import { Button, Divider, Drawer, Empty, Form, Input, List, Modal, Select, Space, Tag, Timeline, Typography, message } from 'antd'
import { Bot, Check, ChevronDown, ChevronUp, Clock3, History, RotateCcw, Sparkles, StopCircle, Wrench } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { getAiRun, streamAiPageDraft, useAiRunsQuery, type AiPageDraft, type AiPageScene, type AiRun, type CreateAiPageDraftPayload } from '../api/ai'
import type { WorkContent } from '../api/types'
import { H5PreviewRenderer } from './H5PreviewRenderer'

const { Paragraph, Text, Title } = Typography

const scenePresets = {
  brand: {
    label: '品牌宣传',
    description: '适合品牌焕新、门店开业和理念传播。',
    values: { topic: '山野生活方式品牌秋季焕新', audience: '关注自然、设计与品质生活的年轻用户', goal: '建立品牌认知，引导用户了解秋季新品系列', tone: '自然、克制、有呼吸感' },
  },
  product: {
    label: '商品种草',
    description: '适合新品首发、核心卖点和限时转化。',
    values: { topic: '轻盈修护精华新品种草', audience: '换季时关注温和修护的年轻消费者', goal: '讲清产品卖点，引导用户领取新品体验装', tone: '专业、轻盈、值得信赖' },
  },
  signup: {
    label: '活动报名',
    description: '适合课程、线下活动和限额招募。',
    values: { topic: '周末城市花艺体验课', audience: '希望用周末时间学习新技能的城市女性', goal: '突出课程价值和限额信息，引导用户立即报名', tone: '温暖、松弛、有行动感' },
  },
  promotion: {
    label: '节日促销',
    description: '适合节日限定、优惠活动和到店转化。',
    values: { topic: '中秋限定礼盒限时预售', audience: '重视节日仪式感与送礼品质的城市消费者', goal: '突出限定设计和预售权益，引导用户立即下单', tone: '雅致、温暖、有节日氛围' },
  },
  launch: {
    label: '新品发布',
    description: '适合新品亮相、发布会和首发预约。',
    values: { topic: '智能随行杯春季新品发布', audience: '关注设计感与智能生活方式的年轻用户', goal: '建立新品认知，讲清核心创新并引导首发预约', tone: '现代、清晰、有未来感' },
  },
  recruitment: {
    label: '招聘招募',
    description: '适合岗位招聘、伙伴招募和志愿者计划。',
    values: { topic: '城市青年创意伙伴招募', audience: '热爱内容、设计与城市文化的年轻创作者', goal: '呈现团队氛围和成长机会，引导候选人立即投递', tone: '真诚、年轻、有号召力' },
  },
  custom: {
    label: '通用创作',
    description: '不限制业务类型，由你的目标决定页面结构。',
    values: { topic: '社区夏日生活节', audience: '希望发现周边新鲜体验的社区居民', goal: '清楚介绍活动内容并引导用户参与', tone: '友好、清晰、有活力' },
  },
} satisfies Record<CreateAiPageDraftPayload['scene'], {
  label: string
  description: string
  values: Pick<CreateAiPageDraftPayload, 'topic' | 'audience' | 'goal' | 'tone'>
}>

const sceneOptions: Array<{ value: AiPageScene; label: string }> = [
  { value: 'brand', label: '品牌宣传' },
  { value: 'product', label: '商品种草' },
  { value: 'signup', label: '活动报名' },
  { value: 'promotion', label: '节日促销' },
  { value: 'launch', label: '新品发布' },
  { value: 'recruitment', label: '招聘招募' },
  { value: 'custom', label: '通用创作' },
]

interface AiGeneratorDrawerProps {
  currentContent: WorkContent
  hasCurrentWork: boolean
  initialScene?: CreateAiPageDraftPayload['scene']
  onApply: (draft: AiPageDraft, mode: 'new' | 'replace') => void
  onClose: () => void
  open: boolean
}

