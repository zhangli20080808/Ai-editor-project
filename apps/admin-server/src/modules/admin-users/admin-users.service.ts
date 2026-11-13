import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { isValidObjectId, type Model } from 'mongoose'

import { AdminAuditService } from '../admin-audit/admin-audit.service'
import {
  AdminAuditAction,
  AdminAuditTargetType,
} from '../admin-audit/schemas/admin-audit-log.schema'
import { type AuthUser } from '../users/users.service'
import {
  User,
  type UserDocument,
  UserStatus,
} from '../users/schemas/user.schema'
import { type FreezeUserDto } from './dto/freeze-user.dto'
import { type ListAdminUsersDto } from './dto/list-admin-users.dto'
import { type UnfreezeUserDto } from './dto/unfreeze-user.dto'

type UserFilter = Record<string, unknown>

@Injectable()
export class AdminUsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly adminAuditService: AdminAuditService,
  ) {}

  async findAll(query: ListAdminUsersDto) {
    const page = query.page ?? 1
    const pageSize = Math.min(query.pageSize ?? 20, 100)
    const filter: UserFilter = {}

    if (query.role) {
      filter.role = query.role
    }
    if (query.status) {
      filter.status = query.status
    }

    applyKeywordFilter(filter, query.keyword)

    const [items, total] = await Promise.all([
      this.userModel
        .find(filter)
        .select(
          'username nickName picture phoneNumber city type provider role status frozenReason frozenAt updatedAt createdAt',
        )
        .sort({ updatedAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean()
        .exec(),
      this.userModel.countDocuments(filter).exec(),
    ])

    return {
      items: items.map(normalizeAdminUser),
      page,
      pageSize,
      total,
    }
  }

  async findOne(id: string) {
    const user = await this.findUserById(id)
    return normalizeAdminUser(user.toObject())
  }

  async freeze(id: string, dto: FreezeUserDto, operator: AuthUser) {
    const user = await this.findUserById(id)
    if (String(user._id) === operator.id) {
      throw new BadRequestException('不能冻结当前登录管理员')
    }
    if (user.status === UserStatus.Frozen) {
      throw new BadRequestException('用户已被冻结')
    }

    const previousStatus = user.status ?? UserStatus.Active
    user.status = UserStatus.Frozen
    user.frozenReason = dto.reason
    user.frozenAt = new Date()
    await user.save()
    await this.createUserAuditLog({
      action: AdminAuditAction.UserFreeze,
      user,
      operator,
      reason: user.frozenReason,
      previousStatus,
      nextStatus: user.status,
    })

    return normalizeAdminUser(user.toObject())
  }

  async unfreeze(id: string, dto: UnfreezeUserDto, operator: AuthUser) {
    const user = await this.findUserById(id)
    if (user.status !== UserStatus.Frozen) {
      throw new BadRequestException('用户未被冻结')
    }

    const previousStatus = user.status
    user.status = UserStatus.Active
    user.frozenReason = ''
    user.frozenAt = null
    await user.save()
    await this.createUserAuditLog({
      action: AdminAuditAction.UserUnfreeze,
      user,
      operator,
      reason: dto.reason ?? '',
      previousStatus,
      nextStatus: user.status,
    })

    return normalizeAdminUser(user.toObject())
  }

  private async findUserById(id: string) {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('用户不存在')
    }

    const user = await this.userModel.findById(id).exec()
    if (!user) {
      throw new NotFoundException('用户不存在')
    }

    return user
  }

  private async createUserAuditLog({
    action,
    user,
    operator,
    reason,
    previousStatus,
    nextStatus,
  }: {
    action: AdminAuditAction
    user: UserDocument
    operator: AuthUser
    reason: string
    previousStatus: UserStatus
    nextStatus: UserStatus
  }) {
    await this.adminAuditService.create({
      action,
      targetType: AdminAuditTargetType.User,
      targetId: String(user._id),
      targetUuid: String(user._id),
      operator: operator.id,
      operatorName: operator.nickName || operator.username,
      reason,
      snapshot: {
        username: user.username,
        nickName: user.nickName,
        phoneNumber: user.phoneNumber,
        previousStatus,
        nextStatus,
      },
    })
  }
}

function applyKeywordFilter(filter: UserFilter, keyword?: string) {
  const normalizedKeyword = keyword?.trim()
  if (!normalizedKeyword) return

  const keywordRegExp = new RegExp(escapeRegExp(normalizedKeyword), 'i')
  filter.$or = [
    { username: keywordRegExp },
    { nickName: keywordRegExp },
    { phoneNumber: keywordRegExp },
  ]
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function normalizeAdminUser<T extends { role?: unknown; status?: unknown }>(
  user: T,
) {
  return {
    ...user,
    role: user.role ?? 'user',
    status: user.status ?? UserStatus.Active,
  }
}
