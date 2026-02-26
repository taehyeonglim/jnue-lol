import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getPost, toggleLike, addComment, deletePost, deleteComment } from '../services/postService'
import { getUserById } from '../services/messageService'
import { Post, Comment, User, POINT_VALUES, TIER_INFO } from '../types'
import LoadingSpinner from '../components/common/LoadingSpinner'
import SendMessageModal from '../components/common/SendMessageModal'
import {
  Breadcrumb,
  BreadcrumbItem,
  Tile,
  TextArea,
  Button,
} from '@carbon/react'
import { Email, Edit, TrashCan, FavoriteFilled, Favorite, Chat } from '@carbon/icons-react'

export default function PostDetail() {
  const { id } = useParams<{ id: string }>()
  const { currentUser, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [messageTarget, setMessageTarget] = useState<User | null>(null)

  useEffect(() => {
    loadPost()
  }, [id])

  const loadPost = async () => {
    if (!id) return
    try {
      const data = await getPost(id)
      setPost(data)
    } catch (error) {
      console.error('게시글 로딩 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async () => {
    if (!currentUser || !post) return
    try {
      const liked = await toggleLike(post.id, currentUser.uid, post.authorId)
      setPost((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          likes: liked
            ? [...prev.likes, currentUser.uid]
            : prev.likes.filter((uid) => uid !== currentUser.uid),
        }
      })
      await refreshUser()
    } catch (error) {
      console.error('좋아요 실패:', error)
    }
  }

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser || !post || !commentText.trim() || submitting) return

    setSubmitting(true)
    try {
      const newComment = await addComment(post.id, currentUser, commentText.trim())
      setPost((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          comments: [...prev.comments, newComment],
        }
      })
      setCommentText('')
      await refreshUser()
    } catch (error) {
      console.error('댓글 작성 실패:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeletePost = async () => {
    if (!post || !window.confirm('정말 삭제하시겠습니까?')) return
    try {
      await deletePost(post.id, post.authorId, post.category)
      await refreshUser()
      navigate(-1)
    } catch (error) {
      console.error('삭제 실패:', error)
    }
  }

  const handleDeleteComment = async (comment: Comment) => {
    if (!post || !window.confirm('댓글을 삭제하시겠습니까?')) return
    try {
      await deleteComment(post.id, comment)
      setPost((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          comments: prev.comments.filter((c) => c.id !== comment.id),
        }
      })
      await refreshUser()
    } catch (error) {
      console.error('댓글 삭제 실패:', error)
    }
  }

  const handleSendMessage = async (userId: string) => {
    try {
      const user = await getUserById(userId)
      if (user) {
        setMessageTarget(user)
      }
    } catch (error) {
      console.error('사용자 정보 로딩 실패:', error)
    }
  }

  const getCategoryInfo = (category: Post['category']) => {
    switch (category) {
      case 'introduction':
        return { label: '자기소개', link: '/introduction', icon: '👤' }
      case 'free':
        return { label: '자유게시판', link: '/free', icon: '💬' }
      case 'games':
        return { label: '좋아하는 게임', link: '/games', icon: '🎮' }
      default:
        return { label: '', link: '/', icon: '' }
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

  const categoryInfo = getCategoryInfo(post.category)
  const isAuthor = currentUser?.uid === post.authorId
  const isAdmin = currentUser?.isAdmin
  const isLiked = currentUser && post.likes.includes(currentUser.uid)
  const tierInfo = TIER_INFO[post.authorTier] || TIER_INFO.bronze

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
      </Breadcrumb>

      {/* Post Content */}
      <Tile style={{ backgroundColor: '#262626', padding: 0, marginBottom: '1.5rem' }}>
        <div style={{ padding: '1.5rem' }}>
          {/* Author Info */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <img
                src={post.authorPhotoURL || '/default-avatar.png'}
                alt={post.authorName}
                className="avatar avatar-md"
                style={{ borderColor: tierInfo.color }}
              />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.125rem' }}>
                  <span style={{ fontWeight: 600, color: '#f4f4f4' }}>{post.authorName}</span>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      padding: '0.125rem 0.375rem',
                      borderRadius: '4px',
                      backgroundColor: `${tierInfo.color}20`,
                      color: tierInfo.color,
                    }}
                  >
                    {tierInfo.emoji} {tierInfo.name}
                  </span>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#c6c6c6' }}>
                  {post.createdAt.toLocaleString('ko-KR')}
                </span>
              </div>
            </div>

            {(isAuthor || isAdmin) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                {isAuthor && (
                  <Button
                    kind="ghost"
                    size="sm"
                    as={Link}
                    to={`/edit/${post.id}`}
                    renderIcon={Edit}
                  >
                    수정
                  </Button>
                )}
                <Button
                  kind="danger--ghost"
                  size="sm"
                  onClick={handleDeletePost}
                  renderIcon={TrashCan}
                >
                  삭제
                </Button>
              </div>
            )}
          </div>

          {/* Title & Content */}
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#f4f4f4', marginBottom: '1rem' }}>
            {post.title}
          </h1>
          <div className="post-content" style={{ color: 'rgba(244,244,244,0.9)', whiteSpace: 'pre-wrap', lineHeight: 1.7, marginBottom: '1rem' }}>
            {post.content}
          </div>

          {/* Post Image */}
          {post.imageURL && (
            <div style={{ marginTop: '1rem' }}>
              <img
                src={post.imageURL}
                alt="첨부 이미지"
                style={{
                  width: '100%',
                  maxHeight: '500px',
                  objectFit: 'contain',
                  borderRadius: '8px',
                  border: '1px solid #393939',
                  backgroundColor: '#161616',
                  cursor: 'pointer',
                }}
                onClick={() => window.open(post.imageURL, '_blank')}
              />
            </div>
          )}

          {/* Actions */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginTop: '2rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid #393939',
          }}>
            <Button
              kind={isLiked ? 'danger' : 'ghost'}
              size="md"
              onClick={handleLike}
              disabled={!currentUser}
              renderIcon={isLiked ? FavoriteFilled : Favorite}
            >
              좋아요 {post.likes.length}
            </Button>
            <span style={{ fontSize: '0.875rem', color: '#c6c6c6', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <Chat size={16} /> 댓글 {post.comments.length}개
            </span>
            {currentUser && !isAuthor && (
              <Button
                kind="ghost"
                size="md"
                onClick={() => handleSendMessage(post.authorId)}
                renderIcon={Email}
                style={{ marginLeft: 'auto' }}
              >
                쪽지
              </Button>
            )}
          </div>
        </div>
      </Tile>

      {/* Comments Section */}
      <Tile style={{ backgroundColor: '#262626', padding: 0 }}>
        {/* Comments Header */}
        <div style={{
          padding: '1rem 1.5rem',
          borderBottom: '1px solid #393939',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <Chat size={20} style={{ color: '#f4f4f4' }} />
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#f4f4f4', margin: 0 }}>
            댓글
          </h2>
          <span style={{ fontSize: '0.875rem', fontWeight: 400, color: '#c6c6c6' }}>
            ({post.comments.length})
          </span>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {/* Comment Form */}
          {currentUser ? (
            <form onSubmit={handleComment} style={{ marginBottom: '1.5rem' }}>
              <TextArea
                id="comment-text"
                labelText=""
                hideLabel
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={`댓글을 작성하세요 (+${POINT_VALUES.COMMENT}P)`}
                maxLength={500}
                rows={3}
                light={false}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#c6c6c6' }}>{commentText.length}/500</span>
                <Button
                  kind="primary"
                  size="sm"
                  type="submit"
                  disabled={!commentText.trim() || submitting}
                >
                  {submitting ? '작성 중...' : '댓글 작성'}
                </Button>
              </div>
            </form>
          ) : (
            <div style={{
              marginBottom: '1.5rem',
              padding: '1rem',
              backgroundColor: '#161616',
              borderRadius: '4px',
              border: '1px solid #393939',
              textAlign: 'center',
            }}>
              <p style={{ fontSize: '0.875rem', color: '#c6c6c6', margin: 0 }}>댓글을 작성하려면 로그인하세요</p>
            </div>
          )}

          {/* Comments List */}
          {post.comments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <p style={{ fontSize: '0.875rem', color: '#c6c6c6', margin: 0 }}>아직 댓글이 없습니다</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {post.comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  canDelete={currentUser?.uid === comment.authorId || isAdmin}
                  onDelete={() => handleDeleteComment(comment)}
                />
              ))}
            </div>
          )}
        </div>
      </Tile>

      {/* Send Message Modal */}
      {messageTarget && (
        <SendMessageModal
          receiver={messageTarget}
          onClose={() => setMessageTarget(null)}
          onSuccess={() => alert('쪽지를 보냈습니다!')}
        />
      )}
    </div>
  )
}

