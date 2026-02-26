import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from '../contexts/AuthContext'
import { User, TIER_INFO, TierType, POINT_VALUES } from '../types'
import { Button, ClickableTile, Tag, Tile } from '@carbon/react'
import { ChevronRight } from '@carbon/icons-react'

export default function Home() {
  const { currentUser, signInWithGoogle } = useAuth()
  const [members, setMembers] = useState<User[]>([])
  const carouselRef = useRef<HTMLDivElement>(null)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    loadMembers()
  }, [])

  useEffect(() => {
    if (members.length === 0 || isPaused) return

    const interval = setInterval(() => {
      if (carouselRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current
        const cardWidth = 140 + 16 // card width + gap

        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          carouselRef.current.scrollTo({ left: 0, behavior: 'smooth' })
        } else {
          carouselRef.current.scrollBy({ left: cardWidth, behavior: 'smooth' })
        }
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [members, isPaused])

  const loadMembers = async () => {
    try {
      const q = query(
        collection(db, 'users'),
        orderBy('points', 'desc'),
        limit(30)
      )
      const snapshot = await getDocs(q)
      const usersData = snapshot.docs
        .map((doc) => {
          const data = doc.data()
          return {
            uid: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
          } as User
        })
        .filter((user) => !user.isTestAccount)
        .slice(0, 20)
      setMembers(usersData)
    } catch (error) {
      console.error('회원 로딩 실패:', error)
    }
  }

  const handleSignIn = async () => {
    try {
      await signInWithGoogle()
    } catch (error) {
      console.error('로그인 실패:', error)
    }
  }

  const tiers: TierType[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'master', 'challenger']

  return (
    <div>
      {/* Hero Section */}
      <section style={{ padding: '5rem 0', textAlign: 'center', borderBottom: '1px solid #393939' }}>
        <div className="page-container">
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              marginBottom: '2rem',
              background: '#262626',
              borderRadius: '9999px',
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#42be65',
                display: 'inline-block',
                animation: 'fadeIn 1s ease infinite alternate',
              }}
            />
            <span style={{ fontSize: '0.875rem', color: '#c6c6c6' }}>전주교대 e스포츠와 교육 동아리</span>
          </div>

          <h1 style={{ fontSize: '3rem', fontWeight: 700, marginBottom: '1rem', letterSpacing: '-0.02em' }}>
            <span style={{ color: '#f4f4f4' }}>JNUE</span>
            <span style={{ color: '#C8AA6E' }}>-</span>
            <span style={{ color: '#0AC8B9' }}>LoL</span>
          </h1>

          <p
            style={{
              fontSize: '0.875rem',
              color: '#C8AA6E',
              fontWeight: 500,
              letterSpacing: '0.2em',
              marginBottom: '1rem',
            }}
          >
            Learn or Lose
          </p>

          <p style={{ fontSize: '1.125rem', color: '#c6c6c6', marginBottom: '3rem' }}>
            게임을 사랑하는 전주교대 학생들의 커뮤니티
          </p>

          {!currentUser ? (
            <Button kind="primary" size="lg" onClick={handleSignIn}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
                style={{ marginRight: '0.5rem' }}
              >
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google로 시작하기
            </Button>
          ) : (
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <Link to="/introduction">
                <Button kind="primary">자기소개 둘러보기</Button>
              </Link>
              <Link to="/free">
                <Button kind="secondary">자유게시판</Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Members Carousel Section */}
      {members.length > 0 && (
        <section style={{ padding: '3rem 0', borderBottom: '1px solid #393939' }}>
          <div className="page-container">
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#f4f4f4', marginBottom: '0.5rem' }}>
                동아리원
              </h2>
              <p style={{ color: '#c6c6c6' }}>함께하는 멤버들을 만나보세요</p>
            </div>

            <div
              ref={carouselRef}
              className="scrollbar-hide"
              style={{
                display: 'flex',
                gap: '1rem',
                overflowX: 'auto',
                paddingTop: '0.75rem',
                paddingRight: '0.75rem',
                paddingBottom: '1rem',
                scrollBehavior: 'smooth',
              }}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              {members.map((member, index) => (
                <MemberCard key={member.uid} member={member} rank={index + 1} />
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
              <Link to="/ranking">
                <Button kind="secondary" size="sm">
                  전체 랭킹 보기
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section style={{ padding: '3rem 0' }}>
        <div className="page-container-sm">
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#f4f4f4', marginBottom: '0.5rem' }}>
              게시판
            </h2>
            <p style={{ color: '#c6c6c6' }}>동아리원들과 소통하세요</p>
          </div>

          <div style={{ display: 'grid', gap: '1rem' }}>
            <FeatureCard
              to="/introduction"
              title="자기소개"
              desc="나를 소개하고 친해지기"
              points={POINT_VALUES.INTRODUCTION}
              accent
            />
            <FeatureCard
              to="/free"
              title="자유게시판"
              desc="자유롭게 이야기 나누기"
              points={POINT_VALUES.POST}
            />
            <FeatureCard
              to="/games"
              title="좋아하는 게임"
              desc="게임 취향 공유하기"
              points={POINT_VALUES.POST}
            />
          </div>
        </div>
      </section>

      {/* Tier Section */}
      <section style={{ padding: '3rem 0', borderTop: '1px solid #393939' }}>
        <div className="page-container-sm">
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#f4f4f4', marginBottom: '0.5rem' }}>
              티어 시스템
            </h2>
            <p style={{ color: '#c6c6c6' }}>활동하면서 티어를 올려보세요</p>
          </div>

          <Tile style={{ padding: '2rem' }}>
            {/* Tier List */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '1rem',
                marginBottom: '2rem',
                flexWrap: 'wrap',
              }}
            >
              {tiers.map((tier) => (
                <div key={tier} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.875rem', marginBottom: '0.5rem' }}>{TIER_INFO[tier].emoji}</div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: TIER_INFO[tier].color,
                    }}
                  >
                    {TIER_INFO[tier].name}
                  </div>
                </div>
              ))}
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #393939', margin: '1.5rem 0' }} />

            {/* Points Guide */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <PointItem label="자기소개" points={POINT_VALUES.INTRODUCTION} />
              <PointItem label="게시글 작성" points={POINT_VALUES.POST} />
              <PointItem label="댓글 작성" points={POINT_VALUES.COMMENT} />
              <PointItem label="좋아요 받기" points={POINT_VALUES.LIKE_RECEIVED} />
            </div>
          </Tile>
        </div>
      </section>

      {/* CTA Section */}
      {!currentUser && (
        <section style={{ padding: '3rem 0', borderTop: '1px solid #393939' }}>
          <div className="page-container-xs" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>🎮</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#f4f4f4', marginBottom: '1rem' }}>
              지금 시작하세요
            </h2>
            <p style={{ color: '#c6c6c6', marginBottom: '2rem' }}>전주교대 학생이라면 누구나 환영합니다</p>
            <Button kind="primary" size="lg" onClick={handleSignIn}>
              Google로 로그인
            </Button>
          </div>
        </section>
      )}
    </div>
  )
}

function FeatureCard({
  to,
  title,
  desc,
  points,
  accent,
}: {
  to: string
  title: string
  desc: string
  points: number
  accent?: boolean
}) {
  return (
    <Link to={to} style={{ textDecoration: 'none' }}>
      <ClickableTile
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.5rem',
          border: accent ? '1px solid #C8AA6E' : undefined,
        }}
      >
        <div>
          <h3
            style={{
              fontWeight: 600,
              marginBottom: '0.25rem',
              color: accent ? '#C8AA6E' : '#f4f4f4',
            }}
          >
            {title}
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#c6c6c6' }}>{desc}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Tag type="blue" size="sm">
            +{points}P
          </Tag>
          <ChevronRight size={20} style={{ color: '#6f6f6f' }} />
        </div>
      </ClickableTile>
    </Link>
  )
}

function PointItem({ label, points }: { label: string; points: number }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem',
        background: '#161616',
        borderRadius: '4px',
        border: '1px solid #393939',
      }}
    >
      <span style={{ fontSize: '0.875rem', color: '#c6c6c6' }}>{label}</span>
      <span style={{ color: '#C8AA6E', fontWeight: 600 }}>+{points}P</span>
    </div>
  )
}

