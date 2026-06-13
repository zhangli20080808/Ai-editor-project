import type { ComponentData, PageSetting } from '../editor/types'

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

export interface WorkContent {
  components: ComponentData[]
  props: PageSetting
  setting?: Record<string, unknown>
}

export interface Work {
  _id: string
  uuid: string
  title: string
  desc: string
  content: WorkContent
  publishedContent: WorkContent | null
  author: string
  coverImg: string
  status: WorkStatus
  isTemplate: boolean
  isHot: boolean
  copiedCount: number
  isPublic: boolean
  user?: string | null
  latestPublishAt: string | null
  createdAt: string
  updatedAt: string
}

export interface ListWorksParams {
  page?: number
  pageSize?: number
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

export type UpdateWorkPayload = Partial<CreateWorkPayload>
