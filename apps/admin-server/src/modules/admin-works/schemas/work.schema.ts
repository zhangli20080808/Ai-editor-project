import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose, { type HydratedDocument, type Types } from 'mongoose'
import type { WorkContent } from '@zhangli2008/ai-editor-schema' with {
  "resolution-mode": "import"
}

export enum WorkStatus {
  Deleted = 0,
  Unpublished = 1,
  Published = 2,
  ForceOffline = 3,
}

export interface WorkChannel {
  id: string
  name: string
  createdAt: Date
}

const defaultPageSetting = () => ({
  backgroundColor: '#ffffff',
  backgroundImage: '',
  backgroundRepeat: 'no-repeat',
  backgroundSize: 'cover',
  height: 640,
})

export type WorkDocument = HydratedDocument<Work>

@Schema({
  collection: 'works',
  timestamps: true,
})
export class Work {
  @Prop({ required: true, unique: true, index: true })
  uuid!: string

  @Prop({ required: true, trim: true })
  title!: string

  @Prop({ default: '', trim: true })
  desc!: string

  @Prop({
    type: mongoose.Schema.Types.Mixed,
    default: () => ({ components: [], props: defaultPageSetting() }),
  })
  content!: WorkContent

  @Prop({
    type: mongoose.Schema.Types.Mixed,
    default: null,
  })
  publishedContent?: WorkContent | null

  @Prop({ required: true, trim: true })
  author!: string

  @Prop({ default: '', trim: true })
  coverImg!: string

  @Prop({
    type: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true, trim: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    default: () => [],
  })
  channels!: WorkChannel[]

  @Prop({
    default: WorkStatus.Unpublished,
    enum: Object.values(WorkStatus).filter((value) => typeof value === 'number'),
    index: true,
  })
  status!: WorkStatus

  @Prop({ default: false, index: true })
  isTemplate!: boolean

  @Prop({ default: '', trim: true, index: true })
  sourceWorkUuid!: string

  @Prop({ default: '', trim: true, index: true })
  sourceTemplateUuid!: string

  @Prop({ type: [String], default: [] })
  templateTags!: string[]

  @Prop({ default: false, index: true })
  isHot!: boolean

  @Prop({ default: 0, min: 0 })
  copiedCount!: number

  @Prop({ default: 0, min: 0, index: true })
  viewCount!: number

  @Prop({ default: 0, min: 0, index: true })
  favoriteCount!: number

  @Prop({ default: false, index: true })
  isPublic!: boolean

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null })
  user?: Types.ObjectId | null

  @Prop({ type: Date, default: null })
  latestPublishAt?: Date | null

  @Prop({ default: '', trim: true })
  adminOfflineReason!: string

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null })
  adminOfflineBy?: Types.ObjectId | null

  @Prop({ type: Date, default: null })
  adminOfflineAt?: Date | null
}

export const WorkSchema = SchemaFactory.createForClass(Work)

WorkSchema.index({ createdAt: -1 })
