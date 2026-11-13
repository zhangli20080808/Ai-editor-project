import { WorkStatus } from '../api/types'
import type {
  AuditAction,
  AuditTargetType,
  UserRole,
  UserStatus,
} from '../api/types'

export const workStatusOptions = [
  { label: '已删除', value: WorkStatus.Deleted },
  { label: '未发布', value: WorkStatus.Unpublished },
  { label: '已发布', value: WorkStatus.Published },
  { label: '强制下线', value: WorkStatus.ForceOffline },
]

export const userRoleOptions: { label: string; value: UserRole }[] = [
  { label: '普通用户', value: 'user' },
  { label: '管理员', value: 'admin' },
]

export const userStatusOptions: { label: string; value: UserStatus }[] = [
  { label: '正常', value: 'active' },
  { label: '冻结', value: 'frozen' },
]

export const auditActionOptions: { label: string; value: AuditAction }[] = [
  { label: '作品下线', value: 'work.offline' },
  { label: '恢复发布', value: 'work.restore_publish' },
  { label: '用户冻结', value: 'user.freeze' },
  { label: '用户解冻', value: 'user.unfreeze' },
  { label: '模板上架', value: 'template.publish' },
  { label: '模板下架', value: 'template.unpublish' },
  { label: '模板推荐', value: 'template.recommend' },
  { label: '取消推荐', value: 'template.cancel_recommend' },
]

export const auditTargetTypeOptions: {
  label: string
  value: AuditTargetType
}[] = [
  { label: '作品', value: 'work' },
  { label: '用户', value: 'user' },
  { label: '模板', value: 'template' },
]

export function getWorkStatusLabel(status: number) {
  return (
    workStatusOptions.find((option) => option.value === status)?.label ??
    `未知状态 ${status}`
  )
}

export function getWorkStatusColor(status: number) {
  if (status === WorkStatus.Published) return 'green'
  if (status === WorkStatus.ForceOffline) return 'red'
  if (status === WorkStatus.Deleted) return 'default'
  return 'gold'
}

export function getUserRoleLabel(role: UserRole) {
  return userRoleOptions.find((option) => option.value === role)?.label ?? role
}

export function getUserStatusLabel(status: UserStatus) {
  return (
    userStatusOptions.find((option) => option.value === status)?.label ?? status
  )
}

export function getUserStatusColor(status: UserStatus) {
  return status === 'frozen' ? 'red' : 'green'
}

export function getAuditActionLabel(action: AuditAction) {
  return (
    auditActionOptions.find((option) => option.value === action)?.label ??
    action
  )
}

export function getAuditTargetTypeLabel(targetType: AuditTargetType) {
  return (
    auditTargetTypeOptions.find((option) => option.value === targetType)
      ?.label ?? targetType
  )
}

export function formatDate(value?: string | null) {
  if (!value) return '-'

  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}
