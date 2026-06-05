import type { ComponentType } from 'react'

export type ComponentName = 'l-text' | 'l-image' | 'l-button'

export interface ComponentData {
  id: string
  name: ComponentName
  props: ComponentProps
  events?: ComponentEvents
}

export interface ComponentProps {
  label: string
  left: number
  top: number
  width: number
  height: number
  [key: string]: unknown
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

export interface PropSchema {
  field: string
  label: string
  component: PropComponent
  min?: number
  max?: number
  step?: number
  marks?: Record<number, string>
  options?: Array<{
    label: string
    value: string
  }>
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
