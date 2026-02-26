import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getPosts } from '../services/postService'
import { Post, POINT_VALUES, TIER_INFO } from '../types'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { Button, Tag, Tile } from '@carbon/react'
import { Add, Image } from '@carbon/icons-react'

export default function FreeBoard() {
  const { currentUser } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPosts()
  }, [])

  const loadPosts = async () => {
    try {
      const data = await getPosts('free')
      setPosts(data)
    } catch (error) {
      console.error('게시글 로딩 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-container">
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#f4f4f4', marginBottom: '0.5rem' }}>
            자유게시판
          </h1>
          <p style={{ color: '#c6c6c6' }}>자유롭게 이야기를 나눠보세요</p>
        </div>
      </div>

      <div className="page-container-sm">
        {/* Action Bar */}
        {currentUser && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
            <Link to="/write?category=free">
              <Button kind="primary" renderIcon={Add}>
                글쓰기
                <Tag type="blue" size="sm" style={{ marginLeft: '0.5rem' }}>
                  +{POINT_VALUES.POST}P
                </Tag>
              </Button>
            </Link>
          </div>
        )}

        {/* Posts */}
        {posts.length === 0 ? (
          <Tile style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
            <p style={{ color: '#c6c6c6', marginBottom: '1.5rem' }}>아직 게시글이 없습니다</p>
            {currentUser && (
              <Link to="/write?category=free">
                <Button kind="primary">첫 글 작성하기</Button>
              </Link>
            )}
          </Tile>
        ) : (
          <Tile style={{ padding: 0 }}>
            {posts.map((post, index) => (
              <PostItem key={post.id} post={post} isLast={index === posts.length - 1} />
            ))}
          </Tile>
        )}
      </div>
    </div>
  )
}

function PostItem({ post, isLast }: { post: Post; isLast: boolean }) {
  const tierInfo = TIER_INFO[post.authorTier] || TIER_INFO.bronze

  return (
    <Link
      to={`/post/${post.id}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '1rem',
        textDecoration: 'none',
        borderBottom: !isLast ? '1px solid #393939' : 'none',
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = '#353535')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <img
        src={post.authorPhotoURL || '/default-avatar.png'}
        alt={post.authorName}
        className="avatar avatar-md"
        style={{ borderColor: tierInfo.color }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <h3
            style={{
              fontWeight: 500,
              color: '#f4f4f4',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {post.title}
          </h3>
          {post.imageURL && <Image size={16} style={{ color: '#C8AA6E', flexShrink: 0 }} />}
        </div>
        <p
          style={{
            fontSize: '0.875rem',
            color: '#c6c6c6',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            marginBottom: '0.5rem',
          }}
        >
          {post.content}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', color: '#c6c6c6' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span>{post.authorName}</span>
            <span style={{ color: tierInfo.color }}>{tierInfo.emoji}</span>
          </span>
          <span>{post.createdAt.toLocaleDateString('ko-KR')}</span>
        </div>
      </div>
      {post.imageURL && (
        <img
          src={post.imageURL}
          alt="썸네일"
          style={{
            width: 64,
            height: 64,
            objectFit: 'cover',
            borderRadius: 4,
            border: '1px solid #393939',
            flexShrink: 0,
          }}
        />
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem', flexShrink: 0 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#c6c6c6' }}>
          <span style={{ color: '#da1e28' }}>♥</span>
          <span>{post.likes.length}</span>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#c6c6c6' }}>
          <span>💬</span>
          <span>{post.comments.length}</span>
        </span>
      </div>
    </Link>
  )
}
