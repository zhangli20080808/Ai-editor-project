import type { LTextProps } from './types'

export function LText({
  text,
  className,
  color = '#1f2329',
  fontSize = 16,
  fontWeight = '400',
  fontFamily = 'system-ui',
  lineHeight = 1.5,
  style,
  textAlign = 'left',
}: LTextProps) {
  return (
    <div
      className={className}
      style={{
        color,
        fontSize,
        fontWeight,
        fontFamily,
        lineHeight,
        textAlign,
        ...style,
      }}
    >
      {text}
    </div>
  )
}
