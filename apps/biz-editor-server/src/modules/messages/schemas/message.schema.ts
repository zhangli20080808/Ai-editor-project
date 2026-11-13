import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Types, type HydratedDocument } from 'mongoose'

export type MessageDocument = HydratedDocument<Message>

export enum MessageType {
  System = 'system',
  Transfer = 'transfer',
}

@Schema({
  collection: 'messages',
  timestamps: true,
})
export class Message {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  user!: Types.ObjectId

  @Prop({
    default: MessageType.System,
    enum: Object.values(MessageType),
    index: true,
  })
  type!: MessageType

  @Prop({ required: true, trim: true })
  title!: string

  @Prop({ default: '', trim: true })
  content!: string

  @Prop({ default: false, index: true })
  isRead!: boolean

  @Prop({ default: '', trim: true })
  workUuid!: string

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  fromUser?: Types.ObjectId | null
}

export const MessageSchema = SchemaFactory.createForClass(Message)

MessageSchema.index({ user: 1, createdAt: -1 })
