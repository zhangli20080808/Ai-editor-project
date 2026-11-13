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
  useAdminWorkQuery,
  useAdminWorksQuery,
  useOfflineAdminWorkMutation,
  useRestoreAdminWorkMutation,
} from '../api/adminWorks'
import { getRequestErrorMessage } from '../api/error'
import { WorkStatus, type AdminWork, type ListAdminWorksParams } from '../api/types'
import {
  formatDate,
  getWorkStatusColor,
  getWorkStatusLabel,
  workStatusOptions,
} from '../utils/labels'

const { Text, Title } = Typography

interface ReasonFormValues {
  reason?: string
}

export default function WorksPage() {
  const [params, setParams] = useState<ListAdminWorksParams>({
    page: 1,
    pageSize: 10,
  })
  const [selectedWorkId, setSelectedWorkId] = useState<string | null>(null)
  const [offlineTarget, setOfflineTarget] = useState<AdminWork | null>(null)
  const [restoreTarget, setRestoreTarget] = useState<AdminWork | null>(null)
  const [offlineForm] = Form.useForm<ReasonFormValues>()
  const [restoreForm] = Form.useForm<ReasonFormValues>()
  const worksQuery = useAdminWorksQuery(params)
  const workQuery = useAdminWorkQuery(selectedWorkId)
  const offlineMutation = useOfflineAdminWorkMutation()
  const restoreMutation = useRestoreAdminWorkMutation()

  const handleTableChange = (pagination: TablePaginationConfig) => {
    setParams((current) => ({
      ...current,
      page: pagination.current ?? 1,
      pageSize: pagination.pageSize ?? 10,
    }))
  }

  const handleSearch = (values: ListAdminWorksParams) => {
    setParams({
      ...values,
      page: 1,
      pageSize: params.pageSize ?? 10,
    })
  }

  const submitOffline = async () => {
    if (!offlineTarget) return

    try {
      const values = await offlineForm.validateFields()
      await offlineMutation.mutateAsync({
        id: offlineTarget.uuid,
        reason: values.reason ?? '',
      })
      message.success('作品已强制下线')
      setOfflineTarget(null)
      offlineForm.resetFields()
    } catch (error) {
      if (error instanceof Error && error.name === 'ValidationError') return
      message.error(getRequestErrorMessage(error))
    }
  }

  const submitRestore = async () => {
    if (!restoreTarget) return

    try {
      const values = await restoreForm.validateFields()
      await restoreMutation.mutateAsync(
        values.reason
          ? { id: restoreTarget.uuid, reason: values.reason }
          : { id: restoreTarget.uuid },
      )
      message.success('作品已恢复发布')
      setRestoreTarget(null)
      restoreForm.resetFields()
    } catch (error) {
      message.error(getRequestErrorMessage(error))
    }
  }

  return (
    <section className="page-panel">
      <div className="page-heading">
        <div>
          <Text className="admin-kicker">WORKS</Text>
          <Title level={3}>作品治理</Title>
        </div>
        <Text type="secondary">管理发布状态，处理违规或误下线作品。</Text>
      </div>

      <Form
        className="filter-bar"
        initialValues={params}
        layout="inline"
        onFinish={handleSearch}
      >
        <Form.Item name="keyword">
          <Input allowClear placeholder="搜索 UUID / 标题 / 作者" />
        </Form.Item>
        <Form.Item name="status">
          <Select
            allowClear
            options={workStatusOptions}
            placeholder="作品状态"
            style={{ width: 140 }}
          />
        </Form.Item>
        <Button htmlType="submit" type="primary">
          查询
        </Button>
      </Form>

      <Table<AdminWork>
        columns={[
          {
            title: '作品',
            dataIndex: 'title',
            render: (title, record) => (
              <Space direction="vertical" size={2}>
                <Button type="link" onClick={() => setSelectedWorkId(record.uuid)}>
                  {title || '未命名作品'}
                </Button>
                <Text type="secondary">{record.uuid}</Text>
              </Space>
            ),
          },
          { title: '作者', dataIndex: 'author', width: 140 },
          {
            title: '状态',
            dataIndex: 'status',
            width: 120,
            render: (status: WorkStatus) => (
              <Tag color={getWorkStatusColor(status)}>
                {getWorkStatusLabel(status)}
              </Tag>
            ),
          },
          {
            title: '模板/公开',
            width: 130,
            render: (_, record) => (
              <Space size={4}>
                {record.isTemplate ? <Tag color="blue">模板</Tag> : null}
                {record.isPublic ? <Tag color="cyan">公开</Tag> : null}
              </Space>
            ),
          },
          {
            title: '更新时间',
            dataIndex: 'updatedAt',
            width: 170,
            render: formatDate,
          },
          {
            title: '操作',
            width: 190,
            render: (_, record) => (
              <Space>
                <Button size="small" onClick={() => setSelectedWorkId(record.uuid)}>
                  详情
                </Button>
                {record.status === WorkStatus.Published ? (
                  <Button
                    danger
                    size="small"
                    onClick={() => setOfflineTarget(record)}
                  >
                    下线
                  </Button>
                ) : null}
                {record.status === WorkStatus.ForceOffline ? (
                  <Button size="small" onClick={() => setRestoreTarget(record)}>
                    恢复
                  </Button>
                ) : null}
              </Space>
            ),
          },
        ]}
        dataSource={worksQuery.data?.items ?? []}
        loading={worksQuery.isLoading}
        onChange={handleTableChange}
        pagination={{
          current: params.page ?? 1,
          pageSize: params.pageSize ?? 10,
          total: worksQuery.data?.total ?? 0,
          showSizeChanger: true,
        }}
        rowKey="_id"
      />

      <Drawer
        open={Boolean(selectedWorkId)}
        title="作品详情"
        width={560}
        onClose={() => setSelectedWorkId(null)}
      >
        <Descriptions column={1} bordered>
          <Descriptions.Item label="标题">
            {workQuery.data?.title ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item label="UUID">
            {workQuery.data?.uuid ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            {workQuery.data ? getWorkStatusLabel(workQuery.data.status) : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="下线原因">
            {workQuery.data?.adminOfflineReason || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="发布时间">
            {formatDate(workQuery.data?.latestPublishAt)}
          </Descriptions.Item>
          <Descriptions.Item label="更新时间">
            {formatDate(workQuery.data?.updatedAt)}
          </Descriptions.Item>
        </Descriptions>
      </Drawer>

      <Modal
        confirmLoading={offlineMutation.isPending}
        open={Boolean(offlineTarget)}
        title="强制下线作品"
        onCancel={() => setOfflineTarget(null)}
        onOk={submitOffline}
      >
        <Form form={offlineForm} layout="vertical">
          <Form.Item
            label="下线原因"
            name="reason"
            rules={[
              { required: true, message: '请输入下线原因' },
              { min: 2, message: '至少 2 个字符' },
            ]}
          >
            <Input.TextArea maxLength={200} showCount />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        confirmLoading={restoreMutation.isPending}
        open={Boolean(restoreTarget)}
        title="恢复发布作品"
        onCancel={() => setRestoreTarget(null)}
        onOk={submitRestore}
      >
        <Form form={restoreForm} layout="vertical">
          <Form.Item label="恢复原因" name="reason">
            <Input.TextArea maxLength={200} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </section>
  )
}
