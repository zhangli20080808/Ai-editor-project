import { useRef, type MouseEventHandler, type PropsWithChildren } from 'react'

import './SpotlightCard.css'

interface SpotlightCardProps extends PropsWithChildren {
  className?: string
  spotlightColor?: `rgba(${number}, ${number}, ${number}, ${number})`
}

export default function SpotlightCard({
  children,
  className = '',
  spotlightColor = 'rgba(255, 255, 255, 0.25)',
}: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null)

  const handleMouseMove: MouseEventHandler<HTMLDivElement> = (event) => {
    const element = ref.current
    if (!element) return

    const rect = element.getBoundingClientRect()
    element.style.setProperty('--mouse-x', `${event.clientX - rect.left}px`)
    element.style.setProperty('--mouse-y', `${event.clientY - rect.top}px`)
    element.style.setProperty('--spotlight-color', spotlightColor)
  }

  return (
    <div ref={ref} className={`card-spotlight ${className}`} onMouseMove={handleMouseMove}>
      {children}
    </div>
  )
}
