import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import {
  Alert,
  Button,
  Card,
  Empty,
  QRCode,
  Space,
  Spin,
  Tag,
  Typography,
  message,
} from 'antd'
import {
  ArrowLeft,
  CopyPlus,
  Eye,
  Heart,
  ScanLine,
  Tags,
  User,
} from 'lucide-react'

import { getAuthToken } from '../api/authStorage'
import { getRequestErrorMessage } from '../api/error'
import {
  usePublicTemplateMutation,
  usePublicTemplateQuery,
} from '../api/works'
import type { Work } from '../api/types'
import { UseTemplateConfirmModal } from '../components/UseTemplateConfirmModal'
import { useFavoriteTemplates } from '../hooks/useFavoriteTemplates'

const { Paragraph, Text, Title } = Typography
const h5BaseUrl =
  import.meta.env.VITE_H5_BASE_URL?.replace(/\/$/, '') ??
  'http://127.0.0.1:7002'

function TemplateDetailPage() {
  const navigate = useNavigate()
  const { templateId } = useParams<{ templateId: string }>()
  const templateQuery = usePublicTemplateQuery(templateId)
  const useTemplateMutation = usePublicTemplateMutation()
  const favoriteTemplates = useFavoriteTemplates()
  const [submitting, setSubmitting] = useState(false)
  const [confirmTemplate, setConfirmTemplate] = useState<Work | null>(null)
  const template = templateQuery.data
  const favorite = template ? favoriteTemplates.isFavorite(template.uuid) : false

  const handleRequestUseTemplate = (source: Work) => {
    if (!getAuthToken()) {
      navigate(`/login?redirect=${encodeURIComponent(`/templates/${source.uuid}`)}`)
      return
    }

    setConfirmTemplate(source)
  }

  const handleConfirmUseTemplate = async (source: Work) => {
    setSubmitting(true)
    try {
      const work = await useTemplateMutation.mutateAsync(source.uuid)
      message.success('已使用模板创建新作品')
      navigate(`/editor/${work.uuid}`)
    } catch (error) {
      message.error(getRequestErrorMessage(error))
    } finally {
      setSubmitting(false)
      setConfirmTemplate(null)
    }
  }

  const handleOpenPreview = (source: Work) => {
    window.open(`${h5BaseUrl}/p/${source.uuid}`, '_blank', 'noopener,noreferrer')
  }

  const handleFavorite = (source: Work) => {
    if (!getAuthToken()) {
      navigate(`/login?redirect=${encodeURIComponent(`/templates/${source.uuid}`)}`)
      return
    }
    favoriteTemplates.toggleFavorite(source.uuid)
  }

  return (
    <main className="workspace-page template-detail-page">
      <div className="template-detail-inner">
        <Button
          className="template-detail-back"
          icon={<ArrowLeft size={15} />}
          onClick={() => navigate('/')}
        >
          返回模板首页
        </Button>

        {templateQuery.isError ? (
          <Alert
            className="page-error-alert"
            message="模板详情加载失败"
            description={getRequestErrorMessage(templateQuery.error)}
            type="error"
            showIcon
          />
        ) : null}

        <Spin spinning={templateQuery.isLoading}>
          {template ? (
            <section className="template-detail-layout">
              <Card className="template-detail-preview-card">
                <div className="template-detail-live-preview">
                  <div className="template-preview-phone">
                    <div className="template-preview-speaker" />
                    <iframe
                      src={`${h5BaseUrl}/p/${template.uuid}`}
                      title={`${template.title || '模板'} H5 预览`}
                    />
                  </div>
                  <div className="template-preview-caption">
                    <Text strong>实时 H5 预览</Text>
                    <Text type="secondary">展示模板当前发布快照，和扫码访问效果一致。</Text>
                    <Button
                      icon={<Eye size={15} />}
                      onClick={() => handleOpenPreview(template)}
                    >
                      新窗口打开
                    </Button>
                  </div>
                </div>
              </Card>

              <Card className="template-detail-info-card">
                <div className="template-detail-info">
                  <div>
                    <Text type="secondary">Template Detail</Text>
                    <Title level={2}>{template.title || '未命名模板'}</Title>
                    <Paragraph type="secondary">
                      {template.desc || '暂无副标题或一句话描述'}
                    </Paragraph>
                  </div>

                  <Space size={12} className="template-author-row">
                    <span className="template-author-avatar">
                      <User size={20} />
                    </span>
                    <div>
                      <Text type="secondary">作者</Text>
                      <div>
                        <Text strong>{template.author}</Text>
                      </div>
                    </div>
                  </Space>

                  <Space size={[8, 8]} wrap>
                    {(template.templateTags?.length
                      ? template.templateTags
                      : ['未分类']
                    ).map((tag) => (
                      <Tag key={tag} icon={<Tags size={12} />}>
                        {tag}
                      </Tag>
                    ))}
                  </Space>

                  <div className="template-detail-stats">
                    <div>
                      <Eye size={16} />
                      <span>浏览 --</span>
                    </div>
                    <div>
                      <CopyPlus size={16} />
                      <span>使用 {template.copiedCount}</span>
                    </div>
                  </div>

                  <div className="template-detail-qr">
                    <QRCode size={128} value={`${h5BaseUrl}/p/${template.uuid}`} />
                    <Space direction="vertical" size={2}>
                      <Text strong>
                        <ScanLine size={15} /> 模板预览二维码
                      </Text>
                      <Text type="secondary">扫码查看已发布 H5 效果</Text>
                    </Space>
                  </div>

                  <Space size={10} className="template-detail-actions">
                    <Button
                      loading={submitting}
                      size="large"
                      type="primary"
                      onClick={() => handleRequestUseTemplate(template)}
                    >
                      使用模板
                    </Button>
                    <Button
                      icon={<Heart fill={favorite ? 'currentColor' : 'none'} size={16} />}
                      size="large"
                      onClick={() => handleFavorite(template)}
                    >
                      {favorite ? '已收藏' : '收藏'}
                    </Button>
                  </Space>
                </div>
              </Card>
            </section>
          ) : templateQuery.isLoading ? null : (
            <Card className="workspace-panel empty-workspace-panel">
              <Empty
                description="模板不存在或不可用"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            </Card>
          )}
        </Spin>
      </div>
      <UseTemplateConfirmModal
        loading={submitting}
        open={Boolean(confirmTemplate)}
        template={confirmTemplate}
        onCancel={() => {
          if (!submitting) {
            setConfirmTemplate(null)
          }
        }}
        onConfirm={(source) => void handleConfirmUseTemplate(source)}
      />
    </main>
  )
}

export default TemplateDetailPage
