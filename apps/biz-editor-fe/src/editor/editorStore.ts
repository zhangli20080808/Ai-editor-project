import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type {
  ComponentData,
  ComponentEventAction,
  ComponentTemplate,
  ComponentProps,
} from './types'

interface EditorState {
  components: ComponentData[]
  currentElement: string | null
  addComponent: (template: ComponentTemplate) => void
  removeComponent: (id: string) => void
  selectComponent: (id: string | null) => void
  updateComponent: (id: string, propKey: string, value: unknown) => void
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
        state.currentElement = id
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
