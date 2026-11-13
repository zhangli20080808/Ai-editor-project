import { useEffect, useState } from 'react'
import { Alert, Avatar, Empty, Input, List, Modal, Space, Tag, Typography } from 'antd'
import { FileText, Search, UserRound } from 'lucide-react'

import { useUserSearchQuery } from '../api/users'
import type { AuthUser, Work } from '../api/types'

const { Paragraph, Text } = Typography

interface TransferWorkModalProps {
  confirmLoading?: boolean
  open: boolean
  work: Work | null
  onCancel: () => void
  onConfirm: (targetUser: AuthUser) => void
}

function TransferWorkModal({
  confirmLoading,
  onCancel,
  onConfirm,
  open,
  work,
}: TransferWorkModalProps) {
  const [keyword, setKeyword] = useState('')
  const [selectedUser, setSelectedUser] = useState<AuthUser | null>(null)
  const searchQuery = useUserSearchQuery(keyword)
  const users = searchQuery.data ?? []

  useEffect(() => {
    if (!open) {
      setKeyword('')
      setSelectedUser(null)
    }
  }, [open])

  return (
    <Modal
      confirmLoading={Boolean(confirmLoading)}
      okButtonProps={{ disabled: !selectedUser }}
      okText="确认转赠"
      open={open}
      title="转赠作品"
      width={560}
      onCancel={onCancel}
      onOk={() => {
        if (selectedUser) onConfirm(selectedUser)
      }}
    >
      {work ? (
        <div className="transfer-modal-content">
          <div className="transfer-work-summary">
            <div className="transfer-work-cover">
              {work.coverImg ? (
                <img src={work.coverImg} alt={work.title} />
              ) : (
                <FileText size={20} />
              )}
            </div>
            <div>
              <Text strong>{work.title || '未命名作品'}</Text>
              <Paragraph type="secondary">
                {work.desc || '暂无描述'}
              </Paragraph>
            </div>
          </div>

          <Input.Search
            allowClear
            enterButton="搜索"
            placeholder="输入手机号、用户名或昵称搜索用户"
            prefix={<Search size={15} />}
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            onSearch={(value) => setKeyword(value.trim())}
          />

          <div className="transfer-user-list">
            {keyword.trim() ? (
              <List
                dataSource={users}
                loading={searchQuery.isFetching}
                locale={{
                  emptyText: (
                    <Empty
                      description="没有找到匹配用户"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                  ),
                }}
                renderItem={(user) => {
                  const active = selectedUser?.id === user.id

                  return (
                    <List.Item
                      className={active ? 'transfer-user-item is-active' : 'transfer-user-item'}
                      onClick={() => setSelectedUser(user)}
                    >
                      <List.Item.Meta
                        avatar={
                          <Avatar icon={<UserRound size={16} />} src={user.picture} />
                        }
                        title={
                          <Space size={8}>
                            <Text strong>{user.nickName || user.username}</Text>
                            {active ? <Tag color="volcano">已选择</Tag> : null}
                          </Space>
                        }
                        description={
                          <Text type="secondary">
                            {user.username} · {maskPhone(user.phoneNumber)}
                          </Text>
                        }
                      />
                    </List.Item>
                  )
                }}
              />
            ) : (
              <div className="transfer-empty-hint">
                <Text type="secondary">请输入目标用户信息后选择一个用户</Text>
              </div>
            )}
          </div>

          <Alert
            showIcon
            type="warning"
            message="转赠后，该作品将从你的列表中移除，对方将获得编辑、发布、删除和统计权限。"
          />
        </div>
      ) : null}
    </Modal>
  )
}

function maskPhone(phoneNumber: string) {
  if (!phoneNumber) return '无手机号'
  if (phoneNumber.length < 8) return phoneNumber
  return `${phoneNumber.slice(0, 3)}****${phoneNumber.slice(-4)}`
}

export default TransferWorkModal
