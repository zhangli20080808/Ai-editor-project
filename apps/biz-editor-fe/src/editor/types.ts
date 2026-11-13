import type { ComponentType } from 'react'
import type {
  ComponentData,
  ComponentEvents,
  ComponentEventAction,
  ComponentName,
  ComponentProps,
  PageSetting,
} from '@zhangli2008/ai-editor-schema'

export type {
  ComponentData,
  ComponentEvents,
  ComponentEventAction,
  ComponentName,
  ComponentProps,
  PageSetting,
}

export interface ComponentTemplate {
  name: ComponentName
  label: string
  description: string
  props: ComponentProps
  events?: ComponentEvents
}

export interface ComponentMeta {
  name: ComponentName
  label: string
  component: ComponentType<ComponentProps>
  propSchema: PropSchema[]
}

export type PropComponent =
  | 'Input'
  | 'TextArea'
  | 'InputNumber'
  | 'Color'
  | 'Select'
  | 'ButtonRadio'
  | 'Radio'
  | 'Slider'

export type PropGroupKey =
  | 'basic'
  | 'size'
  | 'border'
  | 'shadowOpacity'
  | 'position'
  | 'event'

export interface PropSchema {
  field: string
  label: string
  component: PropComponent
  group?: PropGroupKey
  min?: number
  max?: number
  step?: number
  marks?: Record<number, string>
  options?: Array<{
    label: string
    value: string
  }>
}
