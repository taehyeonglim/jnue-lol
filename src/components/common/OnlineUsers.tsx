import { useState, useEffect } from 'react'
import { collection, doc, setDoc, deleteDoc, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { useAuth } from '../../contexts/AuthContext'
import { TierType, TIER_THRESHOLDS, TIER_INFO } from '../../types'
import { Tag } from '@carbon/react'
import { ChevronUp } from '@carbon/icons-react'

interface OnlineUser {
  uid: string
  displayName: string
  nickname?: string
  photoURL: string | null
  tier: TierType
  lastSeen: Date
}

export default function OnlineUsers() {
  const { currentUser } = useAuth()
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [isExpanded, setIsExpanded] = useState(false)

  const calculateTier = (points: number, isChallenger: boolean): TierType => {
    if (isChallenger) return 'challenger'
    const tiers: TierType[] = ['master', 'diamond', 'platinum', 'gold', 'silver', 'bronze']
    for (const tier of tiers) {
      if (points >= TIER_THRESHOLDS[tier].min) return tier
    }
    return 'bronze'
  }

  useEffect(() => {
    if (!currentUser) return

    const presenceRef = doc(db, 'presence', currentUser.uid)

    const registerPresence = async () => {
      await setDoc(presenceRef, {
        uid: currentUser.uid,
        displayName: currentUser.displayName,
        nickname: currentUser.nickname,
        photoURL: currentUser.photoURL,
        points: currentUser.points,
        isChallenger: currentUser.isChallenger,
        lastSeen: serverTimestamp(),
      })
    }

    registerPresence()
    const interval = setInterval(registerPresence, 30000)

    const handleBeforeUnload = () => {
      deleteDoc(presenceRef)
    }
    window.addEventListener('beforeunload', handleBeforeUnload)

    const unsubscribe = onSnapshot(collection(db, 'presence'), (snapshot) => {
      const now = Date.now()
      const users: OnlineUser[] = []

      snapshot.docs.forEach((doc) => {
        const data = doc.data()
        const lastSeen = data.lastSeen?.toDate?.() || new Date()

        if (now - lastSeen.getTime() < 120000) {
          users.push({
            uid: doc.id,
            displayName: data.displayName,
            nickname: data.nickname,
            photoURL: data.photoURL,
            tier: calculateTier(data.points || 0, data.isChallenger || false),
            lastSeen,
          })
        }
      })

      setOnlineUsers(users)
    })

    return () => {
      clearInterval(interval)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      deleteDoc(presenceRef)
      unsubscribe()
    }
  }, [currentUser])

  if (!currentUser) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 16,
      right: 16,
      zIndex: 40,
      width: 240,
    }}>
      <div style={{
        backgroundColor: '#262626',
        border: '1px solid #393939',
        borderRadius: 4,
        overflow: 'hidden',
      }}>
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            width: '100%',
            padding: '0.625rem 0.875rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#f4f4f4',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{
              display: 'inline-block',
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#24a148',
            }} />
            <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#c6c6c6' }}>
              접속 중
            </span>
            <Tag size="sm" type="blue">
              {onlineUsers.length}
            </Tag>
          </div>
          <ChevronUp
            size={14}
            style={{
              color: '#c6c6c6',
              transition: 'transform 0.2s',
              transform: isExpanded ? 'rotate(0deg)' : 'rotate(180deg)',
            }}
          />
        </button>

        {/* User List */}
        {isExpanded && (
          <div style={{ borderTop: '1px solid #393939' }}>
            {onlineUsers.length === 0 ? (
              <div style={{ padding: '1.25rem 1rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.75rem', color: '#6f6f6f' }}>접속 중인 유저가 없습니다</p>
              </div>
            ) : (
              <div style={{ maxHeight: 208, overflowY: 'auto', padding: '0.25rem 0' }}>
                {onlineUsers.map((user) => {
                  const tierInfo = TIER_INFO[user.tier] || TIER_INFO.bronze
                  return (
                    <div
                      key={user.uid}
                      style={{
                        padding: '0.5rem 0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.625rem',
                        backgroundColor: user.uid === currentUser.uid ? 'rgba(69, 137, 255, 0.05)' : 'transparent',
                      }}
                    >
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <img
                          src={user.photoURL || '/default-avatar.png'}
                          alt={user.nickname || user.displayName}
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            border: '1px solid #525252',
                            objectFit: 'cover',
                          }}
                        />
                        <span style={{
                          position: 'absolute',
                          bottom: -2,
                          right: -2,
                          width: 10,
                          height: 10,
                          backgroundColor: '#24a148',
                          borderRadius: '50%',
                          border: '2px solid #262626',
                        }} />
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontSize: '0.8125rem',
                          fontWeight: 500,
                          color: '#e0e0e0',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {user.nickname || user.displayName}
                          {user.uid === currentUser.uid && (
                            <span style={{ fontSize: '0.625rem', color: '#4589ff', marginLeft: 4 }}>(나)</span>
                          )}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ fontSize: '0.625rem' }}>{tierInfo.emoji}</span>
                          <span style={{ fontSize: '0.625rem', fontWeight: 500, color: tierInfo.color }}>
                            {tierInfo.name}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Collapsed avatars */}
        {!isExpanded && onlineUsers.length > 0 && (
          <div style={{ padding: '0 0.75rem 0.625rem', display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex' }}>
              {onlineUsers.slice(0, 4).map((user, i) => (
                <img
                  key={user.uid}
                  src={user.photoURL || '/default-avatar.png'}
                  alt={user.nickname || user.displayName}
                  title={user.nickname || user.displayName}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    border: '2px solid #262626',
                    objectFit: 'cover',
                    marginLeft: i > 0 ? -6 : 0,
                  }}
                />
              ))}
            </div>
            {onlineUsers.length > 4 && (
              <span style={{ fontSize: '0.6875rem', color: '#6f6f6f', marginLeft: 8 }}>
                +{onlineUsers.length - 4}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