function CommentItem({
  comment,
  canDelete,
  onDelete,
}: {
  comment: Comment
  canDelete?: boolean
  onDelete: () => void
}) {
  const createdAt = comment.createdAt instanceof Date
    ? comment.createdAt
    : new Date(comment.createdAt)

  const tierInfo = TIER_INFO[comment.authorTier] || TIER_INFO.bronze

  return (
    <div style={{
      display: 'flex',
      gap: '0.75rem',
      padding: '1rem',
      backgroundColor: '#161616',
      borderRadius: '4px',
      border: '1px solid #393939',
    }}>
      <img
        src={comment.authorPhotoURL || '/default-avatar.png'}
        alt={comment.authorName}
        className="avatar avatar-sm"
        style={{ borderColor: tierInfo.color, flexShrink: 0 }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#f4f4f4' }}>{comment.authorName}</span>
          <span style={{ fontSize: '0.75rem', color: tierInfo.color }}>
            {tierInfo.emoji}
          </span>
          <span style={{ fontSize: '0.75rem', color: '#c6c6c6' }}>
            {createdAt.toLocaleString('ko-KR')}
          </span>
          {canDelete && (
            <Button
              kind="danger--ghost"
              size="sm"
              onClick={onDelete}
              style={{ marginLeft: 'auto', minHeight: 'auto', padding: '0.125rem 0.5rem' }}
            >
              삭제
            </Button>
          )}
        </div>
        <p style={{ fontSize: '0.875rem', color: 'rgba(244,244,244,0.8)', lineHeight: 1.6, margin: 0 }}>
          {comment.content}
        </p>
      </div>
    </div>
  )
}
