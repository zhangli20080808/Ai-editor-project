import { useState } from 'react'
import {
  Alert,
  Button,
  Card,
  Empty,
  Input,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd'
import type { TableProps } from 'antd'
import { RotateCcw, Search, Trash2 } from 'lucide-react'

import { getRequestErrorMessage } from '../api/error'
import { useRestoreWorkMutation, useWorksQuery } from '../api/works'
import { WorkStatus, type Work } from '../api/types'

const { Paragraph, Text, Title } = Typography
const pageSize = 10

function RecycleBinPage() {
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [activeWorkId, setActiveWorkId] = useState<string | null>(null)
  const worksQuery = useWorksQuery({
    page,
    pageSize,
    keyword,
    status: WorkStatus.Deleted,
  })
  const restoreWorkMutation = useRestoreWorkMutation()
  const works = worksQuery.data?.items ?? []

  const handleRestore = async (work: Work) => {
    setActiveWorkId(work.uuid)
    try {
      await restoreWorkMutation.mutateAsync(work.uuid)
      message.success('作品已恢复')
    } catch (error) {
      message.error(getRequestErrorMessage(error))
    } finally {
      setActiveWorkId(null)
    }
  }

  const columns: TableProps<Work>['columns'] = [
    {
      title: '项目',
      dataIndex: 'title',
      render: (_, work) => (
        <Space size={10}>
          <span className="recycle-icon">
            <Trash2 size={16} />
          </span>
          <Space direction="vertical" size={2}>
            <Text strong>{work.title || '未命名作品'}</Text>
            <Text type="secondary">{work.desc || '暂无描述'}</Text>
          </Space>
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'isTemplate',
      width: 110,
      render: (isTemplate: boolean) => (
        <Tag color={isTemplate ? 'purple' : 'blue'}>
          {isTemplate ? '模板' : '作品'}
        </Tag>
      ),
    },
    {
      title: '作者',
      dataIndex: 'author',
      width: 140,
    },
    {
      title: '删除时间',
      dataIndex: 'updatedAt',
      width: 180,
      render: (value: string) => formatDate(value),
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_, work) => (
        <Button
          icon={<RotateCcw size={14} />}
          loading={activeWorkId === work.uuid && restoreWorkMutation.isPending}
          type="link"
          onClick={() => void handleRestore(work)}
        >
          恢复
        </Button>
      ),
    },
  ]

  return (
    <main className="workspace-page product-list-page">
      <div className="product-list-inner">
        <section className="product-list-header">
          <div>
            <Text type="secondary">Recycle Bin</Text>
            <Title level={3}>回收站</Title>
            <Paragraph type="secondary">
              删除的作品和模板会进入这里，恢复后回到未发布状态。
            </Paragraph>
          </div>
        </section>

        <Card className="product-toolbar-card">
          <Input.Search
            allowClear
            enterButton="搜索"
            placeholder="搜索已删除项目"
            prefix={<Search size={16} />}
            onSearch={(value) => {
              setPage(1)
              setKeyword(value.trim())
            }}
          />
        </Card>

        {worksQuery.isError ? (
          <Alert
            className="page-error-alert"
            message="回收站加载失败"
            description={getRequestErrorMessage(worksQuery.error)}
            type="error"
            showIcon
            action={<Button onClick={() => void worksQuery.refetch()}>重试</Button>}
          />
        ) : null}

        <Card className="workspace-panel recycle-table-panel">
          <Table
            columns={columns}
            dataSource={works}
            loading={worksQuery.isLoading}
            locale={{
              emptyText: (
                <Empty
                  description="回收站为空"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ),
            }}
            pagination={{
              current: page,
              pageSize,
              showSizeChanger: false,
              total: worksQuery.data?.total ?? 0,
              onChange: setPage,
            }}
            rowKey="uuid"
          />
        </Card>
      </div>
    </main>
  )
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

export default RecycleBinPage
