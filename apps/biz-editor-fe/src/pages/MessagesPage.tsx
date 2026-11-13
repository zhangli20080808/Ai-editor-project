import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  Alert,
  Button,
  Card,
  Empty,
  List,
  Segmented,
  Space,
  Tag,
  Typography,
  message,
} from 'antd'
import {
  Bell,
  CheckCheck,
  ExternalLink,
  Gift,
  Info,
  MailOpen,
} from 'lucide-react'

import { getRequestErrorMessage } from '../api/error'
import {
  useMarkAllMessagesReadMutation,
  useMarkMessageReadMutation,
  useMessagesQuery,
} from '../api/messages'
import type { AppMessage } from '../api/types'

const { Paragraph, Text, Title } = Typography
type MessageFilter = 'all' | 'unread' | 'transfer' | 'system'

function MessagesPage() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<MessageFilter>('all')
  const messagesQuery = useMessagesQuery()
  const markMessageReadMutation = useMarkMessageReadMutation()
  const markAllMessagesReadMutation = useMarkAllMessagesReadMutation()
  const messages = messagesQuery.data?.items ?? []
  const unreadCount = messagesQuery.data?.unreadCount ?? 0
  const transferCount = messages.filter((item) => item.type === 'transfer').length
  const filteredMessages = useMemo(
    () =>
      messages.filter((item) => {
        if (filter === 'unread') return !item.isRead
        if (filter === 'transfer') return item.type === 'transfer'
        if (filter === 'system') return item.type === 'system'
        return true
      }),
    [filter, messages],
  )

  const markAllRead = async () => {
    try {
      await markAllMessagesReadMutation.mutateAsync()
      message.success('全部消息已读')
    } catch (error) {
      message.error(getRequestErrorMessage(error))
    }
  }

  const markRead = async (id: string) => {
    try {
      await markMessageReadMutation.mutateAsync(id)
    } catch (error) {
      message.error(getRequestErrorMessage(error))
    }
  }

  const markReadSilently = async (messageItem: AppMessage) => {
    if (messageItem.isRead) return

    try {
      await markMessageReadMutation.mutateAsync(messageItem._id)
    } catch (error) {
      message.error(getRequestErrorMessage(error))
    }
  }

  const openTransferWork = async (messageItem: AppMessage) => {
    await markReadSilently(messageItem)
    if (messageItem.workUuid) {
      navigate(`/editor/${messageItem.workUuid}`)
    }
  }

  return (
    <main className="workspace-page product-list-page">
      <div className="product-list-inner">
        <section className="product-list-header">
          <div>
            <Text type="secondary">Messages</Text>
            <Title level={3}>消息中心</Title>
            <Paragraph type="secondary">
              系统消息、作品转赠和后续审核通知都会汇总到这里。
            </Paragraph>
          </div>
          <Button
            icon={<CheckCheck size={15} />}
            loading={markAllMessagesReadMutation.isPending}
            onClick={() => void markAllRead()}
          >
            全部已读
          </Button>
        </section>

        <Card className="message-summary-card">
          <Space size={14} className="message-summary-content">
            <span className="message-summary-icon">
              <Bell size={20} />
            </span>
            <div>
              <Text strong>{unreadCount} 条未读消息</Text>
              <Paragraph type="secondary">
                转赠作品、系统提醒和后续审核结果会在这里持续沉淀。
              </Paragraph>
            </div>
            <div className="message-summary-stats">
              <span>
                <strong>{messages.length}</strong>
                <Text type="secondary">全部</Text>
              </span>
              <span>
                <strong>{transferCount}</strong>
                <Text type="secondary">转赠</Text>
              </span>
            </div>
          </Space>
        </Card>

        {messagesQuery.isError ? (
          <Alert
            className="page-error-alert"
            message="消息列表加载失败"
            description={getRequestErrorMessage(messagesQuery.error)}
            type="error"
            showIcon
            action={<Button onClick={() => void messagesQuery.refetch()}>重试</Button>}
          />
        ) : null}

        <Card className="workspace-panel message-list-panel">
          <div className="message-list-toolbar">
            <Segmented<MessageFilter>
              options={[
                { label: `全部 ${messages.length}`, value: 'all' },
                { label: `未读 ${unreadCount}`, value: 'unread' },
                { label: `转赠 ${transferCount}`, value: 'transfer' },
                { label: '系统', value: 'system' },
              ]}
              value={filter}
              onChange={setFilter}
            />
          </div>
          {filteredMessages.length > 0 ? (
            <List
              dataSource={filteredMessages}
              loading={messagesQuery.isLoading}
              renderItem={(item) => (
                <List.Item
                  className={`message-list-item${item.isRead ? '' : ' is-unread'}`}
                  onClick={() => void markReadSilently(item)}
                  actions={[
                    item.type === 'transfer' && item.workUuid ? (
                      <Button
                        icon={<ExternalLink size={14} />}
                        key="open"
                        size="small"
                        type="primary"
                        onClick={(event) => {
                          event.stopPropagation()
                          void openTransferWork(item)
                        }}
                      >
                        查看作品
                      </Button>
                    ) : null,
                    item.isRead ? (
                      <Text type="secondary" key="read">
                        已读
                      </Text>
                    ) : (
                      <Button
                        key="mark"
                        loading={
                          markMessageReadMutation.isPending &&
                          markMessageReadMutation.variables === item._id
                        }
                        size="small"
                        type="link"
                        onClick={(event) => {
                          event.stopPropagation()
                          void markRead(item._id)
                        }}
                      >
                        标为已读
                      </Button>
                    ),
                  ].filter(Boolean)}
                >
                  <List.Item.Meta
                    avatar={
                      <span className="message-item-icon">
                        {item.type === 'transfer' ? (
                          <Gift size={18} />
                        ) : (
                          <Info size={18} />
                        )}
                      </span>
                    }
                    title={
                      <Space size={8}>
                        <Text strong={!item.isRead}>{item.title}</Text>
                        <Tag color={item.type === 'transfer' ? 'purple' : 'blue'}>
                          {getMessageTypeLabel(item)}
                        </Tag>
                        {!item.isRead ? <Tag color="red">未读</Tag> : null}
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={4}>
                        <Text type="secondary">{item.content}</Text>
                        <Text type="secondary">{formatDate(item.createdAt)}</Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty
              description={messages.length > 0 ? '当前筛选下暂无消息' : '暂无消息'}
              image={<MailOpen size={44} />}
            />
          )}
        </Card>
      </div>
    </main>
  )
}

function getMessageTypeLabel(messageItem: AppMessage) {
  return messageItem.type === 'transfer' ? '转赠' : '系统'
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

export default MessagesPage