export function AiGeneratorDrawer({ currentContent, hasCurrentWork, initialScene = 'brand', onApply, onClose, open }: AiGeneratorDrawerProps) {
  const [form] = Form.useForm<CreateAiPageDraftPayload>()
  const queryClient = useQueryClient()
  const runsQuery = useAiRunsQuery()
  const [running, setRunning] = useState(false)
  const [steps, setSteps] = useState<string[]>([])
  const [streamText, setStreamText] = useState('')
  const [draft, setDraft] = useState<AiPageDraft | null>(null)
  const [draftVersions, setDraftVersions] = useState<AiPageDraft[]>([])
  const [revisionInstruction, setRevisionInstruction] = useState('')
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [processExpanded, setProcessExpanded] = useState(true)
  const controllerRef = useRef<AbortController | null>(null)
  const generationStartedAtRef = useRef(0)
  const selectedScene = Form.useWatch('scene', form) ?? initialScene

  useEffect(() => {
    if (!running) return
    const timer = window.setInterval(() => {
      setElapsedSeconds((Date.now() - generationStartedAtRef.current) / 1000)
    }, 200)
    return () => window.clearInterval(timer)
  }, [running])

  const startGeneration = async (instruction?: string) => {
    const values = await form.validateFields()
    const baseDraft = instruction ? draft : null
    if (instruction && !baseDraft) return
    const controller = new AbortController()
    controllerRef.current = controller
    generationStartedAtRef.current = Date.now()
    setElapsedSeconds(0)
    setRunning(true)
    setProcessExpanded(true)
    setSteps([instruction ? '正在理解本轮修改要求' : '正在提交创作需求'])
    setStreamText('')
    if (!instruction) {
      setDraft(null)
      setDraftVersions([])
    }
    let generatedDraft: AiPageDraft | null = null
    try {
      await streamAiPageDraft({
        ...values,
        ...(instruction ? { instruction } : {}),
        context: { content: baseDraft?.content ?? currentContent },
      }, ({ type, data }) => {
        if (type === 'status') setSteps((items) => [...items, String(data.message ?? '正在处理')])
        if (type === 'token') setStreamText((text) => text + String(data.text ?? ''))
        if (type === 'tool_call') setSteps((items) => [...items, `工具调用：${String(data.label ?? data.name)}`])
        if (type === 'tool_result') setSteps((items) => [...items, String(data.summary ?? '工具执行完成')])
        if (type === 'draft') {
          generatedDraft = { title: String(data.title), desc: String(data.desc), content: data.content as WorkContent, componentCount: Number(data.componentCount ?? 0) }
          setDraft(generatedDraft)
        }
        if (type === 'error') message.error(String(data.message ?? 'AI 生成失败'))
      }, controller.signal)
      if (generatedDraft && baseDraft) {
        setDraftVersions((items) => [...items, baseDraft])
        setRevisionInstruction('')
      }
      queryClient.invalidateQueries({ queryKey: ['ai-runs'] })
    } catch (error) {
      if (!controller.signal.aborted) message.error(error instanceof Error ? error.message : 'AI 生成失败')
    } finally {
      setElapsedSeconds((Date.now() - generationStartedAtRef.current) / 1000)
      if (generatedDraft) setProcessExpanded(false)
      setRunning(false)
      controllerRef.current = null
    }
  }

  const applyDraft = (nextDraft: AiPageDraft, mode: 'new' | 'replace') => {
    const createsNewWork = mode === 'new' && hasCurrentWork
    Modal.confirm({
      title: createsNewWork ? '创建为新作品？' : '替换当前画布？',
      content: createsNewWork
        ? '将保留当前作品，并在新的编辑器中加载这份 AI 草稿。草稿不会自动保存或发布。'
        : '将替换当前画布内容，但不会自动保存或发布。',
      okText: createsNewWork ? '创建新作品' : '替换画布',
      cancelText: '继续预览',
      ...(!createsNewWork ? { okButtonProps: { danger: true } } : {}),
      onOk: () => onApply(nextDraft, mode),
    })
  }

  const handleClose = () => {
    controllerRef.current?.abort()
    onClose()
  }

  const applySceneDefaults = (scene: CreateAiPageDraftPayload['scene']) => {
    const { audience, goal, tone } = scenePresets[scene].values
    form.setFieldsValue({ audience, goal, tone })
  }

  const fillExample = () => {
    form.setFieldsValue({ scene: selectedScene, ...scenePresets[selectedScene].values })
    message.success('示例需求已填入，可直接生成或继续修改')
  }

  const reopenRun = async (run: AiRun) => {
    if (run.status !== 'completed') return
    try {
      const detail = await getAiRun(run.id)
      if (!detail.draft) return
      setDraft({ title: detail.title, desc: detail.desc, content: detail.draft, componentCount: detail.draft.components.length })
      setDraftVersions([])
      setRevisionInstruction('')
      form.setFieldsValue({
        scene: detail.scene,
        topic: detail.topic,
        audience: detail.request?.audience ?? '关注品质生活的年轻用户',
        goal: detail.request?.goal ?? detail.desc,
        tone: detail.request?.tone ?? '清新、有质感、克制',
      })
      setSteps(detail.steps.map((step) => step.label))
      setStreamText('已从创作记录恢复页面草稿。')
      setElapsedSeconds(0)
      setProcessExpanded(false)
    } catch {
      message.error('创作记录加载失败')
    }
  }

  return (
    <Drawer className="ai-generator-drawer" closable title={<Space><Sparkles size={18} /><span>AI 落地页 Agent</span></Space>} open={open} size={460} onClose={handleClose}>
      <Paragraph type="secondary">描述活动目标，Agent 会流式完成策划、工具调用和可编辑页面草稿。应用前不会修改当前作品。</Paragraph>
      <Form form={form} layout="vertical" initialValues={{ scene: initialScene, ...scenePresets[initialScene].values, topic: '' }}>
        <Form.Item label="创作方向" name="scene" rules={[{ required: true }]}>
          <Select
            options={sceneOptions}
            onChange={applySceneDefaults}
          />
        </Form.Item>
        <div className="ai-scene-preset">
          <div><Text strong>{scenePresets[selectedScene].label}示例</Text><Text type="secondary">{scenePresets[selectedScene].description}</Text></div>
          <Button icon={<Sparkles size={14} />} size="small" onClick={fillExample}>使用示例</Button>
        </div>
        <Form.Item label="活动主题" name="topic" rules={[{ required: true, min: 2, message: '请填写活动主题' }]}><Input placeholder="例如：春日城市咖啡节" /></Form.Item>
        <Form.Item label="目标人群" name="audience" rules={[{ required: true, min: 2 }]}><Input placeholder="例如：20-35 岁的咖啡爱好者" /></Form.Item>
        <Form.Item label="希望达成什么目标" name="goal" rules={[{ required: true, min: 2 }]}><Input placeholder="例如：引导用户领取限量体验券" /></Form.Item>
        <Form.Item label="品牌调性" name="tone" rules={[{ required: true, min: 2 }]}><Input placeholder="例如：温暖、自然、有呼吸感" /></Form.Item>
        <Space wrap>
          <Button disabled={running} icon={<Sparkles size={15} />} type="primary" onClick={() => void startGeneration()}>生成页面草稿</Button>
          {running ? <Button danger icon={<StopCircle size={15} />} onClick={() => controllerRef.current?.abort()}>停止</Button> : null}
        </Space>
        {running || elapsedSeconds > 0 ? <Text className="ai-generation-time" type="secondary"><Clock3 size={13} /> {running ? 'Agent 正在工作' : '本次生成耗时'} · {elapsedSeconds.toFixed(1)}s</Text> : null}
      </Form>

      {draft ? <section className="ai-draft-panel">
        <Title level={5}><Bot size={16} /> 候选页面草稿</Title>
        <Text strong>{draft.title}</Text>
        <Paragraph type="secondary">{draft.desc}</Paragraph>
        <div className="ai-draft-preview"><H5PreviewRenderer content={draft.content} /></div>
        <Space wrap>
          <Tag color="blue">{draft.componentCount} 个组件</Tag>
          <Button icon={<Check size={15} />} type="primary" onClick={() => applyDraft(draft, 'new')}>{hasCurrentWork ? '创建为新作品' : '应用到画布'}</Button>
          {hasCurrentWork ? <Button danger onClick={() => applyDraft(draft, 'replace')}>替换当前画布</Button> : null}
          {draftVersions.length ? <Button icon={<RotateCcw size={15} />} onClick={() => {
            const previousDraft = draftVersions[draftVersions.length - 1]
            if (!previousDraft) return
            setDraft(previousDraft)
            setDraftVersions((items) => items.slice(0, -1))
          }}>撤回上一版</Button> : null}
          <Button onClick={() => setDraft(null)}>放弃草稿</Button>
        </Space>
        <div className="ai-draft-next-step">
          <Text strong>接下来怎么做</Text>
          <div><span className="is-active">1</span><Text>应用到画布</Text><i /><span>2</span><Text>检查并保存</Text><i /><span>3</span><Text>发布 H5</Text></div>
          <Text type="secondary">草稿应用后仍可继续编辑，不会自动保存或发布。</Text>
        </div>
        <div className="ai-revision-panel">
          <Text strong>继续修改这版</Text>
          <Paragraph type="secondary">直接描述差异，不用重新填写整套需求。</Paragraph>
          <Input.TextArea
            maxLength={300}
            placeholder="例如：主标题缩短为两行，整体改成暖棕色，按钮文案改为立即预约"
            rows={3}
            showCount
            value={revisionInstruction}
            onChange={(event) => setRevisionInstruction(event.target.value)}
          />
          <Space className="ai-revision-examples" size={[6, 6]} wrap>
            {['主标题更简短', '配色更温暖', '文案更有行动感', '按钮改成立即预约'].map((example) => (
              <Button key={example} size="small" type="text" onClick={() => setRevisionInstruction(example)}>{example}</Button>
            ))}
          </Space>
          <Button
            block
            disabled={revisionInstruction.trim().length < 2}
            icon={<Sparkles size={15} />}
            loading={running}
            type="primary"
            onClick={() => void startGeneration(revisionInstruction.trim())}
          >生成新版本</Button>
        </div>
      </section> : null}

      {steps.length ? <section className={`ai-run-panel${processExpanded ? '' : ' is-collapsed'}`}>
        <div className="ai-run-panel-head">
          <div><Title level={5}><Wrench size={16} /> Agent 执行过程</Title>{!processExpanded ? <Text type="secondary">{draft ? '执行完成，详细策划与工具调用已收起' : '执行详情已收起'}</Text> : null}</div>
          <Button
            icon={processExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            size="small"
            type="text"
            onClick={() => setProcessExpanded((value) => !value)}
          >{processExpanded ? '收起' : '查看详情'}</Button>
        </div>
        {processExpanded ? <><Timeline items={steps.map((item) => ({ color: 'blue', children: item }))} />{streamText ? <Paragraph className="ai-stream-text" type="secondary">{streamText}</Paragraph> : null}</> : null}
      </section> : null}

      <Divider /><section className="ai-history"><Title level={5}><History size={16} /> AI 创作记录</Title>{runsQuery.data?.length ? <List dataSource={runsQuery.data} renderItem={(run) => <List.Item actions={[run.status === 'completed' ? <Button key="open" size="small" onClick={() => void reopenRun(run)}>打开草稿</Button> : null]}><List.Item.Meta title={<Space><Text>{run.title || run.topic}</Text>{run.revisionInstruction ? <Tag color="orange">修改版</Tag> : null}<Tag color={run.status === 'completed' ? 'green' : run.status === 'failed' ? 'red' : 'blue'}>{run.status === 'completed' ? '已完成' : run.status === 'failed' ? '失败' : '生成中'}</Tag></Space>} description={`${new Date(run.createdAt).toLocaleString()} · ${run.componentCount ?? 0} 个组件`} /></List.Item>} /> : <Empty description="暂无 AI 创作记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />}</section>
    </Drawer>
  )
}
