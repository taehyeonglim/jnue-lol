import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getPosts } from '../services/postService'
import { Post, POINT_VALUES, TIER_INFO } from '../types'
import LoadingSpinner from '../components/common/LoadingSpinner'

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
        <div className="container">
          <h1 className="page-title">좋아하는 게임</h1>
          <p className="page-desc">좋아하는 게임을 공유하고 함께 즐겨요</p>
        </div>
      </div>

      <div className="section">
        <div className="container-sm">
          {/* Action Bar */}
          {currentUser && (
            <div className="flex justify-end mb-6">
              <Link to="/write?category=games" className="btn btn-primary">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                게임 추천하기
                <span className="badge badge-gold ml-1">+{POINT_VALUES.POST}P</span>
              </Link>
            </div>
          )}

          {/* Posts */}
          {posts.length === 0 ? (
            <div className="card text-center py-16">
              <div className="text-5xl mb-4">🎮</div>
              <p className="text-[#A09B8C] mb-6">아직 게시글이 없습니다</p>
              {currentUser && (
                <Link to="/write?category=games" className="btn btn-primary">
                  첫 게임 추천하기
                </Link>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <GameCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function GameCard({ post }: { post: Post }) {
  const tierInfo = TIER_INFO[post.authorTier]

  return (
    <Link to={`/post/${post.id}`} className="card card-hover block group">
      {/* Game Banner */}
      {post.imageURL ? (
        <div className="h-32 relative overflow-hidden">
          <img
            src={post.imageURL}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#010A13] to-transparent" />
        </div>
      ) : (
        <div className="h-24 bg-gradient-to-br from-[#0AC8B9]/20 via-[#1E2328] to-[#C8AA6E]/20 flex items-center justify-center relative overflow-hidden">
          <span className="text-4xl group-hover:scale-110 transition-transform duration-300">🎮</span>
          <div className="absolute inset-0 bg-gradient-to-t from-[#010A13] to-transparent" />
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="font-semibold text-[#F0E6D2] truncate group-hover:text-[#C8AA6E] transition-colors">
            {post.title}
          </h3>
          {post.imageURL && (
            <svg className="w-4 h-4 text-[#C8AA6E] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )}
        </div>
        <p className="text-sm text-[#A09B8C] line-clamp-2 mb-4">{post.content}</p>

        {/* Footer */}
        <div className="flex items-center gap-3 pt-3 border-t border-[#1E2328]">
          <img
            src={post.authorPhotoURL || '/default-avatar.png'}
            alt={post.authorName}
            className="avatar avatar-sm"
            style={{ borderColor: tierInfo.color }}
          />
          <div className="flex-1 min-w-0">
            <span className="text-xs text-[#A09B8C] truncate block">{post.authorName}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-[#A09B8C]">
            <span className="flex items-center gap-1">
              <span className="text-red-400">♥</span>
              <span>{post.likes.length}</span>
            </span>
            <span className="flex items-center gap-1">
              <span>💬</span>
              <span>{post.comments.length}</span>
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
