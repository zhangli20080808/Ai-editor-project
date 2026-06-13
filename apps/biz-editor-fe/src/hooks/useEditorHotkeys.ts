import hotkeys from 'hotkeys-js'
import { useEffect } from 'react'

import { useEditorStore } from '../editor/editorStore'

const hotkeyScope = 'editor'
const shortcutKeys = [
  'command+c',
  'ctrl+c',
  'command+v',
  'ctrl+v',
  'backspace',
  'delete',
  'esc',
  'up',
  'down',
  'left',
  'right',
  'shift+up',
  'shift+down',
  'shift+left',
  'shift+right',
  'command+z',
  'ctrl+z',
  'command+shift+z',
  'ctrl+shift+z',
].join(',')

export function useEditorHotkeys() {
  useEffect(() => {
    const previousFilter = hotkeys.filter

    hotkeys.filter = (event) => {
      const target = event.target as HTMLElement | null
      if (!target) {
        return true
      }

      if (isUndoRedoHotkey(event)) {
        return true
      }

      return !(
        target.isContentEditable ||
        target.closest('input, textarea, select, [contenteditable="true"]')
      )
    }

    hotkeys.setScope(hotkeyScope)
    hotkeys(shortcutKeys, hotkeyScope, (event) => {
      const store = useEditorStore.getState()
      const key = event.key.toLowerCase()
      const isCommandKey = event.ctrlKey || event.metaKey

      event.preventDefault()
      event.stopPropagation()

      if (isCommandKey && key === 'c') {
        store.copyCurrentComponent()
        return
      }

      if (isCommandKey && key === 'v') {
        store.pasteCopiedComponent()
        return
      }

      if (isCommandKey && key === 'z') {
        if (event.shiftKey) {
          store.redo()
        } else {
          store.undo()
        }
        return
      }

      if (key === 'backspace' || key === 'delete') {
        store.removeCurrentComponent()
        return
      }

      if (key === 'escape' || key === 'esc') {
        store.selectComponent(null)
        return
      }

      const moveStep = event.shiftKey ? 10 : 1
      if (key === 'arrowup') {
        store.moveCurrentComponent(0, -moveStep)
        return
      }

      if (key === 'arrowdown') {
        store.moveCurrentComponent(0, moveStep)
        return
      }

      if (key === 'arrowleft') {
        store.moveCurrentComponent(-moveStep, 0)
        return
      }

      if (key === 'arrowright') {
        store.moveCurrentComponent(moveStep, 0)
      }
    })

    return () => {
      hotkeys.unbind(shortcutKeys, hotkeyScope)
      hotkeys.filter = previousFilter
    }
  }, [])
}

function isUndoRedoHotkey(event: KeyboardEvent) {
  return (
    (event.ctrlKey || event.metaKey) &&
    event.key.toLowerCase() === 'z'
  )
}
