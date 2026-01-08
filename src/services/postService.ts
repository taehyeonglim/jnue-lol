import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  Timestamp
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from '../config/firebase'
import { Post, Comment, User, POINT_VALUES } from '../types'
import { calculateTier } from '../contexts/AuthContext'

const POSTS_COLLECTION = 'posts'
const USERS_COLLECTION = 'users'

export async function uploadPostImage(file: File, userId: string): Promise<string> {
  const timestamp = Date.now()
  const fileName = `posts/${userId}/${timestamp}_${file.name}`
  const storageRef = ref(storage, fileName)

  await uploadBytes(storageRef, file)
  const downloadURL = await getDownloadURL(storageRef)

  return downloadURL
}

export async function deletePostImage(imageURL: string): Promise<void> {
  try {
    const storageRef = ref(storage, imageURL)
    await deleteObject(storageRef)
  } catch (error) {
    console.error('이미지 삭제 실패:', error)
  }
}

export async function createPost(
  user: User,
  title: string,
  content: string,
  category: Post['category'],
  imageURL?: string
): Promise<string> {
  const postData: Record<string, unknown> = {
    authorId: user.uid,
    authorName: user.nickname || user.displayName,
    authorPhotoURL: user.photoURL,
    authorTier: user.tier,
    title,
    content,
    category,
    likes: [],
    comments: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  if (imageURL) {
    postData.imageURL = imageURL
  }

  const docRef = await addDoc(collection(db, POSTS_COLLECTION), postData)

  // 포인트 지급 (자기소개는 50점, 일반 게시글은 10점)
  const points = category === 'introduction' ? POINT_VALUES.INTRODUCTION : POINT_VALUES.POST
  await addPoints(user.uid, points)

  return docRef.id
}

export async function getPosts(category?: Post['category']): Promise<Post[]> {
  const snapshot = await getDocs(collection(db, POSTS_COLLECTION))

  let posts = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
    updatedAt: (doc.data().updatedAt as Timestamp)?.toDate() || new Date(),
  })) as Post[]

  // 카테고리 필터링
  if (category) {
    posts = posts.filter((post) => post.category === category)
  }

  // 최신순 정렬
  posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  return posts
}

export async function getPost(postId: string): Promise<Post | null> {
  const docRef = doc(db, POSTS_COLLECTION, postId)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) return null

  return {
    id: docSnap.id,
    ...docSnap.data(),
    createdAt: (docSnap.data().createdAt as Timestamp)?.toDate() || new Date(),
    updatedAt: (docSnap.data().updatedAt as Timestamp)?.toDate() || new Date(),
  } as Post
}

export async function updatePost(
  postId: string,
  title: string,
  content: string,
  imageURL?: string | null
): Promise<void> {
  const docRef = doc(db, POSTS_COLLECTION, postId)
  const updateData: Record<string, unknown> = {
    title,
    content,
    updatedAt: serverTimestamp(),
  }

  if (imageURL !== undefined) {
    if (imageURL === null) {
      updateData.imageURL = null
    } else {
      updateData.imageURL = imageURL
    }
  }

  await updateDoc(docRef, updateData)
}

export async function deletePost(postId: string, authorId: string, category: Post['category']): Promise<void> {
  const docRef = doc(db, POSTS_COLLECTION, postId)

  // 포인트 회수 (자기소개는 50점, 일반 게시글은 10점)
  const points = category === 'introduction' ? POINT_VALUES.INTRODUCTION : POINT_VALUES.POST
  await addPoints(authorId, -points)

  await deleteDoc(docRef)
}

export async function toggleLike(postId: string, userId: string, authorId: string): Promise<boolean> {
  const docRef = doc(db, POSTS_COLLECTION, postId)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) return false

  const likes = docSnap.data().likes || []
  const isLiked = likes.includes(userId)

  if (isLiked) {
    await updateDoc(docRef, {
      likes: arrayRemove(userId),
    })
    // 작성자 포인트 차감
    await addPoints(authorId, -POINT_VALUES.LIKE_RECEIVED)
  } else {
    await updateDoc(docRef, {
      likes: arrayUnion(userId),
    })
    // 작성자 포인트 지급
    await addPoints(authorId, POINT_VALUES.LIKE_RECEIVED)
  }

  return !isLiked
}

export async function addComment(
  postId: string,
  user: User,
  content: string
): Promise<Comment> {
  const docRef = doc(db, POSTS_COLLECTION, postId)

  const newComment: Comment = {
    id: crypto.randomUUID(),
    authorId: user.uid,
    authorName: user.nickname || user.displayName,
    authorPhotoURL: user.photoURL,
    authorTier: user.tier,
    content,
    createdAt: new Date(),
  }

  await updateDoc(docRef, {
    comments: arrayUnion({
      ...newComment,
      createdAt: Timestamp.fromDate(newComment.createdAt),
    }),
  })

  // 댓글 작성자에게 포인트 지급
  await addPoints(user.uid, POINT_VALUES.COMMENT)

  return newComment
}

export async function deleteComment(postId: string, comment: Comment): Promise<void> {
  const docRef = doc(db, POSTS_COLLECTION, postId)
  await updateDoc(docRef, {
    comments: arrayRemove({
      ...comment,
      createdAt: Timestamp.fromDate(new Date(comment.createdAt)),
    }),
  })

  // 댓글 작성자 포인트 회수
  await addPoints(comment.authorId, -POINT_VALUES.COMMENT)
}

export async function addPoints(userId: string, points: number): Promise<void> {
  const userRef = doc(db, USERS_COLLECTION, userId)
  const userSnap = await getDoc(userRef)

  if (userSnap.exists()) {
    const currentPoints = userSnap.data().points || 0
    const newPoints = Math.max(0, currentPoints + points)
    const isChallenger = userSnap.data().isChallenger || false
    const newTier = calculateTier(newPoints, isChallenger)

    await updateDoc(userRef, {
      points: newPoints,
      tier: newTier,
    })
  }
}

export async function getUserPosts(userId: string): Promise<Post[]> {
  const snapshot = await getDocs(collection(db, POSTS_COLLECTION))

  const posts = snapshot.docs
    .map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
        updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
      } as Post
    })
    .filter((post) => post.authorId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  return posts
}
