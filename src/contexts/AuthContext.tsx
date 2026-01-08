import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, googleProvider, db } from '../config/firebase'
import { User, TierType, TIER_THRESHOLDS } from '../types'

interface AuthContextType {
  currentUser: User | null
  firebaseUser: FirebaseUser | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function calculateTier(points: number, isChallenger: boolean): TierType {
  if (isChallenger) return 'challenger'

  const tiers: TierType[] = ['master', 'diamond', 'platinum', 'gold', 'silver', 'bronze']
  for (const tier of tiers) {
    if (points >= TIER_THRESHOLDS[tier].min) {
      return tier
    }
  }
  return 'bronze'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  async function fetchUserData(firebaseUser: FirebaseUser): Promise<User | null> {
    const userRef = doc(db, 'users', firebaseUser.uid)
    const userSnap = await getDoc(userRef)

    if (userSnap.exists()) {
      const data = userSnap.data()
      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: data.displayName || firebaseUser.displayName || '',
        nickname: data.nickname,
        photoURL: data.photoURL || firebaseUser.photoURL,
        points: data.points || 0,
        tier: calculateTier(data.points || 0, data.isChallenger || false),
        isAdmin: data.isAdmin || false,
        isChallenger: data.isChallenger || false,
        createdAt: data.createdAt?.toDate() || new Date(),
        introduction: data.introduction,
        favoriteGame: data.favoriteGame,
        studentId: data.studentId,
        lolNickname: data.lolNickname,
        mainPosition: data.mainPosition,
      }
    } else {
      const newUserData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || '',
        photoURL: firebaseUser.photoURL,
        points: 0,
        isAdmin: false,
        isChallenger: false,
        createdAt: serverTimestamp(),
      }
      await setDoc(userRef, newUserData)
      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || '',
        photoURL: firebaseUser.photoURL,
        points: 0,
        tier: 'bronze' as const,
        isAdmin: false,
        isChallenger: false,
        createdAt: new Date(),
      }
    }
  }

  async function refreshUser() {
    if (firebaseUser) {
      const userData = await fetchUserData(firebaseUser)
      setCurrentUser(userData)
    }
  }

  async function signInWithGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const userData = await fetchUserData(result.user)
      setCurrentUser(userData)
    } catch (error) {
      console.error('Google 로그인 에러:', error)
      throw error
    }
  }

  async function signOut() {
    try {
      await firebaseSignOut(auth)
      setCurrentUser(null)
    } catch (error) {
      console.error('로그아웃 에러:', error)
      throw error
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user)
      if (user) {
        const userData = await fetchUserData(user)
        setCurrentUser(userData)
      } else {
        setCurrentUser(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value = {
    currentUser,
    firebaseUser,
    loading,
    signInWithGoogle,
    signOut,
    refreshUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
