import { useState } from 'react'
import { useNavigate } from 'react-router'
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Popconfirm,
  Row,
  Space,
  Spin,
  Tag,
  Typography,
  message,
} from 'antd'
import {
  CopyPlus,
  Eye,
  FileText,
  Layers3,
  LayoutTemplate,
  Pencil,
  Rocket,
  Trash2,
  ToggleRight,
} from 'lucide-react'

import { getRequestErrorMessage } from '../api/error'
import {
  useCopyWorkMutation,
  useRemoveWorkFromTemplatesMutation,
  useWorksQuery,
} from '../api/works'
import { WorkStatus, type Work } from '../api/types'

const { Paragraph, Text, Title } = Typography
const h5BaseUrl =
  import.meta.env.VITE_H5_BASE_URL?.replace(/\/$/, '') ??
  'http://127.0.0.1:7002'

const templateStats = [
  {
    title: '模板列表',
    description: '从成熟作品沉淀可复用结构',
    icon: LayoutTemplate,
  },
  {
    title: '模板预览',
    description: '快速检查移动端发布效果',
    icon: Eye,
  },
  {
    title: '使用模板创建',
    description: '复制模板并进入编辑器二次加工',
    icon: Rocket,
  },
  {
    title: '展示控制',
    description: '后续支持上下架与运营推荐',
    icon: ToggleRight,
  },
]

const statusMeta: Record<WorkStatus, { color: string; label: string }> = {
  [WorkStatus.Deleted]: { color: 'default', label: '已删除' },
  [WorkStatus.Unpublished]: { color: 'gold', label: '未发布' },
  [WorkStatus.Published]: { color: 'green', label: '已发布' },
  [WorkStatus.ForceOffline]: { color: 'red', label: '强制下线' },
}

function TemplatesPage() {
  const navigate = useNavigate()
  const [activeWorkId, setActiveWorkId] = useState<string | null>(null)
  const templatesQuery = useWorksQuery({
    page: 1,
    pageSize: 30,
    isTemplate: true,
  })
  const copyWorkMutation = useCopyWorkMutation()
  const removeTemplateMutation = useRemoveWorkFromTemplatesMutation()
  const templates = templatesQuery.data?.items ?? []

  const useTemplate = async (template: Work) => {
    setActiveWorkId(template.uuid)
    try {
      const copiedWork = await copyWorkMutation.mutateAsync(template.uuid)
      message.success('已使用模板创建新作品')
      navigate(`/editor/${copiedWork.uuid}`)
    } catch (error) {
      message.error(getRequestErrorMessage(error))
    } finally {
      setActiveWorkId(null)
    }
  }

  const previewTemplate = (template: Work) => {
    if (template.status !== WorkStatus.Published) {
      message.info('模板发布后才可以预览线上页面')
      return
    }

    window.open(
      `${h5BaseUrl}/p/${template.uuid}`,
      '_blank',
      'noopener,noreferrer',
    )
  }

  const removeTemplate = async (template: Work) => {
    setActiveWorkId(template.uuid)
    try {
      await removeTemplateMutation.mutateAsync(template.uuid)
      message.success('已移出模板中心')
    } catch (error) {
      message.error(getRequestErrorMessage(error))
    } finally {
      setActiveWorkId(null)
    }
  }

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
          <Space size={8}>
            <Tag color="volcano">真实数据</Tag>
            <Button type="primary" onClick={() => navigate('/works')}>
              从作品沉淀模板
            </Button>
          </Space>
        </section>
        <Row gutter={12} className="template-plan-grid">
          {templateStats.map(({ description, icon: Icon, title }) => (
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
        <Card className="workspace-panel templates-library-panel">
          <div className="templates-library-header">
            <div>
              <Text strong>可用模板</Text>
              <Text type="secondary">
                共 {templatesQuery.data?.total ?? templates.length} 个模板
              </Text>
            </div>
            <Button onClick={() => void templatesQuery.refetch()}>刷新</Button>
          </div>
          {templatesQuery.isError ? (
            <Alert
              className="templates-error-alert"
              message="模板列表加载失败"
              description={getRequestErrorMessage(templatesQuery.error)}
              type="error"
              showIcon
              action={
                <Button size="small" onClick={() => void templatesQuery.refetch()}>
                  重试
                </Button>
              }
            />
          ) : null}
          <Spin spinning={templatesQuery.isLoading}>
            {templates.length > 0 ? (
              <Row gutter={[14, 14]} className="template-card-grid">
                {templates.map((template) => (
                  <Col xs={24} sm={12} lg={8} xl={6} key={template.uuid}>
                    <TemplateCard
                      active={activeWorkId === template.uuid}
                      template={template}
                      onEdit={(work) => navigate(`/editor/${work.uuid}`)}
                      onPreview={previewTemplate}
                      onRemove={removeTemplate}
                      onUse={useTemplate}
                    />
                  </Col>
                ))}
              </Row>
            ) : (
              <div className="templates-empty-content">
                <div className="templates-empty-visual">
                  <Layers3 size={34} />
                </div>
                <Space orientation="vertical" size={8} align="center">
                  <Empty
                    description="还没有模板，先在作品列表把成熟作品设为模板"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                  <Button type="primary" onClick={() => navigate('/works')}>
                    去作品列表
                  </Button>
                </Space>
              </div>
            )}
          </Spin>
        </Card>
      </div>
    </main>
  )
}

interface TemplateCardProps {
  active: boolean
  template: Work
  onEdit: (template: Work) => void
  onPreview: (template: Work) => void
  onRemove: (template: Work) => Promise<void>
  onUse: (template: Work) => Promise<void>
}

function TemplateCard({
  active,
  onEdit,
  onPreview,
  onRemove,
  onUse,
  template,
}: TemplateCardProps) {
  const isPublished = template.status === WorkStatus.Published

  return (
    <Card className="template-library-card">
      <div className="template-library-cover">
        {template.coverImg ? (
          <img src={template.coverImg} alt={template.title} />
        ) : (
          <div className="template-library-cover-empty">
            <FileText size={24} />
          </div>
        )}
        <Tag color={statusMeta[template.status].color}>
          {statusMeta[template.status].label}
        </Tag>
      </div>
      <div className="template-library-body">
        <div className="template-library-title">
          <Text strong ellipsis>
            {template.title || '未命名模板'}
          </Text>
          {template.isHot ? <Tag color="red">HOT</Tag> : null}
        </div>
        <Paragraph type="secondary" ellipsis={{ rows: 2 }}>
          {template.desc || '暂无模板说明'}
        </Paragraph>
        <div className="template-library-meta">
          <Text type="secondary">作者 {template.author}</Text>
          <Text type="secondary">复制 {template.copiedCount}</Text>
        </div>
        <Space size={8} className="template-library-actions">
          <Button
            block
            icon={<CopyPlus size={14} />}
            loading={active}
            type="primary"
            onClick={() => void onUse(template)}
          >
            使用模板
          </Button>
          <Button
            disabled={!isPublished}
            icon={<Eye size={14} />}
            onClick={() => onPreview(template)}
          >
            预览
          </Button>
          <Button
            icon={<Pencil size={14} />}
            onClick={() => onEdit(template)}
          >
            编辑
          </Button>
          <Popconfirm
            title="移出模板中心？"
            description="作品仍会保留，只是不再作为模板展示。"
            okText="移出"
            cancelText="取消"
            onConfirm={() => void onRemove(template)}
          >
            <Button danger icon={<Trash2 size={14} />} loading={active}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      </div>
    </Card>
  )
}

export default TemplatesPage
