import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { TIER_INFO } from '../../types'
import { getUnreadCount } from '../../services/messageService'

export default function Header() {
  const { currentUser, signInWithGoogle, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [unreadMessages, setUnreadMessages] = useState(0)

  useEffect(() => {
    if (currentUser) {
      loadUnreadCount()
      // 30초마다 새 쪽지 확인
      const interval = setInterval(loadUnreadCount, 30000)
      return () => clearInterval(interval)
    }
  }, [currentUser])

  const loadUnreadCount = async () => {
    if (!currentUser) return
    try {
      const count = await getUnreadCount(currentUser.uid)
      setUnreadMessages(count)
    } catch (error) {
      console.error('읽지 않은 쪽지 수 로딩 실패:', error)
    }
  }

  const handleSignIn = async () => {
    try {
      await signInWithGoogle()
    } catch (error) {
      console.error('로그인 실패:', error)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/')
    } catch (error) {
      console.error('로그아웃 실패:', error)
    }
  }

  const isActive = (path: string) => location.pathname === path

  const navLinks = [
    { path: '/introduction', label: '자기소개' },
    { path: '/free', label: '자유게시판' },
    { path: '/games', label: '게임' },
    { path: '/ranking', label: '랭킹' },
  ]

  const displayName = currentUser?.nickname || currentUser?.displayName

  return (
    <header className="sticky top-0 z-50 bg-[#010A13] border-b border-[#1E2328]">
      {/* Gold accent line */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-[#785A28] to-transparent" />

      <div className="container">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="JNUE-LoL" className="w-8 h-8" />
            <div className="hidden sm:block">
              <span className="font-bold text-[#F0E6D2] tracking-wide">
                JNUE<span className="text-[#C8AA6E]">-</span>LoL
              </span>
              <p className="text-[9px] text-[#A09B8C] tracking-wider">Learn or Lose</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 text-sm font-medium rounded border transition-all ${
                  isActive(link.path)
                    ? 'bg-[#C8AA6E]/15 border-[#C8AA6E]/50 text-[#C8AA6E]'
                    : 'bg-[#1E2328] border-[#3C3C41] text-[#A09B8C] hover:border-[#C8AA6E]/30 hover:text-[#F0E6D2]'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {currentUser?.isAdmin && (
              <Link
                to="/admin"
                className={`px-4 py-2 text-sm font-medium rounded border transition-all ${
                  isActive('/admin')
                    ? 'bg-[#0AC8B9]/15 border-[#0AC8B9]/50 text-[#0AC8B9]'
                    : 'bg-[#1E2328] border-[#0AC8B9]/30 text-[#0AC8B9]/70 hover:border-[#0AC8B9]/50 hover:text-[#0AC8B9]'
                }`}
              >
                관리자
              </Link>
            )}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {currentUser ? (
              <>
                {/* Messages Link */}
                <Link
                  to="/messages"
                  className="relative p-2 text-[#A09B8C] hover:text-[#C8AA6E] transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {unreadMessages > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                      {unreadMessages > 9 ? '9+' : unreadMessages}
                    </span>
                  )}
                </Link>
                <Link
                  to="/mypage"
                  className="flex items-center gap-3 px-3 py-1.5 rounded hover:bg-[#1E2328] transition-colors"
                >
                  <div className="relative">
                    <img
                      src={currentUser.photoURL || '/default-avatar.png'}
                      alt={displayName}
                      className="w-8 h-8 rounded-full border-2 object-cover"
                      style={{ borderColor: TIER_INFO[currentUser.tier].color }}
                    />
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium text-[#F0E6D2] leading-tight">
                      {displayName}
                    </p>
                    <p className="text-xs text-[#C8AA6E]">
                      {currentUser.points}P
                    </p>
                  </div>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-[#A09B8C] hover:text-[#F0E6D2] text-sm hidden sm:block"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <button
                onClick={handleSignIn}
                className="btn btn-primary btn-sm"
              >
                로그인
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-[#A09B8C] hover:text-[#F0E6D2]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#010A13] border-t border-[#1E2328]">
          <nav className="container py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 rounded text-sm font-medium ${
                  isActive(link.path)
                    ? 'bg-[#1E2328] text-[#C8AA6E]'
                    : 'text-[#A09B8C] hover:bg-[#1E2328]'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {currentUser && (
              <Link
                to="/messages"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 rounded text-sm font-medium flex items-center gap-2 ${
                  isActive('/messages')
                    ? 'bg-[#1E2328] text-[#C8AA6E]'
                    : 'text-[#A09B8C] hover:bg-[#1E2328]'
                }`}
              >
                쪽지함
                {unreadMessages > 0 && (
                  <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                    {unreadMessages}
                  </span>
                )}
              </Link>
            )}
            {currentUser?.isAdmin && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 rounded text-sm font-medium ${
                  isActive('/admin')
                    ? 'bg-[#1E2328] text-[#0AC8B9]'
                    : 'text-[#0AC8B9]/70'
                }`}
              >
                관리자
              </Link>
            )}
            {currentUser && (
              <button
                onClick={() => {
                  handleSignOut()
                  setMobileMenuOpen(false)
                }}
                className="px-4 py-3 text-left text-sm text-[#A09B8C] hover:text-[#F0E6D2]"
              >
                로그아웃
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
