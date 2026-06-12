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
import { Eye, EyeOff, GripVertical, Lock, Trash2, Unlock } from 'lucide-react'
import {
  Button,
  Collapse,
  Empty,
  Form,
  Input,
  InputNumber,
  Layout,
  Radio,
  Select,
  Slider,
  Space,
  Tabs,
  Tooltip,
  Typography,
  Upload,
  message,
} from 'antd'
import { useCallback, useRef, useState } from 'react'
import type { UploadProps } from 'antd'
import type {
  ComponentData,
  PageSetting,
  PropGroupKey,
  PropSchema,
} from './editor/types'
import {
  componentRegistry,
  componentTemplates,
} from './editor/componentRegistry'
import { useEditorStore } from './editor/editorStore'
import { useClickOutside } from './hooks/useClickOutside'
import { useEditorHotkeys } from './hooks/useEditorHotkeys'
import { useKeyPress } from './hooks/useKeyPress'
import { uploadImage } from './editor/uploadService'
import type { UploadedAsset } from './editor/uploadService'
import './App.css'

const { Header, Content, Sider } = Layout
const { Title, Text } = Typography
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

function App() {
  useEditorHotkeys()

  const components = useEditorStore((state) => state.components)
  const currentElement = useEditorStore((state) => state.currentElement)
  const pageSetting = useEditorStore((state) => state.pageSetting)
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
  const updateComponentRect = useEditorStore(
    (state) => state.updateComponentRect,
  )
  const updateClickEvent = useEditorStore((state) => state.updateClickEvent)
  const updatePageSetting = useEditorStore((state) => state.updatePageSetting)

  const activeComponent =
    components.find((component) => component.id === currentElement) ?? null

  return (
    <Layout className="app-shell">
      <Header className="app-header">
        <Title level={4} className="app-title">
          Ai Editor
        </Title>
        <Space>
          <Button type="text">作品</Button>
          <Button type="text">模板</Button>
          <Button type="primary">创建作品</Button>
        </Space>
      </Header>
      <Content className="app-content">
        <Layout className="editor-shell">
          <Sider width={260} className="editor-sider">
            <PanelTitle title="组件模板库" description="点击添加到画布" />
            <Space orientation="vertical" size={12} className="template-list">
              {componentTemplates.map((template) => (
                <button
                  className="template-card"
                  key={template.name}
                  type="button"
                  onClick={() => addComponent(template)}
                >
                  <span className="template-name">{template.label}</span>
                  <span className="template-desc">{template.description}</span>
                </button>
              ))}
              <ImageUploadEntry onUploaded={addUploadedImage} />
            </Space>
          </Sider>

          <Content className="canvas-region">
            <div className="canvas-toolbar">
              <div>
                <Text strong>画布</Text>
                <Text type="secondary" className="muted-text">
                  使用交互手段更新元素值
                </Text>
              </div>
              <Text type="secondary">{components.length} 个组件</Text>
            </div>
            <div
              className="canvas-stage"
              role="presentation"
              onClick={() => selectComponent(null)}
            >
              <div
                className="page-canvas"
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
                        component={component}
                        key={component.id}
                        layerIndex={index}
                        onRemove={() => removeComponent(component.id)}
                        onSelect={() => selectComponent(component.id)}
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
        </Layout>
      </Content>
    </Layout>
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
  component: ComponentData
  layerIndex: number
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
}

const resizeHandles: Array<{ direction: ResizeDirection; label: string }> = [
  { direction: 'nw', label: '左上角调整大小' },
  { direction: 'ne', label: '右上角调整大小' },
  { direction: 'sw', label: '左下角调整大小' },
  { direction: 'se', label: '右下角调整大小' },
]

function CanvasElement({
  active,
  component,
  layerIndex,
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
        Math.floor(pageCanvasRect.width - elementRect.width),
      ),
      maxTop: Math.max(
        0,
        Math.floor(pageCanvasRect.height - elementRect.height),
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
      Math.round(dragState.startLeft + event.clientX - dragState.startClientX),
      0,
      dragState.maxLeft,
    )
    const nextTop = clamp(
      Math.round(dragState.startTop + event.clientY - dragState.startClientY),
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
        pageWidth: Math.floor(pageCanvasRect.width),
        pageHeight: Math.floor(pageCanvasRect.height),
        minWidth: 40,
        minHeight: 20,
      }

      const resizePointerId = event.pointerId
      const handleDocumentPointerMove = (moveEvent: globalThis.PointerEvent) => {
        const resizeState = resizeStateRef.current
        if (!resizeState || resizeState.pointerId !== moveEvent.pointerId) {
          return
        }

        moveEvent.preventDefault()
        onUpdateRect(
          calculateResizeRect(
            resizeState,
            moveEvent.clientX,
            moveEvent.clientY,
          ),
        )
      }
      const stopDocumentResize = (endEvent: globalThis.PointerEvent) => {
        const resizeState = resizeStateRef.current
        if (!resizeState || resizeState.pointerId !== endEvent.pointerId) {
          return
        }

        document.removeEventListener('pointermove', handleDocumentPointerMove)
        document.removeEventListener('pointerup', stopDocumentResize)
        document.removeEventListener('pointercancel', stopDocumentResize)

        if (event.currentTarget.hasPointerCapture(resizePointerId)) {
          event.currentTarget.releasePointerCapture(resizePointerId)
        }
        resizeStateRef.current = null
        setResizing(false)
      }

      document.addEventListener('pointermove', handleDocumentPointerMove)
      document.addEventListener('pointerup', stopDocumentResize)
      document.addEventListener('pointercancel', stopDocumentResize)
      event.currentTarget.setPointerCapture(resizePointerId)
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
  const deltaX = Math.round(clientX - state.startClientX)
  const deltaY = Math.round(clientY - state.startClientY)
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

export default App
