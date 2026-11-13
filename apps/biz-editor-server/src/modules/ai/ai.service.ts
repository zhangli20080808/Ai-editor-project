import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectModel } from '@nestjs/mongoose'
import type { ComponentData, WorkContent } from '@zhangli2008/ai-editor-schema' with { "resolution-mode": "import" }
import type { Response } from 'express'
import { Types, type Model } from 'mongoose'

import type { AppConfiguration } from '../../config/configuration'
import type { AuthUser } from '../users/users.service'
import { CreateCopySuggestionsDto } from './dto/create-copy-suggestions.dto'
import { CreatePageAuditDto } from './dto/create-page-audit.dto'
import { CreatePageCopyOptimizationDto } from './dto/create-page-copy-optimization.dto'
import { CreatePageDraftDto } from './dto/create-page-draft.dto'
import { AiRun } from './schemas/ai-run.schema'

type AiEventType = 'status' | 'token' | 'tool_call' | 'tool_result' | 'draft' | 'suggestions' | 'page_suggestions' | 'page_audit' | 'done' | 'error'
type ToolCall = { id: string; name: string; arguments: string }
type PageDraft = { title: string; desc: string; content: WorkContent }

const imageFallbacks: Record<CreatePageDraftDto['scene'], string> = {
  brand: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=85',
  product: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=85',
  signup: 'https://images.unsplash.com/photo-1511988617509-a57c8a288659?auto=format&fit=crop&w=900&q=85',
  promotion: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=85',
  launch: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=85',
  recruitment: 'https://images.unsplash.com/photo-1511988617509-a57c8a288659?auto=format&fit=crop&w=900&q=85',
  custom: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=85',
}

const sceneLabels: Record<CreatePageDraftDto['scene'], string> = {
  brand: '品牌宣传',
  product: '商品种草',
  signup: '活动报名',
  promotion: '节日促销',
  launch: '新品发布',
  recruitment: '招聘招募',
  custom: '通用创作',
}

@Injectable()
export class AiService {
  constructor(
    @InjectModel(AiRun.name) private readonly aiRunModel: Model<AiRun>,
    private readonly configService: ConfigService<AppConfiguration>,
  ) {}

  async streamPageDraft(dto: CreatePageDraftDto, user: AuthUser, response: Response) {
    let config: { baseUrl: string; apiKey: string; model: string }
    try {
      config = this.getModelConfig()
    } catch (error) {
      this.emit(response, 'error', { message: getSafeErrorMessage(error) })
      response.end()
      return
    }
    const run = await this.aiRunModel.create({
      user: new Types.ObjectId(user.id),
      status: 'running',
      scene: dto.scene,
      topic: dto.topic,
      request: { topic: dto.topic, audience: dto.audience, goal: dto.goal, tone: dto.tone, instruction: dto.instruction ?? '' },
      steps: [],
      model: config.model,
    })
    const steps: Array<Record<string, unknown>> = []
    let draft: PageDraft | null = null

    try {
      this.emit(response, 'status', { runId: String(run._id), message: '正在理解活动需求' })
      const messages: Array<Record<string, unknown>> = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: buildUserPrompt(dto) },
      ]

      for (let round = 0; round < 3; round += 1) {
        const result = await this.requestModel(config, messages, response)

        if (result.toolCalls.length === 0) break
        messages.push({ role: 'assistant', content: result.content || null, tool_calls: result.toolCalls.map((call) => ({ id: call.id, type: 'function', function: { name: call.name, arguments: call.arguments } })) })

        for (const toolCall of result.toolCalls) {
          this.emit(response, 'tool_call', { name: toolCall.name, label: getToolLabel(toolCall.name) })
          const toolResult = this.runTool(toolCall, dto, draft)
          if (toolResult.draft) draft = toolResult.draft
          steps.push({ name: toolCall.name, label: getToolLabel(toolCall.name), success: toolResult.success })
          this.emit(response, 'tool_result', { name: toolCall.name, success: toolResult.success, summary: toolResult.summary })
          messages.push({ role: 'tool', tool_call_id: toolCall.id, content: JSON.stringify(toolResult.result) })
          if (toolCall.name === 'build_landing_page_draft' && draft) {
            this.emit(response, 'tool_call', { name: 'validate_page_draft', label: getToolLabel('validate_page_draft') })
            const validation = validateDraft(draft)
            steps.push({ name: 'validate_page_draft', label: getToolLabel('validate_page_draft'), success: validation.valid })
            this.emit(response, 'tool_result', { name: 'validate_page_draft', success: validation.valid, summary: validation.message })
            if (!validation.valid) throw new BadRequestException(validation.message)
          }
        }
      }

