import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getPosts } from '../services/postService'
import { Post, POINT_VALUES, TIER_INFO } from '../types'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { Button, Tag, Tile } from '@carbon/react'
import { Add, Image } from '@carbon/icons-react'

export default function GamesBoard() {
  const { currentUser } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPosts()
  }, [])

  const loadPosts = async () => {
    try {
      const data = await getPosts('games')
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
            좋아하는 게임
          </h1>
          <p style={{ color: '#c6c6c6' }}>좋아하는 게임을 공유하고 함께 즐겨요</p>
        </div>
      </div>

      <div className="page-container-sm">
        {/* Action Bar */}
        {currentUser && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
            <Link to="/write?category=games">
              <Button kind="primary" renderIcon={Add}>
                게임 추천하기
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
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎮</div>
            <p style={{ color: '#c6c6c6', marginBottom: '1.5rem' }}>아직 게시글이 없습니다</p>
            {currentUser && (
              <Link to="/write?category=games">
                <Button kind="primary">첫 게임 추천하기</Button>
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
            className="games-grid"
          >
            <style>{`
              @media (min-width: 640px) { .games-grid { grid-template-columns: repeat(2, 1fr) !important; } }
              @media (min-width: 1024px) { .games-grid { grid-template-columns: repeat(3, 1fr) !important; } }
            `}</style>
            {posts.map((post) => (
              <GameCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function GameCard({ post }: { post: Post }) {
  const tierInfo = TIER_INFO[post.authorTier] || TIER_INFO.bronze

  return (
    <Link to={`/post/${post.id}`} style={{ textDecoration: 'none' }}>
      <Tile
        style={{
          padding: 0,
          cursor: 'pointer',
          overflow: 'hidden',
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
        {/* Game Banner */}
        {post.imageURL ? (
          <div style={{ height: 128, position: 'relative', overflow: 'hidden' }}>
            <img
              src={post.imageURL}
              alt={post.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'transform 0.3s',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, #161616, transparent)',
              }}
            />
          </div>
        ) : (
          <div
            style={{
              height: 96,
              background: 'linear-gradient(135deg, rgba(10,200,185,0.2), #262626, rgba(200,170,110,0.2))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <span style={{ fontSize: '2.5rem', transition: 'transform 0.3s' }}>🎮</span>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, #161616, transparent)',
              }}
            />
          </div>
        )}

        {/* Content */}
        <div style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <h3
              style={{
                fontWeight: 600,
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
              display: '-webkit-box',
              WebkitLineClamp: 2,
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
              gap: '0.75rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid #393939',
            }}
          >
            <img
              src={post.authorPhotoURL || '/default-avatar.png'}
              alt={post.authorName}
              className="avatar avatar-sm"
              style={{ borderColor: tierInfo.color }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  color: '#c6c6c6',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  display: 'block',
                }}
              >
                {post.authorName}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', color: '#c6c6c6' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ color: '#da1e28' }}>♥</span>
                <span>{post.likes.length}</span>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span>💬</span>
                <span>{post.comments.length}</span>
              </span>
            </div>
          </div>
        </div>
      </Tile>
    </Link>
  )
}
