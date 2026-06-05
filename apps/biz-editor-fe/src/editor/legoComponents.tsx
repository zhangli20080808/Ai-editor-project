import type { ComponentProps } from './types'

export function LText(props: ComponentProps) {
  return (
    <div
      style={{
        color: props.color as string,
        fontSize: Number(props.fontSize),
        fontWeight: props.fontWeight as string,
        lineHeight: props.lineHeight as string,
        textAlign: props.textAlign as 'left' | 'center' | 'right',
      }}
    >
      {props.text as string}
    </div>
  )
}

export function LImage(props: ComponentProps) {
  return (
    <img
      src={props.src as string}
      alt={props.alt as string}
      style={{
        display: 'block',
        width: '100%',
        height: Number(props.height),
        objectFit: props.objectFit as 'cover' | 'contain' | 'fill',
        borderRadius: Number(props.borderRadius),
      }}
    />
  )
}

export function LButton(props: ComponentProps) {
  return (
    <button
      className="lego-button"
      style={{
        width: '100%',
        height: Number(props.height),
        color: props.color as string,
        backgroundColor: props.backgroundColor as string,
        borderRadius: Number(props.borderRadius),
        fontSize: Number(props.fontSize),
      }}
      type="button"
    >
      {props.text as string}
    </button>
  )
}