      if (!draft) throw new BadRequestException('模型未返回可用的页面草稿，请调整需求后重试')
      const validation = validateDraft(draft)
      if (!validation.valid) throw new BadRequestException(validation.message)

      run.status = 'completed'
      run.steps = steps
      run.title = draft.title
      run.desc = draft.desc
      run.draft = draft.content
      await run.save()
      await this.trimRunHistory(user.id)
      this.emit(response, 'draft', { runId: String(run._id), ...draft, componentCount: draft.content.components.length })
      this.emit(response, 'done', { runId: String(run._id), message: '页面草稿已生成，可预览后应用到画布' })
    } catch (error) {
      const message = getSafeErrorMessage(error)
      run.status = 'failed'
      run.steps = steps
      run.errorMessage = message
      await run.save()
      await this.trimRunHistory(user.id)
      this.emit(response, 'error', { runId: String(run._id), message })
    } finally {
      response.end()
    }
  }

  async listRuns(user: AuthUser) {
    const runs = await this.aiRunModel.find({ user: new Types.ObjectId(user.id) }).sort({ createdAt: -1 }).limit(20).lean().exec()
    return runs.map((run) => serializeRun(run, false))
  }

  async streamCopySuggestions(dto: CreateCopySuggestionsDto, response: Response) {
    let config: { baseUrl: string; apiKey: string; model: string }
    try {
      config = this.getModelConfig()
    } catch (error) {
      this.emit(response, 'error', { message: getSafeErrorMessage(error) })
      response.end()
      return
    }

    try {
      this.emit(response, 'status', { message: '正在理解当前文案与修改目标' })
      const result = await this.requestModel(config, [
        { role: 'system', content: copySystemPrompt },
        { role: 'user', content: buildCopyPrompt(dto) },
      ], response, {
        disableThinking: true,
        emitTokens: false,
        statusMessage: '正在生成 3 个候选版本',
        useTools: false,
      })
      const suggestions = parseCopySuggestions(result.content, dto)
      if (suggestions.length === 0) throw new BadRequestException('模型未返回可用的文案候选，请调整要求后重试')
      this.emit(response, 'suggestions', { suggestions })
      this.emit(response, 'done', { message: '文案候选已生成' })
    } catch (error) {
      this.emit(response, 'error', { message: getSafeErrorMessage(error) })
    } finally {
      response.end()
    }
  }

  async streamPageCopyOptimization(dto: CreatePageCopyOptimizationDto, response: Response) {
    let config: { baseUrl: string; apiKey: string; model: string }
    try {
      config = this.getModelConfig()
    } catch (error) {
      this.emit(response, 'error', { message: getSafeErrorMessage(error) })
      response.end()
      return
    }

    try {
      this.emit(response, 'status', { message: `正在分析 ${dto.components.length} 个文案组件` })
      const result = await this.requestModel(config, [
        { role: 'system', content: pageCopySystemPrompt },
        { role: 'user', content: buildPageCopyPrompt(dto) },
      ], response, {
        disableThinking: true,
        emitTokens: false,
        statusMessage: '正在统一页面表达与转化节奏',
        useTools: false,
      })
      const optimization = parsePageCopyOptimization(result.content, dto)
      if (optimization.suggestions.length === 0) {
        throw new BadRequestException('模型未返回可用的整页优化建议，请调整要求后重试')
      }
      this.emit(response, 'page_suggestions', optimization)
      this.emit(response, 'done', { message: `已生成 ${optimization.suggestions.length} 项整页优化建议` })
    } catch (error) {
      this.emit(response, 'error', { message: getSafeErrorMessage(error) })
    } finally {
      response.end()
    }
  }

  async streamPageAudit(dto: CreatePageAuditDto, response: Response) {
    let config: { baseUrl: string; apiKey: string; model: string }
    try {
      config = this.getModelConfig()
    } catch (error) {
      this.emit(response, 'error', { message: getSafeErrorMessage(error) })
      response.end()
      return
    }

    try {
      this.emit(response, 'status', { message: `正在检查 ${dto.components.length} 个页面组件` })
      const result = await this.requestModel(config, [
        { role: 'system', content: pageAuditSystemPrompt },
        { role: 'user', content: buildPageAuditPrompt(dto) },
      ], response, {
        disableThinking: true,
        emitTokens: false,
        statusMessage: '正在评估品牌、层级、文案和转化表现',
        useTools: false,
      })
      const audit = parsePageAudit(result.content, dto)
      this.emit(response, 'page_audit', audit)
      this.emit(response, 'done', { message: `页面体检完成，发现 ${audit.issues.length} 个改进点` })
    } catch (error) {
      this.emit(response, 'error', { message: getSafeErrorMessage(error) })
    } finally {
      response.end()
    }
  }

  async getRun(id: string, user: AuthUser) {
    if (!Types.ObjectId.isValid(id)) return null
    const run = await this.aiRunModel.findOne({ _id: id, user: new Types.ObjectId(user.id) }).lean().exec()
    return run ? serializeRun(run, true) : null
  }

  private getModelConfig() {
    const baseUrl = this.configService.getOrThrow('llmApiBaseUrl', { infer: true }).replace(/\/$/, '')
    const apiKey = this.configService.getOrThrow('llmApiKey', { infer: true })
    const model = this.configService.getOrThrow('llmModel', { infer: true })
    if (!baseUrl || !apiKey || !model) throw new ServiceUnavailableException('AI 服务尚未配置，请在服务端设置 LLM_API_BASE_URL、LLM_API_KEY 和 LLM_MODEL')
    return { baseUrl, apiKey, model }
  }

  private async trimRunHistory(userId: string) {
    const expiredRuns = await this.aiRunModel
      .find({ user: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .skip(20)
      .select('_id')
      .lean()
      .exec()
    if (expiredRuns.length) {
      await this.aiRunModel.deleteMany({ _id: { $in: expiredRuns.map((run) => run._id) } }).exec()
    }
  }

  private async requestModel(
    config: { baseUrl: string; apiKey: string; model: string },
    messages: Array<Record<string, unknown>>,
    response: Response,
    options: { disableThinking?: boolean; emitTokens?: boolean; statusMessage?: string; useTools?: boolean } = {},
  ) {
    this.emit(response, 'status', { message: options.statusMessage ?? '正在调用模型并生成页面方案' })
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 90_000)
    const abortOnClose = () => controller.abort()
    response.once('close', abortOnClose)
    try {
      const providerResponse = await fetch(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        signal: controller.signal,
        headers: { Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: config.model,
          stream: true,
          temperature: 0.7,
          messages,
          ...(options.disableThinking && isDeepSeekProvider(config.baseUrl)
            ? { thinking: { type: 'disabled' } }
            : {}),
          ...(options.useTools === false ? {} : { tools: pageTools, tool_choice: 'auto' }),
        }),
      })
      if (!providerResponse.ok || !providerResponse.body) throw new ServiceUnavailableException('模型服务暂不可用，请稍后重试')

      const decoder = new TextDecoder()
      const reader = providerResponse.body.getReader()
      let buffer = ''
      let content = ''
      const toolCalls = new Map<number, ToolCall>()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data:')) continue
          const payload = line.slice(5).trim()
          if (!payload || payload === '[DONE]') continue
          const chunk = parseJson(payload)
          const delta = getRecord(getRecord(chunk).choices?.[0])?.delta
          if (!delta) continue
          if (typeof delta.content === 'string') {
            content += delta.content
            if (options.emitTokens !== false) this.emit(response, 'token', { text: delta.content })
          }
          if (Array.isArray(delta.tool_calls)) {
            for (const partial of delta.tool_calls) {
              const tool = getRecord(partial)
              const index = Number(tool.index ?? 0)
              const existing = toolCalls.get(index) ?? { id: '', name: '', arguments: '' }
              const functionValue = getRecord(tool.function)
              toolCalls.set(index, { id: String(tool.id ?? existing.id), name: String(functionValue.name ?? existing.name), arguments: existing.arguments + String(functionValue.arguments ?? '') })
            }
          }
        }
      }
      return { content, toolCalls: Array.from(toolCalls.values()).filter((call) => call.id && call.name) }
    } catch (error) {
      if (controller.signal.aborted) {
        throw new ServiceUnavailableException('模型响应超时或请求已取消，请重试')
      }
      throw error
    } finally {
      clearTimeout(timeout)
      response.off('close', abortOnClose)
    }
  }

  private runTool(toolCall: ToolCall, dto: CreatePageDraftDto, currentDraft: PageDraft | null) {
    const args = parseJson(toolCall.arguments)
    if (toolCall.name === 'build_landing_page_draft') {
      const draft = buildDraft(dto, getRecord(args))
      return { success: true, summary: `已生成 ${draft.content.components.length} 个可编辑组件`, draft, result: { title: draft.title, componentCount: draft.content.components.length } }
    }
    if (toolCall.name === 'validate_page_draft') {
      const validation = currentDraft ? validateDraft(currentDraft) : { valid: false, message: '尚未生成页面草稿' }
      return { success: validation.valid, summary: validation.valid ? '草稿已通过组件与版式校验' : validation.message, result: validation }
    }
    return { success: false, summary: '不支持的工具调用', result: { error: 'unsupported_tool' } }
  }

  private emit(response: Response, event: AiEventType, data: Record<string, unknown>) {
    response.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
  }
}

