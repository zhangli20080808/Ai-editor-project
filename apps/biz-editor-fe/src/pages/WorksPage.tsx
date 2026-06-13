import { Card, Col, Empty, Row, Space, Tag, Typography } from 'antd'

const { Paragraph, Text, Title } = Typography

const workMetrics = [
  { label: '草稿作品', value: '0' },
  { label: '已发布', value: '0' },
  { label: '今日访问', value: '0' },
]

function WorksPage() {
  return (
    <main className="workspace-page">
      <section className="workspace-page-header">
        <div>
          <Text type="secondary">Works</Text>
          <Title level={3}>作品管理</Title>
          <Paragraph type="secondary">
            后续这里会承载我的作品、搜索、复制、删除恢复、发布状态和数据入口。
          </Paragraph>
        </div>
        <Tag color="default">一期占位</Tag>
      </section>
      <Row gutter={16}>
        {workMetrics.map((metric) => (
          <Col span={8} key={metric.label}>
            <Card className="metric-card">
              <Text type="secondary">{metric.label}</Text>
              <Title level={3}>{metric.value}</Title>
            </Card>
          </Col>
        ))}
      </Row>
      <Card className="workspace-panel empty-workspace-panel">
        <Space direction="vertical" align="center">
          <Empty
            description="作品列表将在接入接口后展示"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </Space>
      </Card>
    </main>
  )
}

export default WorksPage
