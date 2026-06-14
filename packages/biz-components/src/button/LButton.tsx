import type { LButtonProps } from './types'

export function LButton({
  text,
  className,
  color = '#ffffff',
  backgroundColor = '#ff5a3c',
  borderRadius = 4,
  fontSize = 16,
  style,
}: LButtonProps) {
  return (
    <button
      className={className}
      style={{
        width: '100%',
        height: '100%',
        cursor: 'pointer',
        color,
        backgroundColor,
        border: 0,
        borderRadius,
        fontSize,
        ...style,
      }}
      type="button"
    >
      {text}
    </button>
  )
}
