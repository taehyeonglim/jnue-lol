import { useState, useEffect } from 'react'
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore'
import { db } from '../config/firebase'
import { User, TIER_INFO, TIER_THRESHOLDS, TierType } from '../types'
import LoadingSpinner from '../components/common/LoadingSpinner'
import SendMessageModal from '../components/common/SendMessageModal'
import { useAuth } from '../contexts/AuthContext'
import { Tile, Tag, Button } from '@carbon/react'
import { Email } from '@carbon/icons-react'

export default function Ranking() {
  const { currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [messageTarget, setMessageTarget] = useState<User | null>(null)

  useEffect(() => {
    loadRanking()
  }, [])

  const loadRanking = async () => {
    try {
      const q = query(
        collection(db, 'users'),
        orderBy('points', 'desc'),
        limit(100)
      )
      const snapshot = await getDocs(q)
      const usersData = snapshot.docs
        .map((doc) => {
          const data = doc.data()
          return {
            uid: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
          } as User
        })
        .filter((user) => !user.isTestAccount)
        .slice(0, 50)
      setUsers(usersData)
    } catch (error) {
      console.error('랭킹 로딩 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const getNextTier = (tier: TierType, points: number): { tier: TierType; pointsNeeded: number } | null => {
    if (tier === 'challenger' || tier === 'master') return null

    const tierOrder: TierType[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'master']
    const currentIndex = tierOrder.indexOf(tier)
    if (currentIndex === -1 || currentIndex >= tierOrder.length - 1) return null

    const nextTier = tierOrder[currentIndex + 1]
    const pointsNeeded = TIER_THRESHOLDS[nextTier].min - points

    return { tier: nextTier, pointsNeeded }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  const currentUserRank = currentUser
    ? users.findIndex((u) => u.uid === currentUser.uid) + 1
    : 0

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="container">
          <h1 className="page-title">랭킹</h1>
          <p className="page-desc">동아리원들의 활동 랭킹을 확인하세요</p>
        </div>
      </div>

      <div style={{ padding: '2rem 0' }}>
        <div className="page-container-sm">
          {/* Current User Card */}
          {currentUser && (
            <Tile
              style={{
                padding: '1.25rem',
                marginBottom: '1.5rem',
                border: `1px solid ${TIER_INFO[currentUser.tier].color}40`,
                background: '#262626',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <img
                    src={currentUser.photoURL || '/default-avatar.png'}
                    alt={currentUser.displayName}
                    className="avatar avatar-lg"
                    style={{ borderColor: TIER_INFO[currentUser.tier].color }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '-4px',
                      right: '-4px',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.875rem',
                      backgroundColor: TIER_INFO[currentUser.tier].color,
                    }}
                  >
                    {TIER_INFO[currentUser.tier].emoji}
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, color: '#f4f4f4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {currentUser.nickname || currentUser.displayName}
                    </span>
                    <Tag
                      size="sm"
                      type="outline"
                      style={{
                        backgroundColor: `${TIER_INFO[currentUser.tier].color}20`,
                        color: TIER_INFO[currentUser.tier].color,
                        borderColor: TIER_INFO[currentUser.tier].color,
                      }}
                    >
                      {TIER_INFO[currentUser.tier].emoji} {TIER_INFO[currentUser.tier].name}
                    </Tag>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#C8AA6E' }}>{currentUser.points}P</span>
                    {(() => {
                      const nextTierInfo = getNextTier(currentUser.tier, currentUser.points)
                      if (nextTierInfo) {
                        return (
                          <span style={{ fontSize: '0.75rem', color: '#c6c6c6' }}>
                            {TIER_INFO[nextTierInfo.tier].emoji} {nextTierInfo.pointsNeeded}P 남음
                          </span>
                        )
                      }
                      return null
                    })()}
                  </div>
                </div>

                <div style={{ textAlign: 'center', padding: '0 1rem', flexShrink: 0 }}>
                  <p style={{ fontSize: '0.75rem', color: '#c6c6c6', marginBottom: '0.25rem' }}>내 순위</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#C8AA6E' }}>
                    #{currentUserRank || '-'}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              {(() => {
                const nextTierInfo = getNextTier(currentUser.tier, currentUser.points)
                if (!nextTierInfo) return null

                const currentMin = TIER_THRESHOLDS[currentUser.tier].min
                const nextMin = TIER_THRESHOLDS[nextTierInfo.tier].min
                const progress = ((currentUser.points - currentMin) / (nextMin - currentMin)) * 100

                return (
                  <div style={{ marginTop: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#c6c6c6', marginBottom: '0.375rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span>{TIER_INFO[currentUser.tier].emoji}</span>
                        <span>{TIER_INFO[currentUser.tier].name}</span>
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span>{TIER_INFO[nextTierInfo.tier].emoji}</span>
                        <span>{TIER_INFO[nextTierInfo.tier].name}</span>
                      </span>
                    </div>
                    <div style={{ height: '8px', backgroundColor: '#393939', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${Math.min(progress, 100)}%`,
                          background: 'linear-gradient(90deg, #C8AA6E, #F0E6D2)',
                          borderRadius: '4px',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                  </div>
                )
              })()}
            </Tile>
          )}

          {/* Tier Legend */}
          <Tile style={{ padding: '1rem', marginBottom: '1.5rem', background: '#262626' }}>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 500, color: '#c6c6c6', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
              티어 기준
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.5rem' }}>
              {(['bronze', 'silver', 'gold', 'platinum', 'diamond', 'master'] as TierType[]).map((tier) => (
                <div
                  key={tier}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    padding: '0.375rem 0.5rem',
                    backgroundColor: '#161616',
                    borderRadius: '4px',
                    border: '1px solid #393939',
                  }}
                >
                  <span style={{ fontSize: '0.875rem' }}>{TIER_INFO[tier].emoji}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 500, color: TIER_INFO[tier].color }}>
                    {TIER_THRESHOLDS[tier].min}P+
                  </span>
                </div>
              ))}
            </div>
          </Tile>

          {/* Ranking List */}
          <Tile style={{ overflow: 'hidden', padding: 0, background: '#262626' }}>
            {/* Header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '3rem 1fr auto 6rem',
                gap: '0.75rem',
                padding: '1rem',
                backgroundColor: '#161616',
                fontSize: '0.75rem',
                fontWeight: 500,
                color: '#c6c6c6',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                borderBottom: '1px solid #393939',
              }}
            >
              <span style={{ textAlign: 'center' }}>#</span>
              <span>유저</span>
              <span style={{ textAlign: 'center' }}>티어</span>
              <span style={{ textAlign: 'right' }}>포인트</span>
            </div>

            {users.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🏆</div>
                <p style={{ color: '#c6c6c6' }}>아직 랭킹 데이터가 없습니다</p>
              </div>
            ) : (
              <div>
                {users.map((user, index) => (
                  <RankingRow
                    key={user.uid}
                    user={user}
                    rank={index + 1}
                    isCurrentUser={currentUser?.uid === user.uid}
                    canMessage={!!currentUser && currentUser.uid !== user.uid}
                    onMessage={() => setMessageTarget(user)}
                  />
                ))}
              </div>
            )}
          </Tile>
        </div>
      </div>

      {/* Send Message Modal */}
      {messageTarget && (
        <SendMessageModal
          receiver={messageTarget}
          onClose={() => setMessageTarget(null)}
          onSuccess={() => alert('쪽지를 보냈습니다!')}
        />
      )}
    </div>
  )
}

function RankingRow({
  user,
  rank,
  isCurrentUser,
  canMessage,
  onMessage,
}: {
  user: User
  rank: number
  isCurrentUser: boolean
  canMessage: boolean
  onMessage: () => void
}) {
  const getRankDisplay = () => {
    if (rank === 1) return { emoji: '🥇', style: { color: '#facc15', fontWeight: 700, fontSize: '1.125rem' } }
    if (rank === 2) return { emoji: '🥈', style: { color: '#d1d5db', fontWeight: 700 } }
    if (rank === 3) return { emoji: '🥉', style: { color: '#d97706', fontWeight: 700 } }
    return { emoji: String(rank), style: { color: '#c6c6c6' } }
  }

  const rankDisplay = getRankDisplay()
  const displayName = user.nickname || user.displayName
  const tierInfo = TIER_INFO[user.tier] || TIER_INFO.bronze

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '3rem 1fr auto 6rem',
        gap: '0.75rem',
        padding: '1rem',
        alignItems: 'center',
        borderBottom: '1px solid #393939',
        transition: 'background-color 0.15s',
        backgroundColor: isCurrentUser ? 'rgba(200, 170, 110, 0.1)' : 'transparent',
        cursor: 'default',
      }}
      onMouseEnter={(e) => { if (!isCurrentUser) e.currentTarget.style.backgroundColor = 'rgba(57, 57, 57, 0.5)' }}
      onMouseLeave={(e) => { if (!isCurrentUser) e.currentTarget.style.backgroundColor = 'transparent' }}
    >
      <span style={{ textAlign: 'center', ...rankDisplay.style }}>
        {rankDisplay.emoji}
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
        <img
          src={user.photoURL || '/default-avatar.png'}
          alt={displayName}
          className="avatar avatar-sm"
          style={{ borderColor: tierInfo.color }}
        />
        <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: isCurrentUser ? '#C8AA6E' : '#f4f4f4' }}>
          {displayName}
          {isCurrentUser && <span style={{ marginLeft: '0.375rem', fontSize: '0.75rem', color: '#0AC8B9' }}>(나)</span>}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        <span style={{ fontSize: '0.875rem' }}>{tierInfo.emoji}</span>
        <span style={{ fontSize: '0.75rem', fontWeight: 500, color: tierInfo.color }}>
          {tierInfo.name}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' }}>
        <span style={{ fontWeight: 700, color: '#C8AA6E' }}>{user.points}P</span>
        {canMessage && (
          <Button
            kind="ghost"
            size="sm"
            hasIconOnly
            renderIcon={Email}
            iconDescription="쪽지 보내기"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation()
              onMessage()
            }}
            style={{ color: '#c6c6c6' }}
          />
        )}
      </div>
    </div>
  )
}
