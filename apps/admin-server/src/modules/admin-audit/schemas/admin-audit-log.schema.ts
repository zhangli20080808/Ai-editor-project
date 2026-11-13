import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose, { type HydratedDocument, type Types } from 'mongoose'

export enum AdminAuditAction {
  WorkOffline = 'work.offline',
  WorkRestorePublish = 'work.restore_publish',
  UserFreeze = 'user.freeze',
  UserUnfreeze = 'user.unfreeze',
  TemplatePublish = 'template.publish',
  TemplateUnpublish = 'template.unpublish',
  TemplateRecommend = 'template.recommend',
  TemplateCancelRecommend = 'template.cancel_recommend',
}

export enum AdminAuditTargetType {
  Work = 'work',
  User = 'user',
  Template = 'template',
}

export type AdminAuditLogDocument = HydratedDocument<AdminAuditLog>

@Schema({
  collection: 'admin_audit_logs',
  timestamps: true,
})
export class AdminAuditLog {
  @Prop({
    required: true,
    enum: Object.values(AdminAuditAction),
    index: true,
  })
  action!: AdminAuditAction

  @Prop({
    required: true,
    enum: Object.values(AdminAuditTargetType),
    index: true,
  })
  targetType!: AdminAuditTargetType

  @Prop({ required: true, trim: true, index: true })
  targetId!: string

  @Prop({ default: '', trim: true, index: true })
  targetUuid!: string

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  operator!: Types.ObjectId

  @Prop({ required: true, trim: true })
  operatorName!: string

  @Prop({ default: '', trim: true })
  reason!: string

  @Prop({ type: mongoose.Schema.Types.Mixed, default: () => ({}) })
  snapshot!: Record<string, unknown>
}

export const AdminAuditLogSchema =
  SchemaFactory.createForClass(AdminAuditLog)

AdminAuditLogSchema.index({ createdAt: -1 })
AdminAuditLogSchema.index({ targetType: 1, targetId: 1, createdAt: -1 })
