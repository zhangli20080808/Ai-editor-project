import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { isValidObjectId, Types, type Model } from 'mongoose'

import { AdminAuditService } from '../admin-audit/admin-audit.service'
import {
  AdminAuditAction,
  AdminAuditTargetType,
} from '../admin-audit/schemas/admin-audit-log.schema'
import { type AuthUser } from '../users/users.service'
import { type ListAdminWorksDto } from './dto/list-admin-works.dto'
import { type OfflineWorkDto } from './dto/offline-work.dto'
import { type RestorePublishWorkDto } from './dto/restore-publish-work.dto'
import { Work, type WorkDocument, WorkStatus } from './schemas/work.schema'

type WorkFilter = Record<string, unknown>

@Injectable()
export class AdminWorksService {
  constructor(
    @InjectModel(Work.name) private readonly workModel: Model<WorkDocument>,
    private readonly adminAuditService: AdminAuditService,
  ) {}

  async findAll(query: ListAdminWorksDto) {
    const page = query.page ?? 1
    const pageSize = Math.min(query.pageSize ?? 20, 100)
    const filter: WorkFilter = {}

    if (query.status !== undefined) {
      filter.status = query.status
    }

    applyKeywordFilter(filter, query.keyword)

    const [items, total] = await Promise.all([
      this.workModel
        .find(filter)
        .select(
          'uuid title author status isTemplate isPublic user latestPublishAt updatedAt createdAt',
        )
        .sort({ updatedAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean()
        .exec(),
      this.workModel.countDocuments(filter).exec(),
    ])

    return {
      items,
      page,
      pageSize,
      total,
    }
  }

  async findOne(id: string) {
    const work = await this.findWorkByIdentity(id)
    return work.toObject()
  }

  async offline(id: string, dto: OfflineWorkDto, operator: AuthUser) {
    const work = await this.findWorkByIdentity(id)
    if (work.status !== WorkStatus.Published) {
      throw new BadRequestException('仅已发布作品可强制下线')
    }

    const previousStatus = work.status
    work.status = WorkStatus.ForceOffline
    work.adminOfflineReason = dto.reason.trim()
    work.adminOfflineBy = new Types.ObjectId(operator.id)
    work.adminOfflineAt = new Date()
    await work.save()
    await this.createWorkAuditLog({
      action: AdminAuditAction.WorkOffline,
      work,
      operator,
      reason: work.adminOfflineReason,
      previousStatus,
      nextStatus: work.status,
    })

    return work.toObject()
  }

  async restorePublish(
    id: string,
    dto: RestorePublishWorkDto,
    operator: AuthUser,
  ) {
    const work = await this.findWorkByIdentity(id)
    if (work.status !== WorkStatus.ForceOffline) {
      throw new BadRequestException('仅已下线作品可恢复发布')
    }

    const previousStatus = work.status
    work.status = WorkStatus.Published
    await work.save()
    await this.createWorkAuditLog({
      action: AdminAuditAction.WorkRestorePublish,
      work,
      operator,
      reason: dto.reason?.trim() ?? '',
      previousStatus,
      nextStatus: work.status,
    })

    return work.toObject()
  }

  private async findWorkByIdentity(id: string) {
    const identityFilter = isValidObjectId(id)
      ? { $or: [{ _id: id }, { uuid: id }] }
      : { uuid: id }
    const work = await this.workModel.findOne(identityFilter).exec()

    if (!work) {
      throw new NotFoundException('作品不存在')
    }

    return work
  }

  private async createWorkAuditLog({
    action,
    work,
    operator,
    reason,
    previousStatus,
    nextStatus,
  }: {
    action: AdminAuditAction
    work: WorkDocument
    operator: AuthUser
    reason: string
    previousStatus: WorkStatus
    nextStatus: WorkStatus
  }) {
    await this.adminAuditService.create({
      action,
      targetType: AdminAuditTargetType.Work,
      targetId: String(work._id),
      targetUuid: work.uuid,
      operator: operator.id,
      operatorName: operator.nickName || operator.username,
      reason,
      snapshot: {
        title: work.title,
        previousStatus,
        nextStatus,
      },
    })
  }
}

function applyKeywordFilter(filter: WorkFilter, keyword?: string) {
  const normalizedKeyword = keyword?.trim()
  if (!normalizedKeyword) return

  const keywordRegExp = new RegExp(escapeRegExp(normalizedKeyword), 'i')
  filter.$or = [
    { uuid: keywordRegExp },
    { title: keywordRegExp },
    { author: keywordRegExp },
  ]
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
