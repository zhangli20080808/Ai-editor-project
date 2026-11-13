import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { isValidObjectId, Types, type Model } from 'mongoose'

import {
  User,
  type UserDocument,
  UserRole,
  UserStatus,
  UserType,
} from './schemas/user.schema'

export interface AuthUser {
  id: string
  username: string
  nickName: string
  picture: string
  phoneNumber: string
  role: UserRole
  status: UserStatus
}

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async findOrCreateByPhone(phoneNumber: string) {
    const existingUser = await this.userModel.findOne({ phoneNumber }).exec()
    if (existingUser) {
      return existingUser
    }

    return this.userModel.create({
      username: phoneNumber,
      phoneNumber,
      nickName: `用户${phoneNumber.slice(-4)}`,
      type: UserType.Cellphone,
    })
  }

  async findById(id: string) {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('用户不存在')
    }

    const user = await this.userModel.findById(id).exec()
    if (!user) {
      throw new NotFoundException('用户不存在')
    }

    return user
  }

  async search(keyword: string, currentUser: AuthUser) {
    const normalizedKeyword = keyword.trim()
    if (!normalizedKeyword) return []

    const keywordRegExp = new RegExp(escapeRegExp(normalizedKeyword), 'i')
    const users = await this.userModel
      .find({
        _id: { $ne: new Types.ObjectId(currentUser.id) },
        $or: [
          { username: keywordRegExp },
          { nickName: keywordRegExp },
          { phoneNumber: keywordRegExp },
        ],
      })
      .limit(10)
      .lean()
      .exec()

    return users.map((user) => ({
      id: String(user._id),
      username: user.username,
      nickName: user.nickName,
      picture: user.picture,
      phoneNumber: user.phoneNumber,
      role: user.role ?? UserRole.User,
      status: user.status ?? UserStatus.Active,
    }))
  }

  toAuthUser(user: UserDocument): AuthUser {
    return {
      id: String(user._id),
      username: user.username,
      nickName: user.nickName,
      picture: user.picture,
      phoneNumber: user.phoneNumber,
      role: user.role ?? UserRole.User,
      status: user.status ?? UserStatus.Active,
    }
  }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
