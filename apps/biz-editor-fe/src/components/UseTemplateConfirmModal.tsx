import {
  Button,
  Modal,
  Space,
  Tag,
  Typography,
} from 'antd'
import {
  CopyPlus,
  LayoutTemplate,
  Tags,
  User,
} from 'lucide-react'

import type { Work } from '../api/types'

const { Paragraph, Text, Title } = Typography

interface UseTemplateConfirmModalProps {
  loading?: boolean
  open: boolean
  template: Work | null
  onCancel: () => void
  onConfirm: (template: Work) => void
}

export function UseTemplateConfirmModal({
  loading = false,
  onCancel,
  onConfirm,
  open,
  template,
}: UseTemplateConfirmModalProps) {
  return (
    <Modal
      centered
      className="use-template-confirm-modal"
      footer={null}
      onCancel={onCancel}
      open={open}
      title={null}
      width={720}
    >
      {template ? (
        <div className="use-template-confirm">
          <div className="use-template-confirm-cover">
            {template.coverImg ? (
              <img src={template.coverImg} alt={template.title} />
            ) : (
              <div className="use-template-confirm-placeholder">
                <LayoutTemplate size={34} />
                <span>Template</span>
              </div>
            )}
          </div>
          <div className="use-template-confirm-info">
            <Text className="use-template-confirm-kicker">Use Template</Text>
            <Title level={3}>{template.title || '未命名模板'}</Title>
            <Paragraph type="secondary">
              {template.desc || '确认后会基于该模板创建一个新的未发布作品，你可以继续编辑内容、渠道和发布设置。'}
            </Paragraph>
            <Space size={8} className="use-template-confirm-author">
              <User size={15} />
              <Text type="secondary">{template.author}</Text>
            </Space>
            <Space size={[6, 6]} wrap>
              {(template.templateTags?.length ? template.templateTags : ['未分类']).map(
                (tag) => (
                  <Tag key={tag} icon={<Tags size={12} />}>
                    {tag}
                  </Tag>
                ),
              )}
            </Space>
            <div className="use-template-confirm-stat">
              <CopyPlus size={16} />
              <span>已被使用 {template.copiedCount} 次</span>
            </div>
            <Space className="use-template-confirm-actions" size={10}>
              <Button onClick={onCancel}>再看看</Button>
              <Button
                loading={loading}
                type="primary"
                onClick={() => onConfirm(template)}
              >
                确认创建作品
              </Button>
            </Space>
          </div>
        </div>
      ) : null}
    </Modal>
  )
}
