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

export type UserRole = 'user' | 'admin'
export type UserStatus = 'active' | 'frozen'
export type AuditAction =
  | 'work.offline'
  | 'work.restore_publish'
  | 'user.freeze'
  | 'user.unfreeze'
  | 'template.publish'
  | 'template.unpublish'
  | 'template.recommend'
  | 'template.cancel_recommend'
export type AuditTargetType = 'work' | 'user' | 'template'

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
  role: UserRole
  status: UserStatus
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

export interface AdminWork {
  _id: string
  uuid: string
  title: string
  desc?: string
  author: string
  coverImg?: string
  status: WorkStatus
  isTemplate: boolean
  isPublic: boolean
  user?: string | null
  adminOfflineReason?: string
  adminOfflineBy?: string | null
  adminOfflineAt?: string | null
  latestPublishAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface ListAdminWorksParams {
  keyword?: string
  status?: WorkStatus
  page?: number
  pageSize?: number
}

export interface AdminTemplate {
  _id: string
  uuid: string
  title: string
  desc?: string
  author: string
  status: WorkStatus
  isPublic: boolean
  isHot: boolean
  sourceWorkUuid?: string
  sourceTemplateUuid?: string
  templateTags: string[]
  copiedCount: number
  latestPublishAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface ListAdminTemplatesParams {
  keyword?: string
  isPublic?: boolean
  isHot?: boolean
  templateTag?: string
  page?: number
  pageSize?: number
}

export interface AdminUser {
  _id: string
  username: string
  nickName: string
  picture: string
  phoneNumber: string
  city: string
  type: string
  provider?: string | null
  role: UserRole
  status: UserStatus
  frozenReason?: string
  frozenAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface ListAdminUsersParams {
  keyword?: string
  role?: UserRole
  status?: UserStatus
  page?: number
  pageSize?: number
}

export interface AdminAuditLog {
  _id: string
  action: AuditAction
  targetType: AuditTargetType
  targetId: string
  targetUuid: string
  operator: string
  operatorName: string
  reason: string
  snapshot: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface ListAdminAuditLogsParams {
  keyword?: string
  action?: AuditAction
  targetType?: AuditTargetType
  targetUuid?: string
  page?: number
  pageSize?: number
}
