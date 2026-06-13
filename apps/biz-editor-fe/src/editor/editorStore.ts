import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type {
  ComponentData,
  ComponentEventAction,
  ComponentEvents,
  ComponentName,
  ComponentTemplate,
  ComponentProps,
  PageSetting,
} from './types'
import type { WorkContent } from '../api/types'
import type { UploadedAsset } from './uploadService'

const pageCanvasWidth = 375
const pasteOffset = 16
const maxHistoryLength = 50
const historyMergeDelay = 300
const minCanvasZoom = 0.5
const maxCanvasZoom = 2
const canvasZoomStep = 0.1
const defaultPageSetting: PageSetting = {
  backgroundColor: '#ffffff',
  backgroundImage: '',
  backgroundRepeat: 'no-repeat',
  backgroundSize: 'cover',
  height: 640,
}

type HistoryRecordType =
  | 'add'
  | 'delete'
  | 'update'
  | 'page-update'
  | 'reorder'

type ComponentFieldKey = 'layerName' | 'isHidden' | 'isLocked' | 'events'

interface ComponentAddPatch {
  kind: 'component-add'
  component: ComponentData
  index: number
}

interface ComponentDeletePatch {
  kind: 'component-delete'
  component: ComponentData
  index: number
}

interface ComponentPropPatch {
  kind: 'component-prop'
  componentId: string
  key: string
  oldValue: unknown
  newValue: unknown
}

interface ComponentFieldPatch {
  kind: 'component-field'
  componentId: string
  key: ComponentFieldKey
  oldValue: unknown
  newValue: unknown
}

interface PageSettingPatch {
  kind: 'page-setting'
  key: keyof PageSetting
  oldValue: unknown
  newValue: unknown
}

interface ComponentOrderPatch {
  kind: 'component-order'
  oldOrder: string[]
  newOrder: string[]
}

export type HistoryPatch =
  | ComponentAddPatch
  | ComponentDeletePatch
  | ComponentPropPatch
  | ComponentFieldPatch
  | PageSettingPatch
  | ComponentOrderPatch

export interface HistoryRecord {
  id: string
  type: HistoryRecordType
  label: string
  timestamp: number
  patches: HistoryPatch[]
  mergeKey?: string
  selectionBefore: string | null
  selectionAfter: string | null
}

