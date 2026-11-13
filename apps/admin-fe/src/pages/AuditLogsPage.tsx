import type { TablePaginationConfig } from 'antd'
import {
  Button,
  Descriptions,
  Drawer,
  Form,
  Input,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd'
import { useState } from 'react'

import {
  useAdminAuditLogQuery,
  useAdminAuditLogsQuery,
} from '../api/adminAudit'
import type {
  AdminAuditLog,
  AuditAction,
  AuditTargetType,
  ListAdminAuditLogsParams,
} from '../api/types'
import {
  auditActionOptions,
  auditTargetTypeOptions,
  formatDate,
  getAuditActionLabel,
  getAuditTargetTypeLabel,
} from '../utils/labels'

const { Paragraph, Text, Title } = Typography

export default function AuditLogsPage() {
  const [params, setParams] = useState<ListAdminAuditLogsParams>({
    page: 1,
    pageSize: 10,
  })
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null)
  const auditLogsQuery = useAdminAuditLogsQuery(params)
  const auditLogQuery = useAdminAuditLogQuery(selectedLogId)

  const handleTableChange = (pagination: TablePaginationConfig) => {
    setParams((current) => ({
      ...current,
      page: pagination.current ?? 1,
      pageSize: pagination.pageSize ?? 10,
    }))
  }

  const handleSearch = (values: ListAdminAuditLogsParams) => {
    setParams({
      ...values,
      page: 1,
      pageSize: params.pageSize ?? 10,
    })
  }

  return (
    <section className="page-panel">
      <div className="page-heading">
        <div>
          <Text className="admin-kicker">AUDIT</Text>
          <Title level={3}>审计日志</Title>
        </div>
        <Text type="secondary">追溯管理员治理动作、原因和资源快照。</Text>
      </div>

      <Form
        className="filter-bar"
        initialValues={params}
        layout="inline"
        onFinish={handleSearch}
      >
        <Form.Item name="keyword">
          <Input allowClear placeholder="搜索操作者 / 原因 / 目标" />
        </Form.Item>
        <Form.Item name="action">
          <Select
            allowClear
            options={auditActionOptions}
            placeholder="动作"
            style={{ width: 140 }}
          />
        </Form.Item>
        <Form.Item name="targetType">
          <Select
            allowClear
            options={auditTargetTypeOptions}
            placeholder="资源"
            style={{ width: 120 }}
          />
        </Form.Item>
        <Form.Item name="targetUuid">
          <Input allowClear placeholder="目标 UUID / ID" />
        </Form.Item>
        <Button htmlType="submit" type="primary">
          查询
        </Button>
      </Form>

      <Table<AdminAuditLog>
        columns={[
          {
            title: '动作',
            dataIndex: 'action',
            width: 130,
            render: (action: AuditAction) => (
              <Tag color="blue">{getAuditActionLabel(action)}</Tag>
            ),
          },
          {
            title: '目标',
            render: (_, record) => (
              <Space direction="vertical" size={2}>
                <Text>{getAuditTargetTypeLabel(record.targetType)}</Text>
                <Text type="secondary">{record.targetUuid || record.targetId}</Text>
              </Space>
            ),
          },
          { title: '操作者', dataIndex: 'operatorName', width: 140 },
          {
            title: '原因',
            dataIndex: 'reason',
            ellipsis: true,
            render: (reason?: string) => reason || '-',
          },
          {
            title: '时间',
            dataIndex: 'createdAt',
            width: 170,
            render: formatDate,
          },
          {
            title: '操作',
            width: 100,
            render: (_, record) => (
              <Button size="small" onClick={() => setSelectedLogId(record._id)}>
                详情
              </Button>
            ),
          },
        ]}
        dataSource={auditLogsQuery.data?.items ?? []}
        loading={auditLogsQuery.isLoading}
        onChange={handleTableChange}
        pagination={{
          current: params.page ?? 1,
          pageSize: params.pageSize ?? 10,
          total: auditLogsQuery.data?.total ?? 0,
          showSizeChanger: true,
        }}
        rowKey="_id"
      />

      <Drawer
        open={Boolean(selectedLogId)}
        title="审计详情"
        width={620}
        onClose={() => setSelectedLogId(null)}
      >
        <Descriptions column={1} bordered>
          <Descriptions.Item label="动作">
            {auditLogQuery.data
              ? getAuditActionLabel(auditLogQuery.data.action)
              : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="目标类型">
            {auditLogQuery.data
              ? getAuditTargetTypeLabel(
                  auditLogQuery.data.targetType as AuditTargetType,
                )
              : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="目标 ID">
            {auditLogQuery.data?.targetUuid || auditLogQuery.data?.targetId || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="操作者">
            {auditLogQuery.data?.operatorName || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="原因">
            {auditLogQuery.data?.reason || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="时间">
            {formatDate(auditLogQuery.data?.createdAt)}
          </Descriptions.Item>
          <Descriptions.Item label="快照">
            <Paragraph className="snapshot-block">
              {JSON.stringify(auditLogQuery.data?.snapshot ?? {}, null, 2)}
            </Paragraph>
          </Descriptions.Item>
        </Descriptions>
      </Drawer>
    </section>
  )
}
