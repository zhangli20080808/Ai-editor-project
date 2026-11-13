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
  FileText,
  LayoutTemplate,
  MoreHorizontal,
  Plus,
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
import { WorkStatus, type AuthUser, type Work } from '../api/types'
import TransferWorkModal from '../components/TransferWorkModal'

const { Paragraph, Text, Title } = Typography
const h5BaseUrl =
  import.meta.env.VITE_H5_BASE_URL?.replace(/\/$/, '') ??
  'http://127.0.0.1:7002'
const pageSize = 12

const statusMeta: Record<WorkStatus, { color: string; label: string }> = {
  [WorkStatus.Deleted]: { color: 'default', label: '已删除' },
  [WorkStatus.Unpublished]: { color: 'gold', label: '未发布' },
  [WorkStatus.Published]: { color: 'green', label: '已发布' },
  [WorkStatus.ForceOffline]: { color: 'red', label: '强制下线' },
}

function WorksPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [activeWorkId, setActiveWorkId] = useState<string | null>(null)
  const [transferWork, setTransferWork] = useState<Work | null>(null)
  const worksQuery = useWorksQuery({
    page,
    pageSize,
    keyword,
    isTemplate: false,
  })
  const copyWorkMutation = useCopyWorkMutation()
  const deleteWorkMutation = useDeleteWorkMutation()
  const transferWorkMutation = useTransferWorkMutation()
  const works = worksQuery.data?.items ?? []

  const handleCopy = async (work: Work) => {
    setActiveWorkId(work.uuid)
    try {
      const copiedWork = await copyWorkMutation.mutateAsync(work.uuid)
      message.success('作品已复制')
      navigate(`/editor/${copiedWork.uuid}`)
    } catch (error) {
      message.error(getRequestErrorMessage(error))
    } finally {
      setActiveWorkId(null)
    }
  }

  const handleDelete = (work: Work) => {
    Modal.confirm({
      title: '删除作品？',
      content: '删除后的作品会进入个人回收站，可以在回收站恢复。',
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        setActiveWorkId(work.uuid)
        try {
          await deleteWorkMutation.mutateAsync(work.uuid)
          message.success('作品已删除')
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
      message.success('作品已转赠')
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
            <Text type="secondary">My Works</Text>
            <Title level={3}>我的作品</Title>
            <Paragraph type="secondary">
              管理自己创建或接收转赠的作品，按更新时间倒排展示。
            </Paragraph>
          </div>
          <Space size={8} wrap>
            <Button icon={<Plus size={15} />} type="primary" onClick={() => navigate('/editor')}>
              新建空白作品
            </Button>
            <Button icon={<LayoutTemplate size={15} />} onClick={() => navigate('/')}>
              使用模板创建
            </Button>
          </Space>
        </section>

        <Card className="product-toolbar-card">
          <Input.Search
            allowClear
            enterButton="搜索"
            placeholder="搜索作品标题、描述或作者"
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
            message="作品列表加载失败"
            description={getRequestErrorMessage(worksQuery.error)}
            type="error"
            showIcon
            action={<Button onClick={() => void worksQuery.refetch()}>重试</Button>}
          />
        ) : null}

        <Spin spinning={worksQuery.isLoading}>
          {works.length > 0 ? (
            <>
              <Row gutter={[16, 16]} className="product-card-grid">
                {works.map((work) => (
                  <Col xs={24} sm={12} lg={8} xl={6} key={work.uuid}>
                    <WorkCard
                      active={activeWorkId === work.uuid}
                      work={work}
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
                  total={worksQuery.data?.total ?? 0}
                  onChange={setPage}
                />
              </div>
            </>
          ) : (
            <Card className="workspace-panel empty-workspace-panel">
              <Empty
                description="暂无作品，创建空白作品或从模板开始"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Space>
                  <Button type="primary" onClick={() => navigate('/editor')}>
                    新建空白作品
                  </Button>
                  <Button onClick={() => navigate('/')}>使用模板创建</Button>
                </Space>
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

interface WorkCardProps {
  active: boolean
  work: Work
  onCopy: (work: Work) => Promise<void>
  onDelete: (work: Work) => void
  onEdit: (work: Work) => void
  onStats: (work: Work) => void
  onTransfer: (work: Work) => void
}

function WorkCard({
  active,
  onCopy,
  onDelete,
  onEdit,
  onStats,
  onTransfer,
  work,
}: WorkCardProps) {
  const isPublished = work.status === WorkStatus.Published
  const publicUrl = `${h5BaseUrl}/p/${work.uuid}`
  const menuItems: MenuProps['items'] = [
    {
      key: 'copy',
      icon: <Copy size={14} />,
      label: '复制',
      onClick: () => void onCopy(work),
    },
    {
      key: 'transfer',
      icon: <Send size={14} />,
      label: '转赠',
      onClick: () => onTransfer(work),
    },
    {
      key: 'delete',
      danger: true,
      icon: <Trash2 size={14} />,
      label: '删除',
      onClick: () => onDelete(work),
    },
  ]

  return (
    <Card className="product-work-card">
      <div className="product-work-cover">
        {work.coverImg ? (
          <img src={work.coverImg} alt={work.title} />
        ) : (
          <FileText size={30} />
        )}
        <Tag color={statusMeta[work.status].color}>
          {statusMeta[work.status].label}
        </Tag>
        <Dropdown menu={{ items: menuItems }} trigger={['click']}>
          <Button
            className="product-card-more"
            icon={<MoreHorizontal size={16} />}
            loading={active}
            shape="circle"
          />
        </Dropdown>
        {isPublished ? (
          <Popover
            content={
              <div className="product-qr-popover">
                <QRCode size={132} value={publicUrl} />
                <Text type="secondary">扫码访问作品</Text>
              </div>
            }
          >
            <Button
              className="product-card-qr"
              icon={<QrCode size={15} />}
              shape="circle"
            />
          </Popover>
        ) : null}
      </div>
      <div className="product-work-body">
        <Title level={5} ellipsis>
          {work.title || '未命名作品'}
        </Title>
        <Paragraph type="secondary" ellipsis={{ rows: 2 }}>
          {work.desc || '暂无描述'}
        </Paragraph>
        <div className="product-work-meta">
          <Text type="secondary">更新 {formatDate(work.updatedAt)}</Text>
          <Text type="secondary">复制 {work.copiedCount}</Text>
        </div>
        <Space className="product-work-actions" size={8}>
          <Button block icon={<Edit3 size={14} />} onClick={() => onEdit(work)}>
            编辑
          </Button>
          <Button block icon={<BarChart3 size={14} />} onClick={() => onStats(work)}>
            统计
          </Button>
        </Space>
      </div>
    </Card>
  )
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export default WorksPage
