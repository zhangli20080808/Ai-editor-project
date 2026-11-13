import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import type { WorkContent } from '@zhangli2008/ai-editor-schema' with { "resolution-mode": "import" }
import mongoose, { type HydratedDocument, type Types } from 'mongoose'

export type AiRunDocument = HydratedDocument<AiRun>

@Schema({ collection: 'ai_runs', timestamps: true })
export class AiRun {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true })
  user!: Types.ObjectId

  @Prop({ required: true, enum: ['running', 'completed', 'failed'], index: true })
  status!: 'running' | 'completed' | 'failed'

  @Prop({ required: true, trim: true })
  scene!: string

  @Prop({ required: true, trim: true, maxlength: 80 })
  topic!: string

  @Prop({ type: mongoose.Schema.Types.Mixed, default: () => ({}) })
  request!: Record<string, unknown>

  @Prop({ type: [mongoose.Schema.Types.Mixed], default: () => [] })
  steps!: Array<Record<string, unknown>>

  @Prop({ default: '', trim: true })
  model!: string

  @Prop({ default: '', trim: true })
  title!: string

  @Prop({ default: '', trim: true })
  desc!: string

  @Prop({ type: mongoose.Schema.Types.Mixed, default: null })
  draft?: WorkContent | null

  @Prop({ default: '', trim: true })
  errorMessage!: string
}

export const AiRunSchema = SchemaFactory.createForClass(AiRun)
AiRunSchema.index({ user: 1, createdAt: -1 })
