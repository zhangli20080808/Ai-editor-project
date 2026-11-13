import { useState } from 'react'
import { useNavigate } from 'react-router'
import {
  Alert,
  Button,
  Card,
  Col,
  Dropdown,
  Empty,
  Input,
  Modal,
  Pagination,
  Popover,
  QRCode,
  Row,
  Space,
  Spin,
  Tag,
  Typography,
  message,
} from 'antd'
import type { MenuProps } from 'antd'
import {
  BarChart3,
  Copy,
  Edit3,
  Eye,
  LayoutTemplate,
  MoreHorizontal,
  QrCode,
  Search,
  Send,
  Trash2,
} from 'lucide-react'

import { getRequestErrorMessage } from '../api/error'
import {
  useCopyWorkMutation,
  useDeleteWorkMutation,
  useTransferWorkMutation,
  useWorksQuery,
} from '../api/works'
import type { AuthUser, Work } from '../api/types'
import TransferWorkModal from '../components/TransferWorkModal'

const { Paragraph, Text, Title } = Typography
const h5BaseUrl =
  import.meta.env.VITE_H5_BASE_URL?.replace(/\/$/, '') ??
  'http://127.0.0.1:7002'
const pageSize = 12

function MyTemplatesPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [activeWorkId, setActiveWorkId] = useState<string | null>(null)
  const [transferWork, setTransferWork] = useState<Work | null>(null)
  const templatesQuery = useWorksQuery({
    page,
    pageSize,
    keyword,
    isTemplate: true,
  })
  const copyWorkMutation = useCopyWorkMutation()
  const deleteWorkMutation = useDeleteWorkMutation()
  const transferWorkMutation = useTransferWorkMutation()
  const templates = templatesQuery.data?.items ?? []

  const handleCopy = async (template: Work) => {
    setActiveWorkId(template.uuid)
    try {
      const copiedWork = await copyWorkMutation.mutateAsync(template.uuid)
      message.success('模板已复制为新作品')
      navigate(`/editor/${copiedWork.uuid}`)
    } catch (error) {
      message.error(getRequestErrorMessage(error))
    } finally {
      setActiveWorkId(null)
    }
  }

  const handleDelete = (template: Work) => {
    Modal.confirm({
      title: '删除模板？',
      content: '模板本质也是作品，删除后会进入个人回收站。',
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        setActiveWorkId(template.uuid)
        try {
          await deleteWorkMutation.mutateAsync(template.uuid)
          message.success('模板已删除')
        } catch (error) {
          message.error(getRequestErrorMessage(error))
        } finally {
          setActiveWorkId(null)
        }
      },
    })
  }

  const handleTransfer = async (targetUser: AuthUser) => {
    if (!transferWork) return

    setActiveWorkId(transferWork.uuid)
    try {
      await transferWorkMutation.mutateAsync({
        id: transferWork.uuid,
        targetUserId: targetUser.id,
      })
      message.success('模板已转赠')
      setTransferWork(null)
    } catch (error) {
      message.error(getRequestErrorMessage(error))
    } finally {
      setActiveWorkId(null)
    }
  }

  return (
    <main className="workspace-page product-list-page">
      <div className="product-list-inner">
        <section className="product-list-header">
          <div>
            <Text type="secondary">My Templates</Text>
            <Title level={3}>我的模板</Title>
            <Paragraph type="secondary">
              模板来自已发布作品，支持编辑、统计、复制、删除和转赠。
            </Paragraph>
          </div>
          <Button type="primary" onClick={() => navigate('/works')}>
            从作品沉淀模板
          </Button>
        </section>

        <Card className="product-toolbar-card">
          <Input.Search
            allowClear
            enterButton="搜索"
            placeholder="搜索模板标题、描述或作者"
            prefix={<Search size={16} />}
            onSearch={(value) => {
              setPage(1)
              setKeyword(value.trim())
            }}
          />
        </Card>

        {templatesQuery.isError ? (
          <Alert
            className="page-error-alert"
            message="模板列表加载失败"
            description={getRequestErrorMessage(templatesQuery.error)}
            type="error"
            showIcon
            action={<Button onClick={() => void templatesQuery.refetch()}>重试</Button>}
          />
        ) : null}

        <Spin spinning={templatesQuery.isLoading}>
          {templates.length > 0 ? (
            <>
              <Row gutter={[16, 16]} className="product-card-grid">
                {templates.map((template) => (
                  <Col xs={24} sm={12} lg={8} xl={6} key={template.uuid}>
                    <MyTemplateCard
                      active={activeWorkId === template.uuid}
                      template={template}
                      onCopy={handleCopy}
                      onDelete={handleDelete}
                      onEdit={(item) => navigate(`/editor/${item.uuid}`)}
                      onStats={(item) => navigate(`/works/${item.uuid}/stats`)}
                      onTransfer={setTransferWork}
                    />
                  </Col>
                ))}
              </Row>
              <div className="product-pagination">
                <Pagination
                  current={page}
                  pageSize={pageSize}
                  showSizeChanger={false}
                  total={templatesQuery.data?.total ?? 0}
                  onChange={setPage}
                />
              </div>
            </>
          ) : (
            <Card className="workspace-panel empty-workspace-panel">
              <Empty
                description="暂无模板，先把已发布作品设置为模板"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button type="primary" onClick={() => navigate('/works')}>
                  去作品列表
                </Button>
              </Empty>
            </Card>
          )}
        </Spin>
        <TransferWorkModal
          confirmLoading={transferWorkMutation.isPending}
          open={Boolean(transferWork)}
          work={transferWork}
          onCancel={() => setTransferWork(null)}
          onConfirm={(targetUser) => void handleTransfer(targetUser)}
        />
      </div>
    </main>
  )
}

