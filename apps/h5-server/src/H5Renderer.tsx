import type { CSSProperties } from 'react'
import {
  LButton,
  LImage,
  LText,
} from '@zhangli2008/ai-editor-components'

import type { ComponentData, PageSetting, WorkContent } from './types'

interface H5RendererProps {
  content: WorkContent
}

export function H5Renderer({ content }: H5RendererProps) {
  const components = content.components.filter((component) => !component.isHidden)

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
              style={getComponentStyle(component, index)}
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
  return {
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
