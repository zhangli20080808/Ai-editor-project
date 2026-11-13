import type {
  ComponentData,
  PageSetting,
  WorkContent,
} from '@zhangli2008/ai-editor-schema'

export type { ComponentData, PageSetting, WorkContent }

export class ApiError extends Error {
  status: number
  data: unknown

  constructor(message: string, status: number, data: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

export const WorkStatus = {
  Deleted: 0,
  Unpublished: 1,
  Published: 2,
  ForceOffline: 3,
} as const

export type WorkStatus = (typeof WorkStatus)[keyof typeof WorkStatus]

export interface PageResult<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
}

export interface AuthUser {
  id: string
  username: string
  nickName: string
  picture: string
  phoneNumber: string
  role: 'user' | 'admin'
}

export type MessageType = 'system' | 'transfer'

export interface AppMessage {
  _id: string
  user: string
  type: MessageType
  title: string
  content: string
  isRead: boolean
  workUuid: string
  fromUser?: string | null
  createdAt: string
  updatedAt: string
}

export interface MessageListResult {
  items: AppMessage[]
  unreadCount: number
}

export interface LoginByPhonePayload {
  phoneNumber: string
  code: string
}

export interface SendCodeResult {
  phoneNumber: string
  mockCode: string
  expiresIn: number
}

export interface AuthTokenResult {
  token: string
  user: AuthUser
}

export interface WorkChannel {
  id: string
  name: string
  createdAt: string
}

export interface Work {
  _id: string
  uuid: string
  title: string
  desc: string
  content: WorkContent
  publishedContent: WorkContent | null
  author: string
  channels: WorkChannel[]
  coverImg: string
  status: WorkStatus
  isTemplate: boolean
  sourceWorkUuid?: string
  sourceTemplateUuid?: string
  templateTags: string[]
  isHot: boolean
  copiedCount: number
  viewCount: number
  favoriteCount: number
  isPublic: boolean
  user?: string | null
  latestPublishAt: string | null
  createdAt: string
  updatedAt: string
}

export interface FavoriteTemplateIds {
  ids: string[]
}

export interface TemplateFavoriteResult {
  favorite: boolean
  favoriteCount: number
}

export interface ListWorksParams {
  page?: number
  pageSize?: number
  keyword?: string
  templateTag?: string
  sort?: 'latest' | 'hot' | 'copied'
  status?: WorkStatus
  isTemplate?: boolean
  isHot?: boolean
  isPublic?: boolean
}

export interface CreateWorkPayload {
  title?: string
  desc?: string
  content?: WorkContent
  coverImg?: string
  isTemplate?: boolean
  isHot?: boolean
  isPublic?: boolean
  status?: WorkStatus
}

export interface WorkStatsChannel extends WorkChannel {
  pv: number
}

export interface WorkStatsDailyItem {
  date: string
  pv: number
}

export interface WorkComponentEventStat {
  componentId: string
  componentLabel: string
  componentName: string
  count: number
  eventName: string
}

export interface WorkStats {
  workUuid: string
  totalPv: number
  totalComponentClicks: number
  channels: WorkStatsChannel[]
  daily: WorkStatsDailyItem[]
  topChannels: WorkStatsChannel[]
  componentEvents: WorkComponentEventStat[]
  topComponentEvents: WorkComponentEventStat[]
}

export type UpdateWorkPayload = Partial<CreateWorkPayload>