interface MyTemplateCardProps {
  active: boolean
  template: Work
  onCopy: (template: Work) => Promise<void>
  onDelete: (template: Work) => void
  onEdit: (template: Work) => void
  onStats: (template: Work) => void
  onTransfer: (template: Work) => void
}

function MyTemplateCard({
  active,
  onCopy,
  onDelete,
  onEdit,
  onStats,
  onTransfer,
  template,
}: MyTemplateCardProps) {
  const publicUrl = `${h5BaseUrl}/p/${template.uuid}`
  const menuItems: MenuProps['items'] = [
    {
      key: 'copy',
      icon: <Copy size={14} />,
      label: '复制',
      onClick: () => void onCopy(template),
    },
    {
      key: 'transfer',
      icon: <Send size={14} />,
      label: '转赠',
      onClick: () => onTransfer(template),
    },
    {
      key: 'delete',
      danger: true,
      icon: <Trash2 size={14} />,
      label: '删除',
      onClick: () => onDelete(template),
    },
  ]

  return (
    <Card className="product-work-card">
      <div className="product-work-cover">
        {template.coverImg ? (
          <img src={template.coverImg} alt={template.title} />
        ) : (
          <LayoutTemplate size={30} />
        )}
        <Tag color={template.isPublic ? 'green' : 'default'}>
          {template.isPublic ? '公开' : '私有'}
        </Tag>
        <Dropdown menu={{ items: menuItems }} trigger={['click']}>
          <Button
            className="product-card-more"
            icon={<MoreHorizontal size={16} />}
            loading={active}
            shape="circle"
          />
        </Dropdown>
        <Popover
          content={
            <div className="product-qr-popover">
              <QRCode size={132} value={publicUrl} />
              <Text type="secondary">扫码访问模板</Text>
            </div>
          }
        >
          <Button
            className="product-card-qr"
            icon={<QrCode size={15} />}
            shape="circle"
          />
        </Popover>
      </div>
      <div className="product-work-body">
        <Title level={5} ellipsis>
          {template.title || '未命名模板'}
        </Title>
        <Paragraph type="secondary" ellipsis={{ rows: 2 }}>
          {template.desc || '暂无描述'}
        </Paragraph>
        <Space size={[6, 6]} wrap>
          {(template.templateTags?.length ? template.templateTags : ['未分类']).map(
            (tag) => (
              <Tag key={tag}>{tag}</Tag>
            ),
          )}
        </Space>
        <div className="product-work-meta">
          <Text type="secondary">
            <Eye size={13} /> 浏览 --
          </Text>
          <Text type="secondary">使用 {template.copiedCount}</Text>
        </div>
        <Space className="product-work-actions" size={8}>
          <Button block icon={<Edit3 size={14} />} onClick={() => onEdit(template)}>
            编辑
          </Button>
          <Button block icon={<BarChart3 size={14} />} onClick={() => onStats(template)}>
            统计
          </Button>
        </Space>
      </div>
    </Card>
  )
}

export default MyTemplatesPage
