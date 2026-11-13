import type { TablePaginationConfig } from 'antd'
import {
  Button,
  Descriptions,
  Drawer,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd'
import { useState } from 'react'

import {
  useAdminUserQuery,
  useAdminUsersQuery,
  useFreezeAdminUserMutation,
  useUnfreezeAdminUserMutation,
} from '../api/adminUsers'
import { getRequestErrorMessage } from '../api/error'
import type {
  AdminUser,
  ListAdminUsersParams,
  UserRole,
  UserStatus,
} from '../api/types'
import {
  formatDate,
  getUserRoleLabel,
  getUserStatusColor,
  getUserStatusLabel,
  userRoleOptions,
  userStatusOptions,
} from '../utils/labels'

const { Text, Title } = Typography

interface ReasonFormValues {
  reason?: string
}

export default function UsersPage() {
  const [params, setParams] = useState<ListAdminUsersParams>({
    page: 1,
    pageSize: 10,
  })
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [freezeTarget, setFreezeTarget] = useState<AdminUser | null>(null)
  const [unfreezeTarget, setUnfreezeTarget] = useState<AdminUser | null>(null)
  const [freezeForm] = Form.useForm<ReasonFormValues>()
  const [unfreezeForm] = Form.useForm<ReasonFormValues>()
  const usersQuery = useAdminUsersQuery(params)
  const userQuery = useAdminUserQuery(selectedUserId)
  const freezeMutation = useFreezeAdminUserMutation()
  const unfreezeMutation = useUnfreezeAdminUserMutation()

  const handleTableChange = (pagination: TablePaginationConfig) => {
    setParams((current) => ({
      ...current,
      page: pagination.current ?? 1,
      pageSize: pagination.pageSize ?? 10,
    }))
  }

  const handleSearch = (values: ListAdminUsersParams) => {
    setParams({
      ...values,
      page: 1,
      pageSize: params.pageSize ?? 10,
    })
  }

  const submitFreeze = async () => {
    if (!freezeTarget) return

    try {
      const values = await freezeForm.validateFields()
      await freezeMutation.mutateAsync({
        id: freezeTarget._id,
        reason: values.reason ?? '',
      })
      message.success('用户已冻结')
      setFreezeTarget(null)
      freezeForm.resetFields()
    } catch (error) {
      message.error(getRequestErrorMessage(error))
    }
  }

  const submitUnfreeze = async () => {
    if (!unfreezeTarget) return

    try {
      const values = await unfreezeForm.validateFields()
      await unfreezeMutation.mutateAsync(
        values.reason
          ? { id: unfreezeTarget._id, reason: values.reason }
          : { id: unfreezeTarget._id },
      )
      message.success('用户已解冻')
      setUnfreezeTarget(null)
      unfreezeForm.resetFields()
    } catch (error) {
      message.error(getRequestErrorMessage(error))
    }
  }

  return (
    <section className="page-panel">
      <div className="page-heading">
        <div>
          <Text className="admin-kicker">USERS</Text>
          <Title level={3}>用户治理</Title>
        </div>
        <Text type="secondary">冻结异常账号，恢复误处理账号。</Text>
      </div>

      <Form
        className="filter-bar"
        initialValues={params}
        layout="inline"
        onFinish={handleSearch}
      >
        <Form.Item name="keyword">
          <Input allowClear placeholder="搜索用户名 / 昵称 / 手机号" />
        </Form.Item>
        <Form.Item name="role">
          <Select
            allowClear
            options={userRoleOptions}
            placeholder="角色"
            style={{ width: 120 }}
          />
        </Form.Item>
        <Form.Item name="status">
          <Select
            allowClear
            options={userStatusOptions}
            placeholder="状态"
            style={{ width: 120 }}
          />
        </Form.Item>
        <Button htmlType="submit" type="primary">
          查询
        </Button>
      </Form>

      <Table<AdminUser>
        columns={[
          {
            title: '用户',
            dataIndex: 'nickName',
            render: (nickName, record) => (
              <Space direction="vertical" size={2}>
                <Button type="link" onClick={() => setSelectedUserId(record._id)}>
                  {nickName || record.username}
                </Button>
                <Text type="secondary">{record.phoneNumber || record.username}</Text>
              </Space>
            ),
          },
          {
            title: '角色',
            dataIndex: 'role',
            width: 120,
            render: (role: UserRole) => <Tag>{getUserRoleLabel(role)}</Tag>,
          },
          {
            title: '状态',
            dataIndex: 'status',
            width: 120,
            render: (status: UserStatus) => (
              <Tag color={getUserStatusColor(status)}>
                {getUserStatusLabel(status)}
              </Tag>
            ),
          },
          {
            title: '冻结原因',
            dataIndex: 'frozenReason',
            ellipsis: true,
            render: (reason?: string) => reason || '-',
          },
          {
            title: '更新时间',
            dataIndex: 'updatedAt',
            width: 170,
            render: formatDate,
          },
          {
            title: '操作',
            width: 170,
            render: (_, record) => (
              <Space>
                <Button size="small" onClick={() => setSelectedUserId(record._id)}>
                  详情
                </Button>
                {record.status === 'active' ? (
                  <Button
                    danger
                    size="small"
                    onClick={() => setFreezeTarget(record)}
                  >
                    冻结
                  </Button>
                ) : (
                  <Button size="small" onClick={() => setUnfreezeTarget(record)}>
                    解冻
                  </Button>
                )}
              </Space>
            ),
          },
        ]}
        dataSource={usersQuery.data?.items ?? []}
        loading={usersQuery.isLoading}
        onChange={handleTableChange}
        pagination={{
          current: params.page ?? 1,
          pageSize: params.pageSize ?? 10,
          total: usersQuery.data?.total ?? 0,
          showSizeChanger: true,
        }}
        rowKey="_id"
      />

      <Drawer
        open={Boolean(selectedUserId)}
        title="用户详情"
        width={560}
        onClose={() => setSelectedUserId(null)}
      >
        <Descriptions column={1} bordered>
          <Descriptions.Item label="昵称">
            {userQuery.data?.nickName || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="用户名">
            {userQuery.data?.username || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="手机号">
            {userQuery.data?.phoneNumber || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="角色">
            {userQuery.data ? getUserRoleLabel(userQuery.data.role) : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            {userQuery.data ? getUserStatusLabel(userQuery.data.status) : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="冻结原因">
            {userQuery.data?.frozenReason || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="冻结时间">
            {formatDate(userQuery.data?.frozenAt)}
          </Descriptions.Item>
        </Descriptions>
      </Drawer>

      <Modal
        confirmLoading={freezeMutation.isPending}
        open={Boolean(freezeTarget)}
        title="冻结用户"
        onCancel={() => setFreezeTarget(null)}
        onOk={submitFreeze}
      >
        <Form form={freezeForm} layout="vertical">
          <Form.Item
            label="冻结原因"
            name="reason"
            rules={[
              { required: true, message: '请输入冻结原因' },
              { min: 2, message: '至少 2 个字符' },
            ]}
          >
            <Input.TextArea maxLength={200} showCount />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        confirmLoading={unfreezeMutation.isPending}
        open={Boolean(unfreezeTarget)}
        title="解冻用户"
        onCancel={() => setUnfreezeTarget(null)}
        onOk={submitUnfreeze}
      >
        <Form form={unfreezeForm} layout="vertical">
          <Form.Item label="解冻原因" name="reason">
            <Input.TextArea maxLength={200} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </section>
  )
}