const pageTools = [
  { type: 'function', function: { name: 'build_landing_page_draft', description: '将活动策划转成可编辑的 H5 落地页草稿。必须调用此工具完成任务。', parameters: { type: 'object', properties: { title: { type: 'string' }, description: { type: 'string' }, visualStyle: { type: 'string' }, primaryColor: { type: 'string' }, heroImage: { type: 'string' }, kicker: { type: 'string' }, headline: { type: 'string' }, intro: { type: 'string' }, benefits: { type: 'array', items: { type: 'string' } }, cta: { type: 'string' } }, required: ['title', 'description', 'primaryColor', 'headline', 'intro', 'benefits', 'cta'] } } },
  { type: 'function', function: { name: 'validate_page_draft', description: '校验已生成的页面草稿是否符合编辑器组件约束。', parameters: { type: 'object', properties: {}, additionalProperties: false } } },
]

const systemPrompt = '你是 H5 落地页策划 Agent。根据用户需求先用简短中文说明策划，再必须调用 build_landing_page_draft。页面只可由标题、正文、主视觉和 CTA 构成。不得生成 HTML、CSS、JavaScript、Markdown 或未知组件。图片 URL 必须是 https。'
const copySystemPrompt = '你是营销页面文案助手。只优化用户提供的单个文本组件，不修改事实、价格、数量或活动规则。严格返回 JSON：{"suggestions":[{"text":"候选文案","reason":"修改方向"}]}。必须返回 3 个有明显差异的中文候选，不要输出 Markdown 或额外说明。'
const pageCopySystemPrompt = '你是营销落地页总编。统一优化用户提供的整页文案，使标题、正文、卖点和 CTA 形成连贯叙事。不得新增或删除组件，不得修改事实、价格、数量、单位或活动规则。不要展开分析，直接返回 JSON：{"summary":"整页优化思路","suggestions":[{"componentId":"原组件ID","text":"优化文案","reason":"修改原因"}]}。每个组件最多返回一项建议，不要输出 Markdown 或额外说明。'
const pageAuditSystemPrompt = '你是移动端营销落地页体验顾问。根据受限的组件文案和布局数据进行页面体检，不生成代码。图片可作为背景，文本与图片几何重叠通常是有意的视觉叠加；在没有图片内容、颜色对比度或层级证据时，不得仅凭坐标重叠判定遮挡或可读性问题。直接返回 JSON：{"overallScore":80,"summary":"总体评价","dimensions":[{"key":"brand","score":80,"summary":"评价"},{"key":"hierarchy","score":80,"summary":"评价"},{"key":"clarity","score":80,"summary":"评价"},{"key":"conversion","score":80,"summary":"评价"}],"issues":[{"componentId":"组件ID或空字符串","severity":"high/medium/low","title":"问题标题","description":"问题说明","suggestion":"改进建议"}]}。必须返回四个维度和 3-5 个最重要问题；只能引用用户提供的组件 ID，不要输出 Markdown 或额外说明。'

