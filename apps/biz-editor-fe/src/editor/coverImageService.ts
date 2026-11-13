import { toJpeg } from 'html-to-image'

const coverPixelRatio = 1
const coverQuality = 0.82
const coverWidth = 375
const coverTimeoutMs = 5000

export async function generateCoverImage(
  canvasElement: HTMLElement | null,
): Promise<string> {
  if (!canvasElement) {
    return ''
  }

  const canvasRect = canvasElement.getBoundingClientRect()
  const captureHeight = Math.min(
    canvasElement.scrollHeight,
    Math.max(canvasRect.height, 667),
  )

  let timeoutId: number | undefined
  try {
    return await Promise.race([
      toJpeg(canvasElement, {
        backgroundColor: '#ffffff',
        cacheBust: true,
        height: captureHeight,
        pixelRatio: coverPixelRatio,
        quality: coverQuality,
        style: {
          transform: 'none',
          transformOrigin: 'top left',
        },
        width: coverWidth,
      }),
      new Promise<string>((_, reject) => {
        timeoutId = window.setTimeout(
          () => reject(new Error('Cover image generation timed out')),
          coverTimeoutMs,
        )
      }),
    ])
  } finally {
    if (timeoutId !== undefined) window.clearTimeout(timeoutId)
  }
}
