import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { isValidObjectId, type Model } from 'mongoose'

import { type ListAdminAuditLogsDto } from './dto/list-admin-audit-logs.dto'
import {
  AdminAuditAction,
  AdminAuditLog,
  type AdminAuditLogDocument,
  AdminAuditTargetType,
} from './schemas/admin-audit-log.schema'

type AuditLogFilter = Record<string, unknown>

export interface CreateAdminAuditLogInput {
  action: AdminAuditAction
  targetType: AdminAuditTargetType
  targetId: string
  targetUuid?: string
  operator: string
  operatorName: string
  reason?: string
  snapshot?: Record<string, unknown>
}

@Injectable()
export class AdminAuditService {
  constructor(
    @InjectModel(AdminAuditLog.name)
    private readonly adminAuditLogModel: Model<AdminAuditLogDocument>,
  ) {}

  async findAll(query: ListAdminAuditLogsDto) {
    const page = query.page ?? 1
    const pageSize = Math.min(query.pageSize ?? 20, 100)
    const filter: AuditLogFilter = {}

    if (query.action) {
      filter.action = query.action
    }
    if (query.targetType) {
      filter.targetType = query.targetType
    }
    if (query.targetUuid) {
      filter.targetUuid = query.targetUuid.trim()
    }

    applyKeywordFilter(filter, query.keyword)

    const [items, total] = await Promise.all([
      this.adminAuditLogModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean()
        .exec(),
      this.adminAuditLogModel.countDocuments(filter).exec(),
    ])

    return {
      items,
      page,
      pageSize,
      total,
    }
  }

  async findOne(id: string) {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('审计记录不存在')
    }

    const auditLog = await this.adminAuditLogModel.findById(id).lean().exec()
    if (!auditLog) {
      throw new NotFoundException('审计记录不存在')
    }

    return auditLog
  }

  async create(input: CreateAdminAuditLogInput) {
    return this.adminAuditLogModel.create({
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      targetUuid: input.targetUuid ?? '',
      operator: input.operator,
      operatorName: input.operatorName,
      reason: input.reason ?? '',
      snapshot: input.snapshot ?? {},
    })
  }
}

function applyKeywordFilter(filter: AuditLogFilter, keyword?: string) {
  const normalizedKeyword = keyword?.trim()
  if (!normalizedKeyword) return

  const keywordRegExp = new RegExp(escapeRegExp(normalizedKeyword), 'i')
  filter.$or = [
    { targetUuid: keywordRegExp },
    { operatorName: keywordRegExp },
    { reason: keywordRegExp },
  ]
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
