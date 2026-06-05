import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type {
  ComponentData,
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

        state.components.push({
          id,
          name: template.name,
          props,
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
  })),
)

function createComponentId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `component_${Date.now()}_${Math.random().toString(16).slice(2)}`
}
