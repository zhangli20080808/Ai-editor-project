import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { isValidObjectId, type Model } from 'mongoose'

import {
  User,
  type UserDocument,
  UserRole,
  UserStatus,
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
