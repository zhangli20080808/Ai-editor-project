export const WorkStatus = {
  Deleted: 0,
  Unpublished: 1,
  Published: 2,
  ForceOffline: 3,
} as const

export type WorkStatus = (typeof WorkStatus)[keyof typeof WorkStatus]

export interface PageSetting {
  backgroundColor?: string
  backgroundImage?: string
  backgroundRepeat?: string
  backgroundSize?: string
  height?: number
}

export interface ComponentData {
  id: string
  name: 'l-text' | 'l-image' | 'l-button'
  props: Record<string, unknown>
  layerName?: string
  isHidden?: boolean
  isLocked?: boolean
}

export interface WorkContent {
  components: ComponentData[]
  props: PageSetting
  setting?: Record<string, unknown>
}

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
