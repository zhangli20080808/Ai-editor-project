import { useState } from 'react'
import { useNavigate } from 'react-router'
import type { TableProps } from 'antd'
import {
  Button,
  Card,
  Col,
  Alert,
  Empty,
  Popconfirm,
  Radio,
  Row,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd'
import {
  Copy,
  FileText,
  Pencil,
  RotateCcw,
  Trash2,
} from 'lucide-react'

import {
  useCopyWorkMutation,
  useDeleteWorkMutation,
  useRestoreWorkMutation,
  useWorksQuery,
} from '../api/works'
import { WorkStatus, type Work } from '../api/types'
import { getRequestErrorMessage } from '../api/error'

const { Paragraph, Text, Title } = Typography

const statusMeta: Record<WorkStatus, { color: string; label: string }> = {
  [WorkStatus.Deleted]: { color: 'default', label: '已删除' },
  [WorkStatus.Unpublished]: { color: 'gold', label: '未发布' },
  [WorkStatus.Published]: { color: 'green', label: '已发布' },
  [WorkStatus.ForceOffline]: { color: 'red', label: '强制下线' },
}

function WorksPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'active' | 'deleted'>('active')
  const [actionWorkId, setActionWorkId] = useState<string | null>(null)
  const worksQuery = useWorksQuery({
    page: 1,
    pageSize: 20,
    ...(mode === 'deleted' ? { status: WorkStatus.Deleted } : {}),
  })
  const copyWorkMutation = useCopyWorkMutation()
  const deleteWorkMutation = useDeleteWorkMutation()
  const restoreWorkMutation = useRestoreWorkMutation()
  const works = worksQuery.data?.items ?? []
  const metrics = getWorkMetrics(works)
  const actionPending =
    copyWorkMutation.isPending ||
    deleteWorkMutation.isPending ||
    restoreWorkMutation.isPending

  const runWorkAction = async (
    work: Work,
    action: () => Promise<unknown>,
    successMessage: string,
  ) => {
    setActionWorkId(work.uuid)
    try {
      await action()
      message.success(successMessage)
    } catch (error) {
      message.error(getRequestErrorMessage(error))
    } finally {
      setActionWorkId(null)
    }
  }

  const columns: TableProps<Work>['columns'] = [
    {
      title: '作品',
      dataIndex: 'title',
      render: (_, work) => (
        <div className="work-title-cell">
          <div className="work-cover-mark">
            <FileText size={18} />
          </div>
          <div className="work-title-text">
            <Text strong>{work.title}</Text>
            <Text type="secondary">{work.desc || '暂无描述'}</Text>
          </div>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 120,
      render: (status: WorkStatus) => (
        <Tag color={statusMeta[status].color}>{statusMeta[status].label}</Tag>
      ),
    },
    {
      title: '作者',
      dataIndex: 'author',
      width: 120,
    },
    {
      title: '复制次数',
      dataIndex: 'copiedCount',
      width: 110,
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 180,
      render: (value: string) => formatDate(value),
    },
    {
      title: '操作',
      key: 'actions',
      width: mode === 'deleted' ? 140 : 260,
      render: (_, work) =>
        mode === 'deleted' ? (
          <Button
            icon={<RotateCcw size={14} />}
            loading={actionPending && actionWorkId === work.uuid}
            size="small"
            type="link"
            onClick={() =>
              runWorkAction(
                work,
                () => restoreWorkMutation.mutateAsync(work.uuid),
                '作品已恢复',
              )
            }
          >
            恢复
          </Button>
        ) : (
          <Space size={6}>
            <Button
              icon={<Pencil size={14} />}
              size="small"
              type="link"
              onClick={() => navigate(`/editor/${work.uuid}`)}
            >
              编辑
            </Button>
            <Button
              icon={<Copy size={14} />}
              loading={actionPending && actionWorkId === work.uuid}
              size="small"
              type="link"
              onClick={() =>
                runWorkAction(
                  work,
                  () => copyWorkMutation.mutateAsync(work.uuid),
                  '作品已复制',
                )
              }
            >
              复制
            </Button>
            <Popconfirm
              title="确认删除作品？"
              description="删除后可在已删除列表中恢复。"
              okText="删除"
              cancelText="取消"
              onConfirm={() =>
                runWorkAction(
                  work,
                  () => deleteWorkMutation.mutateAsync(work.uuid),
                  '作品已删除',
                )
              }
            >
              <Button danger icon={<Trash2 size={14} />} size="small" type="link">
                删除
              </Button>
            </Popconfirm>
          </Space>
        ),
    },
  ]

  return (
    <main className="workspace-page works-page">
      <div className="works-page-inner">
        <section className="workspace-page-header works-page-header">
          <div>
            <Text type="secondary">Works</Text>
            <Title level={3}>作品管理</Title>
            <Paragraph type="secondary">
              管理真实作品数据，支持编辑、复制、软删除和恢复。
            </Paragraph>
          </div>
          <Radio.Group
            className="works-mode-switch"
            optionType="button"
            value={mode}
            options={[
              { label: '正常作品', value: 'active' },
              { label: '已删除', value: 'deleted' },
            ]}
            onChange={(event) => setMode(event.target.value)}
          />
        </section>
        <Row gutter={12} className="works-metrics">
          {metrics.map((metric) => (
            <Col span={8} key={metric.label}>
              <Card className="metric-card works-metric-card">
                <Text type="secondary">{metric.label}</Text>
                <Title level={3}>{metric.value}</Title>
              </Card>
            </Col>
          ))}
        </Row>
        <Card className="workspace-panel works-table-panel">
          <div className="works-table-header">
            <div>
              <Text strong>{mode === 'deleted' ? '已删除作品' : '作品列表'}</Text>
              <Text type="secondary">
                共 {worksQuery.data?.total ?? works.length} 条
              </Text>
            </div>
            <Button type="primary" onClick={() => navigate('/editor')}>
              创建作品
            </Button>
          </div>
          {worksQuery.isError ? (
            <Alert
              className="works-error-alert"
              message="作品列表加载失败"
              description={getRequestErrorMessage(worksQuery.error)}
              type="error"
              showIcon
              action={
                <Button size="small" onClick={() => void worksQuery.refetch()}>
                  重试
                </Button>
              }
            />
          ) : null}
          <Table
            columns={columns}
            dataSource={works}
            loading={worksQuery.isLoading}
            locale={{
              emptyText: (
                <Empty
                  description={
                    mode === 'deleted' ? '暂无已删除作品' : '暂无作品数据'
                  }
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ),
            }}
            pagination={false}
            rowKey="uuid"
            size="middle"
          />
        </Card>
      </div>
    </main>
  )
}

function getWorkMetrics(works: Work[]) {
  return [
    {
      label: '当前列表',
      value: String(works.length),
    },
    {
      label: '草稿作品',
      value: String(
        works.filter((work) => work.status === WorkStatus.Unpublished).length,
      ),
    },
    {
      label: '已发布',
      value: String(
        works.filter((work) => work.status === WorkStatus.Published).length,
      ),
    },
  ]
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

export default WorksPage
