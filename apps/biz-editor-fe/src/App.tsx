import {
  Button,
  Empty,
  Form,
  Input,
  InputNumber,
  Layout,
  Radio,
  Select,
  Slider,
  Space,
  Typography,
} from 'antd'
import type { ComponentData, PropSchema } from './editor/types'
import {
  componentRegistry,
  componentTemplates,
} from './editor/componentRegistry'
import { useEditorStore } from './editor/editorStore'
import './App.css'

const { Header, Content, Sider } = Layout
const { Title, Text } = Typography

function App() {
  const components = useEditorStore((state) => state.components)
  const currentElement = useEditorStore((state) => state.currentElement)
  const addComponent = useEditorStore((state) => state.addComponent)
  const removeComponent = useEditorStore((state) => state.removeComponent)
  const selectComponent = useEditorStore((state) => state.selectComponent)
  const updateComponent = useEditorStore((state) => state.updateComponent)
  const updateClickEvent = useEditorStore((state) => state.updateClickEvent)

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
            <Space direction="vertical" size={12} className="template-list">
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
              {components.length === 0 ? (
                <Empty
                  description="从左侧添加一个组件"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ) : (
                components.map((component) => (
                  <CanvasElement
                    active={component.id === currentElement}
                    component={component}
                    key={component.id}
                    onRemove={() => removeComponent(component.id)}
                    onSelect={() => selectComponent(component.id)}
                    onUpdate={(propKey, value) =>
                      updateComponent(component.id, propKey, value)
                    }
                  />
                ))
              )}
            </div>
          </Content>

          <Sider width={320} className="editor-sider right-sider">
            <PanelTitle title="设置面板" description="使用表单修改元素值" />
            {activeComponent ? (
              <SettingsPanel
                component={activeComponent}
                onChange={(propKey, value) =>
                  updateComponent(activeComponent.id, propKey, value)
                }
                onEventChange={(eventType, value) =>
                  updateClickEvent(activeComponent.id, eventType, value)
                }
              />
            ) : (
              <Empty
                description="请选择画布中的组件"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
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

interface CanvasElementProps {
  active: boolean
  component: ComponentData
  onRemove: () => void
  onSelect: () => void
  onUpdate: (propKey: string, value: unknown) => void
}

function CanvasElement({
  active,
  component,
  onRemove,
  onSelect,
  onUpdate,
}: CanvasElementProps) {
  const meta = componentRegistry[component.name]
  const Component = meta.component
  const props = component.props

  return (
    <div
      className={active ? 'canvas-element is-active' : 'canvas-element'}
      style={{
        left: Number(props.left),
        top: Number(props.top),
        width: Number(props.width),
        minHeight: Number(props.height),
      }}
      role="button"
      tabIndex={0}
      onClick={(event) => {
        event.stopPropagation()
        onSelect()
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect()
        }
      }}
    >
      <Component {...props} />
      {active ? (
        <div className="element-actions">
          <Button
            danger
            size="small"
            type="primary"
            onClick={(event) => {
              event.stopPropagation()
              onRemove()
            }}
          >
            删除
          </Button>
          <Button
            size="small"
            onClick={(event) => {
              event.stopPropagation()
              onUpdate('top', Math.max(0, Number(props.top) - 8))
            }}
          >
            上移
          </Button>
          <Button
            size="small"
            onClick={(event) => {
              event.stopPropagation()
              onUpdate('top', Number(props.top) + 8)
            }}
          >
            下移
          </Button>
        </div>
      ) : null}
    </div>
  )
}

interface SettingsPanelProps {
  component: ComponentData
  onChange: (propKey: string, value: unknown) => void
  onEventChange: (eventType: 'track' | 'link', value: string) => void
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

  return (
    <Form layout="vertical" className="settings-form">
      <Form.Item label="组件名称">
        <Input
          value={component.props.label as string}
          onChange={(event) => onChange('label', event.target.value)}
        />
      </Form.Item>
      {meta.propSchema.map((schema) => (
        <PropField
          key={schema.field}
          schema={schema}
          value={component.props[schema.field]}
          onChange={(value) => onChange(schema.field, value)}
        />
      ))}
      <div className="settings-section-title">点击事件</div>
      <Form.Item label="埋点事件名 eventName">
        <Input
          placeholder="例如 button_click"
          value={trackEvent?.eventName ?? ''}
          onChange={(event) => onEventChange('track', event.target.value)}
        />
      </Form.Item>
      <Form.Item label="跳转链接 url">
        <Input
          placeholder="https://example.com"
          value={linkEvent?.url ?? ''}
          onChange={(event) => onEventChange('link', event.target.value)}
        />
      </Form.Item>
    </Form>
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
