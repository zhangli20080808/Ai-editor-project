import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type {
  ComponentData,
  ComponentEventAction,
  ComponentTemplate,
  ComponentProps,
  PageSetting,
} from './types'
import type { UploadedAsset } from './uploadService'

interface EditorState {
  components: ComponentData[]
  currentElement: string | null
  pageSetting: PageSetting
  addComponent: (template: ComponentTemplate) => void
  addUploadedImage: (asset: UploadedAsset) => void
  removeComponent: (id: string) => void
  selectComponent: (id: string | null) => void
  reorderComponents: (
    orderedIds: string[],
    options?: { syncCanvasTop?: boolean },
  ) => void
  toggleComponentHidden: (id: string) => void
  toggleComponentLocked: (id: string) => void
  updateLayerName: (id: string, layerName: string) => void
  updateComponent: (id: string, propKey: string, value: unknown) => void
  updateComponentPosition: (id: string, left: number, top: number) => void
  updateComponentRect: (
    id: string,
    rect: { left: number; top: number; width: number; height: number },
  ) => void
  updatePageSetting: <K extends keyof PageSetting>(
    key: K,
    value: PageSetting[K],
  ) => void
  updateClickEvent: (
    id: string,
    eventType: ComponentEventAction['type'],
    value: string,
  ) => void
}

export const useEditorStore = create<EditorState>()(
  immer((set) => ({
    components: [],
    currentElement: null,
    pageSetting: {
      backgroundColor: '#ffffff',
      backgroundImage: '',
      backgroundRepeat: 'no-repeat',
      backgroundSize: 'cover',
      height: 640,
    },
    addComponent: (template) => {
      set((state) => {
        const id = createComponentId()
        const offset = state.components.length * 16
        const props: ComponentProps = {
          ...template.props,
          left: template.props.left + offset,
          top: template.props.top + offset,
        }

        const nextComponent: ComponentData = {
          id,
          name: template.name,
          props,
        }

        if (template.events) {
          nextComponent.events = template.events
        }

        state.components.push(nextComponent)
        state.currentElement = id
      })
    },
    addUploadedImage: (asset) => {
      set((state) => {
        const id = createComponentId()
        const offset = state.components.length * 16

        state.components.push({
          id,
          name: 'l-image',
          props: {
            label: asset.name || '上传图片',
            left: 32 + offset,
            top: 104 + offset,
            width: 280,
            height: 160,
            src: asset.url,
            alt: asset.name || '上传图片',
            objectFit: 'cover',
            borderRadius: 0,
          },
          events: {
            click: [
              {
                type: 'track',
                eventName: 'image_click',
              },
            ],
          },
        })
        state.currentElement = id
      })
    },
    removeComponent: (id) => {
      set((state) => {
        state.components = state.components.filter(
          (component) => component.id !== id,
        )
        if (state.currentElement === id) {
          state.currentElement = null
        }
      })
    },
    selectComponent: (id) => {
      set((state) => {
        if (id) {
          const component = state.components.find((item) => item.id === id)
          if (component?.isHidden) {
            return
          }
        }

        state.currentElement = id
      })
    },
    reorderComponents: (orderedIds, options) => {
      set((state) => {
        if (orderedIds.length !== state.components.length) {
          return
        }

        const componentMap = new Map(
          state.components.map((component) => [component.id, component]),
        )
        const nextComponents = orderedIds.map((id) => componentMap.get(id))
        if (nextComponents.some((component) => !component)) {
          return
        }

        state.components = nextComponents as ComponentData[]

        if (options?.syncCanvasTop) {
          let nextTop = 32
          const gap = 16
          const componentsByLayerOrder = [...state.components].reverse()

          componentsByLayerOrder.forEach((component) => {
            component.props.top = nextTop
            nextTop += Number(component.props.height) + gap
          })
        }
      })
    },
    toggleComponentHidden: (id) => {
      set((state) => {
        const component = state.components.find((item) => item.id === id)
        if (!component) {
          return
        }

        component.isHidden = !component.isHidden

        if (component.isHidden && state.currentElement === id) {
          state.currentElement = null
        }
      })
    },
    toggleComponentLocked: (id) => {
      set((state) => {
        const component = state.components.find((item) => item.id === id)
        if (!component) {
          return
        }

        component.isLocked = !component.isLocked
      })
    },
    updateLayerName: (id, layerName) => {
      set((state) => {
        const component = state.components.find((item) => item.id === id)
        if (!component) {
          return
        }

        const nextLayerName = layerName.trim()
        if (nextLayerName) {
          component.layerName = nextLayerName
        } else {
          delete component.layerName
        }
      })
    },
    updateComponent: (id, propKey, value) => {
      set((state) => {
        const component = state.components.find((item) => item.id === id)
        if (component) {
          component.props[propKey] = value
        }
      })
    },
    updateComponentPosition: (id, left, top) => {
      set((state) => {
        const component = state.components.find((item) => item.id === id)
        if (component) {
          component.props.left = left
          component.props.top = top
        }
      })
    },
    updateComponentRect: (id, rect) => {
      set((state) => {
        const component = state.components.find((item) => item.id === id)
        if (component) {
          component.props.left = rect.left
          component.props.top = rect.top
          component.props.width = rect.width
          component.props.height = rect.height
        }
      })
    },
    updatePageSetting: (key, value) => {
      set((state) => {
        state.pageSetting[key] = value
      })
    },
    updateClickEvent: (id, eventType, value) => {
      set((state) => {
        const component = state.components.find((item) => item.id === id)
        if (!component) {
          return
        }

        const actions = component.events?.click ?? []
        const nextActions = actions.filter((action) => action.type !== eventType)

        if (value.trim()) {
          if (eventType === 'track') {
            nextActions.push({
              type: 'track',
              eventName: value.trim(),
            })
          } else {
            nextActions.push({
              type: 'link',
              url: value.trim(),
            })
          }
        }

        if (nextActions.length) {
          component.events = {
            click: nextActions,
          }
        } else {
          delete component.events
        }
      })
    },
  })),
)

function createComponentId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `component_${Date.now()}_${Math.random().toString(16).slice(2)}`
}