function MemberCard({ member, rank }: { member: User; rank: number }) {
  const tierInfo = TIER_INFO[member.tier] || TIER_INFO.bronze
  const displayName = member.nickname || member.displayName
  const [flipped, setFlipped] = useState(false)

  return (
    <div
      className={`flip-card ${flipped ? 'flipped' : ''}`}
      style={{ flexShrink: 0, width: 140, height: 190 }}
      onClick={() => setFlipped(!flipped)}
    >
      <div className="flip-card-inner">
        {/* Front Side */}
        <div
          className="flip-card-front"
          style={{
            background: `linear-gradient(180deg, ${tierInfo.color}10 0%, #262626 100%)`,
            border: '1px solid #393939',
            padding: '0.75rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Rank Badge */}
          {rank <= 3 && (
            <div
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                width: 24,
                height: 24,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 700,
                background: rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : '#CD7F32',
                color: '#161616',
              }}
            >
              {rank}
            </div>
          )}

          {/* Profile Image */}
          <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
            <img
              src={member.photoURL || '/default-avatar.png'}
              alt={displayName}
              className="avatar"
              style={{ width: 56, height: 56, borderColor: tierInfo.color }}
            />
            <span
              style={{
                position: 'absolute',
                bottom: -4,
                right: -4,
                fontSize: '1rem',
              }}
              title={tierInfo.name}
            >
              {tierInfo.emoji}
            </span>
          </div>

          {/* Name */}
          <h3
            style={{
              width: '100%',
              fontWeight: 600,
              color: '#f4f4f4',
              fontSize: '0.875rem',
              marginBottom: '0.25rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              textAlign: 'center',
            }}
          >
            {displayName}
          </h3>

          {/* Tier */}
          <p
            style={{
              fontSize: '11px',
              fontWeight: 500,
              marginBottom: '0.75rem',
              textAlign: 'center',
              color: tierInfo.color,
            }}
          >
            {tierInfo.name}
          </p>

          {/* Points */}
          <div style={{ background: '#161616', borderRadius: 4, padding: '0.375rem 0.75rem' }}>
            <span style={{ fontSize: '11px', color: '#C8AA6E', fontWeight: 600 }}>{member.points}P</span>
          </div>
        </div>

        {/* Back Side */}
        <div
          className="flip-card-back"
          style={{
            background: `linear-gradient(180deg, ${tierInfo.color}20 0%, #262626 100%)`,
            border: '1px solid rgba(200, 170, 110, 0.5)',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
          }}
        >
          {/* Tier Emoji */}
          <div style={{ fontSize: '1.875rem', marginBottom: '0.25rem' }}>{tierInfo.emoji}</div>

          {/* LOL Nickname */}
          {member.lolNickname ? (
            <div style={{ width: '100%', textAlign: 'center' }}>
              <p style={{ fontSize: '10px', color: '#c6c6c6', marginBottom: '0.25rem' }}>소환사명</p>
              <p
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#0AC8B9',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {member.lolNickname}
              </p>
            </div>
          ) : (
            <div style={{ width: '100%', textAlign: 'center' }}>
              <p style={{ fontSize: '10px', color: '#c6c6c6', marginBottom: '0.25rem' }}>소환사명</p>
              <p style={{ fontSize: '0.75rem', color: '#6f6f6f' }}>미등록</p>
            </div>
          )}

          {/* Favorite Game */}
          {member.favoriteGame ? (
            <div style={{ width: '100%', textAlign: 'center' }}>
              <p style={{ fontSize: '10px', color: '#c6c6c6', marginBottom: '0.25rem' }}>좋아하는 게임</p>
              <p
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: '#f4f4f4',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {member.favoriteGame}
              </p>
            </div>
          ) : (
            <div style={{ width: '100%', textAlign: 'center' }}>
              <p style={{ fontSize: '10px', color: '#c6c6c6', marginBottom: '0.25rem' }}>좋아하는 게임</p>
              <p style={{ fontSize: '0.75rem', color: '#6f6f6f' }}>미등록</p>
            </div>
          )}

          {/* Main Position */}
          {member.mainPosition && (
            <div style={{ width: '100%', textAlign: 'center' }}>
              <p style={{ fontSize: '10px', color: '#c6c6c6', marginBottom: '0.25rem' }}>포지션</p>
              <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#C8AA6E' }}>{member.mainPosition}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
