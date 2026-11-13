import { motion, type Transition } from 'motion/react'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

interface BlurTextProps {
  text?: string
  delay?: number
  className?: string
  animateBy?: 'words' | 'letters'
  direction?: 'top' | 'bottom'
  threshold?: number
  rootMargin?: string
  animationFrom?: Record<string, string | number>
  animationTo?: Array<Record<string, string | number>>
  easing?: (value: number) => number
  onAnimationComplete?: () => void
  stepDuration?: number
}

const buildKeyframes = (
  from: Record<string, string | number>,
  steps: Array<Record<string, string | number>>,
) => {
  const keys = new Set([...Object.keys(from), ...steps.flatMap((step) => Object.keys(step))])
  const keyframes: Record<string, Array<string | number>> = {}
  keys.forEach((key) => {
    const initialValue = from[key] ?? steps.find((step) => step[key] !== undefined)?.[key] ?? 0
    keyframes[key] = [
      initialValue,
      ...steps.map((step) => step[key] ?? initialValue),
    ]
  })
  return keyframes
}

export default function BlurText({
  text = '',
  delay = 200,
  className = '',
  animateBy = 'words',
  direction = 'top',
  threshold = 0.1,
  rootMargin = '0px',
  animationFrom,
  animationTo,
  easing = (value) => value,
  onAnimationComplete,
  stepDuration = 0.35,
}: BlurTextProps) {
  const elements = animateBy === 'words' ? text.split(' ') : text.split('')
  const [inView, setInView] = useState(false)
  const ref = useRef<HTMLHeadingElement>(null)
  const [reducedMotion] = useState(() =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const element = ref.current
    if (!element || reducedMotion) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true)
          observer.unobserve(element)
        }
      },
      { threshold, rootMargin },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [reducedMotion, rootMargin, threshold])

  const defaultFrom = useMemo(
    () => ({ filter: 'blur(10px)', opacity: 0, y: direction === 'top' ? -50 : 50 }),
    [direction],
  )
  const defaultTo = useMemo(
    () => [
      { filter: 'blur(5px)', opacity: 0.5, y: direction === 'top' ? 5 : -5 },
      { filter: 'blur(0px)', opacity: 1, y: 0 },
    ],
    [direction],
  )
  const fromSnapshot = animationFrom ?? defaultFrom
  const toSnapshots = animationTo ?? defaultTo
  const stepCount = toSnapshots.length + 1
  const transition: Omit<Transition, 'delay'> = {
    duration: stepDuration * (stepCount - 1),
    times: Array.from({ length: stepCount }, (_, index) => index / (stepCount - 1)),
    ease: easing,
  }

  return (
    <h1 ref={ref} className={className} style={{ display: 'flex', flexWrap: 'wrap' }}>
      {elements.map((segment, index) => (
      <motion.span
        key={`${segment}-${index}`}
        initial={reducedMotion ? false : fromSnapshot}
        animate={reducedMotion || inView ? buildKeyframes(fromSnapshot, toSnapshots) : fromSnapshot}
        transition={{ ...transition, delay: reducedMotion ? 0 : (index * delay) / 1000 }}
        {...(index === elements.length - 1 && onAnimationComplete
          ? { onAnimationComplete }
          : {})}
        style={{ display: 'inline-block', willChange: 'transform, filter, opacity' }}
      >
        {segment}
        {animateBy === 'words' && index < elements.length - 1 ? '\u00a0' : null}
      </motion.span>
      ))}
    </h1>
  )
}
