import { useState, useEffect } from 'react'
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy, serverTimestamp, Timestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from '../config/firebase'
import { useAuth } from '../contexts/AuthContext'
import { GalleryImage } from '../types'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { Tile, Button, Modal, TextInput, TextArea } from '@carbon/react'
import { Add, TrashCan, Close } from '@carbon/icons-react'

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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.875rem' }}>📸</span>
            <h1 className="page-title">갤러리</h1>
          </div>
          <p className="page-desc">동아리 활동 사진을 감상하세요</p>
        </div>
      </div>

      <div style={{ padding: '2rem 0' }}>
        <div className="page-container">
          {/* Admin Upload Button */}
          {currentUser?.isAdmin && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
              <Button
                kind="primary"
                renderIcon={Add}
                onClick={() => setShowUploadModal(true)}
              >
                사진 업로드
              </Button>
            </div>
          )}

          {/* Gallery Grid */}
          {images.length === 0 ? (
            <Tile style={{ padding: '3rem', textAlign: 'center', background: '#262626' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📷</div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#f4f4f4', marginBottom: '0.5rem' }}>아직 사진이 없습니다</h3>
              <p style={{ color: '#c6c6c6' }}>동아리 활동 사진이 곧 업로드됩니다!</p>
            </Tile>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
              {images.map((image) => (
                <div
                  key={image.id}
                  onClick={() => setSelectedImage(image)}
                  style={{
                    position: 'relative',
                    aspectRatio: '1',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: '1px solid #393939',
                    transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#C8AA6E'
                    const overlay = e.currentTarget.querySelector('[data-overlay]') as HTMLElement
                    if (overlay) overlay.style.opacity = '1'
                    const img = e.currentTarget.querySelector('img') as HTMLElement
                    if (img) img.style.transform = 'scale(1.05)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#393939'
                    const overlay = e.currentTarget.querySelector('[data-overlay]') as HTMLElement
                    if (overlay) overlay.style.opacity = '0'
                    const img = e.currentTarget.querySelector('img') as HTMLElement
                    if (img) img.style.transform = 'scale(1)'
                  }}
                >
                  <img
                    src={image.imageURL}
                    alt={image.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
                  />
                  <div
                    data-overlay
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent, transparent)',
                      opacity: 0,
                      transition: 'opacity 0.2s',
                    }}
                  >
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0.75rem' }}>
                      <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{image.title}</p>
                      <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>
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

  const handleSubmit = async () => {
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
    <Modal
      open
      modalHeading="사진 업로드"
      primaryButtonText={uploading ? '업로드 중...' : '업로드'}
      secondaryButtonText="취소"
      onRequestClose={onClose}
      onRequestSubmit={handleSubmit}
      primaryButtonDisabled={uploading || !file}
      size="sm"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Image Upload */}
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: '#c6c6c6', marginBottom: '0.5rem' }}>이미지</label>
          {preview ? (
            <div style={{ position: 'relative' }}>
              <img src={preview} alt="Preview" style={{ width: '100%', height: '192px', objectFit: 'cover', borderRadius: '8px' }} />
              <Button
                kind="ghost"
                size="sm"
                hasIconOnly
                renderIcon={Close}
                iconDescription="제거"
                onClick={() => {
                  setFile(null)
                  setPreview(null)
                }}
                style={{ position: 'absolute', top: '8px', right: '8px', backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff' }}
              />
            </div>
          ) : (
            <label style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '192px',
              border: '2px dashed #393939',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'border-color 0.15s',
            }}>
              <span style={{ fontSize: '3rem', color: '#c6c6c6', marginBottom: '0.5rem' }}>📷</span>
              <p style={{ fontSize: '0.875rem', color: '#c6c6c6' }}>클릭하여 이미지 선택</p>
              <p style={{ fontSize: '0.75rem', color: '#c6c6c6', marginTop: '0.25rem' }}>최대 10MB</p>
              <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
            </label>
          )}
        </div>

        {/* Title */}
        <TextInput
          id="gallery-title"
          labelText="제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="사진 제목"
          maxLength={100}
        />

        {/* Description */}
        <TextArea
          id="gallery-description"
          labelText="설명 (선택)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="사진에 대한 설명"
          maxLength={500}
          rows={3}
        />
      </div>
    </Modal>
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
    <Modal
      open
      passiveModal
      modalHeading={image.title}
      onRequestClose={onClose}
      size="lg"
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Image */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          <img
            src={image.imageURL}
            alt={image.title}
            style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain', borderRadius: '8px' }}
          />
        </div>

        {/* Info */}
        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          {image.description && (
            <p style={{ color: '#c6c6c6', marginTop: '0.5rem' }}>{image.description}</p>
          )}
          <p style={{ fontSize: '0.875rem', color: '#c6c6c6', marginTop: '0.5rem' }}>
            {image.createdAt.toLocaleDateString('ko-KR')} · {image.uploadedByName}
          </p>

          {isAdmin && (
            <Button
              kind="danger--ghost"
              size="sm"
              renderIcon={TrashCan}
              onClick={onDelete}
              style={{ marginTop: '1rem' }}
            >
              삭제
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}
