import type { CSSProperties } from 'react'

export interface LTextProps {
  text: string
  className?: string
  color?: string
  fontSize?: number
  fontWeight?: CSSProperties['fontWeight']
  fontFamily?: CSSProperties['fontFamily']
  lineHeight?: CSSProperties['lineHeight']
  style?: CSSProperties
  textAlign?: CSSProperties['textAlign']
}
