import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type {
  CSSProperties,
  PointerEvent as ReactPointerEvent,
} from 'react'
import type { DragEndEvent } from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Eye,
  EyeOff,
  GripVertical,
  Lock,
  Maximize2,
  Minus,
  Plus,
  Redo2,
  Settings2,
  Trash2,
  Undo2,
  Unlock,
  Copy,
  ExternalLink,
  Share2,
} from 'lucide-react'
import {
  Alert,
  Button,
  Collapse,
  Drawer,
  Empty,
  Form,
  Input,
  InputNumber,
  Layout,
  Modal,
  Popover,
  QRCode,
  Radio,
  Select,
  Slider,
  Space,
  Switch,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  Upload,
  message,
} from 'antd'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { UploadProps } from 'antd'
import { useNavigate, useParams } from 'react-router'
import type {
  ComponentData,
  ComponentName,
  ComponentTemplate,
  PageSetting,
  PropGroupKey,
  PropSchema,
} from '../editor/types'
import {
  componentRegistry,
  componentTemplates,
} from '../editor/componentRegistry'
import {
  useEditorStore,
  type HistoryRecord,
} from '../editor/editorStore'
import { useClickOutside } from '../hooks/useClickOutside'
import { useEditorHotkeys } from '../hooks/useEditorHotkeys'
import { useKeyPress } from '../hooks/useKeyPress'
import { generateCoverImage } from '../editor/coverImageService'
import { uploadImage } from '../editor/uploadService'
import type { UploadedAsset } from '../editor/uploadService'
import {
  useCreateWorkMutation,
  useCreateWorkChannelMutation,
  useDeleteWorkChannelMutation,
  usePublishWorkMutation,
  useUpdateWorkTemplateSettingsMutation,
  useUpdateWorkMutation,
  useWorkQuery,
} from '../api/works'
import type { Work, WorkContent } from '../api/types'
import { getRequestErrorMessage } from '../api/error'
import { H5PreviewRenderer } from '../components/H5PreviewRenderer'
import '../App.css'

const { Content, Sider } = Layout
const { Text } = Typography
const propGroupOptions: Array<{ key: PropGroupKey; label: string }> = [
  { key: 'basic', label: '基础属性' },
  { key: 'size', label: '尺寸' },
  { key: 'border', label: '边框' },
  { key: 'shadowOpacity', label: '阴影与透明度' },
  { key: 'position', label: '位置' },
  { key: 'event', label: '事件功能' },
]
const defaultActivePropGroups: PropGroupKey[] = ['basic', 'position']
const pageColorPresets = [
  '#ffffff',
  '#f8fafc',
  '#111827',
  '#ff5a3c',
  '#1677ff',
  '#52c41a',
]
const h5BaseUrl =
  import.meta.env.VITE_H5_BASE_URL?.replace(/\/$/, '') ??
  'http://127.0.0.1:7002'
const defaultWorkMeta = {
  title: '',
  desc: '',
  coverImg: '',
}
const defaultTemplateSettings = {
  isPublic: true,
  templateTags: [] as string[],
}
const templateTagOptions = [
  { label: '活动促销', value: '活动促销' },
  { label: '品牌宣传', value: '品牌宣传' },
  { label: '商品种草', value: '商品种草' },
  { label: '报名收集', value: '报名收集' },
]
type SaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'publishing' | 'published' | 'error'

