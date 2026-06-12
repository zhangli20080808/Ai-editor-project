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

const pageCanvasWidth = 375
const pasteOffset = 16
const maxHistoryLength = 50

interface HistorySnapshot {
  components: ComponentData[]
  currentElement: string | null
  pageSetting: PageSetting
}

interface EditorState {
  components: ComponentData[]
  currentElement: string | null
  copiedComponent: ComponentData | null
  historyPast: HistorySnapshot[]
  historyFuture: HistorySnapshot[]
  pageSetting: PageSetting
  addComponent: (template: ComponentTemplate) => void
  addUploadedImage: (asset: UploadedAsset) => void
  copyCurrentComponent: () => void
  pasteCopiedComponent: () => void
  removeComponent: (id: string) => void
  removeCurrentComponent: () => void
  selectComponent: (id: string | null) => void
  moveCurrentComponent: (deltaLeft: number, deltaTop: number) => void
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
  undo: () => void
  redo: () => void
}

export const useEditorStore = create<EditorState>()(
  immer((set) => ({
    components: [],
    currentElement: null,
    copiedComponent: null,
    historyPast: [],
    historyFuture: [],
    pageSetting: {
      backgroundColor: '#ffffff',
      backgroundImage: '',
      backgroundRepeat: 'no-repeat',
      backgroundSize: 'cover',
      height: 640,
    },
    addComponent: (template) => {
      set((state) => {
        pushHistory(state)
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
        pushHistory(state)
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
    copyCurrentComponent: () => {
      set((state) => {
        const currentComponent = getCurrentComponent(state)
        if (currentComponent) {
          state.copiedComponent = cloneComponent(currentComponent)
        }
      })
    },
    pasteCopiedComponent: () => {
      set((state) => {
        if (!state.copiedComponent) {
          return
        }

        pushHistory(state)
        const nextComponent = cloneComponent(state.copiedComponent)
        const nextLeft = clampNumber(
          Number(nextComponent.props.left) + pasteOffset,
          0,
          Math.max(0, pageCanvasWidth - Number(nextComponent.props.width)),
        )
        const nextTop = clampNumber(
          Number(nextComponent.props.top) + pasteOffset,
          0,
          Math.max(
            0,
            state.pageSetting.height - Number(nextComponent.props.height),
          ),
        )

        nextComponent.id = createComponentId()
        nextComponent.props.left = nextLeft
        nextComponent.props.top = nextTop
        nextComponent.props.label = `${String(nextComponent.props.label)} 副本`
        state.components.push(nextComponent)
        state.currentElement = nextComponent.id
        state.copiedComponent = cloneComponent(nextComponent)
      })
    },
    removeComponent: (id) => {
      set((state) => {
        pushHistory(state)
        state.components = state.components.filter(
          (component) => component.id !== id,
        )
        if (state.currentElement === id) {
          state.currentElement = null
        }
      })
    },
    removeCurrentComponent: () => {
      set((state) => {
        const currentComponent = getCurrentComponent(state)
        if (!currentComponent || currentComponent.isLocked) {
          return
        }

        pushHistory(state)
        state.components = state.components.filter(
          (component) => component.id !== currentComponent.id,
        )
        state.currentElement = null
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
    moveCurrentComponent: (deltaLeft, deltaTop) => {
      set((state) => {
        const currentComponent = getCurrentComponent(state)
        if (!currentComponent || currentComponent.isLocked) {
          return
        }

        pushHistory(state)
        const maxLeft = Math.max(
          0,
          pageCanvasWidth - Number(currentComponent.props.width),
        )
        const maxTop = Math.max(
          0,
          state.pageSetting.height - Number(currentComponent.props.height),
        )

        currentComponent.props.left = clampNumber(
          Number(currentComponent.props.left) + deltaLeft,
          0,
          maxLeft,
        )
        currentComponent.props.top = clampNumber(
          Number(currentComponent.props.top) + deltaTop,
          0,
          maxTop,
        )
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

        pushHistory(state)
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

        pushHistory(state)
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

        pushHistory(state)
        component.isLocked = !component.isLocked
      })
    },
    updateLayerName: (id, layerName) => {
      set((state) => {
        const component = state.components.find((item) => item.id === id)
        if (!component) {
          return
        }

        pushHistory(state)
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
          pushHistory(state)
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
        pushHistory(state)
        state.pageSetting[key] = value
      })
    },
    updateClickEvent: (id, eventType, value) => {
      set((state) => {
        const component = state.components.find((item) => item.id === id)
        if (!component) {
          return
        }

        pushHistory(state)
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
    undo: () => {
      set((state) => {
        const previous = state.historyPast.pop()
        if (!previous) {
          return
        }

        state.historyFuture.unshift(createHistorySnapshot(state))
        restoreHistorySnapshot(state, previous)
      })
    },
    redo: () => {
      set((state) => {
        const next = state.historyFuture.shift()
        if (!next) {
          return
        }

        state.historyPast.push(createHistorySnapshot(state))
        restoreHistorySnapshot(state, next)
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

function getCurrentComponent(state: EditorState) {
  return (
    state.components.find((component) => component.id === state.currentElement) ??
    null
  )
}

function pushHistory(state: EditorState) {
  state.historyPast.push(createHistorySnapshot(state))
  if (state.historyPast.length > maxHistoryLength) {
    state.historyPast.shift()
  }
  state.historyFuture = []
}

function createHistorySnapshot(state: EditorState): HistorySnapshot {
  return {
    components: state.components.map(cloneComponent),
    currentElement: state.currentElement,
    pageSetting: { ...state.pageSetting },
  }
}

function restoreHistorySnapshot(
  state: EditorState,
  snapshot: HistorySnapshot,
) {
  state.components = snapshot.components.map(cloneComponent)
  state.currentElement = snapshot.currentElement
  state.pageSetting = { ...snapshot.pageSetting }
}

function cloneComponent(component: ComponentData): ComponentData {
  const clonedComponent: ComponentData = {
    ...component,
    props: { ...component.props },
  }

  if (component.events?.click) {
    clonedComponent.events = {
      click: component.events.click.map((event) => ({ ...event })),
    }
  }

  return clonedComponent
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}
