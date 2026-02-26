import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getPosts } from '../services/postService'
import { Post, POINT_VALUES, TIER_INFO } from '../types'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { Button, Tag, Tile } from '@carbon/react'
import { Add, Image } from '@carbon/icons-react'

export default function Introduction() {
  const { currentUser } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPosts()
  }, [])

  const loadPosts = async () => {
    try {
      const data = await getPosts('introduction')
      setPosts(data)
    } catch (error) {
      console.error('게시글 로딩 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const hasIntroduction = posts.some((post) => post.authorId === currentUser?.uid)

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-container">
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#f4f4f4', marginBottom: '0.5rem' }}>
            자기소개
          </h1>
          <p style={{ color: '#c6c6c6' }}>동아리원들을 만나보세요</p>
        </div>
      </div>

      <div className="page-container-sm">
        {/* Action Bar */}
        {currentUser && !hasIntroduction && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
            <Link to="/write?category=introduction">
              <Button kind="primary" renderIcon={Add}>
                자기소개 작성하기
                <Tag type="blue" size="sm" style={{ marginLeft: '0.5rem' }}>
                  +{POINT_VALUES.INTRODUCTION}P
                </Tag>
              </Button>
            </Link>
          </div>
        )}

        {/* Posts */}
        {posts.length === 0 ? (
          <Tile style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👋</div>
            <p style={{ color: '#c6c6c6', marginBottom: '1.5rem' }}>아직 자기소개가 없습니다</p>
            {currentUser && (
              <Link to="/write?category=introduction">
                <Button kind="primary">첫 자기소개 작성하기</Button>
              </Link>
            )}
          </Tile>
        ) : (
          <div
            style={{
              display: 'grid',
              gap: '1rem',
              gridTemplateColumns: 'repeat(1, 1fr)',
            }}
            className="intro-grid"
          >
            <style>{`
              @media (min-width: 640px) { .intro-grid { grid-template-columns: repeat(2, 1fr) !important; } }
              @media (min-width: 1024px) { .intro-grid { grid-template-columns: repeat(3, 1fr) !important; } }
            `}</style>
            {posts.map((post) => (
              <IntroductionCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function IntroductionCard({ post }: { post: Post }) {
  const tierInfo = TIER_INFO[post.authorTier] || TIER_INFO.bronze

  return (
    <Link to={`/post/${post.id}`} style={{ textDecoration: 'none' }}>
      <Tile
        style={{
          padding: '1.25rem',
          cursor: 'pointer',
          transition: 'background 0.15s',
          height: '100%',
        }}
        onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) =>
          (e.currentTarget.style.background = '#353535')
        }
        onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) =>
          (e.currentTarget.style.background = '')
        }
      >
        {/* Author Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <img
            src={post.authorPhotoURL || '/default-avatar.png'}
            alt={post.authorName}
            className="avatar avatar-lg"
            style={{ borderColor: tierInfo.color }}
          />
          <div style={{ minWidth: 0, flex: 1 }}>
            <h3
              style={{
                fontWeight: 600,
                color: '#f4f4f4',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {post.authorName}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
              <span style={{ fontSize: '0.875rem' }}>{tierInfo.emoji}</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 500, color: tierInfo.color }}>
                {tierInfo.name}
              </span>
            </div>
          </div>
        </div>

        {/* Image Thumbnail */}
        {post.imageURL && (
          <div style={{ marginBottom: '1rem', margin: '0 -0.25rem 1rem' }}>
            <img
              src={post.imageURL}
              alt="첨부 이미지"
              style={{
                width: '100%',
                height: 128,
                objectFit: 'cover',
                borderRadius: 4,
                border: '1px solid #393939',
              }}
            />
          </div>
        )}

        {/* Content */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <h4
            style={{
              fontWeight: 500,
              color: '#C8AA6E',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {post.title}
          </h4>
          {post.imageURL && <Image size={16} style={{ color: '#C8AA6E', flexShrink: 0 }} />}
        </div>
        <p
          style={{
            fontSize: '0.875rem',
            color: '#c6c6c6',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            marginBottom: '1rem',
          }}
        >
          {post.content}
        </p>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            paddingTop: '1rem',
            borderTop: '1px solid #393939',
            fontSize: '0.75rem',
            color: '#c6c6c6',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{ color: '#da1e28' }}>♥</span>
            <span>{post.likes.length}</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span>💬</span>
            <span>{post.comments.length}</span>
          </span>
          <span style={{ marginLeft: 'auto' }}>
            {post.createdAt.toLocaleDateString('ko-KR')}
          </span>
        </div>
      </Tile>
    </Link>
  )
}
