import { Button, Card, Col, Empty, Row, Space, Tag, Typography } from 'antd'
import {
  Eye,
  Layers3,
  LayoutTemplate,
  Rocket,
  ToggleRight,
} from 'lucide-react'

const { Paragraph, Text, Title } = Typography

const templatePlans = [
  {
    title: '模板列表',
    description: '集中管理可复用页面结构',
    icon: LayoutTemplate,
  },
  {
    title: '模板预览',
    description: '发布前快速检查移动端效果',
    icon: Eye,
  },
  {
    title: '使用模板创建',
    description: '一键复制模板生成新作品',
    icon: Rocket,
  },
  {
    title: '模板上下架',
    description: '控制模板是否展示给运营',
    icon: ToggleRight,
  },
]

function TemplatesPage() {
  return (
    <main className="workspace-page templates-page">
      <div className="templates-page-inner">
        <section className="workspace-page-header templates-page-header">
          <div>
            <Text type="secondary">Templates</Text>
            <Title level={3}>模板中心</Title>
            <Paragraph type="secondary">
              沉淀可复用的营销页面结构，让运营从成熟版式快速创建作品。
            </Paragraph>
          </div>
          <Tag color="volcano">一期规划</Tag>
        </section>
        <Row gutter={12} className="template-plan-grid">
          {templatePlans.map(({ description, icon: Icon, title }) => (
            <Col span={6} key={title}>
              <Card className="template-plan-card">
                <div className="template-plan-icon">
                  <Icon size={18} />
                </div>
                <Text strong>{title}</Text>
                <Text type="secondary">{description}</Text>
              </Card>
            </Col>
          ))}
        </Row>
        <Card className="workspace-panel templates-empty-panel">
          <div className="templates-empty-content">
            <div className="templates-empty-visual">
              <Layers3 size={34} />
            </div>
            <Space orientation="vertical" size={8} align="center">
              <Empty
                description="模板数据将在后续接入"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
              <Button disabled type="primary">
                创建模板
              </Button>
            </Space>
          </div>
        </Card>
      </div>
    </main>
  )
}

export default TemplatesPage
