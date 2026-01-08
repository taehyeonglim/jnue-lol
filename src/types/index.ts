export type TierType = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'master' | 'challenger'

export interface User {
  uid: string
  email: string
  displayName: string
  nickname?: string
  photoURL: string | null
  points: number
  tier: TierType
  isAdmin: boolean
  isChallenger: boolean
  isTestAccount?: boolean
  createdAt: Date
  introduction?: string
  favoriteGame?: string
  studentId?: string
  lolNickname?: string
  mainPosition?: string
}

export interface Post {
  id: string
  authorId: string
  authorName: string
  authorPhotoURL: string | null
  authorTier: TierType
  title: string
  content: string
  imageURL?: string
  category: 'free' | 'introduction' | 'games'
  likes: string[]
  comments: Comment[]
  createdAt: Date
  updatedAt: Date
}

export interface Comment {
  id: string
  authorId: string
  authorName: string
  authorPhotoURL: string | null
  authorTier: TierType
  content: string
  createdAt: Date
}

export interface Reward {
  id: string
  userId: string
  userName: string
  rewardName: string
  description: string
  givenAt: Date
  givenBy: string
}

export interface Message {
  id: string
  senderId: string
  senderName: string
  senderPhotoURL: string | null
  senderTier: TierType
  receiverId: string
  receiverName: string
  title: string
  content: string
  isRead: boolean
  createdAt: Date
}

export const TIER_THRESHOLDS: Record<TierType, { min: number; max: number }> = {
  bronze: { min: 0, max: 99 },
  silver: { min: 100, max: 299 },
  gold: { min: 300, max: 699 },
  platinum: { min: 700, max: 1499 },
  diamond: { min: 1500, max: 2999 },
  master: { min: 3000, max: Infinity },
  challenger: { min: 0, max: Infinity },
}

export const TIER_INFO: Record<TierType, { name: string; emoji: string; color: string }> = {
  bronze: { name: 'Bronze', emoji: '🥉', color: '#CD7F32' },
  silver: { name: 'Silver', emoji: '🥈', color: '#C0C0C0' },
  gold: { name: 'Gold', emoji: '🥇', color: '#FFD700' },
  platinum: { name: 'Platinum', emoji: '💠', color: '#00CED1' },
  diamond: { name: 'Diamond', emoji: '💎', color: '#B9F2FF' },
  master: { name: 'Master', emoji: '🔮', color: '#9D4DFF' },
  challenger: { name: 'Challenger', emoji: '👑', color: '#F4C874' },
}

export const POINT_VALUES = {
  INTRODUCTION: 50,
  POST: 10,
  COMMENT: 3,
  LIKE_RECEIVED: 2,
}

export interface GalleryImage {
  id: string
  imageURL: string
  title: string
  description?: string
  uploadedBy: string
  uploadedByName: string
  createdAt: Date
}
