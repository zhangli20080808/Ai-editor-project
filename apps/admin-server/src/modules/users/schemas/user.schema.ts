import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { type HydratedDocument } from 'mongoose'

export type UserDocument = HydratedDocument<User>

export enum UserType {
  Email = 'email',
  Cellphone = 'cellphone',
  Oauth = 'oauth',
}

export enum OauthProvider {
  Gitee = 'gitee',
  Github = 'github',
  Weixin = 'weixin',
}

export enum UserRole {
  User = 'user',
  Admin = 'admin',
}

export enum UserStatus {
  Active = 'active',
  Frozen = 'frozen',
}

@Schema({
  collection: 'users',
  timestamps: true,
})
export class User {
  @Prop({ required: true, trim: true, unique: true, index: true })
  username!: string

  @Prop({ default: '', select: false })
  password!: string

  @Prop({ default: '', trim: true })
  nickName!: string

  @Prop({ default: '', trim: true })
  picture!: string

  @Prop({ default: '', trim: true, unique: true, sparse: true, index: true })
  phoneNumber!: string

  @Prop({ default: '', trim: true })
  city!: string

  @Prop({
    default: UserType.Cellphone,
    enum: Object.values(UserType),
    index: true,
  })
  type!: UserType

  @Prop({
    type: String,
    default: null,
    enum: [...Object.values(OauthProvider), null],
  })
  provider?: OauthProvider | null

  @Prop({ default: '', trim: true })
  oauthID!: string

  @Prop({
    default: UserRole.User,
    enum: Object.values(UserRole),
    index: true,
  })
  role!: UserRole

  @Prop({
    default: UserStatus.Active,
    enum: Object.values(UserStatus),
    index: true,
  })
  status!: UserStatus

  @Prop({ default: '', trim: true })
  frozenReason!: string

  @Prop({ type: Date, default: null })
  frozenAt?: Date | null
}

export const UserSchema = SchemaFactory.createForClass(User)

UserSchema.index({ provider: 1, oauthID: 1 })
