import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { type HydratedDocument, Types } from 'mongoose'

export type WorkFavoriteDocument = HydratedDocument<WorkFavorite>

@Schema({ collection: 'work_favorites', timestamps: { createdAt: true, updatedAt: false } })
export class WorkFavorite {
  @Prop({ required: true, index: true })
  workUuid!: string

  @Prop({ type: Types.ObjectId, required: true, index: true })
  user!: Types.ObjectId
}

export const WorkFavoriteSchema = SchemaFactory.createForClass(WorkFavorite)

WorkFavoriteSchema.index({ workUuid: 1, user: 1 }, { unique: true })
