'use client'

import type { CSSProperties, KeyboardEvent, MouseEvent } from 'react'
import { useEffectEvent } from 'react'
import {
  LButton,
  LImage,
  LText,
} from '@zhangli2008/ai-editor-components'
import type {
  ComponentData,
  ComponentEventAction,
  PageSetting,
  WorkContent,
} from '@zhangli2008/ai-editor-schema'

import { recordWorkVisit } from './api'

interface H5RendererProps {
  content: WorkContent
  workUuid: string
}

export function H5Renderer({ content, workUuid }: H5RendererProps) {
  const components = content.components.filter((component) => !component.isHidden)
  const handleComponentClick = useEffectEvent((component: ComponentData) => {
    const clickActions = component.events?.click ?? []
    if (clickActions.length === 0) {
      return
    }

    const channel = new URLSearchParams(window.location.search).get('channel') ?? ''
    const componentLabel = getComponentLabel(component)
    const linkAction = clickActions.find(
      (action): action is Extract<ComponentEventAction, { type: 'link' }> =>
        action.type === 'link' && Boolean(action.url.trim()),
    )

    clickActions.forEach((action) => {
      if (action.type !== 'track' || !action.eventName.trim()) {
        return
      }

      void recordWorkVisit({
        uuid: workUuid,
        eventName: action.eventName.trim(),
        channel,
        componentId: component.id,
        componentLabel,
        componentName: component.name,
        referer: document.referrer,
        userAgent: navigator.userAgent,
      }).catch(() => {
        // 组件事件上报失败不影响正常浏览和跳转。
      })
    })

    if (linkAction) {
      openLink(linkAction)
    }
  })

  return (
    <main className="h5-page-wrap">
      <div className="h5-page" style={getPageStyle(content.props)}>
        {components.length === 0 ? (
          <div className="h5-empty">
            <h1>暂无内容</h1>
            <p>这个作品已经发布，但还没有可展示的组件。</p>
          </div>
        ) : (
          components.map((component, index) => (
            <div
              className="h5-component"
              key={component.id}
              onClick={
                hasClickActions(component)
                  ? (event) => onComponentClick(event, component, handleComponentClick)
                  : undefined
              }
              onKeyDown={
                hasClickActions(component)
                  ? (event) => onComponentKeyDown(event, component, handleComponentClick)
                  : undefined
              }
              role={hasClickActions(component) ? 'button' : undefined}
              style={getComponentStyle(component, index)}
              tabIndex={hasClickActions(component) ? 0 : undefined}
            >
              {renderComponent(component)}
            </div>
          ))
        )}
      </div>
    </main>
  )
}

function renderComponent(component: ComponentData) {
  const props = component.props

  if (component.name === 'l-text') {
    return (
      <LText
        text={String(props.text ?? '')}
        color={toStringValue(props.color, '#1f2329')}
        fontSize={toNumberValue(props.fontSize, 16)}
        fontWeight={toStringValue(props.fontWeight, '400')}
        fontFamily={toStringValue(props.fontFamily, 'system-ui')}
        lineHeight={toNumberValue(props.lineHeight, 1.5)}
        textAlign={toTextAlign(props.textAlign)}
      />
    )
  }

  if (component.name === 'l-image') {
    return (
      <LImage
        src={toStringValue(props.src, '')}
        alt={toStringValue(props.alt, '')}
        objectFit={toObjectFit(props.objectFit)}
        borderRadius={toNumberValue(props.borderRadius, 0)}
      />
    )
  }

  if (component.name === 'l-button') {
    return (
      <LButton
        text={toStringValue(props.text, '')}
        color={toStringValue(props.color, '#ffffff')}
        backgroundColor={toStringValue(props.backgroundColor, '#ff5a3c')}
        borderRadius={toNumberValue(props.borderRadius, 4)}
        fontSize={toNumberValue(props.fontSize, 16)}
      />
    )
  }

  return null
}

function getPageStyle(pageSetting: PageSetting): CSSProperties {
  return {
    minHeight: toNumberValue(pageSetting.height, 640),
    backgroundColor: pageSetting.backgroundColor || '#ffffff',
    backgroundImage: pageSetting.backgroundImage
      ? `url(${pageSetting.backgroundImage})`
      : undefined,
    backgroundRepeat: pageSetting.backgroundRepeat || 'no-repeat',
    backgroundSize: pageSetting.backgroundSize || 'cover',
  }
}

function getComponentStyle(
  component: ComponentData,
  layerIndex: number,
): CSSProperties {
  const hasActions = hasClickActions(component)

  return {
    cursor: hasActions ? 'pointer' : 'default',
    left: toNumberValue(component.props.left, 0),
    top: toNumberValue(component.props.top, 0),
    width: toNumberValue(component.props.width, 120),
    height: toNumberValue(component.props.height, 40),
    zIndex: layerIndex + 1,
  }
}

function toNumberValue(value: unknown, fallback: number) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : fallback
}

function toStringValue(value: unknown, fallback: string) {
  return typeof value === 'string' ? value : fallback
}

function toTextAlign(value: unknown) {
  return value === 'center' || value === 'right' ? value : 'left'
}

function toObjectFit(value: unknown) {
  return value === 'contain' || value === 'fill' ? value : 'cover'
}

function hasClickActions(component: ComponentData) {
  return Boolean(component.events?.click?.length)
}

function onComponentClick(
  event: MouseEvent<HTMLDivElement>,
  component: ComponentData,
  onTrigger: (component: ComponentData) => void,
) {
  event.stopPropagation()
  onTrigger(component)
}

function onComponentKeyDown(
  event: KeyboardEvent<HTMLDivElement>,
  component: ComponentData,
  onTrigger: (component: ComponentData) => void,
) {
  if (event.key !== 'Enter' && event.key !== ' ') {
    return
  }

  event.preventDefault()
  onTrigger(component)
}

function openLink(action: Extract<ComponentEventAction, { type: 'link' }>) {
  const url = action.url.trim()
  if (!url) {
    return
  }

  if (action.openInNewTab) {
    window.open(url, '_blank', 'noopener,noreferrer')
    return
  }

  window.location.assign(url)
}

function getComponentLabel(component: ComponentData) {
  const label = component.layerName || component.props.label
  return typeof label === 'string' && label.trim() ? label.trim() : component.name
}
