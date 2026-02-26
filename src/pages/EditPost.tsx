import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getPost, updatePost, uploadPostImage } from '../services/postService'
import { Post } from '../types'
import LoadingSpinner from '../components/common/LoadingSpinner'
import {
  Breadcrumb,
  BreadcrumbItem,
  Tile,
  TextInput,
  TextArea,
  Button,
  InlineNotification,
} from '@carbon/react'
import { Close, Image } from '@carbon/icons-react'

export default function EditPost() {
  const { id } = useParams<{ id: string }>()
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const [post, setPost] = useState<Post | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [removeImage, setRemoveImage] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadPost()
  }, [id])

  const loadPost = async () => {
    if (!id) return
    try {
      const data = await getPost(id)
      if (data) {
        setPost(data)
        setTitle(data.title)
        setContent(data.content)
        if (data.imageURL) {
          setImagePreview(data.imageURL)
        }
      }
    } catch (error) {
      console.error('게시글 로딩 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const processImageFile = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setError('이미지 크기는 5MB 이하여야 합니다.')
      return false
    }
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드할 수 있습니다.')
      return false
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setRemoveImage(false)
    setError('')
    return true
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processImageFile(file)
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const file = item.getAsFile()
        if (file) {
          processImageFile(file)
        }
        break
      }
    }
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setRemoveImage(true)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser || !post) return

    if (!title.trim()) {
      setError('제목을 입력해주세요.')
      return
    }
    if (!content.trim()) {
      setError('내용을 입력해주세요.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      let newImageURL: string | null | undefined = undefined

      if (imageFile) {
        newImageURL = await uploadPostImage(imageFile, currentUser.uid)
      } else if (removeImage) {
        newImageURL = null
      }

      await updatePost(post.id, title.trim(), content.trim(), newImageURL)
      navigate(`/post/${post.id}`)
    } catch (err) {
      console.error('수정 실패:', err)
      setError('수정에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  const getCategoryInfo = (category: Post['category']) => {
    switch (category) {
      case 'introduction':
        return { label: '자기소개', icon: '👤', link: '/introduction' }
      case 'games':
        return { label: '좋아하는 게임', icon: '🎮', link: '/games' }
      default:
        return { label: '자유게시판', icon: '💬', link: '/free' }
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (!post) {
    return (
      <div className="page-container-xs" style={{ paddingTop: '2rem' }}>
        <Tile style={{ textAlign: 'center', padding: '4rem 2rem', backgroundColor: '#262626' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>😢</div>
          <p style={{ color: '#c6c6c6', marginBottom: '1.5rem' }}>게시글을 찾을 수 없습니다</p>
          <Button kind="secondary" onClick={() => navigate(-1)}>
            돌아가기
          </Button>
        </Tile>
      </div>
    )
  }

  if (!currentUser || currentUser.uid !== post.authorId) {
    return (
      <div className="page-container-xs" style={{ paddingTop: '2rem' }}>
        <Tile style={{ textAlign: 'center', padding: '4rem 2rem', backgroundColor: '#262626' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
          <p style={{ color: '#c6c6c6', marginBottom: '1.5rem' }}>수정 권한이 없습니다</p>
          <Button kind="secondary" onClick={() => navigate(-1)}>
            돌아가기
          </Button>
        </Tile>
      </div>
    )
  }

  const categoryInfo = getCategoryInfo(post.category)

  return (
    <div className="page-container-sm" style={{ paddingTop: '2rem' }}>
      {/* Breadcrumb */}
      <Breadcrumb noTrailingSlash style={{ marginBottom: '1.5rem' }}>
        <BreadcrumbItem>
          <Link to="/">홈</Link>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <Link to={categoryInfo.link}>{categoryInfo.icon} {categoryInfo.label}</Link>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>수정</BreadcrumbItem>
      </Breadcrumb>

      <Tile style={{ backgroundColor: '#262626', padding: 0 }}>
        {/* Header */}
        <div style={{
          padding: '1rem 1.5rem',
          borderBottom: '1px solid #393939',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          <span style={{ fontSize: '1.5rem' }}>✏️</span>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#f4f4f4', margin: 0 }}>
            글 수정
          </h1>
        </div>

        {/* Body */}
        <div style={{ padding: '1.5rem' }}>
          {error && (
            <div style={{ marginBottom: '1.25rem' }}>
              <InlineNotification
                kind="error"
                title={error}
                hideCloseButton
                lowContrast
              />
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.25rem' }}>
              <TextInput
                id="title"
                labelText="제목"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                light={false}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <TextArea
                id="content"
                labelText="내용"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onPaste={handlePaste}
                maxLength={5000}
                rows={12}
                light={false}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#525252' }}>Ctrl+V로 이미지 붙여넣기 가능</span>
                <span style={{ fontSize: '0.75rem', color: '#c6c6c6' }}>{content.length} / 5000</span>
              </div>
            </div>

            {/* Image Upload */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 400, color: '#c6c6c6', marginBottom: '0.5rem' }}>
                이미지 첨부 <span style={{ color: '#6f6f6f' }}>(선택)</span>
              </label>

              {imagePreview ? (
                <div style={{ position: 'relative' }}>
                  <img
                    src={imagePreview}
                    alt="미리보기"
                    style={{
                      width: '100%',
                      maxHeight: '20rem',
                      objectFit: 'contain',
                      borderRadius: '4px',
                      border: '1px solid #393939',
                      backgroundColor: '#161616',
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    style={{
                      position: 'absolute',
                      top: '0.5rem',
                      right: '0.5rem',
                      width: '2rem',
                      height: '2rem',
                      backgroundColor: 'rgba(218, 30, 40, 0.8)',
                      border: 'none',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: '#fff',
                    }}
                  >
                    <Close size={16} />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: '2px dashed #393939',
                    borderRadius: '8px',
                    padding: '2rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#525252')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#393939')}
                >
                  <Image size={40} style={{ margin: '0 auto 0.75rem', color: '#525252' }} />
                  <p style={{ fontSize: '0.875rem', color: '#c6c6c6', marginBottom: '0.25rem' }}>클릭하여 이미지 업로드</p>
                  <p style={{ fontSize: '0.75rem', color: '#525252' }}>PNG, JPG, GIF (최대 5MB)</p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Button
                kind="secondary"
                onClick={() => navigate(-1)}
                style={{ flex: 1 }}
              >
                취소
              </Button>
              <Button
                kind="primary"
                type="submit"
                disabled={submitting}
                style={{ flex: 1 }}
              >
                {submitting ? '수정 중...' : '수정하기'}
              </Button>
            </div>
          </form>
        </div>
      </Tile>
    </div>
  )
}
