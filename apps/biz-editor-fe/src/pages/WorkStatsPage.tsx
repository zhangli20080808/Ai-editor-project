import { Alert, Button, Card, Empty, Space, Table, Tag, Typography } from 'antd'
import type { TableProps } from 'antd'
import { BarChart3, ExternalLink } from 'lucide-react'
import { useNavigate, useParams } from 'react-router'

import { getRequestErrorMessage } from '../api/error'
import { useWorkQuery, useWorkStatsQuery } from '../api/works'
import type { WorkStatsChannel } from '../api/types'

const { Paragraph, Text, Title } = Typography
const h5BaseUrl =
  import.meta.env.VITE_H5_BASE_URL?.replace(/\/$/, '') ??
  'http://127.0.0.1:7002'

function WorkStatsPage() {
  const navigate = useNavigate()
  const { workId } = useParams<{ workId: string }>()
  const workQuery = useWorkQuery(workId)
  const statsQuery = useWorkStatsQuery(workId)
  const channels = statsQuery.data?.channels ?? []

  const columns: TableProps<WorkStatsChannel>['columns'] = [
    {
      title: '渠道',
      dataIndex: 'name',
      render: (_, channel) => (
        <Space size={8}>
          <Text strong>{channel.name}</Text>
          {channel.name === '默认' ? <Tag color="blue">默认</Tag> : null}
        </Space>
      ),
    },
    {
      title: '访问量 PV',
      dataIndex: 'pv',
      width: 130,
      render: (pv: number) => <Text strong>{pv}</Text>,
    },
    {
      title: '渠道链接',
      key: 'link',
      render: (_, channel) => (
        <Text copyable ellipsis>
          {getChannelPublicUrl(workId ?? '', channel.id)}
        </Text>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 110,
      render: (_, channel) => (
        <Button
          icon={<ExternalLink size={14} />}
          size="small"
          type="link"
          onClick={() =>
            window.open(
              getChannelPublicUrl(workId ?? '', channel.id),
              '_blank',
              'noopener,noreferrer',
            )
          }
        >
          打开
        </Button>
      ),
    },
  ]

  return (
    <main className="workspace-page stats-page">
      <div className="stats-page-inner">
        <section className="workspace-page-header stats-page-header">
          <div>
            <Text type="secondary">Analytics</Text>
            <Title level={3}>作品统计</Title>
            <Paragraph type="secondary">
              查看作品发布后的总访问量和分渠道访问量。
            </Paragraph>
          </div>
          <Space size={8}>
            <Button onClick={() => navigate('/works')}>返回作品列表</Button>
            <Button
              type="primary"
              onClick={() => void statsQuery.refetch()}
            >
              刷新统计
            </Button>
          </Space>
        </section>

        {workQuery.isError || statsQuery.isError ? (
          <Alert
            className="stats-error-alert"
            message="统计数据加载失败"
            description={getRequestErrorMessage(
              workQuery.error ?? statsQuery.error,
            )}
            type="error"
            showIcon
          />
        ) : null}

        <div className="stats-summary-grid">
          <Card className="metric-card stats-summary-card">
            <Text type="secondary">作品</Text>
            <Title level={4}>{workQuery.data?.title ?? '-'}</Title>
          </Card>
          <Card className="metric-card stats-summary-card">
            <Text type="secondary">总访问量 PV</Text>
            <Title level={3}>{statsQuery.data?.totalPv ?? 0}</Title>
          </Card>
          <Card className="metric-card stats-summary-card">
            <Text type="secondary">渠道数</Text>
            <Title level={3}>{channels.length}</Title>
          </Card>
        </div>

        <Card className="workspace-panel stats-table-panel">
          <div className="stats-table-title">
            <BarChart3 size={18} />
            <Text strong>分渠道统计</Text>
          </div>
          <Table
            columns={columns}
            dataSource={channels}
            loading={statsQuery.isLoading || workQuery.isLoading}
            locale={{
              emptyText: (
                <Empty
                  description="暂无渠道统计数据"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ),
            }}
            pagination={false}
            rowKey="id"
          />
        </Card>
      </div>
    </main>
  )
}

function getChannelPublicUrl(workUuid: string, channelId: string) {
  return workUuid && channelId
    ? `${h5BaseUrl}/p/${workUuid}?channel=${channelId}`
    : ''
}

export default WorkStatsPage
