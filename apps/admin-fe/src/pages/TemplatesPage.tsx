import type { TablePaginationConfig } from 'antd'
import {
  Button,
  Descriptions,
  Drawer,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd'
import { useState } from 'react'

import {
  useAdminTemplateQuery,
  useAdminTemplatesQuery,
  useCancelRecommendAdminTemplateMutation,
  usePublishAdminTemplateMutation,
  useRecommendAdminTemplateMutation,
  useUnpublishAdminTemplateMutation,
} from '../api/adminTemplates'
import { getRequestErrorMessage } from '../api/error'
import {
  WorkStatus,
  type AdminTemplate,
  type ListAdminTemplatesParams,
} from '../api/types'
import {
  formatDate,
  getWorkStatusColor,
  getWorkStatusLabel,
} from '../utils/labels'

const { Text, Title } = Typography

type TemplateAction = 'publish' | 'unpublish' | 'recommend' | 'cancelRecommend'

interface ActionState {
  action: TemplateAction
  template: AdminTemplate
}

interface ReasonFormValues {
  reason?: string
}

const booleanOptions = [
  { label: '是', value: true },
  { label: '否', value: false },
]

const actionCopy: Record<
  TemplateAction,
  { title: string; success: string; reasonLabel: string }
> = {
  publish: {
    title: '上架模板',
    success: '模板已上架',
    reasonLabel: '上架原因',
  },
  unpublish: {
    title: '下架模板',
    success: '模板已下架',
    reasonLabel: '下架原因',
  },
  recommend: {
    title: '推荐模板',
    success: '模板已推荐',
    reasonLabel: '推荐原因',
  },
  cancelRecommend: {
    title: '取消模板推荐',
    success: '已取消推荐',
    reasonLabel: '取消原因',
  },
}

export default function TemplatesPage() {
  const [params, setParams] = useState<ListAdminTemplatesParams>({
    page: 1,
    pageSize: 10,
  })
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [actionState, setActionState] = useState<ActionState | null>(null)
  const [actionForm] = Form.useForm<ReasonFormValues>()
  const templatesQuery = useAdminTemplatesQuery(params)
  const templateQuery = useAdminTemplateQuery(selectedTemplateId)
  const publishMutation = usePublishAdminTemplateMutation()
  const unpublishMutation = useUnpublishAdminTemplateMutation()
  const recommendMutation = useRecommendAdminTemplateMutation()
  const cancelRecommendMutation = useCancelRecommendAdminTemplateMutation()

  const handleTableChange = (pagination: TablePaginationConfig) => {
    setParams((current) => ({
      ...current,
      page: pagination.current ?? 1,
      pageSize: pagination.pageSize ?? 10,
    }))
  }

  const handleSearch = (values: ListAdminTemplatesParams) => {
    setParams({
      ...values,
      page: 1,
      pageSize: params.pageSize ?? 10,
    })
  }

  const openAction = (action: TemplateAction, template: AdminTemplate) => {
    actionForm.resetFields()
    setActionState({ action, template })
  }

  const submitAction = async () => {
    if (!actionState) return

    try {
      const values = await actionForm.validateFields()
      const payload = values.reason
        ? { id: actionState.template.uuid, reason: values.reason }
        : { id: actionState.template.uuid }

      if (actionState.action === 'publish') {
        await publishMutation.mutateAsync(payload)
      } else if (actionState.action === 'unpublish') {
        await unpublishMutation.mutateAsync(payload)
      } else if (actionState.action === 'recommend') {
        await recommendMutation.mutateAsync(payload)
      } else {
        await cancelRecommendMutation.mutateAsync(payload)
      }

      message.success(actionCopy[actionState.action].success)
      setActionState(null)
      actionForm.resetFields()
    } catch (error) {
      message.error(getRequestErrorMessage(error))
    }
  }

  const actionLoading =
    publishMutation.isPending ||
    unpublishMutation.isPending ||
    recommendMutation.isPending ||
    cancelRecommendMutation.isPending

  return (
    <section className="page-panel">
      <div className="page-heading">
        <div>
          <Text className="admin-kicker">TEMPLATES</Text>
          <Title level={3}>模板治理</Title>
        </div>
        <Text type="secondary">管理模板上架、推荐位和前台可见状态。</Text>
      </div>

      <Form
        className="filter-bar"
        initialValues={params}
        layout="inline"
        onFinish={handleSearch}
      >
        <Form.Item name="keyword">
          <Input allowClear placeholder="搜索 UUID / 标题 / 作者 / 标签" />
        </Form.Item>
        <Form.Item name="isPublic">
          <Select
            allowClear
            options={booleanOptions}
            placeholder="是否上架"
            style={{ width: 130 }}
          />
        </Form.Item>
        <Form.Item name="isHot">
          <Select
            allowClear
            options={booleanOptions}
            placeholder="是否推荐"
            style={{ width: 130 }}
          />
        </Form.Item>
        <Form.Item name="templateTag">
          <Input allowClear placeholder="模板标签" />
        </Form.Item>
        <Button htmlType="submit" type="primary">
          查询
        </Button>
      </Form>

      <Table<AdminTemplate>
        columns={[
          {
            title: '模板',
            dataIndex: 'title',
            render: (title, record) => (
              <Space direction="vertical" size={2}>
                <Button
                  type="link"
                  onClick={() => setSelectedTemplateId(record.uuid)}
                >
                  {title || '未命名模板'}
                </Button>
                <Text type="secondary">{record.uuid}</Text>
              </Space>
            ),
          },
          { title: '作者', dataIndex: 'author', width: 140 },
          {
            title: '状态',
            dataIndex: 'status',
            width: 110,
            render: (status: WorkStatus) => (
              <Tag color={getWorkStatusColor(status)}>
                {getWorkStatusLabel(status)}
              </Tag>
            ),
          },
          {
            title: '上架/推荐',
            width: 130,
            render: (_, record) => (
              <Space size={4}>
                <Tag color={record.isPublic ? 'green' : 'default'}>
                  {record.isPublic ? '已上架' : '未上架'}
                </Tag>
                {record.isHot ? <Tag color="red">推荐</Tag> : null}
              </Space>
            ),
          },
          {
            title: '标签',
            dataIndex: 'templateTags',
            render: (tags: string[]) => (
              <Space size={4} wrap>
                {(tags.length ? tags : ['未分类']).map((tag) => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </Space>
            ),
          },
          { title: '使用次数', dataIndex: 'copiedCount', width: 100 },
          {
            title: '更新时间',
            dataIndex: 'updatedAt',
            width: 170,
            render: formatDate,
          },
          {
            title: '操作',
            width: 250,
            render: (_, record) => (
              <Space wrap>
                <Button
                  size="small"
                  onClick={() => setSelectedTemplateId(record.uuid)}
                >
                  详情
                </Button>
                {record.isPublic ? (
                  <Button size="small" onClick={() => openAction('unpublish', record)}>
                    下架
                  </Button>
                ) : (
                  <Button
                    disabled={record.status !== WorkStatus.Published}
                    size="small"
                    type="primary"
                    onClick={() => openAction('publish', record)}
                  >
                    上架
                  </Button>
                )}
                {record.isHot ? (
                  <Button
                    size="small"
                    onClick={() => openAction('cancelRecommend', record)}
                  >
                    取消推荐
                  </Button>
                ) : (
                  <Button
                    disabled={!record.isPublic}
                    size="small"
                    onClick={() => openAction('recommend', record)}
                  >
                    推荐
                  </Button>
                )}
              </Space>
            ),
          },
        ]}
        dataSource={templatesQuery.data?.items ?? []}
        loading={templatesQuery.isLoading}
        onChange={handleTableChange}
        pagination={{
          current: params.page ?? 1,
          pageSize: params.pageSize ?? 10,
          total: templatesQuery.data?.total ?? 0,
          showSizeChanger: true,
        }}
        rowKey="_id"
      />

      <Drawer
        open={Boolean(selectedTemplateId)}
        title="模板详情"
        width={620}
        onClose={() => setSelectedTemplateId(null)}
      >
        <Descriptions column={1} bordered>
          <Descriptions.Item label="标题">
            {templateQuery.data?.title ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item label="UUID">
            {templateQuery.data?.uuid ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            {templateQuery.data
              ? getWorkStatusLabel(templateQuery.data.status)
              : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="上架">
            {templateQuery.data?.isPublic ? '是' : '否'}
          </Descriptions.Item>
          <Descriptions.Item label="推荐">
            {templateQuery.data?.isHot ? '是' : '否'}
          </Descriptions.Item>
          <Descriptions.Item label="标签">
            {(templateQuery.data?.templateTags.length
              ? templateQuery.data.templateTags
              : ['未分类']
            ).join(' / ')}
          </Descriptions.Item>
          <Descriptions.Item label="使用次数">
            {templateQuery.data?.copiedCount ?? 0}
          </Descriptions.Item>
          <Descriptions.Item label="发布时间">
            {formatDate(templateQuery.data?.latestPublishAt)}
          </Descriptions.Item>
          <Descriptions.Item label="更新时间">
            {formatDate(templateQuery.data?.updatedAt)}
          </Descriptions.Item>
        </Descriptions>
      </Drawer>

      <Modal
        confirmLoading={actionLoading}
        open={Boolean(actionState)}
        title={actionState ? actionCopy[actionState.action].title : ''}
        onCancel={() => setActionState(null)}
        onOk={submitAction}
      >
        <Form form={actionForm} layout="vertical">
          <Form.Item
            label={actionState ? actionCopy[actionState.action].reasonLabel : '原因'}
            name="reason"
          >
            <Input.TextArea maxLength={200} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </section>
  )
}
