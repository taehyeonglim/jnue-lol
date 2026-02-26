import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

import { getUnreadCount } from '../../services/messageService'
import {
  Header as CarbonHeader,
  HeaderName,
  HeaderNavigation,
  HeaderMenuItem,
  HeaderGlobalBar,
  HeaderGlobalAction,
  SideNav,
  SideNavItems,
  SideNavLink,
  SkipToContent,
  Button,
} from '@carbon/react'
import { Email, Menu, Close, UserAvatar, Settings, Logout } from '@carbon/icons-react'

export default function Header() {
  const { currentUser, signInWithGoogle, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [unreadMessages, setUnreadMessages] = useState(0)

  useEffect(() => {
    if (currentUser) {
      loadUnreadCount()
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
    { path: '/gallery', label: '갤러리' },
    { path: '/ranking', label: '랭킹' },
  ]

  const displayName = currentUser?.nickname || currentUser?.displayName

  return (
    <CarbonHeader aria-label="JNUE-LoL">
      <SkipToContent />
      <HeaderName
        as={Link}
        to="/"
        prefix=""
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
      >
        <img src="/logo.png" alt="JNUE-LoL" style={{ width: 24, height: 24 }} />
        JNUE-LoL
      </HeaderName>

      <HeaderNavigation aria-label="메인 네비게이션">
        {navLinks.map((link) => (
          <HeaderMenuItem
            key={link.path}
            as={Link}
            to={link.path}
            isCurrentPage={isActive(link.path)}
          >
            {link.label}
          </HeaderMenuItem>
        ))}
        {currentUser?.isAdmin && (
          <HeaderMenuItem
            as={Link}
            to="/admin"
            isCurrentPage={isActive('/admin')}
          >
            관리자
          </HeaderMenuItem>
        )}
      </HeaderNavigation>

      <HeaderGlobalBar>
        {currentUser ? (
          <>
            <HeaderGlobalAction
              aria-label="쪽지"
              onClick={() => navigate('/messages')}
            >
              <Email size={20} />
              {unreadMessages > 0 && (
                <span className="notification-badge" />
              )}
            </HeaderGlobalAction>

            <HeaderGlobalAction
              aria-label="내 정보"
              onClick={() => navigate('/mypage')}
              tooltipAlignment="end"
            >
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={displayName}
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <UserAvatar size={20} />
              )}
            </HeaderGlobalAction>

            <HeaderGlobalAction
              aria-label="로그아웃"
              onClick={handleSignOut}
              tooltipAlignment="end"
            >
              <Logout size={20} />
            </HeaderGlobalAction>
          </>
        ) : (
          <Button
            kind="primary"
            size="sm"
            onClick={handleSignIn}
            style={{ marginRight: '1rem' }}
          >
            로그인
          </Button>
        )}

        <HeaderGlobalAction
          aria-label="메뉴"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="cds--header__menu-toggle"
        >
          {mobileMenuOpen ? <Close size={20} /> : <Menu size={20} />}
        </HeaderGlobalAction>
      </HeaderGlobalBar>

      <SideNav
        aria-label="사이드 네비게이션"
        expanded={mobileMenuOpen}
        isPersistent={false}
        onSideNavBlur={() => setMobileMenuOpen(false)}
      >
        <SideNavItems>
          {navLinks.map((link) => (
            <SideNavLink
              key={link.path}
              as={Link}
              to={link.path}
              isActive={isActive(link.path)}
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </SideNavLink>
          ))}
          {currentUser && (
            <SideNavLink
              as={Link}
              to="/messages"
              isActive={isActive('/messages')}
              onClick={() => setMobileMenuOpen(false)}
              renderIcon={Email}
            >
              쪽지함 {unreadMessages > 0 && `(${unreadMessages})`}
            </SideNavLink>
          )}
          {currentUser?.isAdmin && (
            <SideNavLink
              as={Link}
              to="/admin"
              isActive={isActive('/admin')}
              onClick={() => setMobileMenuOpen(false)}
              renderIcon={Settings}
            >
              관리자
            </SideNavLink>
          )}
          {currentUser && (
            <SideNavLink
              onClick={() => {
                handleSignOut()
                setMobileMenuOpen(false)
              }}
              renderIcon={Logout}
            >
              로그아웃
            </SideNavLink>
          )}
        </SideNavItems>
      </SideNav>
    </CarbonHeader>
  )
}
