import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from '../contexts/AuthContext'
import { User, TIER_INFO, TierType, POINT_VALUES } from '../types'

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
        limit(20)
      )
      const snapshot = await getDocs(q)
      const usersData = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          uid: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as User
      })
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
      <section className="py-20 md:py-32 text-center border-b border-[#1E2328]">
        <div className="container">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 bg-[#1E2328] rounded-full">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm text-[#A09B8C]">전주교대 e스포츠와 교육 동아리</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight">
            <span className="text-[#F0E6D2]">JNUE</span>
            <span className="text-[#C8AA6E]">-</span>
            <span className="text-[#0AC8B9]">LoL</span>
          </h1>

          <p className="text-sm md:text-base text-[#C8AA6E] font-medium tracking-widest mb-4">
            Learn or Lose
          </p>

          <p className="text-lg text-[#A09B8C] mb-12">
            게임을 사랑하는 전주교대 학생들의 커뮤니티
          </p>

          {!currentUser ? (
            <button onClick={handleSignIn} className="btn btn-primary btn-lg">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google로 시작하기
            </button>
          ) : (
            <div className="flex gap-4 justify-center">
              <Link to="/introduction" className="btn btn-primary">
                자기소개 둘러보기
              </Link>
              <Link to="/free" className="btn btn-secondary">
                자유게시판
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Members Carousel Section */}
      {members.length > 0 && (
        <section className="section border-b border-[#1E2328]">
          <div className="container">
            <div className="section-header text-center">
              <h2 className="section-title">동아리원</h2>
              <p className="text-[#A09B8C]">함께하는 멤버들을 만나보세요</p>
            </div>

            <div
              ref={carouselRef}
              className="flex gap-4 overflow-x-auto pt-3 pr-3 pb-4 scrollbar-hide scroll-smooth"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              {members.map((member, index) => (
                <MemberCard key={member.uid} member={member} rank={index + 1} />
              ))}
            </div>

            <div className="flex justify-center mt-6">
              <Link to="/ranking" className="btn btn-secondary btn-sm">
                전체 랭킹 보기
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="section">
        <div className="container-sm">
          <div className="section-header text-center">
            <h2 className="section-title">게시판</h2>
            <p className="text-[#A09B8C]">동아리원들과 소통하세요</p>
          </div>

          <div className="grid gap-4">
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
      <section className="section border-t border-[#1E2328]">
        <div className="container-sm">
          <div className="section-header text-center">
            <h2 className="section-title">티어 시스템</h2>
            <p className="text-[#A09B8C]">활동하면서 티어를 올려보세요</p>
          </div>

          <div className="card">
            <div className="card-body">
              {/* Tier List */}
              <div className="flex justify-center gap-4 mb-8 flex-wrap">
                {tiers.map((tier) => (
                  <div key={tier} className="text-center">
                    <div className="text-3xl mb-2">{TIER_INFO[tier].emoji}</div>
                    <div className="text-xs font-semibold" style={{ color: TIER_INFO[tier].color }}>
                      {TIER_INFO[tier].name}
                    </div>
                  </div>
                ))}
              </div>

              <div className="divider divider-gold" />

              {/* Points Guide */}
              <div className="grid grid-cols-2 gap-4">
                <PointItem label="자기소개" points={POINT_VALUES.INTRODUCTION} />
                <PointItem label="게시글 작성" points={POINT_VALUES.POST} />
                <PointItem label="댓글 작성" points={POINT_VALUES.COMMENT} />
                <PointItem label="좋아요 받기" points={POINT_VALUES.LIKE_RECEIVED} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!currentUser && (
        <section className="section border-t border-[#1E2328]">
          <div className="container-xs text-center">
            <div className="text-5xl mb-6">🎮</div>
            <h2 className="heading-2 mb-4">지금 시작하세요</h2>
            <p className="text-[#A09B8C] mb-8">전주교대 학생이라면 누구나 환영합니다</p>
            <button onClick={handleSignIn} className="btn btn-primary btn-lg">
              Google로 로그인
            </button>
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
    <Link
      to={to}
      className={`card card-hover flex items-center justify-between p-6 ${
        accent ? 'card-gold' : ''
      }`}
    >
      <div>
        <h3 className={`font-semibold mb-1 ${accent ? 'text-[#C8AA6E]' : 'text-[#F0E6D2]'}`}>
          {title}
        </h3>
        <p className="text-sm text-[#A09B8C]">{desc}</p>
      </div>
      <div className="flex items-center gap-4">
        <span className="badge badge-gold">+{points}P</span>
        <svg className="w-5 h-5 text-[#3C3C41]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  )
}

function PointItem({ label, points }: { label: string; points: number }) {
  return (
    <div className="flex items-center justify-between p-4 bg-[#010A13] rounded border border-[#1E2328]">
      <span className="text-sm text-[#A09B8C]">{label}</span>
      <span className="text-[#C8AA6E] font-semibold">+{points}P</span>
    </div>
  )
}

function MemberCard({ member, rank }: { member: User; rank: number }) {
  const tierInfo = TIER_INFO[member.tier]
  const displayName = member.nickname || member.displayName

  return (
    <div
      className="relative flex-shrink-0 w-[140px] h-[190px] group"
      style={{ perspective: '1000px' }}
    >
      <div
        className="relative w-full h-full transition-transform duration-500 group-hover:[transform:rotateY(180deg)]"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front Side */}
        <div
          className="absolute inset-0 rounded-lg border border-[#3C3C41] p-3 flex flex-col items-center justify-center"
          style={{
            background: `linear-gradient(180deg, ${tierInfo.color}10 0%, #1E2328 100%)`,
            backfaceVisibility: 'hidden',
          }}
        >
          {/* Rank Badge */}
          {rank <= 3 && (
            <div
              className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-lg"
              style={{
                background: rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : '#CD7F32',
                color: '#010A13',
              }}
            >
              {rank}
            </div>
          )}

          {/* Profile Image */}
          <div className="relative mb-3">
            <img
              src={member.photoURL || '/default-avatar.png'}
              alt={displayName}
              className="w-14 h-14 rounded-full border-2 object-cover"
              style={{ borderColor: tierInfo.color }}
            />
            <span
              className="absolute -bottom-1 -right-1 text-base"
              title={tierInfo.name}
            >
              {tierInfo.emoji}
            </span>
          </div>

          {/* Name */}
          <h3 className="w-full font-semibold text-[#F0E6D2] text-sm mb-1 truncate text-center">
            {displayName}
          </h3>

          {/* Tier */}
          <p className="text-[11px] font-medium mb-3 text-center" style={{ color: tierInfo.color }}>
            {tierInfo.name}
          </p>

          {/* Points */}
          <div className="bg-[#010A13] rounded px-3 py-1.5">
            <span className="text-[11px] text-[#C8AA6E] font-semibold">{member.points}P</span>
          </div>
        </div>

        {/* Back Side */}
        <div
          className="absolute inset-0 rounded-lg border border-[#C8AA6E]/50 p-4 flex flex-col items-center justify-center gap-3"
          style={{
            background: `linear-gradient(180deg, ${tierInfo.color}20 0%, #1E2328 100%)`,
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          {/* Tier Emoji */}
          <div className="text-3xl mb-1">{tierInfo.emoji}</div>

          {/* LOL Nickname */}
          {member.lolNickname ? (
            <div className="w-full text-center">
              <p className="text-[10px] text-[#A09B8C] mb-1">소환사명</p>
              <p className="text-sm font-semibold text-[#0AC8B9] truncate">{member.lolNickname}</p>
            </div>
          ) : (
            <div className="w-full text-center">
              <p className="text-[10px] text-[#A09B8C] mb-1">소환사명</p>
              <p className="text-xs text-[#3C3C41]">미등록</p>
            </div>
          )}

          {/* Favorite Game */}
          {member.favoriteGame ? (
            <div className="w-full text-center">
              <p className="text-[10px] text-[#A09B8C] mb-1">좋아하는 게임</p>
              <p className="text-xs font-medium text-[#F0E6D2] truncate">{member.favoriteGame}</p>
            </div>
          ) : (
            <div className="w-full text-center">
              <p className="text-[10px] text-[#A09B8C] mb-1">좋아하는 게임</p>
              <p className="text-xs text-[#3C3C41]">미등록</p>
            </div>
          )}

          {/* Main Position */}
          {member.mainPosition && (
            <div className="w-full text-center">
              <p className="text-[10px] text-[#A09B8C] mb-1">포지션</p>
              <p className="text-xs font-medium text-[#C8AA6E]">{member.mainPosition}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
