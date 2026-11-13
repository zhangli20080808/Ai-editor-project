import {
  Alert,
  Button,
  Card,
  Empty,
  Progress,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd'
import type { TableProps } from 'antd'
import {
  BarChart3,
  ExternalLink,
  GitBranch,
  ListOrdered,
  MousePointerClick,
  RefreshCw,
  TrendingUp,
  Trophy,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router'

import { getRequestErrorMessage } from '../api/error'
import { useWorkQuery, useWorkStatsQuery } from '../api/works'
import type { WorkComponentEventStat, WorkStatsChannel } from '../api/types'

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
  const topChannels = statsQuery.data?.topChannels ?? []
  const topComponentEvents = statsQuery.data?.topComponentEvents ?? []
  const componentEvents = statsQuery.data?.componentEvents ?? []
  const daily = statsQuery.data?.daily ?? []
  const totalPv = statsQuery.data?.totalPv ?? 0
  const totalComponentClicks = statsQuery.data?.totalComponentClicks ?? 0
  const maxDailyPv = Math.max(...daily.map((item) => item.pv), 1)
  const bestChannel = topChannels[0]
  const hottestInteraction = topComponentEvents[0]

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

  const interactionColumns: TableProps<WorkComponentEventStat>['columns'] = [
    {
      title: '组件',
      dataIndex: 'componentLabel',
      render: (_, item) => (
        <Space size={8}>
          <Text strong>{item.componentLabel}</Text>
          <Tag>{item.componentName}</Tag>
        </Space>
      ),
    },
    {
      title: '事件名',
      dataIndex: 'eventName',
      width: 180,
      render: (eventName: string) => <Text code>{eventName}</Text>,
    },
    {
      title: '点击量',
      dataIndex: 'count',
      width: 120,
      render: (count: number) => <Text strong>{count}</Text>,
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
              icon={<RefreshCw size={15} />}
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
            <div className="stats-summary-card-top">
              <Text type="secondary">作品</Text>
              <span className="stats-summary-icon">
                <BarChart3 size={16} />
              </span>
            </div>
            <Title level={4}>{workQuery.data?.title ?? '-'}</Title>
          </Card>
          <Card className="metric-card stats-summary-card">
            <div className="stats-summary-card-top">
              <Text type="secondary">总访问量 PV</Text>
              <span className="stats-summary-icon">
                <MousePointerClick size={16} />
              </span>
            </div>
            <Title level={3}>{totalPv}</Title>
          </Card>
          <Card className="metric-card stats-summary-card">
            <div className="stats-summary-card-top">
              <Text type="secondary">渠道数</Text>
              <span className="stats-summary-icon">
                <GitBranch size={16} />
              </span>
            </div>
            <Title level={3}>{channels.length}</Title>
          </Card>
          <Card className="metric-card stats-summary-card">
            <div className="stats-summary-card-top">
              <Text type="secondary">最高渠道</Text>
              <span className="stats-summary-icon">
                <Trophy size={16} />
              </span>
            </div>
            <Title level={4}>{bestChannel?.name ?? '-'}</Title>
          </Card>
          <Card className="metric-card stats-summary-card">
            <div className="stats-summary-card-top">
              <Text type="secondary">组件点击量</Text>
              <span className="stats-summary-icon">
                <MousePointerClick size={16} />
              </span>
            </div>
            <Title level={3}>{totalComponentClicks}</Title>
          </Card>
        </div>

        <div className="stats-insight-grid">
          <Card className="workspace-panel stats-chart-panel">
            <div className="stats-section-title">
              <div>
                <Space size={8}>
                  <TrendingUp size={18} />
                  <Text strong>近 7 天访问趋势</Text>
                </Space>
                <Paragraph type="secondary">
                  按自然日汇总访问量，帮助判断投放节奏和发布后的反馈。
                </Paragraph>
              </div>
              <div className="stats-section-total">
                <Text type="secondary">7 天 PV</Text>
                <strong>{daily.reduce((sum, item) => sum + item.pv, 0)}</strong>
              </div>
            </div>
            {daily.length === 0 ? (
              <Empty
                description="暂无访问趋势"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <div className="stats-bar-chart">
                {daily.map((item) => (
                  <div className="stats-bar-item" key={item.date}>
                    <div className="stats-bar-value">{item.pv}</div>
                    <div
                      className="stats-bar"
                      style={{
                        height: `${Math.max((item.pv / maxDailyPv) * 120, item.pv > 0 ? 12 : 4)}px`,
                      }}
                    />
                    <Text type="secondary">{formatDayLabel(item.date)}</Text>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="workspace-panel stats-ranking-panel">
            <div className="stats-section-title stats-section-title-compact">
              <div>
                <Space size={8}>
                  <ListOrdered size={18} />
                  <Text strong>渠道排行</Text>
                </Space>
                <Paragraph type="secondary">
                  对比不同投放入口的访问贡献。
                </Paragraph>
              </div>
            </div>
            {topChannels.length === 0 ? (
              <Empty
                description="暂无渠道排行"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <div className="stats-ranking-list">
                {topChannels.map((channel, index) => {
                  const percent =
                    totalPv === 0 ? 0 : Math.round((channel.pv / totalPv) * 100)

                  return (
                    <div className="stats-ranking-item" key={channel.id}>
                      <div className="stats-ranking-head">
                        <Space size={8}>
                          <span className="stats-ranking-index">
                            {index + 1}
                          </span>
                          <Text strong>{channel.name}</Text>
                        </Space>
                        <Text type="secondary">{channel.pv} PV</Text>
                      </div>
                      <Progress
                        percent={percent}
                        showInfo={false}
                        strokeColor="#ff5a3c"
                      />
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>

        <Card className="workspace-panel stats-table-panel">
          <div className="stats-section-title stats-table-heading">
            <div>
              <Space size={8}>
                <BarChart3 size={18} />
                <Text strong>分渠道统计</Text>
              </Space>
              <Paragraph type="secondary">
                渠道链接可直接复制，用于微信、广告投放、社群等不同场景。
              </Paragraph>
            </div>
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

        <Card className="workspace-panel stats-table-panel">
          <div className="stats-section-title stats-table-heading">
            <div>
              <Space size={8}>
                <MousePointerClick size={18} />
                <Text strong>组件交互统计</Text>
              </Space>
              <Paragraph type="secondary">
                统计 H5 端触发的组件埋点事件，查看哪些组件和动作最活跃。
              </Paragraph>
            </div>
            <div className="stats-section-total">
              <Text type="secondary">最热交互</Text>
              <strong>
                {hottestInteraction
                  ? `${hottestInteraction.componentLabel} / ${hottestInteraction.eventName}`
                  : '-'}
              </strong>
            </div>
          </div>
          {topComponentEvents.length > 0 ? (
            <div className="stats-ranking-list">
              {topComponentEvents.map((item, index) => (
                <div className="stats-ranking-item" key={`${item.componentId}-${item.eventName}`}>
                  <div className="stats-ranking-head">
                    <Space size={8}>
                      <span className="stats-ranking-index">{index + 1}</span>
                      <Text strong>{item.componentLabel}</Text>
                      <Tag>{item.componentName}</Tag>
                    </Space>
                    <Text type="secondary">{item.count} 次</Text>
                  </div>
                  <Text type="secondary">{item.eventName}</Text>
                </div>
              ))}
            </div>
          ) : (
            <Empty
              description="暂无组件交互数据"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}
          <Table
            columns={interactionColumns}
            dataSource={componentEvents}
            loading={statsQuery.isLoading || workQuery.isLoading}
            locale={{
              emptyText: (
                <Empty
                  description="暂无组件事件明细"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ),
            }}
            pagination={false}
            rowKey={(record) => `${record.componentId}-${record.eventName}`}
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

function formatDayLabel(date: string) {
  const [, month, day] = date.split('-')
  return `${month}/${day}`
}

export default WorkStatsPage