function EditorPage() {
  useEditorHotkeys()
  const navigate = useNavigate()
  const { workId } = useParams<{ workId: string }>()

  const components = useEditorStore((state) => state.components)
  const currentElement = useEditorStore((state) => state.currentElement)
  const historyPast = useEditorStore((state) => state.historyPast)
  const historyFuture = useEditorStore((state) => state.historyFuture)
  const canvasZoom = useEditorStore((state) => state.canvasZoom)
  const pageSetting = useEditorStore((state) => state.pageSetting)
  const zoomInCanvas = useEditorStore((state) => state.zoomInCanvas)
  const zoomOutCanvas = useEditorStore((state) => state.zoomOutCanvas)
  const resetCanvasZoom = useEditorStore((state) => state.resetCanvasZoom)
  const fitCanvasToView = useEditorStore((state) => state.fitCanvasToView)
  const loadWorkContent = useEditorStore((state) => state.loadWorkContent)
  const resetEditor = useEditorStore((state) => state.resetEditor)
  const addComponent = useEditorStore((state) => state.addComponent)
  const addUploadedImage = useEditorStore((state) => state.addUploadedImage)
  const removeComponent = useEditorStore((state) => state.removeComponent)
  const selectComponent = useEditorStore((state) => state.selectComponent)
  const reorderComponents = useEditorStore((state) => state.reorderComponents)
  const toggleComponentHidden = useEditorStore(
    (state) => state.toggleComponentHidden,
  )
  const toggleComponentLocked = useEditorStore(
    (state) => state.toggleComponentLocked,
  )
  const updateLayerName = useEditorStore((state) => state.updateLayerName)
  const updateComponent = useEditorStore((state) => state.updateComponent)
  const updateComponentPosition = useEditorStore(
    (state) => state.updateComponentPosition,
  )
  const commitComponentPosition = useEditorStore(
    (state) => state.commitComponentPosition,
  )
  const updateComponentRect = useEditorStore(
    (state) => state.updateComponentRect,
  )
  const commitComponentRect = useEditorStore(
    (state) => state.commitComponentRect,
  )
  const updateClickEvent = useEditorStore((state) => state.updateClickEvent)
  const updatePageSetting = useEditorStore((state) => state.updatePageSetting)
  const undo = useEditorStore((state) => state.undo)
  const redo = useEditorStore((state) => state.redo)
  const loadedWorkIdRef = useRef<string | null>(null)
  const workQuery = useWorkQuery(workId)
  const createWorkMutation = useCreateWorkMutation()
  const updateWorkMutation = useUpdateWorkMutation()
  const publishWorkMutation = usePublishWorkMutation()
  const updateTemplateMutation = useUpdateWorkTemplateSettingsMutation()
  const createChannelMutation = useCreateWorkChannelMutation()
  const deleteChannelMutation = useDeleteWorkChannelMutation()
  const canvasStageRef = useRef<HTMLDivElement | null>(null)
  const pageCanvasRef = useRef<HTMLDivElement | null>(null)
  const baselineSnapshotRef = useRef<string | null>(null)
  const shouldResetBaselineRef = useRef(false)
  const [workMeta, setWorkMeta] = useState(defaultWorkMeta)
  const [currentWork, setCurrentWork] = useState<Work | null>(null)
  const [templateSettings, setTemplateSettings] = useState(
    defaultTemplateSettings,
  )
  const [metaModalOpen, setMetaModalOpen] = useState(false)
  const [settingsDrawerOpen, setSettingsDrawerOpen] = useState(false)
  const [settingsPreviewMode, setSettingsPreviewMode] =
    useState<'page' | 'share'>('page')
  const [publishResultOpen, setPublishResultOpen] = useState(false)
  const [channelName, setChannelName] = useState('')
  const [pendingSave, setPendingSave] = useState(false)
  const [pendingPublish, setPendingPublish] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const saving = saveStatus === 'saving' || saveStatus === 'publishing'
  const currentWorkSnapshot = useMemo(
    () =>
      createWorkSnapshot(
        workMeta,
        createWorkContent(components, pageSetting),
      ),
    [components, pageSetting, workMeta],
  )
  const previewContent = useMemo(
    () => createWorkContent(components, pageSetting),
    [components, pageSetting],
  )

  const activeComponent =
    components.find((component) => component.id === currentElement) ?? null

  useEffect(() => {
    if (!workId) {
      loadedWorkIdRef.current = null
      shouldResetBaselineRef.current = true
      baselineSnapshotRef.current = null
      setWorkMeta(defaultWorkMeta)
      setCurrentWork(null)
      setTemplateSettings(defaultTemplateSettings)
      setSaveStatus('idle')
      setLastSavedAt(null)
      resetEditor()
    }
  }, [resetEditor, workId])

  useEffect(() => {
    if (!workId || !workQuery.data) {
      return
    }

    if (loadedWorkIdRef.current === workQuery.data.uuid) {
      return
    }

    loadWorkContent(workQuery.data.content)
    setCurrentWork(workQuery.data)
    setWorkMeta({
      title:
        workQuery.data.title === legacyDefaultWorkTitle
          ? ''
          : workQuery.data.title || '',
      desc: workQuery.data.desc || '',
      coverImg: workQuery.data.coverImg || '',
    })
    setTemplateSettings({
      isPublic: workQuery.data.isPublic,
      templateTags: workQuery.data.templateTags ?? [],
    })
    setSaveStatus('saved')
    setLastSavedAt(workQuery.data.updatedAt)
    shouldResetBaselineRef.current = true
    loadedWorkIdRef.current = workQuery.data.uuid
  }, [loadWorkContent, workId, workQuery.data])

  useEffect(() => {
    if (workQuery.error) {
      message.error(getRequestErrorMessage(workQuery.error))
    }
  }, [workQuery.error])

  useEffect(() => {
    if (shouldResetBaselineRef.current) {
      baselineSnapshotRef.current = currentWorkSnapshot
      shouldResetBaselineRef.current = false
      return
    }

    if (!baselineSnapshotRef.current) {
      baselineSnapshotRef.current = currentWorkSnapshot
      return
    }

    if (
      currentWorkSnapshot !== baselineSnapshotRef.current &&
      saveStatus !== 'saving' &&
      saveStatus !== 'publishing'
    ) {
      setSaveStatus('dirty')
    }
  }, [currentWorkSnapshot, saveStatus])

  useEffect(() => {
    const shouldWarn =
      saveStatus === 'dirty' ||
      saveStatus === 'saving' ||
      saveStatus === 'error'

    if (!shouldWarn) {
      return
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [saveStatus])

  useEffect(() => {
    if (saveStatus !== 'dirty' || !hasMeaningfulWorkTitle(workMeta.title)) {
      return
    }

    const autosaveTimer = window.setTimeout(() => {
      void saveCurrentWork({ silent: true })
    }, 5000)

    return () => window.clearTimeout(autosaveTimer)
  }, [currentWorkSnapshot, saveStatus, workMeta.title])

  const saveCurrentWork = async (options: { silent?: boolean } = {}) => {
    const content = createWorkContent(components, pageSetting)
    const metaPayload = await createWorkMetaWithCover(
      workMeta,
      pageCanvasRef.current,
    )
    setWorkMeta(metaPayload)
    setSaveStatus('saving')

    if (workId) {
      const savedWork = await updateWorkMutation.mutateAsync({
        id: workId,
        payload: {
          ...metaPayload,
          content,
        },
      })
      baselineSnapshotRef.current = createWorkSnapshot(metaPayload, content)
      setCurrentWork(savedWork)
      setSaveStatus('saved')
      setLastSavedAt(savedWork.updatedAt)
      if (!options.silent) {
        message.success('作品保存成功')
      }
      return savedWork
    }

    const createdWork = await createWorkMutation.mutateAsync({
      ...metaPayload,
      content,
    })
    loadedWorkIdRef.current = createdWork.uuid
    baselineSnapshotRef.current = createWorkSnapshot(metaPayload, content)
    setCurrentWork(createdWork)
    setSaveStatus('saved')
    setLastSavedAt(createdWork.updatedAt)
    navigate(`/editor/${createdWork.uuid}`, { replace: true })
    if (!options.silent) {
      message.success('作品保存成功')
    }
    return createdWork
  }

  const handleSave = async () => {
    if (!hasMeaningfulWorkTitle(workMeta.title)) {
      setPendingSave(true)
      setPendingPublish(false)
      setMetaModalOpen(true)
      message.warning('保存前请先设置作品标题')
      return
    }

    try {
      await saveCurrentWork()
    } catch (error) {
      setSaveStatus('error')
      message.error(getRequestErrorMessage(error))
    }
  }

  const handlePublish = async () => {
    if (!hasMeaningfulWorkTitle(workMeta.title)) {
      setPendingSave(false)
      setPendingPublish(true)
      setMetaModalOpen(true)
      message.warning('发布前请先填写作品标题')
      return
    }

    try {
      const savedWork = await saveCurrentWork()
      setSaveStatus('publishing')
      const publishedWork = await publishWorkMutation.mutateAsync(savedWork.uuid)
      setCurrentWork(publishedWork)
      setSaveStatus('published')
      setLastSavedAt(new Date().toISOString())
      setPublishResultOpen(true)
      showPublishSuccessMessage(`${h5BaseUrl}/p/${publishedWork.uuid}`)
    } catch (error) {
      setSaveStatus('error')
      message.error(getRequestErrorMessage(error))
    }
  }

  const handlePublishTemplate = async () => {
    if (!hasMeaningfulWorkTitle(workMeta.title)) {
      setSettingsPreviewMode('share')
      message.warning('发布为模板前请先填写作品标题')
      return
    }

    try {
      const savedWork = await saveCurrentWork({ silent: true })
      const templateWork = await updateTemplateMutation.mutateAsync({
        id: savedWork.uuid,
        payload: templateSettings,
      })

      setCurrentWork(templateWork)
      message.success('已发布为模板')
    } catch (error) {
      setSaveStatus('error')
      message.error(getRequestErrorMessage(error))
    }
  }

  const handleCreateChannel = async () => {
    if (!currentWork) {
      message.warning('请先保存或发布作品')
      return
    }

    const name = channelName.trim()
    if (!name) {
      message.warning('请输入渠道名称')
      return
    }

    try {
      const nextWork = await createChannelMutation.mutateAsync({
        id: currentWork.uuid,
        name,
      })
      setCurrentWork(nextWork)
      setChannelName('')
      message.success('渠道已创建')
    } catch (error) {
      message.error(getRequestErrorMessage(error))
    }
  }

  const handleDeleteChannel = async (channelId: string) => {
    if (!currentWork) {
      return
    }

    try {
      const nextWork = await deleteChannelMutation.mutateAsync({
        id: currentWork.uuid,
        channelId,
      })
      setCurrentWork(nextWork)
      message.success('渠道已删除')
    } catch (error) {
      message.error(getRequestErrorMessage(error))
    }
  }
  const handleMetaModalOk = () => {
    if (!hasMeaningfulWorkTitle(workMeta.title)) {
      message.warning('请设置一个明确的作品标题')
      return
    }

    setMetaModalOpen(false)
    if (pendingSave) {
      setPendingSave(false)
      void handleSave()
      return
    }

    if (pendingPublish) {
      setPendingPublish(false)
      void handlePublish()
    }
  }
  const handleFitCanvas = () => {
    const stage = canvasStageRef.current
    if (!stage) {
      return
    }

    fitCanvasToView({
      width: stage.clientWidth,
      height: stage.clientHeight,
    })
  }
  const templateTabItems = [
    {
      key: 'all',
      label: '全部',
      children: (
        <TemplateList
          onAddComponent={addComponent}
          onUploaded={addUploadedImage}
          showUpload
          templateNames={['l-text', 'l-image', 'l-button']}
        />
      ),
    },
    {
      key: 'text',
      label: '文本',
      children: (
        <TemplateList
          onAddComponent={addComponent}
          onUploaded={addUploadedImage}
          templateNames={['l-text']}
        />
      ),
    },
    {
      key: 'media',
      label: '媒体',
      children: (
        <TemplateList
          onAddComponent={addComponent}
          onUploaded={addUploadedImage}
          showUpload
          templateNames={['l-image']}
        />
      ),
    },
    {
      key: 'action',
      label: '动作',
      children: (
        <TemplateList
          onAddComponent={addComponent}
          onUploaded={addUploadedImage}
          templateNames={['l-button']}
        />
      ),
    },
  ]

  return (
    <Content className="app-content">
      <Layout className="editor-shell">
        <Sider width={260} className="editor-sider">
          <PanelTitle title="组件资产" description="选择组件添加到画布" />
          <Tabs className="asset-tabs" items={templateTabItems} />
        </Sider>

        <Content className="canvas-region">
            <div className="canvas-toolbar">
              <div>
                <Space size={8} className="work-heading">
                  <Text strong>{workMeta.title || '未设置标题'}</Text>
                  <Tag color={getSaveStatusMeta(saveStatus).color}>
                    {getSaveStatusMeta(saveStatus).label}
                  </Tag>
                </Space>
                <Text type="secondary" className="muted-text">
                  {workId
                    ? `正在编辑：${workId}`
                    : '新建作品'}
                  {lastSavedAt ? ` · ${formatSaveTime(lastSavedAt)}` : ''}
                </Text>
              </div>
              <Space size={12} className="canvas-toolbar-actions">
                <Text type="secondary">{components.length} 个组件</Text>
                <Space size={4} className="canvas-zoom-controls">
                  <Tooltip title="缩小画布">
                    <Button
                      aria-label="缩小画布"
                      icon={<Minus size={14} />}
                      shape="circle"
                      size="small"
                      onClick={zoomOutCanvas}
                    />
                  </Tooltip>
                  <Button
                    className="canvas-zoom-value"
                    size="small"
                    onClick={resetCanvasZoom}
                  >
                    {Math.round(canvasZoom * 100)}%
                  </Button>
                  <Tooltip title="放大画布">
                    <Button
                      aria-label="放大画布"
                      icon={<Plus size={14} />}
                      shape="circle"
                      size="small"
                      onClick={zoomInCanvas}
                    />
                  </Tooltip>
                  <Tooltip title="适应视图">
                    <Button
                      aria-label="适应视图"
                      icon={<Maximize2 size={14} />}
                      shape="circle"
                      size="small"
                      onClick={handleFitCanvas}
                    />
                  </Tooltip>
                </Space>
                <Space size={6}>
                <Popover
                  content={
                    <HistoryStack title="Undo 栈" records={historyPast} />
                  }
                  mouseEnterDelay={0.2}
                  placement="bottomRight"
                  title="撤销历史"
                >
                  <Button
                    aria-label="撤销"
                    disabled={historyPast.length === 0}
                    icon={<Undo2 size={16} />}
                    shape="circle"
                    size="small"
                    onClick={undo}
                  />
                </Popover>
                <Popover
                  content={
                    <HistoryStack title="Redo 栈" records={historyFuture} />
                  }
                  mouseEnterDelay={0.2}
                  placement="bottomRight"
                  title="重做历史"
                >
                  <Button
                    aria-label="重做"
                    disabled={historyFuture.length === 0}
                    icon={<Redo2 size={16} />}
                    shape="circle"
                    size="small"
                    onClick={redo}
                  />
                </Popover>
                </Space>
                <Space size={6}>
                  <Button
                    icon={<Settings2 size={14} />}
                    size="small"
                    type={settingsDrawerOpen ? 'primary' : 'default'}
                    onClick={() => {
                      setSettingsDrawerOpen(true)
                      setPreviewMode(true)
                    }}
                  >
                    预览和设置
                  </Button>
                  <Button
                    loading={saveStatus === 'saving'}
                    size="small"
                    onClick={handleSave}
                  >
                    保存
                  </Button>
                  <Button
                    loading={saving}
                    type="primary"
                    size="small"
                    onClick={handlePublish}
                  >
                    发布
                  </Button>
                </Space>
              </Space>
            </div>
            <div
              className="canvas-stage"
              ref={canvasStageRef}
              role="presentation"
              onClick={() => selectComponent(null)}
            >
              <div
                className="page-canvas-viewport"
                style={getPageCanvasViewportStyle(pageSetting, canvasZoom)}
              >
                {workQuery.isError ? (
                  <Alert
                    className="work-load-error"
                    message="作品加载失败"
                    description={getRequestErrorMessage(workQuery.error)}
                    type="error"
                    showIcon
                  />
                ) : null}
                <div
                  className="page-canvas"
                  ref={pageCanvasRef}
                  style={getPageCanvasStyle(pageSetting)}
                >
                  {components.length === 0 ? (
                    <Empty
                      description="从左侧添加一个组件"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                  ) : (
                    components.map((component, index) =>
                      component.isHidden ? null : (
                        <CanvasElement
                          active={component.id === currentElement}
                          canvasZoom={canvasZoom}
                          component={component}
                          key={component.id}
                          layerIndex={index}
                          onRemove={() => removeComponent(component.id)}
                          onSelect={() => selectComponent(component.id)}
                          onCommitPosition={(rect) =>
                            commitComponentPosition(component.id, rect)
                          }
                          onCommitRect={(rect) =>
                            commitComponentRect(component.id, rect)
                          }
                          onUpdatePosition={(left, top) =>
                            updateComponentPosition(component.id, left, top)
                          }
                          onUpdateRect={(rect) =>
                            updateComponentRect(component.id, rect)
                          }
                        />
                      ),
                    )
                  )}
                </div>
              </div>
            </div>
        </Content>

        <Sider width={320} className="editor-sider right-sider">
            <PanelTitle title="设置面板" description="使用表单修改元素值" />
            <RightSettingsTabs
              activeComponent={activeComponent}
              components={components}
              currentElement={currentElement}
              pageSetting={pageSetting}
              onChange={(propKey, value) => {
                if (activeComponent) {
                  updateComponent(activeComponent.id, propKey, value)
                }
              }}
              onEventChange={(eventType, value) => {
                if (activeComponent) {
                  updateClickEvent(activeComponent.id, eventType, value)
                }
              }}
              onRemove={removeComponent}
              onReorder={reorderComponents}
              onSelect={selectComponent}
              onToggleHidden={toggleComponentHidden}
              onToggleLocked={toggleComponentLocked}
              onUpdateLayerName={updateLayerName}
              onUpdatePageSetting={updatePageSetting}
            />
        </Sider>
        {previewMode ? (
          <div
            className="editor-floating-preview"
            onClick={(event) => event.stopPropagation()}
          >
            {settingsPreviewMode === 'share' ? (
              <SharePreviewCard value={workMeta} />
            ) : (
              <H5PreviewRenderer content={previewContent} />
            )}
          </div>
        ) : null}
      </Layout>
      <PublishSettingsDrawer
        channelName={channelName}
        currentWork={currentWork}
        loading={
          saving ||
          updateTemplateMutation.isPending ||
          createChannelMutation.isPending ||
          deleteChannelMutation.isPending
        }
        open={settingsDrawerOpen}
        previewMode={settingsPreviewMode}
        saveStatus={saveStatus}
        templateSettings={templateSettings}
        value={workMeta}
        onCancel={() => setSettingsDrawerOpen(false)}
        onChannelNameChange={setChannelName}
        onCreateChannel={handleCreateChannel}
        onDeleteChannel={handleDeleteChannel}
        onPreviewModeChange={setSettingsPreviewMode}
        onPublish={handlePublish}
        onPublishTemplate={handlePublishTemplate}
        onSave={handleSave}
        onTemplateSettingsChange={setTemplateSettings}
        onValueChange={(nextValue) => {
          setSettingsPreviewMode('share')
          setWorkMeta(nextValue)
        }}
      />
      <PublishResultModal
        channels={currentWork?.channels ?? []}
        open={publishResultOpen}
        workUuid={currentWork?.uuid ?? workId ?? ''}
        onCancel={() => setPublishResultOpen(false)}
        onChannelNameChange={setChannelName}
        onCreateChannel={handleCreateChannel}
        onDeleteChannel={handleDeleteChannel}
        channelName={channelName}
        loading={createChannelMutation.isPending || deleteChannelMutation.isPending}
      />
      <WorkMetaModal
        open={metaModalOpen}
        pendingSave={pendingSave}
        pendingPublish={pendingPublish}
        value={workMeta}
        onChange={setWorkMeta}
        onCancel={() => {
          setMetaModalOpen(false)
          setPendingSave(false)
          setPendingPublish(false)
        }}
        onOk={handleMetaModalOk}
      />
    </Content>
  )
}

interface WorkMetaModalProps {
  open: boolean
  pendingSave: boolean
  pendingPublish: boolean
  value: typeof defaultWorkMeta
  onCancel: () => void
  onChange: (value: typeof defaultWorkMeta) => void
  onOk: () => void
}

function WorkMetaModal({
  open,
  pendingSave,
  pendingPublish,
  value,
  onCancel,
  onChange,
  onOk,
}: WorkMetaModalProps) {
  return (
    <Modal
      title={pendingPublish ? '发布前完善作品信息' : '作品设置'}
      open={open}
      okText={
        pendingPublish ? '保存并发布' : pendingSave ? '保存作品' : '保存设置'
      }
      cancelText="取消"
      onCancel={onCancel}
      onOk={onOk}
    >
      <Form layout="vertical" className="work-meta-form">
        <Form.Item label="作品标题" required>
          <Input
            maxLength={60}
            showCount
            placeholder="请输入作品标题"
            value={value.title}
            onChange={(event) =>
              onChange({ ...value, title: event.target.value })
            }
          />
        </Form.Item>
        <Form.Item label="作品描述">
          <Input.TextArea
            autoSize={{ minRows: 3, maxRows: 5 }}
            maxLength={160}
            showCount
            placeholder="给运营和作品列表看的简短描述"
            value={value.desc}
            onChange={(event) =>
              onChange({ ...value, desc: event.target.value })
            }
          />
        </Form.Item>
        <Form.Item label="封面图片 URL">
          <Input
            allowClear
            placeholder="https://example.com/cover.png"
            value={value.coverImg}
            onChange={(event) =>
              onChange({ ...value, coverImg: event.target.value })
            }
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}

interface PublishSettingsDrawerProps {
  channelName: string
  currentWork: Work | null
  loading: boolean
  open: boolean
  previewMode: 'page' | 'share'
  saveStatus: SaveStatus
  templateSettings: typeof defaultTemplateSettings
  value: typeof defaultWorkMeta
  onCancel: () => void
  onChannelNameChange: (value: string) => void
  onCreateChannel: () => void
  onDeleteChannel: (channelId: string) => void
  onPreviewModeChange: (mode: 'page' | 'share') => void
  onPublish: () => void
  onPublishTemplate: () => void
  onSave: () => void
  onTemplateSettingsChange: (value: typeof defaultTemplateSettings) => void
  onValueChange: (value: typeof defaultWorkMeta) => void
}

function PublishSettingsDrawer({
  channelName,
  currentWork,
  loading,
  onCancel,
  onChannelNameChange,
  onCreateChannel,
  onDeleteChannel,
  onPreviewModeChange,
  onPublish,
  onPublishTemplate,
  onSave,
  onTemplateSettingsChange,
  onValueChange,
  open,
  previewMode,
  saveStatus,
  templateSettings,
  value,
}: PublishSettingsDrawerProps) {
  return (
    <Drawer
      className="publish-settings-drawer"
      open={open}
      title="预览和设置"
      width={390}
      extra={
        <Radio.Group
          optionType="button"
          size="small"
          value={previewMode}
          options={[
            { label: '页面', value: 'page' },
            { label: '分享', value: 'share' },
          ]}
          onChange={(event) => onPreviewModeChange(event.target.value)}
        />
      }
      onClose={onCancel}
    >
      <Space direction="vertical" size={16} className="publish-settings-stack">
        <section className="settings-section">
          <div className="settings-section-title">
            <Text strong>基本信息</Text>
            <Tag color={getSaveStatusMeta(saveStatus).color}>
              {getSaveStatusMeta(saveStatus).label}
            </Tag>
          </div>
          <Form layout="vertical" className="work-meta-form">
            <Form.Item label="作品标题" required>
              <Input
                maxLength={60}
                showCount
                placeholder="请输入作品标题"
                value={value.title}
                onChange={(event) =>
                  onValueChange({ ...value, title: event.target.value })
                }
              />
            </Form.Item>
            <Form.Item label="副标题 / 分享描述">
              <Input.TextArea
                autoSize={{ minRows: 3, maxRows: 5 }}
                maxLength={160}
                showCount
                placeholder="会用于作品列表和分享摘要"
                value={value.desc}
                onChange={(event) =>
                  onValueChange({ ...value, desc: event.target.value })
                }
              />
            </Form.Item>
            <Form.Item label="封面图片 URL">
              <Input
                allowClear
                placeholder="https://example.com/cover.png"
                value={value.coverImg}
                onChange={(event) =>
                  onValueChange({ ...value, coverImg: event.target.value })
                }
              />
            </Form.Item>
          </Form>
          <Button block loading={saveStatus === 'saving'} onClick={onSave}>
            保存
          </Button>
        </section>

        <section className="settings-section">
          <div className="settings-section-title">
            <Text strong>发布为作品</Text>
            <Text type="secondary">{currentWork ? '可管理渠道' : '保存后生成链接'}</Text>
          </div>
          <Button block type="primary" loading={loading} onClick={onPublish}>
            发布作品
          </Button>
          <ChannelManager
            channelName={channelName}
            channels={currentWork?.channels ?? []}
            disabled={!currentWork}
            workUuid={currentWork?.uuid ?? ''}
            onChannelNameChange={onChannelNameChange}
            onCreateChannel={onCreateChannel}
            onDeleteChannel={onDeleteChannel}
          />
        </section>

        <section className="settings-section">
          <div className="settings-section-title">
            <Text strong>发布为模板</Text>
            <Text type="secondary">模板链接稳定，无需渠道</Text>
          </div>
          <Form layout="vertical">
            <Form.Item label="模板标签">
              <Select
                mode="multiple"
                allowClear
                placeholder="选择模板标签"
                options={templateTagOptions}
                value={templateSettings.templateTags}
                onChange={(templateTags) =>
                  onTemplateSettingsChange({
                    ...templateSettings,
                    templateTags,
                  })
                }
              />
            </Form.Item>
            <Form.Item label="公开模板">
              <Switch
                checked={templateSettings.isPublic}
                checkedChildren="公开"
                unCheckedChildren="私有"
                onChange={(isPublic) =>
                  onTemplateSettingsChange({
                    ...templateSettings,
                    isPublic,
                  })
                }
              />
            </Form.Item>
          </Form>
          <Button block loading={loading} onClick={onPublishTemplate}>
            发布为模板
          </Button>
        </section>
      </Space>
    </Drawer>
  )
}

interface PublishResultModalProps {
  channelName: string
  channels: Work['channels']
  loading: boolean
  open: boolean
  workUuid: string
  onCancel: () => void
  onChannelNameChange: (value: string) => void
  onCreateChannel: () => void
  onDeleteChannel: (channelId: string) => void
}

function PublishResultModal({
  channelName,
  channels,
  loading,
  onCancel,
  onChannelNameChange,
  onCreateChannel,
  onDeleteChannel,
  open,
  workUuid,
}: PublishResultModalProps) {
  return (
    <Modal
      className="publish-result-modal"
      footer={null}
      open={open}
      title="发布成功"
      width={760}
      onCancel={onCancel}
    >
      <div className="publish-result-layout">
        <div className="publish-result-preview">
          <Text strong>作品链接</Text>
          <QRCode value={getWorkPublicUrl(workUuid)} size={132} />
          <Input
            readOnly
            value={getWorkPublicUrl(workUuid)}
            addonAfter={
              <Button
                size="small"
                type="link"
                onClick={() => copyText(getWorkPublicUrl(workUuid))}
              >
                复制
              </Button>
            }
          />
        </div>
        <ChannelManager
          channelName={channelName}
          channels={channels}
          disabled={!workUuid}
          loading={loading}
          workUuid={workUuid}
          onChannelNameChange={onChannelNameChange}
          onCreateChannel={onCreateChannel}
          onDeleteChannel={onDeleteChannel}
        />
      </div>
    </Modal>
  )
}

interface ChannelManagerProps {
  channelName: string
  channels: Work['channels']
  disabled?: boolean
  loading?: boolean
  workUuid: string
  onChannelNameChange: (value: string) => void
  onCreateChannel: () => void
  onDeleteChannel: (channelId: string) => void
}

function ChannelManager({
  channelName,
  channels,
  disabled = false,
  loading = false,
  onChannelNameChange,
  onCreateChannel,
  onDeleteChannel,
  workUuid,
}: ChannelManagerProps) {
  return (
    <div className="channel-manager">
      {channels.map((channel) => {
        const link = getChannelPublicUrl(workUuid, channel.id)
        const deletable = channels.length > 1

        return (
          <div className="channel-row" key={channel.id}>
            <QRCode value={link} size={68} />
            <div className="channel-row-main">
              <div className="channel-row-title">
                <Text strong>{channel.name}</Text>
                <Button size="small" type="link" onClick={() => copyText(link)}>
                  复制链接
                </Button>
                <Button
                  danger
                  disabled={!deletable}
                  size="small"
                  type="link"
                  onClick={() => onDeleteChannel(channel.id)}
                >
                  删除渠道
                </Button>
              </div>
              <Input readOnly value={link} />
            </div>
          </div>
        )
      })}
      <Space.Compact className="channel-create-row">
        <Input
          disabled={disabled}
          placeholder="输入渠道名称"
          value={channelName}
          onChange={(event) => onChannelNameChange(event.target.value)}
          onPressEnter={onCreateChannel}
        />
        <Button disabled={disabled} loading={loading} onClick={onCreateChannel}>
          创建新渠道
        </Button>
      </Space.Compact>
    </div>
  )
}

function SharePreviewCard({ value }: { value: typeof defaultWorkMeta }) {
  return (
    <div className="share-preview-wrap">
      <div className="share-preview-card">
        <div className="share-preview-cover">
          {value.coverImg ? <img src={value.coverImg} alt={value.title} /> : null}
          {!value.coverImg ? <Share2 size={34} /> : null}
        </div>
        <div className="share-preview-content">
          <Text strong>{value.title || '分享标题'}</Text>
          <Text type="secondary">{value.desc || '分享副标题会显示在这里'}</Text>
        </div>
      </div>
    </div>
  )
}

interface PanelTitleProps {
  title: string
  description: string
}

function PanelTitle({ title, description }: PanelTitleProps) {
  return (
    <div className="panel-title">
      <Text strong>{title}</Text>
      <Text type="secondary">{description}</Text>
    </div>
  )
}

interface HistoryStackProps {
  title: string
  records: HistoryRecord[]
}

function HistoryStack({ title, records }: HistoryStackProps) {
  return (
    <div className="history-stack">
      <Text type="secondary" className="history-stack-title">
        {title} ({records.length})
      </Text>
      <div className="history-stack-items">
        {records.length === 0 ? (
          <span className="history-empty">空</span>
        ) : (
          records.map((record, index) => (
            <div className="history-item" key={record.id}>
              <span className="history-item-index">#{index + 1}</span>
              <span className="history-item-meta">
                {record.label}
              </span>
              <span className="history-item-status">
                {getHistoryPatchCount(record)} 项
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function getHistoryPatchCount(record: HistoryRecord) {
  return record.patches.reduce((count, patch) => {
    if (patch.kind === 'component-prop') {
      return count + 1
    }

    return count + 1
  }, 0)
}

interface TemplateListProps {
  onAddComponent: (template: ComponentTemplate) => void
  onUploaded: (asset: UploadedAsset) => void
  showUpload?: boolean
  templateNames: ComponentName[]
}

function TemplateList({
  onAddComponent,
  onUploaded,
  showUpload = false,
  templateNames,
}: TemplateListProps) {
  const templates = componentTemplates.filter((template) =>
    templateNames.includes(template.name),
  )

  return (
    <Space orientation="vertical" size={10} className="template-list">
      {templates.map((template) => (
        <button
          className="template-card"
          key={template.name}
          type="button"
          onClick={() => onAddComponent(template)}
        >
          <span className="template-name">{template.label}</span>
          <span className="template-desc">{template.description}</span>
        </button>
      ))}
      {showUpload ? <ImageUploadEntry onUploaded={onUploaded} /> : null}
    </Space>
  )
}

interface ImageUploadEntryProps {
  onUploaded: (asset: UploadedAsset) => void
}

function ImageUploadEntry({ onUploaded }: ImageUploadEntryProps) {
  const uploadProps: UploadProps = {
    accept: 'image/*',
    maxCount: 1,
    showUploadList: false,
    beforeUpload: (file) => {
      if (!file.type.startsWith('image/')) {
        message.error('请选择图片文件')
        return Upload.LIST_IGNORE
      }

      return true
    },
    customRequest: async ({ file, onError, onSuccess }) => {
      try {
        const asset = await uploadImage(file as File)

        onUploaded(asset)
        message.success('图片上传成功')
        onSuccess?.(asset)
      } catch (error) {
        message.error('图片上传失败')
        onError?.(error as Error)
      }
    },
  }

  return (
    <Upload {...uploadProps}>
      <button className="template-card upload-card" type="button">
        <span className="template-name">上传图片</span>
        <span className="template-desc">选择本地图片并添加到画布</span>
      </button>
    </Upload>
  )
}

interface CanvasElementProps {
  active: boolean
  canvasZoom: number
  component: ComponentData
  layerIndex: number
  onCommitPosition: (rect: { left: number; top: number }) => void
  onCommitRect: (rect: ComponentRect) => void
  onRemove: () => void
  onSelect: () => void
  onUpdateRect: (rect: ComponentRect) => void
  onUpdatePosition: (left: number, top: number) => void
}

interface ComponentRect {
  left: number
  top: number
  width: number
  height: number
}

interface DragState {
  pointerId: number
  startClientX: number
  startClientY: number
  startLeft: number
  startTop: number
  maxLeft: number
  maxTop: number
}

type ResizeDirection = 'nw' | 'ne' | 'sw' | 'se'

interface ResizeState {
  direction: ResizeDirection
  pointerId: number
  startClientX: number
  startClientY: number
  startLeft: number
  startTop: number
  startWidth: number
  startHeight: number
  pageWidth: number
  pageHeight: number
  minWidth: number
  minHeight: number
  zoom: number
}

const resizeHandles: Array<{ direction: ResizeDirection; label: string }> = [
  { direction: 'nw', label: '左上角调整大小' },
  { direction: 'ne', label: '右上角调整大小' },
  { direction: 'sw', label: '左下角调整大小' },
  { direction: 'se', label: '右下角调整大小' },
]

function CanvasElement({
  active,
  canvasZoom,
  component,
  layerIndex,
  onCommitPosition,
  onCommitRect,
  onRemove,
  onSelect,
  onUpdateRect,
  onUpdatePosition,
}: CanvasElementProps) {
  const meta = componentRegistry[component.name]
  const Component = meta.component
  const props = component.props
  const locked = Boolean(component.isLocked)
  const dragStateRef = useRef<DragState | null>(null)
  const resizeStateRef = useRef<ResizeState | null>(null)
  const [dragging, setDragging] = useState(false)
  const [resizing, setResizing] = useState(false)

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.stopPropagation()

    if (locked || event.button !== 0) {
      return
    }

    if ((event.target as HTMLElement).closest('.element-actions')) {
      return
    }

    const element = event.currentTarget
    const pageCanvas = element.parentElement
    if (!pageCanvas) {
      onSelect()
      return
    }

    const elementRect = element.getBoundingClientRect()
    const pageCanvasRect = pageCanvas.getBoundingClientRect()

    dragStateRef.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startLeft: Number(props.left),
      startTop: Number(props.top),
      maxLeft: Math.max(
        0,
        Math.floor(
          (pageCanvasRect.width - elementRect.width) / canvasZoom,
        ),
      ),
      maxTop: Math.max(
        0,
        Math.floor(
          (pageCanvasRect.height - elementRect.height) / canvasZoom,
        ),
      ),
    }

    element.setPointerCapture(event.pointerId)
    setDragging(true)
    onSelect()
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return
    }

    event.preventDefault()
    const nextLeft = clamp(
      Math.round(
        dragState.startLeft +
          (event.clientX - dragState.startClientX) / canvasZoom,
      ),
      0,
      dragState.maxLeft,
    )
    const nextTop = clamp(
      Math.round(
        dragState.startTop +
          (event.clientY - dragState.startClientY) / canvasZoom,
      ),
      0,
      dragState.maxTop,
    )

    onUpdatePosition(nextLeft, nextTop)
  }

  const stopDragging = (event: ReactPointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    onCommitPosition({
      left: dragState.startLeft,
      top: dragState.startTop,
    })
    dragStateRef.current = null
    setDragging(false)
  }

  const handleResizePointerDown =
    (direction: ResizeDirection) =>
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      event.preventDefault()
      event.stopPropagation()

      if (locked || event.button !== 0) {
        return
      }

      const element = event.currentTarget.closest(
        '.canvas-element',
      ) as HTMLDivElement | null
      const pageCanvas = element?.parentElement
      if (!element || !pageCanvas) {
        return
      }

      const pageCanvasRect = pageCanvas.getBoundingClientRect()

      resizeStateRef.current = {
        direction,
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startLeft: Number(props.left),
        startTop: Number(props.top),
        startWidth: Number(props.width),
        startHeight: Number(props.height),
        pageWidth: Math.floor(pageCanvasRect.width / canvasZoom),
        pageHeight: Math.floor(pageCanvasRect.height / canvasZoom),
        minWidth: 40,
        minHeight: 20,
        zoom: canvasZoom,
      }

      const resizeHandle = event.currentTarget
      const resizePointerId = event.pointerId
      const handleDocumentPointerMove = (moveEvent: globalThis.PointerEvent) => {
        const resizeState = resizeStateRef.current
        if (!resizeState || resizeState.pointerId !== moveEvent.pointerId) {
          return
        }

        moveEvent.preventDefault()
        const nextRect = calculateResizeRect(
          resizeState,
          moveEvent.clientX,
          moveEvent.clientY,
        )

        onUpdateRect(nextRect)
      }
      const stopDocumentResize = (endEvent: globalThis.PointerEvent) => {
        const resizeState = resizeStateRef.current
        if (!resizeState || resizeState.pointerId !== endEvent.pointerId) {
          return
        }

        document.removeEventListener('pointermove', handleDocumentPointerMove)
        document.removeEventListener('pointerup', stopDocumentResize)
        document.removeEventListener('pointercancel', stopDocumentResize)

        if (resizeHandle.hasPointerCapture(resizePointerId)) {
          resizeHandle.releasePointerCapture(resizePointerId)
        }
        onCommitRect({
          left: resizeState.startLeft,
          top: resizeState.startTop,
          width: resizeState.startWidth,
          height: resizeState.startHeight,
        })
        resizeStateRef.current = null
        setResizing(false)
      }

      document.addEventListener('pointermove', handleDocumentPointerMove)
      document.addEventListener('pointerup', stopDocumentResize)
      document.addEventListener('pointercancel', stopDocumentResize)
      resizeHandle.setPointerCapture(resizePointerId)
      setResizing(true)
      onSelect()
    }

  return (
    <div
      className={[
        'canvas-element',
        active ? 'is-active' : '',
        dragging ? 'is-dragging' : '',
        resizing ? 'is-resizing' : '',
        locked ? 'is-locked' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        left: Number(props.left),
        top: Number(props.top),
        width: Number(props.width),
        height: Number(props.height),
        zIndex: layerIndex + 1,
      }}
      role="button"
      tabIndex={0}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={stopDragging}
      onPointerCancel={stopDragging}
      onClick={(event) => {
        event.stopPropagation()
        if (locked) {
          return
        }
        onSelect()
      }}
      onKeyDown={(event) => {
        if (locked) {
          return
        }
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect()
        }
      }}
    >
      <Component {...props} />
      {active && !locked ? (
        <>
          <Tooltip title="删除组件">
            <Button
              aria-label="删除组件"
              className="canvas-delete-button"
              danger
              icon={<Trash2 size={14} />}
              shape="circle"
              size="small"
              type="primary"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation()
                onRemove()
              }}
            />
          </Tooltip>
          {resizeHandles.map(({ direction, label }) => (
            <button
              aria-label={label}
              className={`resize-handle resize-handle-${direction}`}
              key={direction}
              type="button"
              onClick={(event) => event.stopPropagation()}
              onPointerDown={handleResizePointerDown(direction)}
            />
          ))}
        </>
      ) : null}
    </div>
  )
}

function calculateResizeRect(
  state: ResizeState,
  clientX: number,
  clientY: number,
): ComponentRect {
  const deltaX = Math.round((clientX - state.startClientX) / state.zoom)
  const deltaY = Math.round((clientY - state.startClientY) / state.zoom)
  const movesLeft = state.direction.includes('w')
  const movesTop = state.direction.includes('n')
  const maxWidth = movesLeft
    ? state.startLeft + state.startWidth
    : state.pageWidth - state.startLeft
  const maxHeight = movesTop
    ? state.startTop + state.startHeight
    : state.pageHeight - state.startTop
  const rawWidth = movesLeft
    ? state.startWidth - deltaX
    : state.startWidth + deltaX
  const rawHeight = movesTop
    ? state.startHeight - deltaY
    : state.startHeight + deltaY
  const width = clamp(rawWidth, state.minWidth, maxWidth)
  const height = clamp(rawHeight, state.minHeight, maxHeight)
  const left = movesLeft
    ? clamp(
        state.startLeft + state.startWidth - width,
        0,
        state.pageWidth - width,
      )
    : state.startLeft
  const top = movesTop
    ? clamp(
        state.startTop + state.startHeight - height,
        0,
        state.pageHeight - height,
      )
    : state.startTop

  return {
    left: Math.round(left),
    top: Math.round(top),
    width: Math.round(width),
    height: Math.round(height),
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function getPageCanvasStyle(pageSetting: PageSetting): CSSProperties {
  return {
    height: pageSetting.height,
    backgroundColor: pageSetting.backgroundColor,
    backgroundImage: pageSetting.backgroundImage
      ? `url(${pageSetting.backgroundImage})`
      : undefined,
    backgroundRepeat: pageSetting.backgroundRepeat,
    backgroundSize: pageSetting.backgroundSize,
    backgroundPosition: 'center',
  }
}

function getPageCanvasViewportStyle(
  pageSetting: PageSetting,
  canvasZoom: number,
): CSSProperties {
  return {
    width: 375 * canvasZoom,
    height: pageSetting.height * canvasZoom,
    ['--canvas-zoom' as string]: canvasZoom,
  }
}

function showPublishSuccessMessage(publicUrl: string) {
  const copyPublicUrl = () => {
    copyText(publicUrl)
  }

  message.success({
    content: (
      <Space size={8}>
        <span>作品发布成功</span>
        <Button
          icon={<Copy size={13} />}
          size="small"
          type="link"
          onClick={copyPublicUrl}
        >
          复制链接
        </Button>
        <Button
          icon={<ExternalLink size={13} />}
          size="small"
          type="link"
          onClick={() => window.open(publicUrl, '_blank', 'noopener,noreferrer')}
        >
          打开
        </Button>
      </Space>
    ),
    duration: 8,
  })
}

function getWorkPublicUrl(workUuid: string) {
  return workUuid ? `${h5BaseUrl}/p/${workUuid}` : ''
}

function getChannelPublicUrl(workUuid: string, channelId: string) {
  return workUuid && channelId
    ? `${getWorkPublicUrl(workUuid)}?channel=${channelId}`
    : ''
}

function copyText(text: string) {
  if (!text) {
    return
  }

  if (!navigator.clipboard) {
    message.info(text)
    return
  }

  void navigator.clipboard
    .writeText(text)
    .then(() => message.success('链接已复制'))
    .catch(() => message.warning('复制失败，请手动复制链接'))
}

function createWorkContent(
  components: ComponentData[],
  pageSetting: PageSetting,
): WorkContent {
  return {
    components: components.map(cloneWorkComponent),
    props: { ...pageSetting },
  }
}

function cloneWorkComponent(component: ComponentData): ComponentData {
  const clonedComponent: ComponentData = {
    ...component,
    props: { ...component.props },
  }

  if (component.events) {
    clonedComponent.events = {
      ...(component.events.click
        ? { click: component.events.click.map((event) => ({ ...event })) }
        : {}),
    }
  }

  return clonedComponent
}

function normalizeWorkMeta(meta: typeof defaultWorkMeta) {
  return {
    title: meta.title.trim(),
    desc: meta.desc.trim(),
    coverImg: meta.coverImg.trim(),
  }
}

async function createWorkMetaWithCover(
  meta: typeof defaultWorkMeta,
  pageCanvasElement: HTMLElement | null,
) {
  const normalizedMeta = normalizeWorkMeta(meta)

  if (normalizedMeta.coverImg) {
    return normalizedMeta
  }

  try {
    const coverImg = await generateCoverImage(pageCanvasElement)
    return {
      ...normalizedMeta,
      coverImg,
    }
  } catch (error) {
    console.warn('Failed to generate work cover image.', error)
    message.warning('封面自动生成失败，本次将不保存封面')
    return normalizedMeta
  }
}

const legacyDefaultWorkTitle = '未命名作品'

function hasMeaningfulWorkTitle(title: string) {
  const normalizedTitle = title.trim()
  return Boolean(normalizedTitle) && normalizedTitle !== legacyDefaultWorkTitle
}

function createWorkSnapshot(
  meta: ReturnType<typeof normalizeWorkMeta>,
  content: WorkContent,
) {
  return JSON.stringify({
    meta: normalizeWorkMeta(meta),
    content,
  })
}

function getSaveStatusMeta(status: SaveStatus) {
  const statusMap: Record<SaveStatus, { color: string; label: string }> = {
    idle: { color: 'default', label: '新作品' },
    dirty: { color: 'gold', label: '未保存' },
    saving: { color: 'processing', label: '保存中' },
    saved: { color: 'green', label: '已保存' },
    publishing: { color: 'processing', label: '发布中' },
    published: { color: 'blue', label: '发布成功' },
    error: { color: 'red', label: '保存失败' },
  }

  return statusMap[status]
}

function formatSaveTime(value: string) {
  return `最近保存 ${new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))}`
}

interface SettingsPanelProps {
  component: ComponentData
  onChange: (propKey: string, value: unknown) => void
  onEventChange: (eventType: 'track' | 'link', value: string) => void
}

interface RightSettingsTabsProps {
  activeComponent: ComponentData | null
  components: ComponentData[]
  currentElement: string | null
  pageSetting: PageSetting
  onChange: (propKey: string, value: unknown) => void
  onEventChange: (eventType: 'track' | 'link', value: string) => void
  onRemove: (id: string) => void
  onReorder: (
    orderedIds: string[],
    options?: { syncCanvasTop?: boolean },
  ) => void
  onSelect: (id: string | null) => void
  onToggleHidden: (id: string) => void
  onToggleLocked: (id: string) => void
  onUpdateLayerName: (id: string, layerName: string) => void
  onUpdatePageSetting: <K extends keyof PageSetting>(
    key: K,
    value: PageSetting[K],
  ) => void
}

function RightSettingsTabs({
  activeComponent,
  components,
  currentElement,
  pageSetting,
  onChange,
  onEventChange,
  onRemove,
  onReorder,
  onSelect,
  onToggleHidden,
  onToggleLocked,
  onUpdateLayerName,
  onUpdatePageSetting,
}: RightSettingsTabsProps) {
  return (
    <Tabs
      className="settings-tabs"
      items={[
        {
          key: 'props',
          label: '组件属性',
          children: activeComponent ? (
            <SettingsPanel
              component={activeComponent}
              onChange={onChange}
              onEventChange={onEventChange}
            />
          ) : (
            <Empty
              description="请选择画布中的组件"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ),
        },
        {
          key: 'layers',
          label: '图层设置',
          children: (
            <LayerPanel
              components={components}
              currentElement={currentElement}
              onRemove={onRemove}
              onReorder={onReorder}
              onSelect={onSelect}
              onToggleHidden={onToggleHidden}
              onToggleLocked={onToggleLocked}
              onUpdateLayerName={onUpdateLayerName}
            />
          ),
        },
        {
          key: 'page',
          label: '页面设置',
          children: (
            <PageSettingsPanel
              pageSetting={pageSetting}
              onChange={onUpdatePageSetting}
            />
          ),
        },
      ]}
    />
  )
}

interface PageSettingsPanelProps {
  pageSetting: PageSetting
  onChange: <K extends keyof PageSetting>(
    key: K,
    value: PageSetting[K],
  ) => void
}

function PageSettingsPanel({ pageSetting, onChange }: PageSettingsPanelProps) {
  return (
    <Form layout="vertical" className="settings-form">
      <Form.Item label="背景颜色">
        <Space.Compact className="full-control">
          <Input
            type="color"
            value={pageSetting.backgroundColor}
            onChange={(event) =>
              onChange('backgroundColor', event.target.value)
            }
          />
          <Input
            value={pageSetting.backgroundColor}
            onChange={(event) =>
              onChange('backgroundColor', event.target.value)
            }
          />
        </Space.Compact>
        <div className="page-color-presets">
          {pageColorPresets.map((color) => (
            <button
              aria-label={`设置背景颜色 ${color}`}
              className="page-color-swatch"
              key={color}
              style={{ backgroundColor: color }}
              type="button"
              onClick={() => onChange('backgroundColor', color)}
            />
          ))}
        </div>
      </Form.Item>
      <Form.Item label="背景图片 URL">
        <Input
          allowClear
          placeholder="https://example.com/background.png"
          value={pageSetting.backgroundImage}
          onChange={(event) => onChange('backgroundImage', event.target.value)}
        />
      </Form.Item>
      <Form.Item label="背景重复">
        <Select
          value={pageSetting.backgroundRepeat}
          options={[
            { label: '无重复', value: 'no-repeat' },
            { label: '重复', value: 'repeat' },
            { label: '水平重复', value: 'repeat-x' },
            { label: '垂直重复', value: 'repeat-y' },
          ]}
          onChange={(value) => onChange('backgroundRepeat', value)}
        />
      </Form.Item>
      <Form.Item label="背景大小">
        <Select
          value={pageSetting.backgroundSize}
          options={[
            { label: '自动填充', value: 'cover' },
            { label: '完整显示', value: 'contain' },
            { label: '原始大小', value: 'auto' },
            { label: '拉伸填满', value: '100% 100%' },
          ]}
          onChange={(value) => onChange('backgroundSize', value)}
        />
      </Form.Item>
      <Form.Item label="页面高度">
        <InputNumber
          className="full-control"
          min={320}
          value={pageSetting.height}
          onChange={(value) => onChange('height', value ?? 320)}
        />
      </Form.Item>
    </Form>
  )
}

interface LayerPanelProps {
  components: ComponentData[]
  currentElement: string | null
  onRemove: (id: string) => void
  onReorder: (
    orderedIds: string[],
    options?: { syncCanvasTop?: boolean },
  ) => void
  onSelect: (id: string | null) => void
  onToggleHidden: (id: string) => void
  onToggleLocked: (id: string) => void
  onUpdateLayerName: (id: string, layerName: string) => void
}

function LayerPanel({
  components,
  currentElement,
  onRemove,
  onReorder,
  onSelect,
  onToggleHidden,
  onToggleLocked,
  onUpdateLayerName,
}: LayerPanelProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  if (components.length === 0) {
    return (
      <Empty description="暂无图层" image={Empty.PRESENTED_IMAGE_SIMPLE} />
    )
  }

  const layerItems = [...components].reverse()
  const layerIds = layerItems.map((component) => component.id)

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = layerIds.indexOf(String(active.id))
    const newIndex = layerIds.indexOf(String(over.id))

    if (oldIndex < 0 || newIndex < 0) {
      return
    }

    const nextLayerIds = arrayMove(layerIds, oldIndex, newIndex)
    onReorder([...nextLayerIds].reverse(), { syncCanvasTop: true })
  }

  return (
    <DndContext
      collisionDetection={closestCenter}
      sensors={sensors}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={layerIds}
        strategy={verticalListSortingStrategy}
      >
        <div className="layer-list">
          {layerItems.map((component) => (
            <SortableLayerItem
              component={component}
              currentElement={currentElement}
              key={component.id}
              onRemove={onRemove}
              onSelect={onSelect}
              onToggleHidden={onToggleHidden}
              onToggleLocked={onToggleLocked}
              onUpdateLayerName={onUpdateLayerName}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

interface SortableLayerItemProps {
  component: ComponentData
  currentElement: string | null
  onRemove: (id: string) => void
  onSelect: (id: string | null) => void
  onToggleHidden: (id: string) => void
  onToggleLocked: (id: string) => void
  onUpdateLayerName: (id: string, layerName: string) => void
}

function SortableLayerItem({
  component,
  currentElement,
  onRemove,
  onSelect,
  onToggleHidden,
  onToggleLocked,
  onUpdateLayerName,
}: SortableLayerItemProps) {
  const [editing, setEditing] = useState(false)
  const [draftName, setDraftName] = useState('')
  const editorRef = useRef<HTMLDivElement>(null)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: component.id })
  const meta = componentRegistry[component.name]
  const isActive = component.id === currentElement
  const label = getLayerLabel(component)
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  }
  const saveLayerName = useCallback(() => {
    onUpdateLayerName(component.id, draftName)
    setEditing(false)
  }, [component.id, draftName, onUpdateLayerName])
  const cancelLayerName = useCallback(() => {
    setDraftName(label)
    setEditing(false)
  }, [label])

  useKeyPress(
    'Enter',
    (event) => {
      event.preventDefault()
      saveLayerName()
    },
    editing,
  )
  useKeyPress(
    'Escape',
    (event) => {
      event.preventDefault()
      cancelLayerName()
    },
    editing,
  )
  useClickOutside(editorRef, saveLayerName, editing)

  return (
    <div
      className={[
        'layer-item',
        isActive ? 'is-active' : '',
        isDragging ? 'is-dragging' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onSelect(component.id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect(component.id)
        }
      }}
    >
      <Tooltip title={component.isHidden ? '显示图层' : '隐藏图层'}>
        <Button
          className="layer-icon-button"
          icon={
            component.isHidden ? <EyeOff size={15} /> : <Eye size={15} />
          }
          shape="circle"
          size="small"
          type="text"
          aria-label={component.isHidden ? '显示图层' : '隐藏图层'}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation()
            onToggleHidden(component.id)
          }}
        />
      </Tooltip>
      <Tooltip title={component.isLocked ? '解锁图层' : '锁定图层'}>
        <Button
          className="layer-icon-button"
          icon={component.isLocked ? <Lock size={15} /> : <Unlock size={15} />}
          shape="circle"
          size="small"
          type="text"
          aria-label={component.isLocked ? '解锁图层' : '锁定图层'}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation()
            onToggleLocked(component.id)
          }}
        />
      </Tooltip>
      <div className="layer-main">
        {editing ? (
          <div ref={editorRef}>
            <Input
              autoFocus
              size="small"
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              onClick={(event) => event.stopPropagation()}
              onPointerDown={(event) => event.stopPropagation()}
            />
          </div>
        ) : (
          <button
            className="layer-name-button"
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation()
              onSelect(component.id)
              setDraftName(label)
              setEditing(true)
            }}
          >
            {label}
          </button>
        )}
        <div className="layer-meta">
          {meta.label} / {component.name}
        </div>
      </div>
      <Tooltip title="删除图层">
        <Button
          className="layer-icon-button"
          danger
          icon={<Trash2 size={15} />}
          shape="circle"
          size="small"
          type="text"
          aria-label="删除图层"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation()
            onRemove(component.id)
          }}
        />
      </Tooltip>
      <Tooltip title="拖动排序">
        <button
          className="layer-drag-handle"
          type="button"
          aria-label={`拖动排序 ${label}`}
          onClick={(event) => event.stopPropagation()}
        >
          <GripVertical size={16} />
        </button>
      </Tooltip>
    </div>
  )
}

