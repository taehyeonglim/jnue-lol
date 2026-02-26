import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  getReceivedMessages,
  getSentMessages,
  markAsRead,
  deleteMessage,
} from '../services/messageService'
import { Message, TIER_INFO } from '../types'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { Tile, Button, Tabs, TabList, Tab, TabPanels, TabPanel } from '@carbon/react'
import { TrashCan } from '@carbon/icons-react'

type TabType = 'received' | 'sent'

export default function Messages() {
  const { currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>('received')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)

  useEffect(() => {
    if (currentUser) {
      loadMessages()
    }
  }, [currentUser, activeTab])

  const loadMessages = async () => {
    if (!currentUser) return
    setLoading(true)
    try {
      const data =
        activeTab === 'received'
          ? await getReceivedMessages(currentUser.uid)
          : await getSentMessages(currentUser.uid)
      setMessages(data)
    } catch (error) {
      console.error('쪽지 로딩 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectMessage = async (message: Message) => {
    setSelectedMessage(message)
    if (activeTab === 'received' && !message.isRead) {
      try {
        await markAsRead(message.id)
        setMessages((prev) =>
          prev.map((m) => (m.id === message.id ? { ...m, isRead: true } : m))
        )
      } catch (error) {
        console.error('읽음 처리 실패:', error)
      }
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (!window.confirm('쪽지를 삭제하시겠습니까?')) return
    try {
      await deleteMessage(messageId)
      setMessages((prev) => prev.filter((m) => m.id !== messageId))
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(null)
      }
    } catch (error) {
      console.error('삭제 실패:', error)
    }
  }

  const handleTabChange = (evt: { selectedIndex: number }) => {
    const tab = evt.selectedIndex === 0 ? 'received' : 'sent'
    setActiveTab(tab)
    setSelectedMessage(null)
  }

  if (!currentUser) {
    return (
      <div style={{ padding: '2rem 0' }}>
        <div className="page-container-xs">
          <Tile style={{ textAlign: 'center', padding: '4rem 1rem', background: '#262626' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
            <p style={{ color: '#c6c6c6', marginBottom: '1.5rem' }}>로그인이 필요합니다</p>
            <Link to="/">
              <Button kind="primary">홈으로 가기</Button>
            </Link>
          </Tile>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="container">
          <h1 className="page-title">쪽지함</h1>
          <p className="page-desc">회원들과 1:1 메시지를 주고받으세요</p>
        </div>
      </div>

      <div style={{ padding: '2rem 0' }}>
        <div className="page-container-sm">
          {/* Tabs */}
          <Tabs selectedIndex={activeTab === 'received' ? 0 : 1} onChange={handleTabChange}>
            <TabList aria-label="쪽지함 탭" style={{ marginBottom: '1.5rem' }}>
              <Tab>
                📥 받은 쪽지
                {activeTab === 'received' && messages.filter((m) => !m.isRead).length > 0 && (
                  <span style={{
                    marginLeft: '0.5rem',
                    padding: '0.125rem 0.5rem',
                    backgroundColor: '#da1e28',
                    color: '#fff',
                    fontSize: '0.75rem',
                    borderRadius: '9999px',
                  }}>
                    {messages.filter((m) => !m.isRead).length}
                  </span>
                )}
              </Tab>
              <Tab>📤 보낸 쪽지</Tab>
            </TabList>
            <TabPanels>
              <TabPanel style={{ padding: 0 }}>
                <MessageContent
                  activeTab={activeTab}
                  messages={messages}
                  loading={loading}
                  selectedMessage={selectedMessage}
                  onSelectMessage={handleSelectMessage}
                  onDeleteMessage={handleDeleteMessage}
                />
              </TabPanel>
              <TabPanel style={{ padding: 0 }}>
                <MessageContent
                  activeTab={activeTab}
                  messages={messages}
                  loading={loading}
                  selectedMessage={selectedMessage}
                  onSelectMessage={handleSelectMessage}
                  onDeleteMessage={handleDeleteMessage}
                />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

function MessageContent({
  activeTab,
  messages,
  loading,
  selectedMessage,
  onSelectMessage,
  onDeleteMessage,
}: {
  activeTab: TabType
  messages: Message[]
  loading: boolean
  selectedMessage: Message | null
  onSelectMessage: (message: Message) => void
  onDeleteMessage: (messageId: string) => void
}) {
  return (
    <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
      {/* Message List */}
      <Tile style={{ padding: 0, background: '#262626' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #393939' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#C8AA6E' }}>
            {activeTab === 'received' ? '받은 쪽지' : '보낸 쪽지'}
          </h2>
        </div>
        <div>
          {loading ? (
            <div style={{ padding: '2rem' }}>
              <LoadingSpinner />
            </div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 0' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>
                {activeTab === 'received' ? '📭' : '📤'}
              </div>
              <p style={{ color: '#c6c6c6' }}>
                {activeTab === 'received'
                  ? '받은 쪽지가 없습니다'
                  : '보낸 쪽지가 없습니다'}
              </p>
            </div>
          ) : (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {messages.map((message) => (
                <MessageListItem
                  key={message.id}
                  message={message}
                  type={activeTab}
                  isSelected={selectedMessage?.id === message.id}
                  onClick={() => onSelectMessage(message)}
                  onDelete={() => onDeleteMessage(message.id)}
                />
              ))}
            </div>
          )}
        </div>
      </Tile>

      {/* Message Detail */}
      <Tile style={{ padding: 0, background: '#262626' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #393939' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#C8AA6E' }}>쪽지 내용</h2>
        </div>
        <div style={{ padding: '1.5rem' }}>
          {selectedMessage ? (
            <MessageDetail
              message={selectedMessage}
              type={activeTab}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 0' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>💌</div>
              <p style={{ color: '#c6c6c6' }}>쪽지를 선택하세요</p>
            </div>
          )}
        </div>
      </Tile>
    </div>
  )
}

function MessageListItem({
  message,
  type,
  isSelected,
  onClick,
  onDelete,
}: {
  message: Message
  type: TabType
  isSelected: boolean
  onClick: () => void
  onDelete: () => void
}) {
  const tierInfo = TIER_INFO[message.senderTier] || TIER_INFO.bronze
  const isUnread = type === 'received' && !message.isRead

  return (
    <div
      onClick={onClick}
      style={{
        padding: '1rem',
        borderBottom: '1px solid #393939',
        cursor: 'pointer',
        transition: 'background-color 0.15s',
        backgroundColor: isSelected
          ? 'rgba(200, 170, 110, 0.1)'
          : isUnread
          ? 'rgba(10, 200, 185, 0.05)'
          : 'transparent',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = isUnread ? 'rgba(10, 200, 185, 0.1)' : '#393939'
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = isUnread ? 'rgba(10, 200, 185, 0.05)' : 'transparent'
        }
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
        <img
          src={message.senderPhotoURL || '/default-avatar.png'}
          alt={message.senderName}
          className="avatar avatar-sm"
          style={{ borderColor: tierInfo.color, flexShrink: 0 }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            {isUnread && (
              <span style={{ width: '8px', height: '8px', backgroundColor: '#0AC8B9', borderRadius: '50%', flexShrink: 0 }} />
            )}
            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#f4f4f4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {type === 'received' ? message.senderName : message.receiverName}
            </span>
            <span style={{ fontSize: '0.75rem', color: tierInfo.color }}>
              {tierInfo.emoji}
            </span>
          </div>
          <p
            style={{
              fontSize: '0.875rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              marginBottom: '0.25rem',
              color: isUnread ? '#f4f4f4' : '#c6c6c6',
              fontWeight: isUnread ? 500 : 400,
            }}
          >
            {message.title}
          </p>
          <span style={{ fontSize: '0.75rem', color: '#525252' }}>
            {message.createdAt.toLocaleString('ko-KR')}
          </span>
        </div>
        <Button
          kind="danger--ghost"
          size="sm"
          hasIconOnly
          renderIcon={TrashCan}
          iconDescription="삭제"
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation()
            onDelete()
          }}
          style={{ color: 'rgba(250, 77, 86, 0.5)' }}
        />
      </div>
    </div>
  )
}

function MessageDetail({
  message,
  type,
}: {
  message: Message
  type: TabType
}) {
  const tierInfo = TIER_INFO[message.senderTier] || TIER_INFO.bronze

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #393939' }}>
        <img
          src={message.senderPhotoURL || '/default-avatar.png'}
          alt={message.senderName}
          className="avatar avatar-md"
          style={{ borderColor: tierInfo.color }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ fontWeight: 600, color: '#f4f4f4' }}>
              {type === 'received' ? message.senderName : message.receiverName}
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                padding: '0.125rem 0.375rem',
                borderRadius: '4px',
                backgroundColor: `${tierInfo.color}20`,
                color: tierInfo.color,
              }}
            >
              {tierInfo.emoji} {tierInfo.name}
            </span>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#c6c6c6' }}>
            {message.createdAt.toLocaleString('ko-KR')}
          </span>
        </div>
      </div>

      {/* Title */}
      <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#C8AA6E', marginBottom: '1rem' }}>{message.title}</h3>

      {/* Content */}
      <div style={{ color: 'rgba(244, 244, 244, 0.9)', whiteSpace: 'pre-wrap', lineHeight: 1.6, minHeight: '150px' }}>
        {message.content}
      </div>
    </div>
  )
}
