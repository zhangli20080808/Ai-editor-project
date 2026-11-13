import { Button, Input, Select, Space, Tag, Typography, message } from 'antd'
import { Check, Sparkles, StopCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import {
  streamAiCopySuggestions,
  type AiCopyMode,
  type AiCopySuggestion,
} from '../api/ai'
import type { ComponentData } from '../editor/types'

const { Paragraph, Text } = Typography

const modeOptions: Array<{ label: string; value: AiCopyMode }> = [
  { label: '润色表达', value: 'polish' },
  { label: '缩短文案', value: 'shorten' },
  { label: '增强行动感', value: 'action' },
  { label: '切换语气', value: 'tone' },
  { label: '自定义', value: 'custom' },
]

interface AiCopyAssistantProps {
  component: ComponentData
  pageTitle: string
  onApply: (text: string) => void
}

export function AiCopyAssistant({ component, pageTitle, onApply }: AiCopyAssistantProps) {
  const [mode, setMode] = useState<AiCopyMode>('polish')
  const [instruction, setInstruction] = useState('')
  const [running, setRunning] = useState(false)
  const [status, setStatus] = useState('')
  const [suggestions, setSuggestions] = useState<AiCopySuggestion[]>([])
  const controllerRef = useRef<AbortController | null>(null)
  const currentText = String(component.props.text ?? '')

  useEffect(() => () => controllerRef.current?.abort(), [component.id])

  const generateSuggestions = async () => {
    if (mode === 'custom' && instruction.trim().length < 2) {
      message.warning('请描述希望如何修改这段文案')
      return
    }
    const controller = new AbortController()
    controllerRef.current = controller
    setRunning(true)
    setStatus('正在提交当前文案')
    setSuggestions([])
    try {
      await streamAiCopySuggestions({
        componentType: component.name as 'l-text' | 'l-button',
        text: currentText,
        mode,
        pageTitle,
        ...(instruction.trim() ? { instruction: instruction.trim() } : {}),
      }, ({ type, data }) => {
        if (type === 'status') setStatus(String(data.message ?? '正在生成候选'))
        if (type === 'suggestions') {
          setSuggestions((data.suggestions as AiCopySuggestion[] | undefined) ?? [])
        }
        if (type === 'error') message.error(String(data.message ?? 'AI 文案生成失败'))
      }, controller.signal)
    } catch (error) {
      if (!controller.signal.aborted) {
        message.error(error instanceof Error ? error.message : 'AI 文案生成失败')
      }
    } finally {
      setRunning(false)
      setStatus('')
      controllerRef.current = null
    }
  }

  return (
    <section className="ai-copy-assistant">
      <div className="ai-copy-assistant-head">
        <div>
          <Text strong><Sparkles size={15} /> AI 文案助手</Text>
          <Text type="secondary">基于当前组件生成 3 个候选，可撤销。</Text>
        </div>
        <Tag color={component.name === 'l-button' ? 'orange' : 'blue'}>
          {component.name === 'l-button' ? '按钮' : '文本'}
        </Tag>
      </div>

      <Paragraph className="ai-copy-current" ellipsis={{ rows: 3 }}>
        {currentText}
      </Paragraph>
      <Select
        className="full-control"
        options={modeOptions}
        value={mode}
        onChange={setMode}
      />
      <Input.TextArea
        maxLength={200}
        placeholder={mode === 'custom' ? '例如：更年轻一些，保留“秋天”这个关键词' : '可补充要求，例如：语气更年轻（选填）'}
        rows={2}
        value={instruction}
        onChange={(event) => setInstruction(event.target.value)}
      />
      <Space className="ai-copy-actions">
        <Button
          icon={<Sparkles size={14} />}
          loading={running}
          type="primary"
          onClick={() => void generateSuggestions()}
        >生成 3 个候选</Button>
        {running ? <Button danger icon={<StopCircle size={14} />} onClick={() => controllerRef.current?.abort()}>停止</Button> : null}
      </Space>
      {status ? <Text className="ai-copy-status" type="secondary">{status}</Text> : null}

      {suggestions.length ? <div className="ai-copy-suggestions">
        {suggestions.map((suggestion, index) => {
          const applied = suggestion.text === currentText
          return (
            <button
              className={`ai-copy-suggestion${applied ? ' is-applied' : ''}`}
              key={`${suggestion.text}-${index}`}
              type="button"
              onClick={() => {
                onApply(suggestion.text)
                message.success('AI 文案已替换，可使用撤销恢复')
              }}
            >
              <span>{suggestion.text}</span>
              <small>{applied ? <><Check size={12} /> 已应用</> : suggestion.reason}</small>
            </button>
          )
        })}
      </div> : null}
    </section>
  )
}