function getLayerLabel(component: ComponentData) {
  const meta = componentRegistry[component.name]

  return String(component.layerName || component.props.label || meta.label)
}

function SettingsPanel({
  component,
  onChange,
  onEventChange,
}: SettingsPanelProps) {
  const meta = componentRegistry[component.name]
  const trackEvent = component.events?.click?.find(
    (event) => event.type === 'track',
  )
  const linkEvent = component.events?.click?.find(
    (event) => event.type === 'link',
  )
  const groupedSchemas = groupPropSchemas(meta.propSchema)
  const collapseItems = propGroupOptions
    .map(({ key, label }) => {
      const schemas = groupedSchemas[key] ?? []

      if (schemas.length === 0 && key !== 'basic' && key !== 'event') {
        return null
      }

      if (key === 'basic') {
        return {
          key,
          label,
          children: (
            <>
              <Form.Item label="组件名称">
                <Input
                  value={component.props.label as string}
                  onChange={(event) => onChange('label', event.target.value)}
                />
              </Form.Item>
              {schemas.map((schema) => (
                <PropField
                  key={schema.field}
                  schema={schema}
                  value={component.props[schema.field]}
                  onChange={(value) => onChange(schema.field, value)}
                />
              ))}
            </>
          ),
        }
      }

      if (key === 'event') {
        return {
          key,
          label,
          children: (
            <>
              <Form.Item label="埋点事件名 eventName">
                <Input
                  placeholder="例如 button_click"
                  value={trackEvent?.eventName ?? ''}
                  onChange={(event) =>
                    onEventChange('track', event.target.value)
                  }
                />
              </Form.Item>
              <Form.Item label="跳转链接 url">
                <Input
                  placeholder="https://example.com"
                  value={linkEvent?.url ?? ''}
                  onChange={(event) => onEventChange('link', event.target.value)}
                />
              </Form.Item>
            </>
          ),
        }
      }

      return {
        key,
        label,
        children: schemas.map((schema) => (
          <PropField
            key={schema.field}
            schema={schema}
            value={component.props[schema.field]}
            onChange={(value) => onChange(schema.field, value)}
          />
        )),
      }
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))

  return (
    <Form layout="vertical" className="settings-form">
      <Collapse
        className="settings-collapse"
        defaultActiveKey={defaultActivePropGroups}
        items={collapseItems}
      />
    </Form>
  )
}

