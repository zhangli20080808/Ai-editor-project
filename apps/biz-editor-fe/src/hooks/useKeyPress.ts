import { useEffect } from 'react'

export function useKeyPress(
  key: string,
  handler: (event: KeyboardEvent) => void,
  enabled = true,
) {
  useEffect(() => {
    if (!enabled) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === key) {
        handler(event)
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [enabled, handler, key])
}
