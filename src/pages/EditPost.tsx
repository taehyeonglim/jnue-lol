import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getPost, updatePost, uploadPostImage } from '../services/postService'
import { Post } from '../types'
import LoadingSpinner from '../components/common/LoadingSpinner'

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
      <div className="section">
        <div className="container-xs">
          <div className="card text-center py-16">
            <div className="text-5xl mb-4">😢</div>
            <p className="text-[#A09B8C] mb-6">게시글을 찾을 수 없습니다</p>
            <button onClick={() => navigate(-1)} className="btn btn-secondary">
              돌아가기
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!currentUser || currentUser.uid !== post.authorId) {
    return (
      <div className="section">
        <div className="container-xs">
          <div className="card text-center py-16">
            <div className="text-5xl mb-4">🔒</div>
            <p className="text-[#A09B8C] mb-6">수정 권한이 없습니다</p>
            <button onClick={() => navigate(-1)} className="btn btn-secondary">
              돌아가기
            </button>
          </div>
        </div>
      </div>
    )
  }

  const categoryInfo = getCategoryInfo(post.category)

  return (
    <div className="section">
      <div className="container-sm">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-[#A09B8C] mb-6">
          <Link to="/" className="hover:text-[#C8AA6E] transition-colors">홈</Link>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <Link to={categoryInfo.link} className="hover:text-[#C8AA6E] transition-colors flex items-center gap-1">
            <span>{categoryInfo.icon}</span>
            <span>{categoryInfo.label}</span>
          </Link>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span>수정</span>
        </nav>

        <div className="card">
          {/* Header */}
          <div className="card-header">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✏️</span>
              <h1 className="heading-3 text-[#C8AA6E]">글 수정</h1>
            </div>
          </div>

          <div className="card-body">
            {error && (
              <div className="mb-5 p-4 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-400 flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-5">
                <label htmlFor="title" className="block text-sm font-medium text-[#F0E6D2] mb-2">
                  제목
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input"
                  maxLength={100}
                />
              </div>

              <div className="mb-6">
                <label htmlFor="content" className="block text-sm font-medium text-[#F0E6D2] mb-2">
                  내용
                </label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onPaste={handlePaste}
                  className="input textarea h-64"
                  maxLength={5000}
                />
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-[#3C3C41]">Ctrl+V로 이미지 붙여넣기 가능</span>
                  <span className="text-xs text-[#A09B8C]">{content.length} / 5000</span>
                </div>
              </div>

              {/* Image Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-[#F0E6D2] mb-2">
                  이미지 첨부 <span className="text-[#A09B8C] font-normal">(선택)</span>
                </label>

                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="미리보기"
                      className="w-full max-h-80 object-contain rounded border border-[#3C3C41] bg-[#010A13]"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center transition-colors"
                    >
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-[#3C3C41] rounded-lg p-8 text-center cursor-pointer hover:border-[#C8AA6E]/50 transition-colors"
                  >
                    <svg className="w-10 h-10 mx-auto mb-3 text-[#3C3C41]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm text-[#A09B8C] mb-1">클릭하여 이미지 업로드</p>
                    <p className="text-xs text-[#3C3C41]">PNG, JPG, GIF (최대 5MB)</p>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="flex-1 btn btn-secondary"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 btn btn-primary"
                >
                  {submitting ? '수정 중...' : '수정하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