const copyModePrompts: Record<CreateCopySuggestionsDto['mode'], string> = {
  shorten: '在保留核心信息的前提下缩短文案，表达更利落',
  polish: '润色表达，使文案更自然、更有品牌质感',
  action: '增强行动感和转化意图，但不要夸大承诺',
  tone: '调整语气与表达风格，三个候选分别体现不同但合适的语气',
  custom: '按照用户的自定义要求修改',
}

function buildCopyPrompt(dto: CreateCopySuggestionsDto) {
  const maxLength = dto.componentType === 'l-button' ? 20 : Math.min(Math.max(dto.text.length * 2, 40), 180)
  const protectedFacts = extractProtectedFacts(dto.text)
  return `页面标题：${dto.pageTitle || '未提供'}\n组件类型：${dto.componentType === 'l-button' ? '行动按钮' : '文本'}\n当前文案：${dto.text}\n修改目标：${copyModePrompts[dto.mode]}${dto.instruction ? `\n自定义要求：${dto.instruction}` : ''}${protectedFacts.length ? `\n以下事实片段必须逐字保留，不得替换数字或单位：${protectedFacts.join('、')}` : ''}\n每个候选不超过 ${maxLength} 个字符。`
}

function parseCopySuggestions(content: string, dto: CreateCopySuggestionsDto) {
  const jsonStart = content.indexOf('{')
  const jsonEnd = content.lastIndexOf('}')
  const parsed = jsonStart >= 0 && jsonEnd > jsonStart
    ? getRecord(parseJson(content.slice(jsonStart, jsonEnd + 1)))
    : {}
  const maxLength = dto.componentType === 'l-button' ? 20 : Math.min(Math.max(dto.text.length * 2, 40), 180)
  const protectedFacts = extractProtectedFacts(dto.text).map(normalizeFact)
  const seen = new Set<string>()
  return (Array.isArray(parsed.suggestions) ? parsed.suggestions : [])
    .map((item) => {
      const value = getRecord(item)
      return {
        text: text(value.text, '', maxLength),
        reason: text(value.reason, 'AI 优化版本', 40),
      }
    })
    .filter((item) => {
      if (!item.text || item.text === dto.text || seen.has(item.text)) return false
      if (!protectedFacts.every((fact) => normalizeFact(item.text).includes(fact))) return false
      seen.add(item.text)
      return true
    })
    .slice(0, 3)
}

