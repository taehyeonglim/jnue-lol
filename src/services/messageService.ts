import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { Message, User } from '../types'

const MESSAGES_COLLECTION = 'messages'

export async function sendMessage(
  sender: User,
  receiverId: string,
  receiverName: string,
  title: string,
  content: string
): Promise<string> {
  const messageData = {
    senderId: sender.uid,
    senderName: sender.nickname || sender.displayName,
    senderPhotoURL: sender.photoURL,
    senderTier: sender.tier,
    receiverId,
    receiverName,
    title,
    content,
    isRead: false,
    createdAt: serverTimestamp(),
  }

  const docRef = await addDoc(collection(db, MESSAGES_COLLECTION), messageData)
  return docRef.id
}

export async function getReceivedMessages(userId: string): Promise<Message[]> {
  const q = query(
    collection(db, MESSAGES_COLLECTION),
    where('receiverId', '==', userId),
    orderBy('createdAt', 'desc')
  )

  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
  })) as Message[]
}

export async function getSentMessages(userId: string): Promise<Message[]> {
  const q = query(
    collection(db, MESSAGES_COLLECTION),
    where('senderId', '==', userId),
    orderBy('createdAt', 'desc')
  )

  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
  })) as Message[]
}

export async function getMessage(messageId: string): Promise<Message | null> {
  const docRef = doc(db, MESSAGES_COLLECTION, messageId)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) return null

  return {
    id: docSnap.id,
    ...docSnap.data(),
    createdAt: (docSnap.data().createdAt as Timestamp)?.toDate() || new Date(),
  } as Message
}

export async function markAsRead(messageId: string): Promise<void> {
  const docRef = doc(db, MESSAGES_COLLECTION, messageId)
  await updateDoc(docRef, { isRead: true })
}

export async function deleteMessage(messageId: string): Promise<void> {
  const docRef = doc(db, MESSAGES_COLLECTION, messageId)
  await deleteDoc(docRef)
}

export async function getUnreadCount(userId: string): Promise<number> {
  const q = query(
    collection(db, MESSAGES_COLLECTION),
    where('receiverId', '==', userId),
    where('isRead', '==', false)
  )

  const snapshot = await getDocs(q)
  return snapshot.size
}

export async function getUserById(userId: string): Promise<User | null> {
  const docRef = doc(db, 'users', userId)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) return null

  const data = docSnap.data()
  return {
    uid: docSnap.id,
    ...data,
    createdAt: data.createdAt?.toDate() || new Date(),
  } as User
}
