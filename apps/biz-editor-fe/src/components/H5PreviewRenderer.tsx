import type { CSSProperties } from 'react'

import type { WorkContent } from '../api/types'
import type { ComponentData } from '../editor/types'
import { componentRegistry } from '../editor/componentRegistry'

interface H5PreviewRendererProps {
  content: WorkContent
}

export function H5PreviewRenderer({ content }: H5PreviewRendererProps) {
  const components = content.components.filter((component) => !component.isHidden)

  return (
    <div className="h5-preview-workbench">
      <div className="h5-preview-phone" aria-label="移动端草稿预览">
        <div className="h5-preview-phone-button h5-preview-phone-button-left" />
        <div className="h5-preview-phone-button h5-preview-phone-button-right" />
        <div className="h5-preview-phone-shell">
          <div className="h5-preview-phone-island" />
          <div className="h5-preview-screen-frame">
            <div className="h5-preview-screen">
              <div className="h5-preview-page" style={getPageStyle(content)}>
                {components.length === 0 ? (
                  <div className="h5-preview-empty">暂无内容</div>
                ) : (
                  components.map((component, index) => (
                    <div
                      className="h5-preview-component"
                      key={component.id}
                      style={getComponentStyle(component, index)}
                    >
                      {renderComponent(component)}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          <div className="h5-preview-phone-home" />
        </div>
      </div>
    </div>
  )
}

function renderComponent(component: ComponentData) {
  const PreviewComponent = componentRegistry[component.name]?.component
  return PreviewComponent ? <PreviewComponent {...component.props} /> : null
}

function getPageStyle(content: WorkContent): CSSProperties {
  const pageSetting = content.props
  const previewHeight = 667

  return {
    minHeight: Math.max(
      toNumberValue(pageSetting.height, previewHeight),
      previewHeight,
    ),
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
