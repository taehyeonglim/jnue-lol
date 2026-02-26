import { Loading } from '@carbon/react'

export default function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
      <Loading withOverlay={false} description="로딩 중..." />
    </div>
  )
}