function groupPropSchemas(propSchemas: PropSchema[]) {
  return propSchemas.reduce(
    (groups, schema) => {
      const group = schema.group ?? 'basic'
      groups[group] = [...(groups[group] ?? []), schema]
      return groups
    },
    {} as Partial<Record<PropGroupKey, PropSchema[]>>,
  )
}

interface PropFieldProps {
  schema: PropSchema
  value: unknown
  onChange: (value: unknown) => void
}

function PropField({ schema, value, onChange }: PropFieldProps) {
  if (schema.component === 'InputNumber') {
    const inputNumberProps = {
      ...(schema.min === undefined ? {} : { min: schema.min }),
      ...(schema.max === undefined ? {} : { max: schema.max }),
    }

    return (
      <Form.Item label={schema.label}>
        <InputNumber
          {...inputNumberProps}
          value={Number(value)}
          className="full-control"
          onChange={(nextValue) => onChange(nextValue ?? 0)}
        />
      </Form.Item>
    )
  }

  if (schema.component === 'Select') {
    return (
      <Form.Item label={schema.label}>
        <Select
          value={value as string}
          options={schema.options ?? []}
          onChange={(nextValue) => onChange(nextValue)}
        />
      </Form.Item>
    )
  }

  if (schema.component === 'ButtonRadio') {
    return (
      <Form.Item label={schema.label}>
        <Radio.Group
          value={value as string}
          options={schema.options ?? []}
          optionType="button"
          buttonStyle="solid"
          className="full-control"
          onChange={(event) => onChange(event.target.value)}
        />
      </Form.Item>
    )
  }

  if (schema.component === 'Slider') {
    const sliderProps = {
      ...(schema.min === undefined ? {} : { min: schema.min }),
      ...(schema.max === undefined ? {} : { max: schema.max }),
      ...(schema.step === undefined ? {} : { step: schema.step }),
      ...(schema.marks === undefined ? {} : { marks: schema.marks }),
    }

    return (
      <Form.Item label={schema.label}>
        <Slider
          {...sliderProps}
          value={Number(value)}
          onChange={(nextValue) => onChange(nextValue)}
        />
      </Form.Item>
    )
  }

  if (schema.component === 'Radio') {
    return (
      <Form.Item label={schema.label}>
        <Radio.Group
          value={value as string}
          options={schema.options ?? []}
          onChange={(event) => onChange(event.target.value)}
        />
      </Form.Item>
    )
  }

  if (schema.component === 'Color') {
    return (
      <Form.Item label={schema.label}>
        <Input
          type="color"
          value={value as string}
          onChange={(event) => onChange(event.target.value)}
        />
      </Form.Item>
    )
  }

  if (schema.component === 'TextArea') {
    return (
      <Form.Item label={schema.label}>
        <Input.TextArea
          value={value as string}
          autoSize={{ minRows: 3, maxRows: 6 }}
          onChange={(event) => onChange(event.target.value)}
        />
      </Form.Item>
    )
  }

  return (
    <Form.Item label={schema.label}>
      <Input
        value={value as string}
        onChange={(event) => onChange(event.target.value)}
      />
    </Form.Item>
  )
}

export default EditorPage
