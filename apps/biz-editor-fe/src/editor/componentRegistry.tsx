import type {
  ComponentMeta,
  ComponentName,
  ComponentTemplate,
} from './types'
import { EditorText } from './externalComponents'
import { LButton, LImage } from './legoComponents'

const commonPositionSchema = [
  { field: 'left', label: 'X 坐标', component: 'InputNumber', min: 0 },
  { field: 'top', label: 'Y 坐标', component: 'InputNumber', min: 0 },
  { field: 'width', label: '宽度', component: 'InputNumber', min: 40 },
  { field: 'height', label: '高度', component: 'InputNumber', min: 20 },
] as const

export const componentRegistry: Record<ComponentName, ComponentMeta> = {
  'l-text': {
    name: 'l-text',
    label: '文本',
    component: EditorText,
    propSchema: [
      { field: 'text', label: '文本内容', component: 'TextArea' },
      { field: 'color', label: '文字颜色', component: 'Color' },
      { field: 'fontSize', label: '字号', component: 'InputNumber', min: 10 },
      {
        field: 'fontWeight',
        label: '字重',
        component: 'Radio',
        options: [
          { label: '常规', value: '400' },
          { label: '加粗', value: '700' },
        ],
      },
      {
        field: 'fontFamily',
        label: '字体',
        component: 'Select',
        options: [
          { label: '默认字体', value: 'system-ui' },
          { label: '黑体', value: 'SimHei' },
          { label: '宋体', value: 'SimSun' },
          { label: 'Arial', value: 'Arial' },
          { label: 'Georgia', value: 'Georgia' },
        ],
      },
      {
        field: 'lineHeight',
        label: '行高',
        component: 'Slider',
        min: 1,
        max: 3,
        step: 0.1,
        marks: {
          1: '1',
          2: '2',
          3: '3',
        },
      },
      {
        field: 'textAlign',
        label: '对齐方式',
        component: 'ButtonRadio',
        options: [
          { label: '左对齐', value: 'left' },
          { label: '居中', value: 'center' },
          { label: '右对齐', value: 'right' },
        ],
      },
      ...commonPositionSchema,
    ],
  },
  'l-image': {
    name: 'l-image',
    label: '图片',
    component: LImage,
    propSchema: [
      { field: 'src', label: '图片地址', component: 'Input' },
      { field: 'alt', label: '图片描述', component: 'Input' },
      {
        field: 'objectFit',
        label: '填充方式',
        component: 'Select',
        options: [
          { label: '裁剪填充', value: 'cover' },
          { label: '完整显示', value: 'contain' },
          { label: '拉伸填充', value: 'fill' },
        ],
      },
      { field: 'borderRadius', label: '圆角', component: 'InputNumber', min: 0 },
      ...commonPositionSchema,
    ],
  },
  'l-button': {
    name: 'l-button',
    label: '按钮',
    component: LButton,
    propSchema: [
      { field: 'text', label: '按钮文字', component: 'Input' },
      { field: 'color', label: '文字颜色', component: 'Color' },
      { field: 'backgroundColor', label: '背景颜色', component: 'Color' },
      { field: 'fontSize', label: '字号', component: 'InputNumber', min: 10 },
      { field: 'borderRadius', label: '圆角', component: 'InputNumber', min: 0 },
      ...commonPositionSchema,
    ],
  },
}

export const componentTemplates: ComponentTemplate[] = [
  {
    name: 'l-text',
    label: '文本',
    description: '标题、正文、说明文案',
    props: {
      label: '文本组件',
      left: 32,
      top: 32,
      width: 280,
      height: 48,
      text: '双击右侧设置修改文本',
      color: '#1f2329',
      fontSize: 20,
      fontWeight: '700',
      fontFamily: 'system-ui',
      lineHeight: 1.5,
      textAlign: 'left',
    },
    events: {
      click: [
        {
          type: 'track',
          eventName: 'text_click',
        },
      ],
    },
  },
  {
    name: 'l-image',
    label: '图片',
    description: 'Banner、商品图、封面图',
    props: {
      label: '图片组件',
      left: 32,
      top: 104,
      width: 280,
      height: 160,
      src: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80',
      alt: '示例图片',
      objectFit: 'cover',
      borderRadius: 6,
    },
    events: {
      click: [
        {
          type: 'track',
          eventName: 'image_click',
        },
      ],
    },
  },
  {
    name: 'l-button',
    label: '按钮',
    description: '跳转、报名、领取优惠',
    props: {
      label: '按钮组件',
      left: 32,
      top: 288,
      width: 220,
      height: 48,
      text: '立即行动',
      color: '#ffffff',
      backgroundColor: '#ff5a3c',
      fontSize: 16,
      borderRadius: 6,
    },
    events: {
      click: [
        {
          type: 'track',
          eventName: 'button_click',
        },
        {
          type: 'link',
          url: 'https://example.com',
        },
      ],
    },
  },
]
