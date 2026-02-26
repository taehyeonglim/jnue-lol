import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { doc, updateDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../config/firebase'
import { useAuth } from '../contexts/AuthContext'
import { getUserPosts } from '../services/postService'
import { Post, TIER_INFO, TIER_THRESHOLDS, TierType } from '../types'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { Tile, Tag, Button, TextInput, Tabs, TabList, Tab, TabPanels, TabPanel } from '@carbon/react'
import { Camera } from '@carbon/icons-react'

const POSITIONS = ['탑', '정글', '미드', '원딜', '서포터']

export default function MyPage() {
  const { currentUser, refreshUser } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
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
      <div style={{ padding: '2rem 0' }}>
        <div className="page-container-xs">
          <Tile style={{ textAlign: 'center', padding: '4rem 1rem', background: '#262626' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
            <p style={{ color: '#c6c6c6', marginBottom: '1.5rem' }}>로그인이 필요합니다</p>
            <Link to="/">
              <Button kind="primary">홈으로 가기</Button>
            </Link>
          </Tile>
        </div>
      </div>
    )
  }

  if (loading) {
    return <LoadingSpinner />
  }

  const nextTierInfo = getNextTier()
  const displayNickname = currentUser.nickname || currentUser.displayName
  const tierInfo = TIER_INFO[currentUser.tier] || TIER_INFO.bronze

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handlePhotoChange}
        accept="image/*"
        style={{ display: 'none' }}
      />

      {/* Page Header */}
      <div className="page-header">
        <div className="container">
          <h1 className="page-title">마이페이지</h1>
          <p className="page-desc">프로필을 관리하세요</p>
        </div>
      </div>

      <div style={{ padding: '2rem 0' }}>
        <div className="page-container-sm">
          {/* Profile Header Card */}
          <Tile
            style={{
              padding: '1.5rem',
              marginBottom: '1.5rem',
              border: `1px solid ${tierInfo.color}40`,
              background: '#262626',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
              {/* Avatar */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <img
                  src={currentUser.photoURL || '/default-avatar.png'}
                  alt={displayNickname}
                  className="avatar avatar-xl"
                  style={{ borderColor: tierInfo.color }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: '-4px',
                    right: '-4px',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.125rem',
                    backgroundColor: tierInfo.color,
                  }}
                >
                  {tierInfo.emoji}
                </div>
                <button
                  onClick={handlePhotoClick}
                  disabled={uploadingPhoto}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0,
                    transition: 'opacity 0.2s',
                    cursor: uploadingPhoto ? 'wait' : 'pointer',
                    border: 'none',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = '1' }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = '0' }}
                >
                  {uploadingPhoto ? (
                    <div style={{ width: '24px', height: '24px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <Camera size={24} style={{ color: '#fff' }} />
                  )}
                </button>
              </div>

              {/* User Info */}
              <div style={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f4f4f4' }}>{displayNickname}</h1>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <Tag
                      size="sm"
                      type="outline"
                      style={{
                        backgroundColor: `${tierInfo.color}20`,
                        color: tierInfo.color,
                        borderColor: tierInfo.color,
                      }}
                    >
                      {tierInfo.emoji} {tierInfo.name}
                    </Tag>
                    {currentUser.isAdmin && (
                      <Tag size="sm" type="blue">관리자</Tag>
                    )}
                  </div>
                </div>

                <p style={{ fontSize: '0.875rem', color: '#c6c6c6', marginBottom: '0.75rem' }}>{currentUser.email}</p>

                {(currentUser.lolNickname || currentUser.mainPosition) && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    {currentUser.lolNickname && (
                      <Tag size="sm" type="blue">🎮 {currentUser.lolNickname}</Tag>
                    )}
                    {currentUser.mainPosition && (
                      <Tag size="sm" type="warm-gray" style={{ backgroundColor: '#C8AA6E20', color: '#C8AA6E' }}>
                        🏆 {currentUser.mainPosition}
                      </Tag>
                    )}
                  </div>
                )}

                {/* Points & Progress */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#C8AA6E' }}>{currentUser.points}P</span>
                  {nextTierInfo && (
                    <span style={{ fontSize: '0.75rem', color: '#c6c6c6' }}>
                      {TIER_INFO[nextTierInfo.tier].emoji} {nextTierInfo.pointsNeeded}P 남음
                    </span>
                  )}
                </div>

                {nextTierInfo && (
                  <div style={{ maxWidth: '320px', margin: '0 auto' }}>
                    <div style={{ height: '8px', backgroundColor: '#393939', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${Math.min(
                            ((currentUser.points - TIER_THRESHOLDS[currentUser.tier].min) /
                              (TIER_THRESHOLDS[nextTierInfo.tier].min - TIER_THRESHOLDS[currentUser.tier].min)) * 100,
                            100
                          )}%`,
                          background: 'linear-gradient(90deg, #C8AA6E, #F0E6D2)',
                          borderRadius: '4px',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Tile>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            <StatCard label="작성글" value={posts.length} icon="📝" />
            <StatCard label="받은 좋아요" value={posts.reduce((sum, post) => sum + post.likes.length, 0)} icon="❤️" />
            <StatCard label="받은 댓글" value={posts.reduce((sum, post) => sum + post.comments.length, 0)} icon="💬" />
          </div>

          {/* Tabs */}
          <Tabs>
            <TabList aria-label="마이페이지 탭" style={{ marginBottom: '1.5rem' }}>
              <Tab>회원정보 수정</Tab>
              <Tab>내가 쓴 글 ({posts.length})</Tab>
            </TabList>
            <TabPanels>
              {/* Profile Tab */}
              <TabPanel>
                <Tile style={{ background: '#262626', padding: 0 }}>
                  <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #393939' }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#C8AA6E', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>⚙️</span>
                      <span>회원정보 수정</span>
                    </h2>
                  </div>
                  <div style={{ padding: '1.5rem' }}>
                    <div style={{ maxWidth: '28rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      <div style={{ padding: '1rem', backgroundColor: 'rgba(10, 200, 185, 0.1)', border: '1px solid rgba(10, 200, 185, 0.2)', borderRadius: '4px', fontSize: '0.875rem', color: '#0AC8B9' }}>
                        💡 프로필 사진을 변경하려면 위의 프로필 이미지에 마우스를 올려보세요!
                      </div>

                      <TextInput
                        id="nickname"
                        labelText={<span>닉네임 <span style={{ color: '#fa4d56' }}>*</span></span>}
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        placeholder="사이트에서 사용할 닉네임"
                        maxLength={20}
                        helperText="다른 회원들에게 보여지는 이름입니다."
                      />

                      <TextInput
                        id="studentId"
                        labelText="학번"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        placeholder="예: 20231234"
                        maxLength={10}
                      />

                      <TextInput
                        id="lolNickname"
                        labelText="롤 닉네임 (소환사명)"
                        value={lolNickname}
                        onChange={(e) => setLolNickname(e.target.value)}
                        placeholder="예: Hide on bush"
                        maxLength={30}
                      />

                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: '#c6c6c6', marginBottom: '0.5rem' }}>
                          주 포지션
                        </label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {POSITIONS.map((pos) => (
                            <Button
                              key={pos}
                              kind={mainPosition === pos ? 'primary' : 'ghost'}
                              size="md"
                              onClick={() => setMainPosition(mainPosition === pos ? '' : pos)}
                              style={mainPosition === pos ? {
                                background: 'linear-gradient(180deg, #C8AA6E, #785A28)',
                                color: '#010A13',
                                borderColor: 'transparent',
                              } : {
                                backgroundColor: '#161616',
                                color: '#c6c6c6',
                                border: '1px solid #393939',
                              }}
                            >
                              {pos}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <TextInput
                        id="favoriteGame"
                        labelText="좋아하는 게임"
                        value={favoriteGame}
                        onChange={(e) => setFavoriteGame(e.target.value)}
                        placeholder="롤 외에 좋아하는 게임"
                        maxLength={50}
                      />

                      <Button
                        kind="primary"
                        size="lg"
                        onClick={handleSave}
                        disabled={saving}
                        style={{ width: '100%', maxWidth: '100%', marginTop: '0.5rem' }}
                      >
                        {saving ? '저장 중...' : '저장하기'}
                      </Button>
                    </div>
                  </div>
                </Tile>
              </TabPanel>

              {/* Posts Tab */}
              <TabPanel>
                <Tile style={{ background: '#262626', padding: 0 }}>
                  <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #393939' }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#C8AA6E', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>📝</span>
                      <span>내가 쓴 글</span>
                    </h2>
                  </div>
                  <div style={{ padding: '1.5rem' }}>
                    {posts.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '2.5rem 0' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📝</div>
                        <p style={{ color: '#c6c6c6', marginBottom: '1rem' }}>아직 작성한 글이 없습니다</p>
                        <Link to="/write?category=introduction">
                          <Button kind="primary">첫 글 작성하기</Button>
                        </Link>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {posts.map((post) => (
                          <Link
                            key={post.id}
                            to={`/post/${post.id}`}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '1rem',
                              padding: '0.75rem',
                              backgroundColor: '#161616',
                              borderRadius: '4px',
                              border: '1px solid #393939',
                              textDecoration: 'none',
                              transition: 'border-color 0.15s',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#785A28' }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#393939' }}
                          >
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <span style={{ fontSize: '0.75rem', color: '#0AC8B9', marginRight: '0.5rem' }}>[{getCategoryLabel(post.category)}]</span>
                              <span style={{ fontSize: '0.875rem', color: '#f4f4f4' }}>{post.title}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', color: '#c6c6c6', flexShrink: 0 }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <span style={{ color: '#fa4d56' }}>♥</span>
                                <span>{post.likes.length}</span>
                              </span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <span>💬</span>
                                <span>{post.comments.length}</span>
                              </span>
                              <span>{post.createdAt.toLocaleDateString('ko-KR')}</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </Tile>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <Tile style={{ padding: '1rem', textAlign: 'center', background: '#262626' }}>
      <span style={{ fontSize: '1.25rem', marginBottom: '0.25rem', display: 'block' }}>{icon}</span>
      <p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#C8AA6E' }}>{value}</p>
      <p style={{ fontSize: '0.75rem', color: '#c6c6c6' }}>{label}</p>
    </Tile>
  )
}
