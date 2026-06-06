import type { CSSProperties } from 'react'

export interface LTextProps {
  text: string
  color?: string
  fontSize?: number
  fontWeight?: CSSProperties['fontWeight']
  fontFamily?: CSSProperties['fontFamily']
  lineHeight?: CSSProperties['lineHeight']
  textAlign?: CSSProperties['textAlign']
}
