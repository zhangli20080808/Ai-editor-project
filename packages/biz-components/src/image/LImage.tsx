import type { LImageProps } from './types'

export function LImage({
  src,
  alt = '',
  className,
  objectFit = 'cover',
  borderRadius = 0,
  style,
}: LImageProps) {
  return (
    <img
      alt={alt}
      className={className}
      src={src}
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
        objectFit,
        borderRadius,
        ...style,
      }}
    />
  )
}
