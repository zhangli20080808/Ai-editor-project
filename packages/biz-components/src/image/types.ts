import type { CSSProperties } from 'react'

export interface LImageProps {
  src: string
  alt?: string
  className?: string
  objectFit?: CSSProperties['objectFit']
  borderRadius?: number
  style?: CSSProperties
}
