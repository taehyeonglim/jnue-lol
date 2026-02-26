import { useState, useEffect } from 'react'
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from '../contexts/AuthContext'
import { User, Reward, TIER_INFO, TierType, TIER_THRESHOLDS } from '../types'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { Navigate } from 'react-router-dom'
import {
  Tile, Button, Tag, Search, TextInput, TextArea, Select, SelectItem,
  Tabs, TabList, Tab, TabPanels, TabPanel,
} from '@carbon/react'
import { TrashCan } from '@carbon/icons-react'

type AdminTab = 'users' | 'rewards' | 'challenger'

const TAB_INFO: Record<AdminTab, { label: string; icon: string; description: string }> = {
  users: { label: '회원 관리', icon: '👥', description: '포인트 조정 및 관리자 권한 관리' },
  challenger: { label: '챌린저 지정', icon: '👑', description: '특별 챌린저 티어 부여' },
  rewards: { label: '상품 지급', icon: '🎁', description: '이벤트 상품 지급 및 내역 관리' },
}

const TAB_KEYS: AdminTab[] = ['users', 'challenger', 'rewards']

export default function Admin() {
  const { currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState<AdminTab>('users')
  const [users, setUsers] = useState<User[]>([])
  const [rewards, setRewards] = useState<Reward[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const calculateTier = (points: number, isChallenger: boolean): TierType => {
    if (isChallenger) return 'challenger'
    const tiers: TierType[] = ['master', 'diamond', 'platinum', 'gold', 'silver', 'bronze']
    for (const tier of tiers) {
      if (points >= TIER_THRESHOLDS[tier].min) return tier
    }
    return 'bronze'
  }

  const loadData = async () => {
    try {
      const usersSnap = await getDocs(collection(db, 'users'))
      const usersData = usersSnap.docs
        .map((doc) => {
          const data = doc.data()
          const points = data.points || 0
          const isChallenger = data.isChallenger || false
          return {
            uid: doc.id,
            ...data,
            points,
            tier: calculateTier(points, isChallenger),
            createdAt: data.createdAt?.toDate() || new Date(),
          }
        })
        .sort((a, b) => b.points - a.points) as User[]
      setUsers(usersData)

      const rewardsSnap = await getDocs(collection(db, 'rewards'))
      const rewardsData = rewardsSnap.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
          givenAt: doc.data().givenAt?.toDate() || new Date(),
        }))
        .sort((a, b) => b.givenAt.getTime() - a.givenAt.getTime()) as Reward[]
      setRewards(rewardsData)
    } catch (error) {
      console.error('데이터 로딩 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!currentUser?.isAdmin) {
    return <Navigate to="/" replace />
  }

  if (loading) {
    return <LoadingSpinner />
  }

  const handleTabChange = (evt: { selectedIndex: number }) => {
    setActiveTab(TAB_KEYS[evt.selectedIndex])
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.875rem' }}>⚙️</span>
            <h1 className="page-title">관리자 페이지</h1>
          </div>
          <p className="page-desc">회원 관리, 챌린저 지정, 상품 지급을 관리합니다</p>
        </div>
      </div>

      <div style={{ padding: '2rem 0' }}>
        <div className="page-container">
          {/* Stats Overview */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <StatCard label="전체 회원" value={users.length} icon="👥" />
            <StatCard label="챌린저" value={users.filter(u => u.isChallenger).length} icon="👑" />
            <StatCard label="관리자" value={users.filter(u => u.isAdmin).length} icon="🛡️" />
            <StatCard label="상품 지급" value={rewards.length} icon="🎁" />
          </div>

          {/* Tabs */}
          <Tabs selectedIndex={TAB_KEYS.indexOf(activeTab)} onChange={handleTabChange}>
            <TabList aria-label="관리자 탭" style={{ marginBottom: '0.5rem' }}>
              {TAB_KEYS.map((key) => (
                <Tab key={key}>
                  <span style={{ marginRight: '0.5rem' }}>{TAB_INFO[key].icon}</span>
                  {TAB_INFO[key].label}
                </Tab>
              ))}
            </TabList>

            {/* Tab Description */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem', color: '#c6c6c6', paddingTop: '0.5rem' }}>
              <span>{TAB_INFO[activeTab].icon}</span>
              <span>{TAB_INFO[activeTab].description}</span>
            </div>

            <TabPanels>
              <TabPanel style={{ padding: 0 }}>
                <UsersTab users={users} onUpdate={loadData} />
              </TabPanel>
              <TabPanel style={{ padding: 0 }}>
                <ChallengerTab users={users} onUpdate={loadData} />
              </TabPanel>
              <TabPanel style={{ padding: 0 }}>
                <RewardsTab
                  users={users}
                  rewards={rewards}
                  adminName={currentUser.nickname || currentUser.displayName}
                  onUpdate={loadData}
                />
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
    <Tile style={{ padding: '1rem', background: '#262626' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ fontSize: '1.5rem' }}>{icon}</span>
        <div>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#C8AA6E' }}>{value}</p>
          <p style={{ fontSize: '0.75rem', color: '#c6c6c6' }}>{label}</p>
        </div>
      </div>
    </Tile>
  )
}

function UsersTab({ users, onUpdate }: { users: User[]; onUpdate: () => void }) {
  const [search, setSearch] = useState('')

  const filteredUsers = users.filter(
    (user) =>
      user.displayName.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      (user.nickname && user.nickname.toLowerCase().includes(search.toLowerCase()))
  )

  const toggleAdmin = async (user: User) => {
    if (!window.confirm(`${user.nickname || user.displayName}의 관리자 권한을 ${user.isAdmin ? '해제' : '부여'}하시겠습니까?`)) {
      return
    }

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        isAdmin: !user.isAdmin,
      })
      onUpdate()
    } catch (error) {
      console.error('권한 변경 실패:', error)
    }
  }

  const adjustPoints = async (user: User) => {
    const input = window.prompt(`${user.nickname || user.displayName}의 포인트를 조정합니다.\n현재: ${user.points}P\n\n조정할 포인트 (양수: 추가, 음수: 차감):`)
    if (!input) return

    const points = parseInt(input)
    if (isNaN(points)) {
      alert('올바른 숫자를 입력해주세요.')
      return
    }

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        points: Math.max(0, user.points + points),
      })
      onUpdate()
    } catch (error) {
      console.error('포인트 조정 실패:', error)
    }
  }

  const deleteUser = async (user: User) => {
    if (user.isAdmin) {
      alert('관리자는 삭제할 수 없습니다.')
      return
    }

    const confirmText = window.prompt(
      `⚠️ 정말로 "${user.nickname || user.displayName}" 회원을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.\n확인하려면 "삭제"를 입력하세요:`
    )

    if (confirmText !== '삭제') {
      if (confirmText !== null) {
        alert('삭제가 취소되었습니다.')
      }
      return
    }

    try {
      await deleteDoc(doc(db, 'users', user.uid))
      alert(`${user.nickname || user.displayName} 회원이 삭제되었습니다.`)
      onUpdate()
    } catch (error) {
      console.error('회원 삭제 실패:', error)
      alert('회원 삭제에 실패했습니다.')
    }
  }

  const toggleTestAccount = async (user: User) => {
    const action = user.isTestAccount ? '해제' : '지정'
    if (!window.confirm(`${user.nickname || user.displayName}을(를) 테스트 계정으로 ${action}하시겠습니까?\n\n테스트 계정은 랭킹과 동아리원 목록에서 숨겨집니다.`)) {
      return
    }

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        isTestAccount: !user.isTestAccount,
      })
      onUpdate()
    } catch (error) {
      console.error('테스트 계정 변경 실패:', error)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Search */}
      <Tile style={{ padding: '1rem', background: '#262626' }}>
        <Search
          id="user-search"
          labelText="회원 검색"
          placeholder="이름, 닉네임, 이메일로 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value || '')}
          size="lg"
        />
        <p style={{ fontSize: '0.75rem', color: '#c6c6c6', marginTop: '0.5rem' }}>
          총 {filteredUsers.length}명의 회원
        </p>
      </Tile>

      {/* User List */}
      <Tile style={{ overflow: 'hidden', padding: 0, background: '#262626' }}>
        <div
          style={{
            display: 'none',
            gridTemplateColumns: '1fr auto auto auto auto auto',
            gap: '1rem',
            padding: '1rem',
            backgroundColor: '#161616',
            fontSize: '0.75rem',
            fontWeight: 500,
            color: '#c6c6c6',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            borderBottom: '1px solid #393939',
          }}
          className="sm-grid-show"
        >
          <span>유저</span>
          <span style={{ width: '96px', textAlign: 'center' }}>티어</span>
          <span style={{ width: '80px', textAlign: 'right' }}>포인트</span>
          <span style={{ width: '64px', textAlign: 'center' }}>관리자</span>
          <span style={{ width: '48px', textAlign: 'center' }}>테스트</span>
          <span style={{ width: '224px', textAlign: 'right' }}>액션</span>
        </div>

        <div>
          {filteredUsers.map((user) => {
            const tierInfo = TIER_INFO[user.tier]
            return (
              <div
                key={user.uid}
                style={{
                  padding: '1rem',
                  borderBottom: '1px solid #393939',
                  transition: 'background-color 0.15s',
                  opacity: user.isTestAccount ? 0.6 : 1,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(57, 57, 57, 0.5)' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {/* User info row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img
                      src={user.photoURL || '/default-avatar.png'}
                      alt={user.displayName}
                      className="avatar avatar-md"
                      style={{ borderColor: tierInfo.color }}
                    />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ color: '#f4f4f4', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user.nickname || user.displayName}
                        {user.isChallenger && <span style={{ marginLeft: '0.375rem', fontSize: '0.75rem' }}>{TIER_INFO.challenger.emoji}</span>}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: '#c6c6c6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</p>
                    </div>
                  </div>

                  {/* Info + Actions row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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

                      <span style={{ color: '#C8AA6E', fontWeight: 700 }}>
                        {user.points}P
                      </span>

                      {user.isAdmin && (
                        <Tag size="sm" type="teal">관리자</Tag>
                      )}

                      {user.isTestAccount && (
                        <Tag size="sm" type="warm-gray" style={{ backgroundColor: 'rgba(251, 146, 60, 0.15)', color: '#fb923c' }}>테스트</Tag>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Button
                        kind="ghost"
                        size="sm"
                        onClick={() => adjustPoints(user)}
                        style={{ color: '#C8AA6E' }}
                      >
                        포인트
                      </Button>
                      <Button
                        kind="ghost"
                        size="sm"
                        onClick={() => toggleTestAccount(user)}
                        style={{ color: user.isTestAccount ? '#fb923c' : '#c6c6c6' }}
                      >
                        {user.isTestAccount ? '테스트 해제' : '테스트'}
                      </Button>
                      <Button
                        kind="ghost"
                        size="sm"
                        onClick={() => toggleAdmin(user)}
                        style={{ color: user.isAdmin ? '#fa4d56' : '#0AC8B9' }}
                      >
                        {user.isAdmin ? '관리자 해제' : '관리자'}
                      </Button>
                      {!user.isAdmin && (
                        <Button
                          kind="danger--ghost"
                          size="sm"
                          hasIconOnly
                          renderIcon={TrashCan}
                          iconDescription="회원 삭제"
                          onClick={() => deleteUser(user)}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Tile>
    </div>
  )
}

function ChallengerTab({ users, onUpdate }: { users: User[]; onUpdate: () => void }) {
  const challengers = users.filter((u) => u.isChallenger)
  const nonChallengers = users.filter((u) => !u.isChallenger)

  const toggleChallenger = async (user: User) => {
    const action = user.isChallenger ? '해제' : '지정'
    if (!window.confirm(`${user.nickname || user.displayName}을(를) 챌린저 티어로 ${action}하시겠습니까?`)) {
      return
    }

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        isChallenger: !user.isChallenger,
        tier: user.isChallenger ? 'master' : 'challenger',
      })
      onUpdate()
    } catch (error) {
      console.error('챌린저 변경 실패:', error)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Current Challengers */}
      <Tile style={{ overflow: 'hidden', padding: 0, background: '#262626' }}>
        <div style={{
          padding: '1rem 1.5rem',
          borderBottom: '1px solid #393939',
          background: 'linear-gradient(to right, rgba(244, 200, 116, 0.2), transparent)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>{TIER_INFO.challenger.emoji}</span>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#C8AA6E' }}>현재 챌린저</h2>
              <p style={{ fontSize: '0.875rem', color: '#c6c6c6' }}>{challengers.length}명의 챌린저</p>
            </div>
          </div>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {challengers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <span style={{ fontSize: '2.5rem', marginBottom: '0.75rem', display: 'block' }}>👑</span>
              <p style={{ color: '#c6c6c6' }}>아직 챌린저가 없습니다</p>
              <p style={{ fontSize: '0.875rem', color: '#c6c6c6' }}>아래에서 지정해주세요</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '0.75rem' }}>
              {challengers.map((user) => (
                <div
                  key={user.uid}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    background: 'linear-gradient(to right, rgba(244, 200, 116, 0.1), transparent)',
                    border: '1px solid rgba(244, 200, 116, 0.3)',
                    borderRadius: '4px',
                  }}
                >
                  <img
                    src={user.photoURL || '/default-avatar.png'}
                    alt={user.displayName}
                    className="avatar avatar-lg"
                    style={{ borderColor: TIER_INFO.challenger.color }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, color: '#f4f4f4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.nickname || user.displayName}</p>
                    <p style={{ fontSize: '0.875rem', color: '#C8AA6E' }}>{user.points}P</p>
                  </div>
                  <Button
                    kind="danger--ghost"
                    size="sm"
                    onClick={() => toggleChallenger(user)}
                  >
                    해제
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Tile>

      {/* Assign Challenger */}
      <Tile style={{ overflow: 'hidden', padding: 0, background: '#262626' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #393939' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#C8AA6E' }}>챌린저 지정하기</h2>
          <p style={{ fontSize: '0.875rem', color: '#c6c6c6' }}>
            포인트 상위 유저들 중에서 챌린저를 선정하세요
          </p>
        </div>

        <div>
          {nonChallengers.slice(0, 20).map((user, index) => {
            const tierInfo = TIER_INFO[user.tier]
            return (
              <div
                key={user.uid}
                style={{
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  borderBottom: '1px solid #393939',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(57, 57, 57, 0.5)' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                <span style={{
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  backgroundColor: '#161616',
                  color: '#c6c6c6',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}>
                  {index + 1}
                </span>
                <img
                  src={user.photoURL || '/default-avatar.png'}
                  alt={user.displayName}
                  className="avatar avatar-md"
                  style={{ borderColor: tierInfo.color }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 500, color: '#f4f4f4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.nickname || user.displayName}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.125rem' }}>
                    <span style={{ fontSize: '0.75rem', color: tierInfo.color }}>
                      {tierInfo.emoji} {tierInfo.name}
                    </span>
                    <span style={{ fontSize: '0.875rem', color: '#C8AA6E', fontWeight: 500 }}>{user.points}P</span>
                  </div>
                </div>
                <Button
                  kind="tertiary"
                  size="sm"
                  onClick={() => toggleChallenger(user)}
                  style={{ color: '#0AC8B9', borderColor: 'rgba(10, 200, 185, 0.3)' }}
                >
                  👑 챌린저 지정
                </Button>
              </div>
            )
          })}
        </div>
      </Tile>
    </div>
  )
}

function RewardsTab({
  users,
  rewards,
  adminName,
  onUpdate,
}: {
  users: User[]
  rewards: Reward[]
  adminName: string
  onUpdate: () => void
}) {
  const [selectedUser, setSelectedUser] = useState('')
  const [rewardName, setRewardName] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleGiveReward = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser || !rewardName.trim()) {
      alert('유저와 상품명을 입력해주세요.')
      return
    }

    setSubmitting(true)
    try {
      const user = users.find((u) => u.uid === selectedUser)
      if (!user) return

      await addDoc(collection(db, 'rewards'), {
        userId: selectedUser,
        userName: user.nickname || user.displayName,
        rewardName: rewardName.trim(),
        description: description.trim(),
        givenAt: serverTimestamp(),
        givenBy: adminName,
      })

      setSelectedUser('')
      setRewardName('')
      setDescription('')
      onUpdate()
      alert('상품이 지급되었습니다!')
    } catch (error) {
      console.error('상품 지급 실패:', error)
      alert('상품 지급에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
      {/* Give Reward Form */}
      <Tile style={{ overflow: 'hidden', padding: 0, background: '#262626' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #393939' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>🎁</span>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#C8AA6E' }}>상품 지급</h2>
          </div>
        </div>

        <form onSubmit={handleGiveReward} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Select
            id="reward-user-select"
            labelText="대상 유저"
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
          >
            <SelectItem value="" text="유저 선택..." />
            {users.map((user) => (
              <SelectItem
                key={user.uid}
                value={user.uid}
                text={`${user.nickname || user.displayName} (${user.points}P - ${TIER_INFO[user.tier].name})`}
              />
            ))}
          </Select>

          <TextInput
            id="reward-name"
            labelText="상품명"
            value={rewardName}
            onChange={(e) => setRewardName(e.target.value)}
            placeholder="예: 스타벅스 아메리카노"
          />

          <TextArea
            id="reward-description"
            labelText="설명 (선택)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="상품 지급 사유나 설명"
            rows={3}
          />

          <Button
            type="submit"
            kind="primary"
            size="lg"
            disabled={submitting || !selectedUser || !rewardName.trim()}
            style={{ width: '100%', maxWidth: '100%' }}
          >
            {submitting ? '지급 중...' : '상품 지급'}
          </Button>
        </form>
      </Tile>

      {/* Reward History */}
      <Tile style={{ overflow: 'hidden', padding: 0, background: '#262626' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #393939', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>📋</span>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#C8AA6E' }}>지급 내역</h2>
          </div>
          <span style={{ fontSize: '0.875rem', color: '#c6c6c6' }}>{rewards.length}건</span>
        </div>

        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
          {rewards.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <span style={{ fontSize: '2.5rem', marginBottom: '0.75rem', display: 'block' }}>📭</span>
              <p style={{ color: '#c6c6c6' }}>아직 지급 내역이 없습니다</p>
            </div>
          ) : (
            <div>
              {rewards.map((reward) => (
                <div
                  key={reward.id}
                  style={{
                    padding: '1rem',
                    borderBottom: '1px solid #393939',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(57, 57, 57, 0.5)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>🎁</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 500, color: '#f4f4f4' }}>{reward.rewardName}</p>
                      <p style={{ fontSize: '0.875rem', color: '#C8AA6E' }}>{reward.userName}</p>
                      {reward.description && (
                        <p style={{ fontSize: '0.875rem', color: '#c6c6c6', marginTop: '0.25rem' }}>{reward.description}</p>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#c6c6c6', flexShrink: 0 }}>
                      <p>{reward.givenAt.toLocaleDateString('ko-KR')}</p>
                      <p style={{ marginTop: '0.125rem' }}>by {reward.givenBy}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Tile>
    </div>
  )
}
