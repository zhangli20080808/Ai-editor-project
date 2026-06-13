import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose, { type HydratedDocument, type Types } from 'mongoose'

export enum WorkStatus {
  Deleted = 0,
  Unpublished = 1,
  Published = 2,
  ForceOffline = 3,
}

export interface WorkContent {
  components: unknown[]
  props: Record<string, unknown>
  setting?: Record<string, unknown>
}

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
    default: () => ({ components: [], props: {} }),
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
    default: WorkStatus.Unpublished,
    enum: Object.values(WorkStatus).filter((value) => typeof value === 'number'),
    index: true,
  })
  status!: WorkStatus

  @Prop({ default: false, index: true })
  isTemplate!: boolean

  @Prop({ default: false, index: true })
  isHot!: boolean

  @Prop({ default: 0, min: 0 })
  copiedCount!: number

  @Prop({ default: false, index: true })
  isPublic!: boolean

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null })
  user?: Types.ObjectId | null

  @Prop({ type: Date, default: null })
  latestPublishAt?: Date | null
}

export const WorkSchema = SchemaFactory.createForClass(Work)

WorkSchema.index({ createdAt: -1 })
