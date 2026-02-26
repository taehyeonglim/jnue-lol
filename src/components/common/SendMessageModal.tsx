import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { sendMessage } from '../../services/messageService'
import { User, TIER_INFO } from '../../types'
import {
  Modal,
  TextInput,
  TextArea,
  InlineNotification,
} from '@carbon/react'

interface SendMessageModalProps {
  receiver: User
  onClose: () => void
  onSuccess?: () => void
}

export default function SendMessageModal({
  receiver,
  onClose,
  onSuccess,
}: SendMessageModalProps) {
  const { currentUser } = useAuth()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const tierInfo = TIER_INFO[receiver.tier] || TIER_INFO.bronze

  const handleSubmit = async () => {
    if (!currentUser) return

    if (!title.trim()) {
      setError('제목을 입력해주세요.')
      return
    }
    if (!content.trim()) {
      setError('내용을 입력해주세요.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      await sendMessage(
        currentUser,
        receiver.uid,
        receiver.nickname || receiver.displayName,
        title.trim(),
        content.trim()
      )
      onSuccess?.()
      onClose()
    } catch (err) {
      console.error('쪽지 전송 실패:', err)
      setError('쪽지 전송에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open
      modalHeading="쪽지 보내기"
      primaryButtonText={submitting ? '전송 중...' : '보내기'}
      secondaryButtonText="취소"
      onRequestClose={onClose}
      onRequestSubmit={handleSubmit}
      primaryButtonDisabled={submitting}
      size="md"
    >
      {/* Receiver Info */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        marginBottom: '1rem',
        padding: '0.75rem',
        backgroundColor: '#262626',
        borderRadius: 4,
      }}>
        <span style={{ fontSize: '0.875rem', color: '#c6c6c6' }}>받는 사람:</span>
        <img
          src={receiver.photoURL || '/default-avatar.png'}
          alt={receiver.nickname || receiver.displayName}
          className="avatar avatar-sm"
          style={{ borderColor: tierInfo.color }}
        />
        <span style={{ fontWeight: 500, color: '#f4f4f4' }}>
          {receiver.nickname || receiver.displayName}
        </span>
        <span style={{ fontSize: '0.875rem', color: tierInfo.color }}>
          {tierInfo.emoji}
        </span>
      </div>

      {error && (
        <InlineNotification
          kind="error"
          title={error}
          lowContrast
          hideCloseButton
          style={{ marginBottom: '1rem' }}
        />
      )}

      <TextInput
        id="message-title"
        labelText="제목"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="제목을 입력하세요"
        maxLength={100}
        style={{ marginBottom: '1rem' }}
      />

      <TextArea
        id="message-content"
        labelText="내용"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="내용을 입력하세요"
        maxCount={1000}
        rows={6}
      />
    </Modal>
  )
}
