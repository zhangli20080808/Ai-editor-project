import { Alert, Button, Empty, Progress, Space, Tag, Typography, message } from 'antd'
import { LocateFixed, ScanSearch, StopCircle, Wrench } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { streamAiPageAudit, type AiAuditDimensionKey, type AiAuditSeverity, type AiPageAuditResult } from '../api/ai'
import type { ComponentData, PageSetting } from '../editor/types'

const { Paragraph, Text, Title } = Typography

const dimensionLabels: Record<AiAuditDimensionKey, string> = {
  brand: '品牌一致性',
  hierarchy: '信息层级',
  clarity: '文案清晰度',
  conversion: 'CTA 转化',
}

const severityMeta: Record<AiAuditSeverity, { label: string; color: string }> = {
  high: { label: '优先修复', color: 'error' },
  medium: { label: '建议优化', color: 'warning' },
  low: { label: '细节提升', color: 'processing' },
}

interface AiPageAuditPanelProps {
  components: ComponentData[]
  open: boolean
  pageDescription: string
  pageSetting: PageSetting
  pageTitle: string
  onLocateComponent: (id: string) => void
}

export function AiPageAuditPanel({
  components,
  open,
  pageDescription,
  pageSetting,
  pageTitle,
  onLocateComponent,
}: AiPageAuditPanelProps) {
  const [running, setRunning] = useState(false)
  const [status, setStatus] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [result, setResult] = useState<AiPageAuditResult | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const controllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!open) controllerRef.current?.abort()
  }, [open])

  useEffect(() => {
    if (!running) return
    const startedAt = Date.now()
    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [running])

  const visibleComponents = components.filter((component) => !component.isHidden).slice(0, 30)

  const startAudit = async () => {
    if (!visibleComponents.length) {
      message.warning('当前页面没有可体检的组件')
      return
    }
    const controller = new AbortController()
    controllerRef.current = controller
    setRunning(true)
    setElapsedSeconds(0)
    setStatus('正在提交页面结构')
    setErrorMessage('')
    setResult(null)
    try {
      await streamAiPageAudit({
        pageTitle: pageTitle || '未命名作品',
        ...(pageDescription ? { pageDescription } : {}),
        pageHeight: toNumber(pageSetting.height, 640),
        backgroundColor: pageSetting.backgroundColor || '#ffffff',
        components: visibleComponents.map((component) => ({
          id: component.id,
          componentType: component.name,
          label: component.layerName || String(component.props.label || ''),
          ...(component.name !== 'l-image' ? { text: String(component.props.text || '') } : {}),
          top: toNumber(component.props.top, 0),
          left: toNumber(component.props.left, 0),
          width: toNumber(component.props.width, 1),
          height: toNumber(component.props.height, 1),
          ...(['l-text', 'l-button'].includes(component.name)
            ? { fontSize: toNumber(component.props.fontSize, 14) }
            : {}),
          hasClickAction: Boolean(component.events?.click?.length),
        })),
      }, ({ type, data }) => {
        if (type === 'status') setStatus(String(data.message ?? '正在进行页面体检'))
        if (type === 'page_audit') setResult(data as unknown as AiPageAuditResult)
        if (type === 'error') {
          const nextMessage = String(data.message ?? '页面体检失败')
          setErrorMessage(nextMessage)
          message.error(nextMessage)
        }
      }, controller.signal)
    } catch (error) {
      if (!controller.signal.aborted) {
        const nextMessage = error instanceof Error ? error.message : '页面体检失败'
        setErrorMessage(nextMessage)
        message.error(nextMessage)
      }
    } finally {
      setRunning(false)
      setStatus('')
      controllerRef.current = null
    }
  }

  return <div className="ai-page-audit">
    <section className="ai-page-audit-intro">
      <div>
        <Text className="ai-page-audit-eyebrow">AI EXPERIENCE REVIEW</Text>
        <Title level={4}>让页面更清楚，也更会转化</Title>
        <Paragraph>仅分析组件文案和布局数据，不会发送图片地址，也不会修改或保存画布。</Paragraph>
      </div>
      <Space wrap>
        <Button icon={<ScanSearch size={16} />} loading={running} type="primary" onClick={() => void startAudit()}>
          {result ? '重新体检' : '开始页面体检'}
        </Button>
        {running ? <Button danger icon={<StopCircle size={15} />} onClick={() => controllerRef.current?.abort()}>停止</Button> : null}
      </Space>
      {running ? <Text className="ai-page-audit-status" type="secondary">{status} · {elapsedSeconds}s</Text> : null}
      {errorMessage ? <Alert message={errorMessage} type="error" showIcon /> : null}
    </section>

    {result ? <>
      <section className="ai-page-audit-score">
        <Progress
          percent={result.overallScore}
          size={122}
          strokeColor={{ '0%': '#ff8a58', '100%': '#1868db' }}
          type="circle"
          format={(percent) => <span><strong>{percent}</strong><small>综合评分</small></span>}
        />
        <div><Text type="secondary">本次诊断</Text><Title level={4}>{getScoreTitle(result.overallScore)}</Title><Paragraph>{result.summary}</Paragraph></div>
      </section>
      <section className="ai-page-audit-dimensions">
        {result.dimensions.map((dimension) => <article key={dimension.key}>
          <div><Text strong>{dimensionLabels[dimension.key]}</Text><strong>{dimension.score}</strong></div>
          <Progress percent={dimension.score} showInfo={false} strokeColor={getScoreColor(dimension.score)} />
          <Paragraph type="secondary">{dimension.summary}</Paragraph>
        </article>)}
      </section>
      <section className="ai-page-audit-issues">
        <div className="ai-page-audit-section-title"><Title level={5}>优先改进项</Title><Tag>{result.issues.length} 项</Tag></div>
        {result.issues.map((issue, index) => {
          const component = components.find((item) => item.id === issue.componentId)
          const actionLabel = component?.name === 'l-image' ? '定位组件' : '定位并修复'
          return <article className={`ai-page-audit-issue is-${issue.severity}`} key={`${issue.componentId}-${index}`}>
            <div className="ai-page-audit-issue-head">
              <Space size={6}><Tag color={severityMeta[issue.severity].color}>{severityMeta[issue.severity].label}</Tag>{component ? <Text type="secondary">{component.layerName || component.props.label || component.name}</Text> : <Text type="secondary">页面整体</Text>}</Space>
              {component ? <Button icon={component.name === 'l-image' ? <LocateFixed size={14} /> : <Wrench size={14} />} size="small" onClick={() => onLocateComponent(component.id)}>{actionLabel}</Button> : null}
            </div>
            <Title level={5}>{issue.title}</Title>
            <Paragraph>{issue.description}</Paragraph>
            <div className="ai-page-audit-suggestion"><Text strong>建议</Text><span>{issue.suggestion}</span></div>
          </article>
        })}
      </section>
    </> : !running && !errorMessage ? <Empty description="开始体检后，这里会展示评分和可定位的问题" image={Empty.PRESENTED_IMAGE_SIMPLE} /> : null}
  </div>
}

function toNumber(value: unknown, fallback: number) {
  const result = Number(value)
  return Number.isFinite(result) ? result : fallback
}

function getScoreColor(score: number) {
  return score >= 85 ? '#22a06b' : score >= 70 ? '#1868db' : '#ff7a45'
}

function getScoreTitle(score: number) {
  return score >= 85 ? '页面表现成熟' : score >= 70 ? '基础不错，仍可提升' : '建议优先调整关键路径'
}