function extractProtectedFacts(value: string) {
  return [...new Set(value.match(/\d+(?:\.\d+)?\s*(?:元|折|件|份|名|人|位|杯|个|套|天|日|小时|分钟|秒|%|％)/g) ?? [])]
}

function normalizeFact(value: string) {
  return value.replace(/\s+/g, '')
}

function isDeepSeekProvider(baseUrl: string) {
  try {
    const hostname = new URL(baseUrl).hostname
    return hostname === 'api.deepseek.com' || hostname.endsWith('.deepseek.com')
  } catch {
    return false
  }
}

const pageCopyObjectivePrompts: Record<CreatePageCopyOptimizationDto['objective'], string> = {
  brand: '统一品牌语气与叙事节奏，让表达更自然、更有质感',
  conversion: '强化卖点递进和行动引导，但不要夸大承诺',
  concise: '删除重复和空泛表达，让整页更短、更清晰',
  custom: '严格按照用户补充要求统一优化整页文案',
}

function buildPageCopyPrompt(dto: CreatePageCopyOptimizationDto) {
  const componentLines = dto.components.map((component, index) => {
    const protectedFacts = extractProtectedFacts(component.text)
    return `${index + 1}. ID=${component.id}；类型=${component.componentType === 'l-button' ? '按钮' : '文本'}；名称=${component.label || '未命名'}；原文=${component.text}${protectedFacts.length ? `；必须逐字保留=${protectedFacts.join('、')}` : ''}`
  })
  return `页面标题：${dto.pageTitle}\n页面描述：${dto.pageDescription || '未提供'}\n优化目标：${pageCopyObjectivePrompts[dto.objective]}${dto.instruction ? `\n补充要求：${dto.instruction}` : ''}\n请结合上下文优化以下组件；没有必要修改的组件可以不返回：\n${componentLines.join('\n')}`
}

