import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { type HydratedDocument } from 'mongoose'

export type WorkVisitDocument = HydratedDocument<WorkVisit>

@Schema({
  collection: 'work_visits',
  timestamps: { createdAt: true, updatedAt: false },
})
export class WorkVisit {
  @Prop({ required: true, index: true })
  workUuid!: string

  @Prop({ default: 'page_view', index: true })
  eventName!: string

  @Prop({ default: '', index: true })
  channel!: string

  @Prop({ default: '' })
  referer!: string

  @Prop({ default: '' })
  userAgent!: string
}

export const WorkVisitSchema = SchemaFactory.createForClass(WorkVisit)

WorkVisitSchema.index({ workUuid: 1, channel: 1, createdAt: -1 })
