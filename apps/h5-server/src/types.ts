import type {
  ComponentData,
  PageSetting,
  WorkContent,
} from '@zhangli2008/ai-editor-schema'

export type { ComponentData, PageSetting, WorkContent }

export const WorkStatus = {
  Deleted: 0,
  Unpublished: 1,
  Published: 2,
  ForceOffline: 3,
} as const

export type WorkStatus = (typeof WorkStatus)[keyof typeof WorkStatus]

export interface WorkChannel {
  id: string
  name: string
  createdAt: string
}

export interface PublishedWork {
  uuid: string
  title: string
  desc: string
  coverImg: string
  channels: WorkChannel[]
  status: WorkStatus
  publishedContent: WorkContent
  latestPublishAt: string | null
  updatedAt: string
}

export type PublicWorkUnavailableCode =
  | 'WORK_DELETED'
  | 'WORK_FORCE_OFFLINE'
  | 'WORK_NO_PUBLISHED_CONTENT'
  | 'WORK_NOT_FOUND'
  | 'WORK_UNPUBLISHED'
  | 'WORK_UNAVAILABLE'