function parsePageCopyOptimization(content: string, dto: CreatePageCopyOptimizationDto) {
  const jsonStart = content.indexOf('{')
  const jsonEnd = content.lastIndexOf('}')
  const parsed = jsonStart >= 0 && jsonEnd > jsonStart
    ? getRecord(parseJson(content.slice(jsonStart, jsonEnd + 1)))
    : {}
  const componentsById = new Map(dto.components.map((component) => [component.id, component]))
  const seen = new Set<string>()
  const suggestions = (Array.isArray(parsed.suggestions) ? parsed.suggestions : [])
    .map((item) => {
      const value = getRecord(item)
      const componentId = text(value.componentId, '', 100)
      const component = componentsById.get(componentId)
      if (!component) return null
      const maxLength = component.componentType === 'l-button'
        ? 20
        : Math.min(Math.max(component.text.length * 2, 40), 180)
      return {
        componentId,
        text: text(value.text, '', maxLength),
        reason: text(value.reason, '统一整页表达', 60),
        originalText: component.text,
      }
    })
    .filter((item): item is NonNullable<typeof item> => {
      if (!item || !item.text || item.text === item.originalText || seen.has(item.componentId)) return false
      const component = componentsById.get(item.componentId)
      if (!component) return false
      const protectedFacts = extractProtectedFacts(component.text).map(normalizeFact)
      if (!protectedFacts.every((fact) => normalizeFact(item.text).includes(fact))) return false
      seen.add(item.componentId)
      return true
    })
  return {
    summary: text(parsed.summary, '已统一页面叙事和行动引导', 120),
    suggestions,
  }
}

type PageAuditDimensionKey = 'brand' | 'hierarchy' | 'clarity' | 'conversion'

const pageAuditDimensions: Array<{ key: PageAuditDimensionKey; label: string }> = [
  { key: 'brand', label: '品牌一致性' },
  { key: 'hierarchy', label: '信息层级' },
  { key: 'clarity', label: '文案清晰度' },
  { key: 'conversion', label: 'CTA 转化' },
]

function buildPageAuditPrompt(dto: CreatePageAuditDto) {
  const componentLines = dto.components.map((component, index) => {
    const values = [
      `${index + 1}. ID=${component.id}`,
      `类型=${component.componentType}`,
      `名称=${component.label || '未命名'}`,
      `文案=${component.componentType === 'l-image' ? '无（图片内容未发送）' : component.text || '空'}`,
      `位置=(${component.left}, ${component.top})`,
      `尺寸=${component.width}x${component.height}`,
      `字号=${component.fontSize ?? '无'}`,
      `点击行为=${component.hasClickAction ? '有' : '无'}`,
    ]
    return values.join('；')
  })
  return `页面标题：${dto.pageTitle}\n页面描述：${dto.pageDescription || '未提供'}\n页面高度：${dto.pageHeight}\n背景颜色：${dto.backgroundColor}\n请结合移动端页面布局评估以下组件：\n${componentLines.join('\n')}`
}

