import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getPosts } from '../services/postService'
import { Post, POINT_VALUES, TIER_INFO } from '../types'
import LoadingSpinner from '../components/common/LoadingSpinner'

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
        <div className="container">
          <h1 className="page-title">자유게시판</h1>
          <p className="page-desc">자유롭게 이야기를 나눠보세요</p>
        </div>
      </div>

      <div className="section">
        <div className="container-sm">
          {/* Action Bar */}
          {currentUser && (
            <div className="flex justify-end mb-6">
              <Link to="/write?category=free" className="btn btn-primary">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                글쓰기
                <span className="badge badge-gold ml-1">+{POINT_VALUES.POST}P</span>
              </Link>
            </div>
          )}

          {/* Posts */}
          {posts.length === 0 ? (
            <div className="card text-center py-16">
              <div className="text-5xl mb-4">💬</div>
              <p className="text-[#A09B8C] mb-6">아직 게시글이 없습니다</p>
              {currentUser && (
                <Link to="/write?category=free" className="btn btn-primary">
                  첫 글 작성하기
                </Link>
              )}
            </div>
          ) : (
            <div className="card">
              {posts.map((post, index) => (
                <PostItem key={post.id} post={post} isLast={index === posts.length - 1} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function PostItem({ post, isLast }: { post: Post; isLast: boolean }) {
  const tierInfo = TIER_INFO[post.authorTier]

  return (
    <Link
      to={`/post/${post.id}`}
      className={`list-item gap-4 ${!isLast ? '' : 'border-b-0'}`}
    >
      <img
        src={post.authorPhotoURL || '/default-avatar.png'}
        alt={post.authorName}
        className="avatar avatar-md"
        style={{ borderColor: tierInfo.color }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-medium text-[#F0E6D2] truncate hover:text-[#C8AA6E] transition-colors">
            {post.title}
          </h3>
          {post.imageURL && (
            <svg className="w-4 h-4 text-[#C8AA6E] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )}
        </div>
        <p className="text-sm text-[#A09B8C] truncate mb-2">{post.content}</p>
        <div className="flex items-center gap-4 text-xs text-[#A09B8C]">
          <span className="flex items-center gap-1">
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
          className="w-16 h-16 object-cover rounded border border-[#3C3C41] shrink-0"
        />
      )}
      <div className="flex items-center gap-4 text-sm shrink-0">
        <span className="flex items-center gap-1 text-[#A09B8C]">
          <span className="text-red-400">♥</span>
          <span>{post.likes.length}</span>
        </span>
        <span className="flex items-center gap-1 text-[#A09B8C]">
          <span>💬</span>
          <span>{post.comments.length}</span>
        </span>
      </div>
    </Link>
  )
}
