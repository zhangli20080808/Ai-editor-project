import { useQuery } from '@tanstack/react-query'

import { getAuthToken } from './authStorage'
import { ApiError } from './types'
import { request } from './http'
import type { WorkContent } from './types'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? 'http://127.0.0.1:7001/api'

export type AiRunStatus = 'running' | 'completed' | 'failed'
export type AiStreamEventType = 'status' | 'token' | 'tool_call' | 'tool_result' | 'draft' | 'suggestions' | 'page_suggestions' | 'page_audit' | 'done' | 'error'
export type AiCopyMode = 'shorten' | 'polish' | 'action' | 'tone' | 'custom'
export type AiPageScene = 'brand' | 'product' | 'signup' | 'promotion' | 'launch' | 'recruitment' | 'custom'

export interface AiPageDraft {
  title: string
  desc: string
  content: WorkContent
  componentCount: number
}

export interface AiRun {
  id: string
  status: AiRunStatus
  scene: AiPageScene
  topic: string
  model: string
  title: string
  desc: string
  steps: Array<{ name: string; label: string; success: boolean }>
  errorMessage: string
  createdAt: string
  revisionInstruction: string
  componentCount?: number
  draft?: WorkContent
  request?: Pick<CreateAiPageDraftPayload, 'audience' | 'goal' | 'tone'>
}

export interface CreateAiPageDraftPayload {
  scene: AiPageScene
  topic: string
  audience: string
  goal: string
  tone: string
  instruction?: string
  context?: { content: WorkContent }
}

export interface CreateAiCopySuggestionsPayload {
  componentType: 'l-text' | 'l-button'
  text: string
  mode: AiCopyMode
  pageTitle?: string
  instruction?: string
}

export interface AiCopySuggestion {
  text: string
  reason: string
}

export type AiPageCopyObjective = 'brand' | 'conversion' | 'concise' | 'custom'

export interface CreateAiPageCopyOptimizationPayload {
  pageTitle: string
  pageDescription?: string
  objective: AiPageCopyObjective
  instruction?: string
  components: Array<{
    id: string
    componentType: 'l-text' | 'l-button'
    text: string
    label?: string
  }>
}

export interface AiPageCopySuggestion {
  componentId: string
  originalText: string
  text: string
  reason: string
}

export interface AiPageCopyOptimization {
  summary: string
  suggestions: AiPageCopySuggestion[]
}

export type AiAuditDimensionKey = 'brand' | 'hierarchy' | 'clarity' | 'conversion'
export type AiAuditSeverity = 'high' | 'medium' | 'low'

export interface CreateAiPageAuditPayload {
  pageTitle: string
  pageDescription?: string
  pageHeight: number
  backgroundColor: string
  components: Array<{
    id: string
    componentType: 'l-text' | 'l-image' | 'l-button'
    label?: string
    text?: string
    top: number
    left: number
    width: number
    height: number
    fontSize?: number
    hasClickAction: boolean
  }>
}

export interface AiPageAuditResult {
  overallScore: number
  summary: string
  dimensions: Array<{
    key: AiAuditDimensionKey
    score: number
    summary: string
  }>
  issues: Array<{
    componentId: string
    severity: AiAuditSeverity
    title: string
    description: string
    suggestion: string
  }>
}

export function getAiRuns() {
  return request<AiRun[]>('/ai/runs')
}

export function getAiRun(id: string) {
  return request<AiRun>(`/ai/runs/${id}`)
}

export function useAiRunsQuery() {
  return useQuery({ queryKey: ['ai-runs'], queryFn: getAiRuns })
}

export async function streamAiPageDraft(
  payload: CreateAiPageDraftPayload,
  onEvent: (event: { type: AiStreamEventType; data: Record<string, unknown> }) => void,
  signal?: AbortSignal,
) {
  return streamAiEvents('/ai/page-drafts/stream', payload, onEvent, signal)
}

export async function streamAiCopySuggestions(
  payload: CreateAiCopySuggestionsPayload,
  onEvent: (event: { type: AiStreamEventType; data: Record<string, unknown> }) => void,
  signal?: AbortSignal,
) {
  return streamAiEvents('/ai/copy-suggestions/stream', payload, onEvent, signal)
}

export async function streamAiPageCopyOptimization(
  payload: CreateAiPageCopyOptimizationPayload,
  onEvent: (event: { type: AiStreamEventType; data: Record<string, unknown> }) => void,
  signal?: AbortSignal,
) {
  return streamAiEvents('/ai/page-copy-optimization/stream', payload, onEvent, signal)
}

export async function streamAiPageAudit(
  payload: CreateAiPageAuditPayload,
  onEvent: (event: { type: AiStreamEventType; data: Record<string, unknown> }) => void,
  signal?: AbortSignal,
) {
  return streamAiEvents('/ai/page-audit/stream', payload, onEvent, signal)
}

async function streamAiEvents(
  endpoint: string,
  payload: CreateAiPageDraftPayload | CreateAiCopySuggestionsPayload | CreateAiPageCopyOptimizationPayload | CreateAiPageAuditPayload,
  onEvent: (event: { type: AiStreamEventType; data: Record<string, unknown> }) => void,
  signal?: AbortSignal,
) {
  const token = getAuthToken()
  const response = await fetch(`${apiBaseUrl}${endpoint}`, {
    method: 'POST',
    ...(signal ? { signal } : {}),
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  })
  if (!response.ok || !response.body) {
    const text = await response.text()
    throw new ApiError(getErrorMessage(text), response.status, text)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const frames = buffer.split('\n\n')
    buffer = frames.pop() ?? ''
    for (const frame of frames) {
      const event = frame.match(/^event:\s*(.+)$/m)?.[1] as AiStreamEventType | undefined
      const rawData = frame.match(/^data:\s*(.+)$/m)?.[1]
      if (!event || !rawData) continue
      try { onEvent({ type: event, data: JSON.parse(rawData) as Record<string, unknown> }) } catch { /* Ignore malformed provider events. */ }
    }
  }
}

function getErrorMessage(text: string) {
  try {
    const value = JSON.parse(text) as { message?: string | string[] }
    return Array.isArray(value.message) ? value.message.join('；') : value.message || 'AI 请求失败'
  } catch {
    return 'AI 请求失败'
  }
}