function parsePageAudit(content: string, dto: CreatePageAuditDto) {
  const jsonStart = content.indexOf('{')
  const jsonEnd = content.lastIndexOf('}')
  const parsed = jsonStart >= 0 && jsonEnd > jsonStart
    ? getRecord(parseJson(content.slice(jsonStart, jsonEnd + 1)))
    : {}
  const rawDimensions = Array.isArray(parsed.dimensions) ? parsed.dimensions : []
  const dimensionsByKey = new Map<PageAuditDimensionKey, Record<string, any>>()
  for (const item of rawDimensions) {
    const value = getRecord(item)
    const key = text(value.key, '', 20) as PageAuditDimensionKey
    if (pageAuditDimensions.some((dimension) => dimension.key === key) && !dimensionsByKey.has(key)) {
      dimensionsByKey.set(key, value)
    }
  }

  const parsedOverallScore = toAuditScore(parsed.overallScore, 70)
  const dimensions = pageAuditDimensions.map((dimension) => {
    const value = dimensionsByKey.get(dimension.key) ?? {}
    return {
      key: dimension.key,
      score: toAuditScore(value.score, parsedOverallScore),
      summary: text(value.summary, `${dimension.label}仍有优化空间`, 100),
    }
  })
  const calculatedScore = Math.round(dimensions.reduce((total, dimension) => total + dimension.score, 0) / dimensions.length)
  const knownIds = new Set(dto.components.map((component) => component.id))
  const issues = (Array.isArray(parsed.issues) ? parsed.issues : [])
    .map((item) => {
      const value = getRecord(item)
      const componentId = text(value.componentId, '', 100)
      const severity = text(value.severity, '', 10)
      if (componentId && !knownIds.has(componentId)) return null
      if (!['high', 'medium', 'low'].includes(severity)) return null
      const issue = {
        componentId,
        severity: severity as 'high' | 'medium' | 'low',
        title: text(value.title, '', 50),
        description: text(value.description, '', 160),
        suggestion: text(value.suggestion, '', 160),
      }
      return issue.title && issue.description && issue.suggestion ? issue : null
    })
    .filter((issue): issue is NonNullable<typeof issue> => Boolean(issue))
    .slice(0, 5)

  if (issues.length === 0) {
    throw new BadRequestException('模型未返回可用的页面体检问题，请稍后重试')
  }
  return {
    overallScore: Number.isFinite(Number(parsed.overallScore)) ? parsedOverallScore : calculatedScore,
    summary: text(parsed.summary, '页面基础信息完整，建议优先处理下列关键体验问题。', 160),
    dimensions,
    issues,
  }
}

function toAuditScore(value: unknown, fallback: number) {
  const score = Number(value)
  return Number.isFinite(score) ? Math.round(Math.min(100, Math.max(0, score))) : fallback
}

function buildUserPrompt(dto: CreatePageDraftDto) {
  const basePrompt = `创作方向：${sceneLabels[dto.scene]}\n主题：${dto.topic}\n目标人群：${dto.audience}\n目标：${dto.goal}\n品牌调性：${dto.tone}`
  const currentDraft = dto.context?.content
    ? `\n当前页面：\n${summarizePageContent(dto.context.content)}`
    : ''
  if (dto.instruction) {
    return `${basePrompt}${currentDraft}\n本轮修改要求：${dto.instruction}\n请基于当前页面生成新版本，只修改要求涉及的内容，未提及的主题和卖点尽量保持不变。`
  }
  return `${basePrompt}${currentDraft}\n请生成一页移动端 H5 落地页草稿。`
}

function summarizePageContent(content: WorkContent) {
  return content.components.slice(0, 12).map((component) => {
    const props = getRecord(component.props)
    const value = component.name === 'l-image'
      ? props.src
      : props.text ?? props.label
    return `${component.name}：${text(value, '', 180)}`
  }).filter(Boolean).join('\n')
}

function buildDraft(dto: CreatePageDraftDto, args: Record<string, unknown>): PageDraft {
  const isSignupScene = dto.scene === 'signup' || dto.scene === 'recruitment'
  const primaryColor = normalizeColor(args.primaryColor, isSignupScene ? '#1868db' : '#ff5a3c')
  const heroImage = normalizeImage(args.heroImage, imageFallbacks[dto.scene])
  const title = text(args.title, dto.topic, 44)
  const desc = text(args.description, dto.goal, 110)
  const kicker = text(args.kicker, isSignupScene ? 'MAKE YOUR MOVE' : 'DESIGNED FOR GOOD DAYS', 42)
  const headline = text(args.headline, title, 42)
  const intro = text(args.intro, desc, 120)
  const benefits = Array.isArray(args.benefits) ? args.benefits.map((item) => text(item, '', 28)).filter(Boolean).slice(0, 3) : []
  const cta = text(args.cta, isSignupScene ? '立即报名' : dto.scene === 'promotion' ? '立即参与' : '立即了解', 20)
  const components: ComponentData[] = [
    imageComponent('hero', 0, 0, 375, 400, heroImage),
    textComponent('kicker', 28, 42, 310, 22, kicker, '#ffffff', 11, '700'),
    textComponent('headline', 28, 84, 320, 116, headline.replace(/[｜|]/g, '\n'), '#ffffff', 34, '700'),
    textComponent('intro', 28, 442, 319, 84, intro, '#1f2937', 16, '400'),
    textComponent('benefits', 28, 570, 319, 110, benefits.length ? benefits.map((item) => `• ${item}`).join('\n') : '• 精选体验\n• 即刻参与\n• 专属权益', '#1f2937', 17, '700'),
    buttonComponent('cta', 28, 790, cta, primaryColor),
  ]
  return { title, desc, content: { props: { backgroundColor: '#f7f8fa', backgroundImage: '', backgroundRepeat: 'no-repeat', backgroundSize: 'cover', height: 900 }, components } }
}

