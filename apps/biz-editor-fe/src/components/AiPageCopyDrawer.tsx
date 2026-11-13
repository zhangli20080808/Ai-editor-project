import { Alert, Button, Drawer, Empty, Input, Modal, Select, Space, Tabs, Tag, Typography, message } from 'antd'
import { Check, Sparkles, StopCircle } from 'lucide-react'
import { useRef, useState } from 'react'

import {
  streamAiPageCopyOptimization,
  type AiPageCopyObjective,
  type AiPageCopyOptimization,
} from '../api/ai'
import type { ComponentData, PageSetting } from '../editor/types'
import { AiPageAuditPanel } from './AiPageAuditPanel'

const { Paragraph, Text, Title } = Typography

const objectiveOptions: Array<{ label: string; value: AiPageCopyObjective }> = [
  { label: '统一品牌表达', value: 'brand' },
  { label: '增强转化节奏', value: 'conversion' },
  { label: '整页精简', value: 'concise' },
  { label: '自定义目标', value: 'custom' },
]

interface AiPageCopyDrawerProps {
  components: ComponentData[]
  open: boolean
  pageDescription: string
  pageSetting: PageSetting
  pageTitle: string
  onApplyAll: (updates: Array<{ id: string; text: string }>) => void
  onApplyOne: (id: string, text: string) => void
  onClose: () => void
  onLocateComponent: (id: string) => void
}

