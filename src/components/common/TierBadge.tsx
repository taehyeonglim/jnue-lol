import { TierType, TIER_INFO } from '../../types'

interface TierBadgeProps {
  tier?: TierType
  size?: 'sm' | 'md' | 'lg'
  showName?: boolean
}

export default function TierBadge({ tier = 'bronze', size = 'md', showName = false }: TierBadgeProps) {
  const info = TIER_INFO[tier] || TIER_INFO.bronze

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5',
  }

  return (
    <span
      className={`tier-badge inline-flex items-center gap-1 rounded-full font-medium ${sizeClasses[size]}`}
      style={{
        backgroundColor: `${info.color}20`,
        color: info.color,
        border: `1px solid ${info.color}40`,
      }}
    >
      <span>{info.emoji}</span>
      {showName && <span>{info.name}</span>}
    </span>
  )
}
