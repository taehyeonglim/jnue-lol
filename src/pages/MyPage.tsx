import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { doc, updateDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../config/firebase'
import { useAuth } from '../contexts/AuthContext'
import { getUserPosts } from '../services/postService'
import { Post, TIER_INFO, TIER_THRESHOLDS, TierType } from '../types'
import LoadingSpinner from '../components/common/LoadingSpinner'

const POSITIONS = ['탑', '정글', '미드', '원딜', '서포터']

export default function MyPage() {
  const { currentUser, refreshUser } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'posts'>('profile')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [nickname, setNickname] = useState('')
  const [studentId, setStudentId] = useState('')
  const [favoriteGame, setFavoriteGame] = useState('')
  const [lolNickname, setLolNickname] = useState('')
  const [mainPosition, setMainPosition] = useState('')

  useEffect(() => {
    if (currentUser) {
      loadData()
    }
  }, [currentUser])

  const loadData = async () => {
    if (!currentUser) return
    try {
      const userPosts = await getUserPosts(currentUser.uid)
      setPosts(userPosts)
      setNickname(currentUser.nickname || currentUser.displayName || '')
      setStudentId(currentUser.studentId || '')
      setFavoriteGame(currentUser.favoriteGame || '')
      setLolNickname(currentUser.lolNickname || '')
      setMainPosition(currentUser.mainPosition || '')
    } catch (error) {
      console.error('데이터 로딩 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoClick = () => {
    fileInputRef.current?.click()
  }

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentUser) return

    if (file.size > 5 * 1024 * 1024) {
      alert('파일 크기는 5MB 이하여야 합니다.')
      return
    }

    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있습니다.')
      return
    }

    setUploadingPhoto(true)
    try {
      const storageRef = ref(storage, `profile-photos/${currentUser.uid}`)
      await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(storageRef)

      const userRef = doc(db, 'users', currentUser.uid)
      await updateDoc(userRef, { photoURL: downloadURL })

      await refreshUser()
      alert('프로필 사진이 변경되었습니다!')
    } catch (error) {
      console.error('사진 업로드 실패:', error)
      alert('사진 업로드에 실패했습니다.')
    } finally {
      setUploadingPhoto(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleSave = async () => {
    if (!currentUser) return
    if (!nickname.trim()) {
      alert('닉네임을 입력해주세요.')
      return
    }

    setSaving(true)
    try {
      const userRef = doc(db, 'users', currentUser.uid)
      await updateDoc(userRef, {
        nickname: nickname.trim(),
        studentId: studentId.trim(),
        favoriteGame: favoriteGame.trim(),
        lolNickname: lolNickname.trim(),
        mainPosition: mainPosition,
      })
      await refreshUser()
      alert('저장되었습니다!')
    } catch (error) {
      console.error('저장 실패:', error)
      alert('저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const getNextTier = (): { tier: TierType; pointsNeeded: number } | null => {
    if (!currentUser) return null
    const { tier, points } = currentUser

    if (tier === 'challenger' || tier === 'master') return null

    const tierOrder: TierType[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'master']
    const currentIndex = tierOrder.indexOf(tier)
    if (currentIndex === -1 || currentIndex >= tierOrder.length - 1) return null

    const nextTier = tierOrder[currentIndex + 1]
    const pointsNeeded = TIER_THRESHOLDS[nextTier].min - points

    return { tier: nextTier, pointsNeeded }
  }

  const getCategoryLabel = (category: Post['category']) => {
    switch (category) {
      case 'introduction': return '자기소개'
      case 'free': return '자유게시판'
      case 'games': return '좋아하는 게임'
      default: return ''
    }
  }

  if (!currentUser) {
    return (
      <div className="section">
        <div className="container-xs">
          <div className="card text-center py-16">
            <div className="text-5xl mb-4">🔒</div>
            <p className="text-[#A09B8C] mb-6">로그인이 필요합니다</p>
            <Link to="/" className="btn btn-primary">
              홈으로 가기
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return <LoadingSpinner />
  }

  const nextTierInfo = getNextTier()
  const displayNickname = currentUser.nickname || currentUser.displayName
  const tierInfo = TIER_INFO[currentUser.tier]

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handlePhotoChange}
        accept="image/*"
        className="hidden"
      />

      {/* Page Header */}
      <div className="page-header">
        <div className="container">
          <h1 className="page-title">마이페이지</h1>
          <p className="page-desc">프로필을 관리하세요</p>
        </div>
      </div>

      <div className="section">
        <div className="container-sm">
          {/* Profile Header Card */}
          <div className="card card-gold p-6 mb-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              {/* Avatar */}
              <div className="relative group shrink-0">
                <img
                  src={currentUser.photoURL || '/default-avatar.png'}
                  alt={displayNickname}
                  className="avatar avatar-xl"
                  style={{ borderColor: tierInfo.color }}
                />
                <div
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center text-lg"
                  style={{ backgroundColor: tierInfo.color }}
                >
                  {tierInfo.emoji}
                </div>
                <button
                  onClick={handlePhotoClick}
                  disabled={uploadingPhoto}
                  className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-wait"
                >
                  {uploadingPhoto ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>

              {/* User Info */}
              <div className="flex-1 text-center sm:text-left min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                  <h1 className="text-xl font-bold text-[#F0E6D2]">{displayNickname}</h1>
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: `${tierInfo.color}20`,
                        color: tierInfo.color,
                      }}
                    >
                      {tierInfo.emoji} {tierInfo.name}
                    </span>
                    {currentUser.isAdmin && (
                      <span className="badge badge-blue">관리자</span>
                    )}
                  </div>
                </div>

                <p className="text-sm text-[#A09B8C] mb-3">{currentUser.email}</p>

                {(currentUser.lolNickname || currentUser.mainPosition) && (
                  <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-3">
                    {currentUser.lolNickname && (
                      <span className="badge badge-blue">🎮 {currentUser.lolNickname}</span>
                    )}
                    {currentUser.mainPosition && (
                      <span className="badge badge-gold">🏆 {currentUser.mainPosition}</span>
                    )}
                  </div>
                )}

                {/* Points & Progress */}
                <div className="flex items-center justify-center sm:justify-start gap-3 mb-3">
                  <span className="text-2xl font-bold text-[#C8AA6E]">{currentUser.points}P</span>
                  {nextTierInfo && (
                    <span className="text-xs text-[#A09B8C]">
                      {TIER_INFO[nextTierInfo.tier].emoji} {nextTierInfo.pointsNeeded}P 남음
                    </span>
                  )}
                </div>

                {nextTierInfo && (
                  <div className="max-w-xs mx-auto sm:mx-0">
                    <div className="progress">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${Math.min(
                            ((currentUser.points - TIER_THRESHOLDS[currentUser.tier].min) /
                              (TIER_THRESHOLDS[nextTierInfo.tier].min - TIER_THRESHOLDS[currentUser.tier].min)) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <StatCard label="작성글" value={posts.length} icon="📝" />
            <StatCard label="받은 좋아요" value={posts.reduce((sum, post) => sum + post.likes.length, 0)} icon="❤️" />
            <StatCard label="받은 댓글" value={posts.reduce((sum, post) => sum + post.comments.length, 0)} icon="💬" />
          </div>

          {/* Tabs */}
          <div className="tabs mb-6">
            <button
              onClick={() => setActiveTab('profile')}
              className={`tab ${activeTab === 'profile' ? 'tab-active' : ''}`}
            >
              회원정보 수정
            </button>
            <button
              onClick={() => setActiveTab('posts')}
              className={`tab ${activeTab === 'posts' ? 'tab-active' : ''}`}
            >
              내가 쓴 글 ({posts.length})
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'profile' ? (
            <div className="card">
              <div className="card-header">
                <h2 className="heading-3 text-[#C8AA6E] flex items-center gap-2">
                  <span>⚙️</span>
                  <span>회원정보 수정</span>
                </h2>
              </div>
              <div className="card-body">
                <div className="space-y-5 max-w-md">
                  <div className="p-4 bg-[#0AC8B9]/10 border border-[#0AC8B9]/20 rounded text-sm text-[#0AC8B9]">
                    💡 프로필 사진을 변경하려면 위의 프로필 이미지에 마우스를 올려보세요!
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#F0E6D2] mb-2">
                      닉네임 <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="사이트에서 사용할 닉네임"
                      className="input"
                      maxLength={20}
                    />
                    <p className="text-xs text-[#A09B8C] mt-1.5">다른 회원들에게 보여지는 이름입니다.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#F0E6D2] mb-2">학번</label>
                    <input
                      type="text"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      placeholder="예: 20231234"
                      className="input"
                      maxLength={10}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#F0E6D2] mb-2">롤 닉네임 (소환사명)</label>
                    <input
                      type="text"
                      value={lolNickname}
                      onChange={(e) => setLolNickname(e.target.value)}
                      placeholder="예: Hide on bush"
                      className="input"
                      maxLength={30}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#F0E6D2] mb-2">주 포지션</label>
                    <div className="flex flex-wrap gap-2">
                      {POSITIONS.map((pos) => (
                        <button
                          key={pos}
                          type="button"
                          onClick={() => setMainPosition(mainPosition === pos ? '' : pos)}
                          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                            mainPosition === pos
                              ? 'bg-gradient-to-b from-[#C8AA6E] to-[#785A28] text-[#010A13]'
                              : 'bg-[#010A13] text-[#A09B8C] border border-[#3C3C41] hover:border-[#C8AA6E]'
                          }`}
                        >
                          {pos}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#F0E6D2] mb-2">좋아하는 게임</label>
                    <input
                      type="text"
                      value={favoriteGame}
                      onChange={(e) => setFavoriteGame(e.target.value)}
                      placeholder="롤 외에 좋아하는 게임"
                      className="input"
                      maxLength={50}
                    />
                  </div>

                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full btn btn-primary btn-lg mt-2"
                  >
                    {saving ? '저장 중...' : '저장하기'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-header">
                <h2 className="heading-3 text-[#C8AA6E] flex items-center gap-2">
                  <span>📝</span>
                  <span>내가 쓴 글</span>
                </h2>
              </div>
              <div className="card-body">
                {posts.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="text-4xl mb-3">📝</div>
                    <p className="text-[#A09B8C] mb-4">아직 작성한 글이 없습니다</p>
                    <Link to="/write?category=introduction" className="btn btn-primary">
                      첫 글 작성하기
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {posts.map((post) => (
                      <Link
                        key={post.id}
                        to={`/post/${post.id}`}
                        className="flex items-center justify-between gap-4 p-3 bg-[#010A13] rounded border border-[#1E2328] hover:border-[#785A28] transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <span className="text-xs text-[#0AC8B9] mr-2">[{getCategoryLabel(post.category)}]</span>
                          <span className="text-sm text-[#F0E6D2]">{post.title}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-[#A09B8C] shrink-0">
                          <span className="flex items-center gap-1">
                            <span className="text-red-400">♥</span>
                            <span>{post.likes.length}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span>💬</span>
                            <span>{post.comments.length}</span>
                          </span>
                          <span className="hidden sm:block">{post.createdAt.toLocaleDateString('ko-KR')}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="card p-4 text-center">
      <span className="text-xl mb-1 block">{icon}</span>
      <p className="text-xl font-bold text-[#C8AA6E]">{value}</p>
      <p className="text-xs text-[#A09B8C]">{label}</p>
    </div>
  )
}