export function AiPageCopyDrawer({
  components,
  open,
  pageDescription,
  pageSetting,
  pageTitle,
  onApplyAll,
  onApplyOne,
  onClose,
  onLocateComponent,
}: AiPageCopyDrawerProps) {
  const [objective, setObjective] = useState<AiPageCopyObjective>('brand')
  const [instruction, setInstruction] = useState('')
  const [running, setRunning] = useState(false)
  const [status, setStatus] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [result, setResult] = useState<AiPageCopyOptimization | null>(null)
  const controllerRef = useRef<AbortController | null>(null)
  const editableComponents = components
    .filter((component) => !component.isHidden && ['l-text', 'l-button'].includes(component.name) && String(component.props.text ?? '').trim())
    .slice(0, 20)

  const startOptimization = async () => {
    if (objective === 'custom' && instruction.trim().length < 2) {
      message.warning('请描述整页文案的优化目标')
      return
    }
    if (editableComponents.length === 0) {
      message.warning('当前页面没有可优化的文本或按钮')
      return
    }
    const controller = new AbortController()
    controllerRef.current = controller
    setRunning(true)
    setStatus('正在提交整页文案')
    setErrorMessage('')
    setResult(null)
    try {
      await streamAiPageCopyOptimization({
        pageTitle: pageTitle || '未命名作品',
        ...(pageDescription ? { pageDescription } : {}),
        objective,
        ...(instruction.trim() ? { instruction: instruction.trim() } : {}),
        components: editableComponents.map((component) => ({
          id: component.id,
          componentType: component.name as 'l-text' | 'l-button',
          text: String(component.props.text),
          label: component.layerName || String(component.props.label || ''),
        })),
      }, ({ type, data }) => {
        if (type === 'status') setStatus(String(data.message ?? '正在优化整页文案'))
        if (type === 'page_suggestions') {
          setResult({
            summary: String(data.summary ?? '整页文案优化完成'),
            suggestions: Array.isArray(data.suggestions) ? data.suggestions as AiPageCopyOptimization['suggestions'] : [],
          })
        }
        if (type === 'error') {
          const nextMessage = String(data.message ?? '整页文案优化失败')
          setErrorMessage(nextMessage)
          message.error(nextMessage)
        }
      }, controller.signal)
    } catch (error) {
      if (!controller.signal.aborted) {
        const nextMessage = error instanceof Error ? error.message : '整页文案优化失败'
        setErrorMessage(nextMessage)
        message.error(nextMessage)
      }
    } finally {
      setRunning(false)
      setStatus('')
      controllerRef.current = null
    }
  }

  const pendingSuggestions = (result?.suggestions ?? []).filter((suggestion) => {
    const component = components.find((item) => item.id === suggestion.componentId)
    return component && String(component.props.text ?? '') !== suggestion.text
  })

  const applyAll = () => {
    if (!pendingSuggestions.length) return
    Modal.confirm({
      title: `应用 ${pendingSuggestions.length} 项整页优化？`,
      content: '只会替换对应组件的文案，不会自动保存或发布。应用后可通过一次撤销恢复整页。',
      okText: '全部应用',
      cancelText: '继续预览',
      onOk: () => {
        onApplyAll(pendingSuggestions.map((suggestion) => ({ id: suggestion.componentId, text: suggestion.text })))
        message.success('整页文案已应用，可使用撤销恢复')
      },
    })
  }

  const closeDrawer = () => {
    controllerRef.current?.abort()
    onClose()
  }

  const copyPanel = <div className="ai-page-copy-panel">
      <Paragraph type="secondary">读取当前页面文案，统一标题、卖点和 CTA 的表达。生成建议前后都不会自动保存。</Paragraph>
      <section className="ai-page-copy-config">
        <Text strong>优化目标</Text>
        <Select className="full-control" options={objectiveOptions} value={objective} onChange={setObjective} />
        <Input.TextArea
          maxLength={200}
          placeholder={objective === 'custom' ? '例如：更年轻、更克制，突出限量体验' : '补充品牌语气或必须保留的关键词（选填）'}
          rows={3}
          value={instruction}
          onChange={(event) => setInstruction(event.target.value)}
        />
        <Space wrap>
          <Button
            disabled={!editableComponents.length}
            icon={<Sparkles size={15} />}
            loading={running}
            type="primary"
            onClick={() => void startOptimization()}
          >分析 {editableComponents.length} 个组件</Button>
          {running ? <Button danger icon={<StopCircle size={15} />} onClick={() => controllerRef.current?.abort()}>停止</Button> : null}
        </Space>
        {status ? <Text className="ai-page-copy-status" type="secondary">{status}</Text> : null}
        {errorMessage ? <Alert className="ai-page-copy-error" message={errorMessage} type="error" showIcon /> : null}
      </section>

      {result ? <section className="ai-page-copy-result">
        <div className="ai-page-copy-summary">
          <div><Title level={5}>整页优化方案</Title><Paragraph>{result.summary}</Paragraph></div>
          <Button disabled={!pendingSuggestions.length} type="primary" onClick={applyAll}>一键应用 {pendingSuggestions.length} 项</Button>
        </div>
        {result.suggestions.length ? <div className="ai-page-copy-list">
          {result.suggestions.map((suggestion, index) => {
            const component = components.find((item) => item.id === suggestion.componentId)
            if (!component) return null
            const applied = String(component.props.text ?? '') === suggestion.text
            return <article className={`ai-page-copy-item${applied ? ' is-applied' : ''}`} key={suggestion.componentId}>
              <div className="ai-page-copy-item-head">
                <Space size={6}><Tag color={component.name === 'l-button' ? 'orange' : 'blue'}>{component.name === 'l-button' ? '按钮' : '文本'}</Tag><Text strong>{component.layerName || component.props.label || `文案 ${index + 1}`}</Text></Space>
                {applied ? <Tag color="green"><Check size={12} /> 已应用</Tag> : <Button size="small" onClick={() => {
                  onApplyOne(suggestion.componentId, suggestion.text)
                  message.success('该项文案已应用，可使用撤销恢复')
                }}>应用此项</Button>}
              </div>
              <div className="ai-page-copy-diff"><small>原文</small><p>{suggestion.originalText}</p></div>
              <div className="ai-page-copy-diff is-new"><small>建议</small><p>{suggestion.text}</p></div>
              <Text type="secondary">{suggestion.reason}</Text>
            </article>
          })}
        </div> : <Empty description="当前文案无需修改" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
      </section> : editableComponents.length === 0 ? <Alert message="当前页面没有可优化文案" type="info" showIcon /> : null}
    </div>

  return (
    <Drawer
      className="ai-page-copy-drawer"
      open={open}
      size={500}
      title={<Space><Sparkles size={18} /><span>AI 页面优化</span></Space>}
      onClose={closeDrawer}
    >
      <Tabs
        className="ai-page-optimization-tabs"
        items={[
          { key: 'copy', label: '整页文案', children: copyPanel },
          {
            key: 'audit',
            label: '页面体检',
            children: <AiPageAuditPanel
              components={components}
              open={open}
              pageDescription={pageDescription}
              pageSetting={pageSetting}
              pageTitle={pageTitle}
              onLocateComponent={onLocateComponent}
            />,
          },
        ]}
      />
    </Drawer>
  )
}