function textComponent(id: string, left: number, top: number, width: number, height: number, value: string, color: string, fontSize: number, fontWeight: string): ComponentData {
  return { id, name: 'l-text', layerName: id, props: { label: id, left, top, width, height, text: value, color, fontSize, fontWeight, fontFamily: fontSize >= 30 ? 'Georgia' : 'system-ui', lineHeight: 1.3, textAlign: 'left' } }
}

function imageComponent(id: string, left: number, top: number, width: number, height: number, src: string): ComponentData {
  return { id, name: 'l-image', layerName: '主视觉', props: { label: '主视觉', left, top, width, height, src, alt: 'AI 生成的主视觉', objectFit: 'cover', borderRadius: 0 } }
}

function buttonComponent(id: string, left: number, top: number, label: string, backgroundColor: string): ComponentData {
  return { id, name: 'l-button', layerName: '行动按钮', props: { label: '行动按钮', left, top, width: 319, height: 54, text: label, color: '#ffffff', backgroundColor, fontSize: 17, borderRadius: 999 }, events: { click: [{ type: 'track', eventName: 'ai_page_cta_click' }, { type: 'link', url: 'https://example.com' }] } }
}

function validateDraft(draft: PageDraft) {
  const components = draft.content.components
  if (components.length < 3 || components.length > 12) return { valid: false, message: '草稿组件数量不符合要求' }
  if (components.some((component) => !['l-text', 'l-image', 'l-button'].includes(component.name))) return { valid: false, message: '草稿包含不支持的组件' }
  if (components.some((component) => Number(component.props.left) < 0 || Number(component.props.top) < 0 || Number(component.props.width) <= 0 || Number(component.props.height) <= 0)) return { valid: false, message: '草稿包含无效布局坐标' }
  return { valid: true, message: '草稿校验通过' }
}

function serializeRun(run: any, includeDraft: boolean) {
  return { id: String(run._id), status: run.status, scene: run.scene, topic: run.topic, model: run.model, title: run.title, desc: run.desc, steps: run.steps, errorMessage: run.errorMessage, createdAt: run.createdAt, revisionInstruction: String(getRecord(run.request).instruction ?? ''), ...(includeDraft ? { draft: run.draft, request: run.request } : { componentCount: getRecord(run.draft).components ? (getRecord(run.draft).components as unknown[]).length : 0 }) }
}

function getToolLabel(name: string) {
  return name === 'build_landing_page_draft' ? '正在搭建可编辑页面组件' : name === 'validate_page_draft' ? '正在校验页面草稿' : '正在处理工具调用'
}

function getSafeErrorMessage(error: unknown) {
  if (error instanceof ServiceUnavailableException || error instanceof BadRequestException) {
    const response = error.getResponse()
    if (typeof response === 'string') return response
    if (response && typeof response === 'object' && 'message' in response) {
      const message = (response as { message?: unknown }).message
      return Array.isArray(message) ? message.join('；') : String(message ?? 'AI 请求失败')
    }
  }
  return 'AI 生成暂时失败，请稍后重试'
}

function getRecord(value: unknown): Record<string, any> {
  return value && typeof value === 'object' ? value as Record<string, any> : {}
}

function parseJson(value: string): unknown {
  try { return JSON.parse(value) } catch { return {} }
}

function text(value: unknown, fallback: string, maxLength: number) {
  const result = typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : ''
  return (result || fallback).slice(0, maxLength)
}

function normalizeColor(value: unknown, fallback: string) {
  return typeof value === 'string' && /^#[\da-fA-F]{6}$/.test(value) ? value : fallback
}

function normalizeImage(value: unknown, fallback: string) {
  if (typeof value !== 'string') return fallback
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && url.hostname === 'images.unsplash.com' ? url.toString() : fallback
  } catch {
    return fallback
  }
}
