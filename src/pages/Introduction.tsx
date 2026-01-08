import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getPosts } from '../services/postService'
import { Post, POINT_VALUES, TIER_INFO } from '../types'
import LoadingSpinner from '../components/common/LoadingSpinner'

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
        <div className="container">
          <h1 className="page-title">자기소개</h1>
          <p className="page-desc">동아리원들을 만나보세요</p>
        </div>
      </div>

      <div className="section">
        <div className="container-sm">
          {/* Action Bar */}
          {currentUser && !hasIntroduction && (
            <div className="flex justify-end mb-6">
              <Link to="/write?category=introduction" className="btn btn-primary">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                자기소개 작성하기
                <span className="badge badge-gold ml-1">+{POINT_VALUES.INTRODUCTION}P</span>
              </Link>
            </div>
          )}

          {/* Posts */}
          {posts.length === 0 ? (
            <div className="card text-center py-16">
              <div className="text-5xl mb-4">👋</div>
              <p className="text-[#A09B8C] mb-6">아직 자기소개가 없습니다</p>
              {currentUser && (
                <Link to="/write?category=introduction" className="btn btn-primary">
                  첫 자기소개 작성하기
                </Link>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <IntroductionCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function IntroductionCard({ post }: { post: Post }) {
  const tierInfo = TIER_INFO[post.authorTier] || TIER_INFO.bronze

  return (
    <Link to={`/post/${post.id}`} className="card card-hover p-5 block group">
      {/* Author Info */}
      <div className="flex items-center gap-4 mb-4">
        <img
          src={post.authorPhotoURL || '/default-avatar.png'}
          alt={post.authorName}
          className="avatar avatar-lg"
          style={{ borderColor: tierInfo.color }}
        />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-[#F0E6D2] truncate group-hover:text-[#C8AA6E] transition-colors">
            {post.authorName}
          </h3>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-sm">{tierInfo.emoji}</span>
            <span className="text-xs font-medium" style={{ color: tierInfo.color }}>
              {tierInfo.name}
            </span>
          </div>
        </div>
      </div>

      {/* Image Thumbnail */}
      {post.imageURL && (
        <div className="mb-4 -mx-1">
          <img
            src={post.imageURL}
            alt="첨부 이미지"
            className="w-full h-32 object-cover rounded border border-[#3C3C41]"
          />
        </div>
      )}

      {/* Content */}
      <div className="flex items-center gap-2 mb-2">
        <h4 className="font-medium text-[#C8AA6E] truncate">{post.title}</h4>
        {post.imageURL && (
          <svg className="w-4 h-4 text-[#C8AA6E] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )}
      </div>
      <p className="text-sm text-[#A09B8C] line-clamp-3 mb-4">{post.content}</p>

      {/* Footer */}
      <div className="flex items-center gap-4 pt-4 border-t border-[#1E2328] text-xs text-[#A09B8C]">
        <span className="flex items-center gap-1">
          <span className="text-red-400">♥</span>
          <span>{post.likes.length}</span>
        </span>
        <span className="flex items-center gap-1">
          <span>💬</span>
          <span>{post.comments.length}</span>
        </span>
        <span className="ml-auto">
          {post.createdAt.toLocaleDateString('ko-KR')}
        </span>
      </div>
    </Link>
  )
}
