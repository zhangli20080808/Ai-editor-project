import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Types, type Model } from 'mongoose'

import type { AuthUser } from '../users/users.service'
import {
  Message,
  type MessageDocument,
  MessageType,
} from './schemas/message.schema'

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
  ) {}

  async findAll(currentUser: AuthUser) {
    const items = await this.messageModel
      .find({ user: new Types.ObjectId(currentUser.id) })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean()
      .exec()
    const unreadCount = await this.messageModel
      .countDocuments({
        user: new Types.ObjectId(currentUser.id),
        isRead: false,
      })
      .exec()

    return {
      items,
      unreadCount,
    }
  }

  async markAsRead(id: string, currentUser: AuthUser) {
    const message = await this.messageModel
      .findOneAndUpdate(
        { _id: id, user: new Types.ObjectId(currentUser.id) },
        { isRead: true },
        { new: true },
      )
      .lean()
      .exec()

    if (!message) {
      throw new NotFoundException('消息不存在')
    }

    return message
  }

  async markAllAsRead(currentUser: AuthUser) {
    await this.messageModel
      .updateMany(
        { user: new Types.ObjectId(currentUser.id), isRead: false },
        { isRead: true },
      )
      .exec()

    return { ok: true }
  }

  async createTransferMessage(options: {
    targetUserId: string
    fromUserId: string
    fromUserName: string
    workTitle: string
    workUuid: string
  }) {
    const message = await this.messageModel.create({
      user: new Types.ObjectId(options.targetUserId),
      fromUser: new Types.ObjectId(options.fromUserId),
      type: MessageType.Transfer,
      title: '收到作品转赠',
      content: `${options.fromUserName} 将作品「${options.workTitle || '未命名作品'}」转赠给你。`,
      isRead: false,
      workUuid: options.workUuid,
    })

    return message.toObject()
  }
}
