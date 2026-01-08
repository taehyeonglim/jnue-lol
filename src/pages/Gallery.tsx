import { useState, useEffect } from 'react'
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy, serverTimestamp, Timestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from '../config/firebase'
import { useAuth } from '../contexts/AuthContext'
import { GalleryImage } from '../types'
import LoadingSpinner from '../components/common/LoadingSpinner'

export default function Gallery() {
  const { currentUser } = useAuth()
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null)

  useEffect(() => {
    loadImages()
  }, [])

  const loadImages = async () => {
    try {
      const q = query(collection(db, 'gallery'), orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(q)
      const imagesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
      })) as GalleryImage[]
      setImages(imagesData)
    } catch (error) {
      console.error('갤러리 로딩 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (image: GalleryImage) => {
    if (!window.confirm('이 사진을 삭제하시겠습니까?')) return

    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'gallery', image.id))

      // Delete from Storage
      try {
        const imageRef = ref(storage, `gallery/${image.id}`)
        await deleteObject(imageRef)
      } catch {
        console.log('Storage file may not exist')
      }

      setImages((prev) => prev.filter((img) => img.id !== image.id))
      setSelectedImage(null)
    } catch (error) {
      console.error('삭제 실패:', error)
      alert('삭제에 실패했습니다.')
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="container">
          <div className="flex items-center justify-center gap-3 mb-2">
            <span className="text-3xl">📸</span>
            <h1 className="page-title">갤러리</h1>
          </div>
          <p className="page-desc">동아리 활동 사진을 감상하세요</p>
        </div>
      </div>

      <div className="section">
        <div className="container">
          {/* Admin Upload Button */}
          {currentUser?.isAdmin && (
            <div className="flex justify-end mb-6">
              <button
                onClick={() => setShowUploadModal(true)}
                className="btn btn-primary flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                사진 업로드
              </button>
            </div>
          )}

          {/* Gallery Grid */}
          {images.length === 0 ? (
            <div className="card p-12 text-center">
              <div className="text-5xl mb-4">📷</div>
              <h3 className="text-lg font-semibold text-[#F0E6D2] mb-2">아직 사진이 없습니다</h3>
              <p className="text-[#A09B8C]">동아리 활동 사진이 곧 업로드됩니다!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image) => (
                <div
                  key={image.id}
                  onClick={() => setSelectedImage(image)}
                  className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer border border-[#3C3C41] hover:border-[#C8AA6E] transition-colors"
                >
                  <img
                    src={image.imageURL}
                    alt={image.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-sm font-medium text-white truncate">{image.title}</p>
                      <p className="text-xs text-white/70">
                        {image.createdAt.toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && currentUser?.isAdmin && (
        <UploadModal
          currentUser={currentUser}
          uploading={uploading}
          setUploading={setUploading}
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false)
            loadImages()
          }}
        />
      )}

      {/* Image View Modal */}
      {selectedImage && (
        <ImageViewModal
          image={selectedImage}
          isAdmin={currentUser?.isAdmin || false}
          onClose={() => setSelectedImage(null)}
          onDelete={() => handleDelete(selectedImage)}
        />
      )}
    </div>
  )
}

function UploadModal({
  currentUser,
  uploading,
  setUploading,
  onClose,
  onSuccess,
}: {
  currentUser: { uid: string; displayName: string; nickname?: string }
  uploading: boolean
  setUploading: (v: boolean) => void
  onClose: () => void
  onSuccess: () => void
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        alert('파일 크기는 10MB 이하여야 합니다.')
        return
      }
      setFile(selectedFile)
      setPreview(URL.createObjectURL(selectedFile))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !title.trim()) {
      alert('제목과 이미지를 선택해주세요.')
      return
    }

    setUploading(true)
    try {
      // Create document first to get ID
      const docRef = await addDoc(collection(db, 'gallery'), {
        title: title.trim(),
        description: description.trim(),
        imageURL: '', // Will be updated
        uploadedBy: currentUser.uid,
        uploadedByName: currentUser.nickname || currentUser.displayName,
        createdAt: serverTimestamp(),
      })

      // Upload image with document ID
      const imageRef = ref(storage, `gallery/${docRef.id}`)
      await uploadBytes(imageRef, file)
      const imageURL = await getDownloadURL(imageRef)

      // Update document with image URL
      const { updateDoc } = await import('firebase/firestore')
      await updateDoc(doc(db, 'gallery', docRef.id), { imageURL })

      onSuccess()
    } catch (error) {
      console.error('업로드 실패:', error)
      alert('업로드에 실패했습니다.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-[#1E2328] rounded-lg border border-[#3C3C41] w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-[#3C3C41]">
          <h2 className="text-lg font-semibold text-[#C8AA6E]">사진 업로드</h2>
          <button onClick={onClose} className="text-[#A09B8C] hover:text-[#F0E6D2]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-[#F0E6D2] mb-2">이미지</label>
            {preview ? (
              <div className="relative">
                <img src={preview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                <button
                  type="button"
                  onClick={() => {
                    setFile(null)
                    setPreview(null)
                  }}
                  className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-[#3C3C41] rounded-lg cursor-pointer hover:border-[#C8AA6E] transition-colors">
                <svg className="w-12 h-12 text-[#A09B8C] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-[#A09B8C]">클릭하여 이미지 선택</p>
                <p className="text-xs text-[#A09B8C] mt-1">최대 10MB</p>
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-[#F0E6D2] mb-2">제목</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="사진 제목"
              className="input"
              maxLength={100}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[#F0E6D2] mb-2">설명 (선택)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="사진에 대한 설명"
              className="input textarea h-24"
              maxLength={500}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn btn-secondary">
              취소
            </button>
            <button type="submit" disabled={uploading || !file} className="flex-1 btn btn-primary">
              {uploading ? '업로드 중...' : '업로드'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ImageViewModal({
  image,
  isAdmin,
  onClose,
  onDelete,
}: {
  image: GalleryImage
  isAdmin: boolean
  onClose: () => void
  onDelete: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90" onClick={onClose} />

      <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white/70 hover:text-white transition-colors"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Image */}
        <div className="flex-1 flex items-center justify-center min-h-0">
          <img
            src={image.imageURL}
            alt={image.title}
            className="max-w-full max-h-[70vh] object-contain rounded-lg"
          />
        </div>

        {/* Info */}
        <div className="mt-4 text-center">
          <h3 className="text-xl font-semibold text-[#F0E6D2]">{image.title}</h3>
          {image.description && (
            <p className="text-[#A09B8C] mt-2">{image.description}</p>
          )}
          <p className="text-sm text-[#A09B8C] mt-2">
            {image.createdAt.toLocaleDateString('ko-KR')} · {image.uploadedByName}
          </p>

          {isAdmin && (
            <button
              onClick={onDelete}
              className="mt-4 px-4 py-2 text-sm text-red-400 hover:bg-red-400/10 rounded transition-colors"
            >
              삭제
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
