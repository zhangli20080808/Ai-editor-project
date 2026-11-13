export type ComponentName = 'l-text' | 'l-image' | 'l-button'

export interface ComponentProps {
  label: string
  left: number
  top: number
  width: number
  height: number
  [key: string]: unknown
}

export interface ComponentEvents {
  click?: ComponentEventAction[]
}

export type ComponentEventAction =
  | {
      type: 'track'
      eventName: string
    }
  | {
      type: 'link'
      url: string
      openInNewTab?: boolean
    }

export interface ComponentData {
  id: string
  name: ComponentName
  props: ComponentProps
  layerName?: string
  isHidden?: boolean
  isLocked?: boolean
  events?: ComponentEvents
}

export interface PageSetting {
  backgroundColor: string
  backgroundImage: string
  backgroundRepeat: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y'
  backgroundSize: 'cover' | 'contain' | 'auto' | '100% 100%'
  height: number
}

export interface WorkContent {
  components: ComponentData[]
  props: PageSetting
  setting?: Record<string, unknown>
}
