import { LText } from '@zhangli2008/ai-editor-components'
import type { ComponentProps } from './types'

export function EditorText(props: ComponentProps) {
  return (
    <LText
      text={String(props.text ?? '')}
      color={props.color as string}
      fontSize={Number(props.fontSize)}
      fontWeight={props.fontWeight as string}
      fontFamily={props.fontFamily as string}
      lineHeight={Number(props.lineHeight)}
      textAlign={props.textAlign as 'left' | 'center' | 'right'}
    />
  )
}
