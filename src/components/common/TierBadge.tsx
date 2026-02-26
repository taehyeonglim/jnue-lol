import { Tag } from '@carbon/react'
import { TierType, TIER_INFO } from '../../types'

interface TierBadgeProps {
  tier?: TierType
  size?: 'sm' | 'md' | 'lg'
  showName?: boolean
}

export default function TierBadge({ tier = 'bronze', size = 'md', showName = false }: TierBadgeProps) {
  const info = TIER_INFO[tier] || TIER_INFO.bronze
  const carbonSize = size === 'sm' ? 'sm' : 'md'

  return (
    <Tag
      size={carbonSize}
      type="outline"
      style={{
        backgroundColor: `${info.color}20`,
        color: info.color,
        borderColor: `${info.color}40`,
      }}
    >
      {info.emoji} {showName && info.name}
    </Tag>
  )
}
