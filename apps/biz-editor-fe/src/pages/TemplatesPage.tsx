import { Card, Col, Empty, Row, Space, Tag, Typography } from 'antd'

const { Paragraph, Text, Title } = Typography

const templatePlans = [
  '模板列表',
  '模板预览',
  '使用模板创建作品',
  '模板上下架',
]

function TemplatesPage() {
  return (
    <main className="workspace-page">
      <section className="workspace-page-header">
        <div>
          <Text type="secondary">Templates</Text>
          <Title level={3}>模板中心</Title>
          <Paragraph type="secondary">
            模板中心会沉淀可复用的营销页面结构，帮助运营快速创建作品。
          </Paragraph>
        </div>
        <Tag color="default">一期占位</Tag>
      </section>
      <Row gutter={16}>
        {templatePlans.map((plan) => (
          <Col span={6} key={plan}>
            <Card className="template-plan-card">
              <Text strong>{plan}</Text>
            </Card>
          </Col>
        ))}
      </Row>
      <Card className="workspace-panel empty-workspace-panel">
        <Space direction="vertical" align="center">
          <Empty
            description="模板数据将在后续接入"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </Space>
      </Card>
    </main>
  )
}

export default TemplatesPage
