import type { LTextProps } from './types'

export function LText({
  text,
  color = '#1f2329',
  fontSize = 16,
  fontWeight = '400',
  fontFamily = 'system-ui',
  lineHeight = 1.5,
  textAlign = 'left',
}: LTextProps) {
  return (
    <div
      style={{
        color,
        fontSize,
        fontWeight,
        fontFamily,
        lineHeight,
        textAlign,
      }}
    >
      {text}
    </div>
  )
}