interface EditorState {
  components: ComponentData[]
  currentElement: string | null
  copiedComponent: ComponentData | null
  historyPast: HistoryRecord[]
  historyFuture: HistoryRecord[]
  lastHistoryMergeKey: string | null
  lastHistoryMergeTime: number
  canvasZoom: number
  pageSetting: PageSetting
  setCanvasZoom: (zoom: number) => void
  zoomInCanvas: () => void
  zoomOutCanvas: () => void
  resetCanvasZoom: () => void
  fitCanvasToView: (viewport: { width: number; height: number }) => void
  loadWorkContent: (content: WorkContent) => void
  resetEditor: () => void
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
  updateComponent: (
    id: string,
    propKeyOrValues: string | Partial<ComponentProps>,
    value?: unknown,
  ) => void
  updateComponentPosition: (id: string, left: number, top: number) => void
  commitComponentPosition: (
    id: string,
    rect: { left: number; top: number },
  ) => void
  updateComponentRect: (
    id: string,
    rect: { left: number; top: number; width: number; height: number },
  ) => void
  commitComponentRect: (
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
    lastHistoryMergeKey: null,
    lastHistoryMergeTime: 0,
    canvasZoom: 1,
    pageSetting: { ...defaultPageSetting },
    setCanvasZoom: (zoom) => {
      set((state) => {
        state.canvasZoom = normalizeCanvasZoom(zoom)
      })
    },
    zoomInCanvas: () => {
      set((state) => {
        state.canvasZoom = normalizeCanvasZoom(state.canvasZoom + canvasZoomStep)
      })
    },
    zoomOutCanvas: () => {
      set((state) => {
        state.canvasZoom = normalizeCanvasZoom(state.canvasZoom - canvasZoomStep)
      })
    },
    resetCanvasZoom: () => {
      set((state) => {
        state.canvasZoom = 1
      })
    },
    fitCanvasToView: (viewport) => {
      set((state) => {
        const horizontalZoom = (viewport.width - 48) / pageCanvasWidth
        const verticalZoom = (viewport.height - 48) / state.pageSetting.height
        state.canvasZoom = normalizeCanvasZoom(
          Math.min(horizontalZoom, verticalZoom, 1),
        )
      })
    },
    loadWorkContent: (content) => {
      set((state) => {
        state.components = normalizeLoadedComponents(content.components)
        state.currentElement = null
        state.copiedComponent = null
        state.historyPast = []
        state.historyFuture = []
        state.lastHistoryMergeKey = null
        state.lastHistoryMergeTime = 0
        state.canvasZoom = 1
        state.pageSetting = normalizePageSetting(content.props)
      })
    },
    resetEditor: () => {
      set((state) => {
        state.components = []
        state.currentElement = null
        state.copiedComponent = null
        state.historyPast = []
        state.historyFuture = []
        state.lastHistoryMergeKey = null
        state.lastHistoryMergeTime = 0
        state.canvasZoom = 1
        state.pageSetting = { ...defaultPageSetting }
      })
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
          nextComponent.events = cloneEvents(template.events)
        }

        const index = state.components.length
        recordHistory(state, {
          type: 'add',
          label: `新增${template.label}`,
          patches: [
            {
              kind: 'component-add',
              component: cloneComponent(nextComponent),
              index,
            },
          ],
          selectionBefore: state.currentElement,
          selectionAfter: id,
        })
        state.components.push(nextComponent)
        state.currentElement = id
      })
    },
    addUploadedImage: (asset) => {
      set((state) => {
        const id = createComponentId()
        const offset = state.components.length * 16
        const nextComponent: ComponentData = {
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
        }
        const index = state.components.length

        recordHistory(state, {
          type: 'add',
          label: '新增上传图片',
          patches: [
            {
              kind: 'component-add',
              component: cloneComponent(nextComponent),
              index,
            },
          ],
          selectionBefore: state.currentElement,
          selectionAfter: id,
        })
        state.components.push(nextComponent)
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
        const index = state.components.length

        recordHistory(state, {
          type: 'add',
          label: '粘贴组件',
          patches: [
            {
              kind: 'component-add',
              component: cloneComponent(nextComponent),
              index,
            },
          ],
          selectionBefore: state.currentElement,
          selectionAfter: nextComponent.id,
        })
        state.components.push(nextComponent)
        state.currentElement = nextComponent.id
        state.copiedComponent = cloneComponent(nextComponent)
      })
    },
    removeComponent: (id) => {
      set((state) => {
        removeComponentWithHistory(state, id)
      })
    },
    removeCurrentComponent: () => {
      set((state) => {
        const currentComponent = getCurrentComponent(state)
        if (!currentComponent || currentComponent.isLocked) {
          return
        }

        removeComponentWithHistory(state, currentComponent.id)
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

        const oldLeft = Number(currentComponent.props.left)
        const oldTop = Number(currentComponent.props.top)
        const maxLeft = Math.max(
          0,
          pageCanvasWidth - Number(currentComponent.props.width),
        )
        const maxTop = Math.max(
          0,
          state.pageSetting.height - Number(currentComponent.props.height),
        )
        const nextLeft = clampNumber(oldLeft + deltaLeft, 0, maxLeft)
        const nextTop = clampNumber(oldTop + deltaTop, 0, maxTop)

        if (nextLeft === oldLeft && nextTop === oldTop) {
          return
        }

        recordHistory(state, {
          type: 'update',
          label: '移动组件',
          mergeKey: `component:${currentComponent.id}:keyboard-position`,
          patches: createComponentPropPatches(currentComponent, {
            left: nextLeft,
            top: nextTop,
          }),
          selectionBefore: state.currentElement,
          selectionAfter: currentComponent.id,
        })
        currentComponent.props.left = nextLeft
        currentComponent.props.top = nextTop
        state.currentElement = currentComponent.id
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

        const oldOrder = state.components.map((component) => component.id)
        if (sameArray(oldOrder, orderedIds)) {
          return
        }

        const patches: HistoryPatch[] = [
          {
            kind: 'component-order',
            oldOrder,
            newOrder: orderedIds,
          },
        ]
        const componentsByNextOrder = nextComponents as ComponentData[]

        if (options?.syncCanvasTop) {
          let nextTop = 32
          const gap = 16
          const componentsByLayerOrder = [...componentsByNextOrder].reverse()

          componentsByLayerOrder.forEach((component) => {
            if (Number(component.props.top) !== nextTop) {
              patches.push({
                kind: 'component-prop',
                componentId: component.id,
                key: 'top',
                oldValue: component.props.top,
                newValue: nextTop,
              })
            }
            nextTop += Number(component.props.height) + gap
          })
        }

        recordHistory(state, {
          type: 'reorder',
          label: '调整图层顺序',
          patches,
          selectionBefore: state.currentElement,
          selectionAfter: state.currentElement,
        })
        applyHistoryPatches(state, patches, 'redo')
      })
    },
    toggleComponentHidden: (id) => {
      set((state) => {
        const component = state.components.find((item) => item.id === id)
        if (!component) {
          return
        }

        const nextHidden = !component.isHidden
        recordHistory(state, {
          type: 'update',
          label: nextHidden ? '隐藏图层' : '显示图层',
          patches: [
            {
              kind: 'component-field',
              componentId: id,
              key: 'isHidden',
              oldValue: component.isHidden,
              newValue: nextHidden,
            },
          ],
          selectionBefore: state.currentElement,
          selectionAfter:
            nextHidden && state.currentElement === id ? null : state.currentElement,
        })
        component.isHidden = nextHidden

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

        const nextLocked = !component.isLocked
        recordHistory(state, {
          type: 'update',
          label: nextLocked ? '锁定图层' : '解锁图层',
          patches: [
            {
              kind: 'component-field',
              componentId: id,
              key: 'isLocked',
              oldValue: component.isLocked,
              newValue: nextLocked,
            },
          ],
          selectionBefore: state.currentElement,
          selectionAfter: state.currentElement,
        })
        component.isLocked = nextLocked
      })
    },
    updateLayerName: (id, layerName) => {
      set((state) => {
        const component = state.components.find((item) => item.id === id)
        if (!component) {
          return
        }

        const nextLayerName = layerName.trim() || undefined
        if (component.layerName === nextLayerName) {
          return
        }

        recordHistory(state, {
          type: 'update',
          label: '修改图层名称',
          patches: [
            {
              kind: 'component-field',
              componentId: id,
              key: 'layerName',
              oldValue: component.layerName,
              newValue: nextLayerName,
            },
          ],
          selectionBefore: state.currentElement,
          selectionAfter: state.currentElement,
        })

        if (nextLayerName) {
          component.layerName = nextLayerName
        } else {
          delete component.layerName
        }
      })
    },
    updateComponent: (id, propKeyOrValues, value) => {
      set((state) => {
        const component = state.components.find((item) => item.id === id)
        if (!component) {
          return
        }

        const values =
          typeof propKeyOrValues === 'string'
            ? { [propKeyOrValues]: value }
            : propKeyOrValues
        const patches = createComponentPropPatches(component, values)
        if (patches.length === 0) {
          return
        }

        const fields = Object.keys(values)
        const mergeKey =
          fields.length === 1 ? `component:${id}:prop:${fields[0]}` : undefined
        recordHistory(state, {
          type: 'update',
          label: getComponentUpdateLabel(fields),
          ...(mergeKey ? { mergeKey } : {}),
          patches,
          selectionBefore: state.currentElement,
          selectionAfter: state.currentElement,
        })
        applyComponentPropValues(component, values)
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
    commitComponentPosition: (id, rect) => {
      set((state) => {
        const component = state.components.find((item) => item.id === id)
        if (!component) {
          return
        }

        const patches = createComponentPropPatchesFromOldValues(component.id, {
          left: rect.left,
          top: rect.top,
        }, {
          left: component.props.left,
          top: component.props.top,
        })
        if (patches.length === 0) {
          return
        }

        recordHistory(state, {
          type: 'update',
          label: '移动组件',
          patches,
          selectionBefore: state.currentElement,
          selectionAfter: component.id,
        })
        state.currentElement = component.id
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
    commitComponentRect: (id, rect) => {
      set((state) => {
        const component = state.components.find((item) => item.id === id)
        if (!component) {
          return
        }

        const patches = createComponentPropPatchesFromOldValues(component.id, {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        }, {
          left: component.props.left,
          top: component.props.top,
          width: component.props.width,
          height: component.props.height,
        })
        if (patches.length === 0) {
          return
        }

        recordHistory(state, {
          type: 'update',
          label: '调整组件大小',
          patches,
          selectionBefore: state.currentElement,
          selectionAfter: component.id,
        })
        state.currentElement = component.id
      })
    },
    updatePageSetting: (key, value) => {
      set((state) => {
        if (isSameValue(state.pageSetting[key], value)) {
          return
        }

        recordHistory(state, {
          type: 'page-update',
          label: '页面设置',
          mergeKey: `page:${String(key)}`,
          patches: [
            {
              kind: 'page-setting',
              key,
              oldValue: state.pageSetting[key],
              newValue: value,
            },
          ],
          selectionBefore: state.currentElement,
          selectionAfter: state.currentElement,
        })
        state.pageSetting[key] = value
      })
    },
    updateClickEvent: (id, eventType, value) => {
      set((state) => {
        const component = state.components.find((item) => item.id === id)
        if (!component) {
          return
        }

        const oldEvents = cloneOptionalEvents(component.events)
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

        const nextEvents = nextActions.length
          ? {
              click: nextActions,
            }
          : undefined
        if (isSameValue(oldEvents, nextEvents)) {
          return
        }

        recordHistory(state, {
          type: 'update',
          label: eventType === 'track' ? '修改统计事件' : '修改跳转链接',
          mergeKey: `component:${id}:event:${eventType}`,
          patches: [
            {
              kind: 'component-field',
              componentId: id,
              key: 'events',
              oldValue: oldEvents,
              newValue: cloneOptionalEvents(nextEvents),
            },
          ],
          selectionBefore: state.currentElement,
          selectionAfter: state.currentElement,
        })

        if (nextEvents) {
          component.events = nextEvents
        } else {
          delete component.events
        }
      })
    },
    undo: () => {
      set((state) => {
        const record = state.historyPast.pop()
        if (!record) {
          return
        }

        applyHistoryRecord(state, record, 'undo')
        state.historyFuture.unshift(record)
        state.lastHistoryMergeKey = null
        state.lastHistoryMergeTime = 0
      })
    },
    redo: () => {
      set((state) => {
        const record = state.historyFuture.shift()
        if (!record) {
          return
        }

        applyHistoryRecord(state, record, 'redo')
        state.historyPast.push(record)
        if (state.historyPast.length > maxHistoryLength) {
          state.historyPast.shift()
        }
        state.lastHistoryMergeKey = null
        state.lastHistoryMergeTime = 0
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

function createHistoryId() {
  return `history_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

function getCurrentComponent(state: EditorState) {
  return (
    state.components.find((component) => component.id === state.currentElement) ??
    null
  )
}

function removeComponentWithHistory(state: EditorState, id: string) {
  const index = state.components.findIndex((component) => component.id === id)
  if (index < 0) {
    return
  }

  const targetComponent = state.components[index]
  if (!targetComponent) {
    return
  }

  const component = cloneComponent(targetComponent)
  recordHistory(state, {
    type: 'delete',
    label: '删除组件',
    patches: [
      {
        kind: 'component-delete',
        component,
        index,
      },
    ],
    selectionBefore: state.currentElement,
    selectionAfter: state.currentElement === id ? null : state.currentElement,
  })
  state.components.splice(index, 1)
  if (state.currentElement === id) {
    state.currentElement = null
  }
}

type HistoryRecordInput = Omit<HistoryRecord, 'id' | 'timestamp'>

function recordHistory(state: EditorState, input: HistoryRecordInput) {
  if (input.patches.length === 0) {
    return
  }

  const now = Date.now()
  const previous = state.historyPast[state.historyPast.length - 1]
  const shouldMerge =
    input.mergeKey &&
    previous?.mergeKey === input.mergeKey &&
    state.lastHistoryMergeKey === input.mergeKey &&
    now - state.lastHistoryMergeTime <= historyMergeDelay

  if (shouldMerge) {
    previous.patches = mergeHistoryPatches(previous.patches, input.patches)
    previous.selectionAfter = input.selectionAfter
    previous.timestamp = now
    previous.label = input.label
    state.lastHistoryMergeTime = now
    state.historyFuture = []
    return
  }

  state.historyPast.push({
    ...input,
    id: createHistoryId(),
    timestamp: now,
  })
  if (state.historyPast.length > maxHistoryLength) {
    state.historyPast.shift()
  }
  state.historyFuture = []
  state.lastHistoryMergeKey = input.mergeKey ?? null
  state.lastHistoryMergeTime = input.mergeKey ? now : 0
}

function mergeHistoryPatches(
  previousPatches: HistoryPatch[],
  nextPatches: HistoryPatch[],
) {
  const mergedPatches = previousPatches.map(cloneHistoryPatch)

  nextPatches.forEach((nextPatch) => {
    const index = mergedPatches.findIndex((patch) =>
      isMergeablePatch(patch, nextPatch),
    )
    if (index < 0) {
      mergedPatches.push(cloneHistoryPatch(nextPatch))
      return
    }

    const previousPatch = mergedPatches[index]
    if (!previousPatch) {
      return
    }
    if (
      (previousPatch.kind === 'component-prop' &&
        nextPatch.kind === 'component-prop') ||
      (previousPatch.kind === 'component-field' &&
        nextPatch.kind === 'component-field') ||
      (previousPatch.kind === 'page-setting' &&
        nextPatch.kind === 'page-setting')
    ) {
      previousPatch.newValue = cloneValue(nextPatch.newValue)
    }
  })

  return mergedPatches
}

function isMergeablePatch(previous: HistoryPatch, next: HistoryPatch) {
  if (previous.kind !== next.kind) {
    return false
  }

  if (previous.kind === 'component-prop' && next.kind === 'component-prop') {
    return previous.componentId === next.componentId && previous.key === next.key
  }

  if (previous.kind === 'component-field' && next.kind === 'component-field') {
    return previous.componentId === next.componentId && previous.key === next.key
  }

  if (previous.kind === 'page-setting' && next.kind === 'page-setting') {
    return previous.key === next.key
  }

  return false
}

function applyHistoryRecord(
  state: EditorState,
  record: HistoryRecord,
  direction: 'undo' | 'redo',
) {
  applyHistoryPatches(state, record.patches, direction)
  state.currentElement =
    direction === 'undo' ? record.selectionBefore : record.selectionAfter
}

function applyHistoryPatches(
  state: EditorState,
  patches: HistoryPatch[],
  direction: 'undo' | 'redo',
) {
  const orderedPatches = direction === 'undo' ? [...patches].reverse() : patches

  orderedPatches.forEach((patch) => {
    applyHistoryPatch(state, patch, direction)
  })
}

function applyHistoryPatch(
  state: EditorState,
  patch: HistoryPatch,
  direction: 'undo' | 'redo',
) {
  if (patch.kind === 'component-add') {
    if (direction === 'redo') {
      insertComponent(state, patch.component, patch.index)
    } else {
      removeComponentById(state, patch.component.id)
    }
    return
  }

  if (patch.kind === 'component-delete') {
    if (direction === 'redo') {
      removeComponentById(state, patch.component.id)
    } else {
      insertComponent(state, patch.component, patch.index)
    }
    return
  }

  if (patch.kind === 'component-prop') {
    const component = state.components.find((item) => item.id === patch.componentId)
    if (component) {
      setObjectValue(
        component.props,
        patch.key,
        direction === 'undo' ? patch.oldValue : patch.newValue,
      )
    }
    return
  }

  if (patch.kind === 'component-field') {
    const component = state.components.find((item) => item.id === patch.componentId)
    if (component) {
      setObjectValue(
        component,
        patch.key,
        direction === 'undo' ? patch.oldValue : patch.newValue,
      )
    }
    return
  }

  if (patch.kind === 'page-setting') {
    setObjectValue(
      state.pageSetting,
      patch.key,
      direction === 'undo' ? patch.oldValue : patch.newValue,
    )
    return
  }

  if (patch.kind === 'component-order') {
    state.components = orderComponentsByIds(
      state.components,
      direction === 'undo' ? patch.oldOrder : patch.newOrder,
    )
  }
}

function createComponentPropPatches(
  component: ComponentData,
  values: Partial<ComponentProps>,
): ComponentPropPatch[] {
  return Object.entries(values)
    .filter(([key, value]) => !isSameValue(component.props[key], value))
    .map(([key, value]) => ({
      kind: 'component-prop',
      componentId: component.id,
      key,
      oldValue: cloneValue(component.props[key]),
      newValue: cloneValue(value),
    }))
}

function createComponentPropPatchesFromOldValues(
  componentId: string,
  oldValues: Partial<ComponentProps>,
  newValues: Partial<ComponentProps>,
): ComponentPropPatch[] {
  return Object.entries(newValues)
    .filter(([key, value]) => !isSameValue(oldValues[key], value))
    .map(([key, value]) => ({
      kind: 'component-prop',
      componentId,
      key,
      oldValue: cloneValue(oldValues[key]),
      newValue: cloneValue(value),
    }))
}

function applyComponentPropValues(
  component: ComponentData,
  values: Partial<ComponentProps>,
) {
  Object.entries(values).forEach(([key, value]) => {
    component.props[key] = value
  })
}

function getComponentUpdateLabel(fields: string[]) {
  if (fields.length > 1) {
    return '修改组件属性'
  }

  const field = fields[0]
  if (!field) {
    return '修改组件属性'
  }
  const labelMap: Record<string, string> = {
    text: '修改文本',
    label: '修改名称',
    left: '移动组件',
    top: '移动组件',
    width: '修改宽度',
    height: '修改高度',
  }

  return labelMap[field] ?? '修改组件属性'
}

function insertComponent(
  state: EditorState,
  component: ComponentData,
  index: number,
) {
  removeComponentById(state, component.id)
  state.components.splice(
    clampNumber(index, 0, state.components.length),
    0,
    cloneComponent(component),
  )
}

function removeComponentById(state: EditorState, id: string) {
  state.components = state.components.filter((component) => component.id !== id)
}

function orderComponentsByIds(components: ComponentData[], orderedIds: string[]) {
  const componentMap = new Map(
    components.map((component) => [component.id, component]),
  )
  const orderedComponents = orderedIds
    .map((id) => componentMap.get(id))
    .filter(Boolean) as ComponentData[]
  const missingComponents = components.filter(
    (component) => !orderedIds.includes(component.id),
  )

  return [...orderedComponents, ...missingComponents]
}

function setObjectValue<T extends object>(
  target: T,
  key: keyof T | string,
  value: unknown,
) {
  if (value === undefined) {
    delete (target as Record<string, unknown>)[String(key)]
    return
  }

  ;(target as Record<string, unknown>)[String(key)] = cloneValue(value)
}

function cloneHistoryPatch(patch: HistoryPatch): HistoryPatch {
  if (patch.kind === 'component-add' || patch.kind === 'component-delete') {
    return {
      ...patch,
      component: cloneComponent(patch.component),
    }
  }

  if (patch.kind === 'component-order') {
    return {
      ...patch,
      oldOrder: [...patch.oldOrder],
      newOrder: [...patch.newOrder],
    }
  }

  return {
    ...patch,
    oldValue: cloneValue(patch.oldValue),
    newValue: cloneValue(patch.newValue),
  }
}

function cloneComponent(component: ComponentData): ComponentData {
  const clonedComponent: ComponentData = {
    ...component,
    props: { ...component.props },
  }

  if (component.events) {
    clonedComponent.events = cloneEvents(component.events)
  }

  return clonedComponent
}

function cloneEvents(events: ComponentEvents): ComponentEvents {
  const clonedEvents: ComponentEvents = {}

  if (events.click) {
    clonedEvents.click = events.click.map((event) => ({ ...event }))
  }

  return clonedEvents
}

function cloneOptionalEvents(
  events?: ComponentEvents,
): ComponentEvents | undefined {
  return events ? cloneEvents(events) : undefined
}

function cloneValue<T>(value: T): T {
  if (value === undefined || value === null) {
    return value
  }

  if (Array.isArray(value)) {
    return value.map((item) => cloneValue(item)) as T
  }

  if (typeof value === 'object') {
    return { ...(value as Record<string, unknown>) } as T
  }

  return value
}

function normalizePageSetting(pageSetting: Partial<PageSetting>): PageSetting {
  return {
    ...defaultPageSetting,
    ...pageSetting,
    height:
      typeof pageSetting.height === 'number'
        ? pageSetting.height
        : defaultPageSetting.height,
  }
}

type RawComponentData = Partial<ComponentData> & {
  tag?: unknown
}

function normalizeLoadedComponents(components: unknown[]): ComponentData[] {
  return components
    .map((component, index) =>
      normalizeLoadedComponent(component as RawComponentData, index),
    )
    .filter(Boolean) as ComponentData[]
}

function normalizeLoadedComponent(
  component: RawComponentData,
  index: number,
): ComponentData | null {
  const name = component.name ?? component.tag
  if (!isComponentName(name)) {
    return null
  }

  const props = {
    ...getFallbackProps(name, index),
    ...(component.props ?? {}),
  }
  const normalizedComponent: ComponentData = {
    id:
      typeof component.id === 'string' && component.id
        ? component.id
        : createComponentId(),
    name,
    props,
  }

  if (component.layerName) {
    normalizedComponent.layerName = component.layerName
  }
  if (component.isHidden !== undefined) {
    normalizedComponent.isHidden = component.isHidden
  }
  if (component.isLocked !== undefined) {
    normalizedComponent.isLocked = component.isLocked
  }
  if (component.events) {
    normalizedComponent.events = cloneEvents(component.events)
  }

  return normalizedComponent
}

function isComponentName(name: unknown): name is ComponentName {
  return name === 'l-text' || name === 'l-image' || name === 'l-button'
}

function getFallbackProps(
  name: ComponentName,
  index: number,
): ComponentProps {
  const offset = index * 16

  if (name === 'l-image') {
    return {
      label: '图片',
      left: 32 + offset,
      top: 96 + offset,
      width: 280,
      height: 160,
      src: '',
      alt: '图片',
      objectFit: 'cover',
      borderRadius: 0,
    }
  }

  if (name === 'l-button') {
    return {
      label: '按钮',
      left: 96 + offset,
      top: 160 + offset,
      width: 160,
      height: 44,
      text: '按钮内容',
      color: '#ffffff',
      backgroundColor: '#ff5a3c',
      fontSize: 16,
      borderRadius: 4,
    }
  }

  return {
    label: '文本',
    left: 32 + offset,
    top: 32 + offset,
    width: 220,
    height: 56,
    text: '文本内容',
    color: '#1f2329',
    fontSize: 20,
    fontWeight: 'normal',
    fontFamily: 'system-ui',
    lineHeight: 1.5,
    textAlign: 'left',
  }
}

function isSameValue(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right)
}

function sameArray(left: string[], right: string[]) {
  return left.length === right.length && left.every((item, index) => item === right[index])
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function normalizeCanvasZoom(zoom: number) {
  return Number(
    clampNumber(zoom, minCanvasZoom, maxCanvasZoom).toFixed(2),
  )
}
