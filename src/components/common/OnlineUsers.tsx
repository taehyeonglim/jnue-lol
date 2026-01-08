import { useState, useEffect } from 'react'
import { collection, doc, setDoc, deleteDoc, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { useAuth } from '../../contexts/AuthContext'
import { TierType, TIER_THRESHOLDS, TIER_INFO } from '../../types'

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

        if (now - lastSeen.getTime() < 60000) {
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
    <div className="fixed bottom-4 right-4 z-40">
      <div className="card w-60 overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-3.5 py-2.5 flex items-center justify-between hover:bg-[#1E2328]/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-[13px] font-medium text-[#F0E6D2]/80">
              접속 중
            </span>
            <span className="badge badge-gold text-[11px]">
              {onlineUsers.length}
            </span>
          </div>
          <svg
            className={`w-3.5 h-3.5 text-[#A09B8C] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 15l7-7 7 7" />
          </svg>
        </button>

        {/* User List */}
        {isExpanded && (
          <div className="border-t border-[#1E2328]">
            {onlineUsers.length === 0 ? (
              <div className="px-4 py-5 text-center">
                <p className="text-xs text-[#A09B8C]">접속 중인 유저가 없습니다</p>
              </div>
            ) : (
              <div className="max-h-52 overflow-y-auto py-1">
                {onlineUsers.map((user) => {
                  const tierInfo = TIER_INFO[user.tier]
                  return (
                    <div
                      key={user.uid}
                      className={`px-3 py-2 flex items-center gap-2.5 transition-colors ${
                        user.uid === currentUser.uid
                          ? 'bg-[#C8AA6E]/5'
                          : 'hover:bg-[#1E2328]/50'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <img
                          src={user.photoURL || '/default-avatar.png'}
                          alt={user.nickname || user.displayName}
                          className="w-7 h-7 rounded-full ring-1 ring-[#3C3C41] object-cover"
                        />
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full ring-2 ring-[#010A13]"></span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-[#F0E6D2]/90 truncate">
                          {user.nickname || user.displayName}
                          {user.uid === currentUser.uid && (
                            <span className="text-[10px] text-[#0AC8B9] ml-1">(나)</span>
                          )}
                        </p>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px]">{tierInfo.emoji}</span>
                          <span
                            className="text-[10px] font-medium"
                            style={{ color: tierInfo.color }}
                          >
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
          <div className="px-3 pb-2.5 flex items-center">
            <div className="flex -space-x-1.5">
              {onlineUsers.slice(0, 4).map((user) => (
                <img
                  key={user.uid}
                  src={user.photoURL || '/default-avatar.png'}
                  alt={user.nickname || user.displayName}
                  className="w-6 h-6 rounded-full ring-2 ring-[#010A13] object-cover"
                  title={user.nickname || user.displayName}
                />
              ))}
            </div>
            {onlineUsers.length > 4 && (
              <span className="text-[11px] text-[#A09B8C] ml-2">
                +{onlineUsers.length - 4}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
