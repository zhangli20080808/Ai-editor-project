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
import { type ListAdminTemplatesDto } from './dto/list-admin-templates.dto'
import { type TemplateActionDto } from './dto/template-action.dto'
import {
  Work,
  type WorkDocument,
  WorkStatus,
} from '../admin-works/schemas/work.schema'

type TemplateFilter = Record<string, unknown>

@Injectable()
export class AdminTemplatesService {
  constructor(
    @InjectModel(Work.name) private readonly workModel: Model<WorkDocument>,
    private readonly adminAuditService: AdminAuditService,
  ) {}

  async findAll(query: ListAdminTemplatesDto) {
    const page = query.page ?? 1
    const pageSize = Math.min(query.pageSize ?? 20, 100)
    const filter: TemplateFilter = {
      isTemplate: true,
    }

    if (query.isPublic !== undefined) filter.isPublic = query.isPublic
    if (query.isHot !== undefined) filter.isHot = query.isHot
    const templateTag = query.templateTag?.trim()
    if (templateTag) filter.templateTags = templateTag
    applyKeywordFilter(filter, query.keyword)

    const [items, total] = await Promise.all([
      this.workModel
        .find(filter)
        .select(
          'uuid title desc author status isPublic isHot sourceWorkUuid templateTags copiedCount latestPublishAt updatedAt createdAt',
        )
        .sort({ isHot: -1, updatedAt: -1 })
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
    const template = await this.findTemplateByIdentity(id)
    return template.toObject()
  }

  async publish(
    id: string,
    dto: TemplateActionDto,
    operator: AuthUser,
  ) {
    const template = await this.findTemplateByIdentity(id)
    if (template.status !== WorkStatus.Published) {
      throw new BadRequestException('仅已发布模板可上架')
    }
    if (template.isPublic) {
      throw new BadRequestException('模板已上架')
    }

    const previous = snapshotTemplateState(template)
    template.isPublic = true
    await template.save()
    await this.createTemplateAuditLog({
      action: AdminAuditAction.TemplatePublish,
      template,
      operator,
      reason: dto.reason?.trim() ?? '',
      previous,
    })

    return template.toObject()
  }

  async unpublish(
    id: string,
    dto: TemplateActionDto,
    operator: AuthUser,
  ) {
    const template = await this.findTemplateByIdentity(id)
    if (!template.isPublic) {
      throw new BadRequestException('模板已下架')
    }

    const previous = snapshotTemplateState(template)
    template.isPublic = false
    template.isHot = false
    await template.save()
    await this.createTemplateAuditLog({
      action: AdminAuditAction.TemplateUnpublish,
      template,
      operator,
      reason: dto.reason?.trim() ?? '',
      previous,
    })

    return template.toObject()
  }

  async recommend(
    id: string,
    dto: TemplateActionDto,
    operator: AuthUser,
  ) {
    const template = await this.findTemplateByIdentity(id)
    if (template.status !== WorkStatus.Published || !template.isPublic) {
      throw new BadRequestException('仅已上架模板可推荐')
    }
    if (template.isHot) {
      throw new BadRequestException('模板已推荐')
    }

    const previous = snapshotTemplateState(template)
    template.isHot = true
    await template.save()
    await this.createTemplateAuditLog({
      action: AdminAuditAction.TemplateRecommend,
      template,
      operator,
      reason: dto.reason?.trim() ?? '',
      previous,
    })

    return template.toObject()
  }

  async cancelRecommend(
    id: string,
    dto: TemplateActionDto,
    operator: AuthUser,
  ) {
    const template = await this.findTemplateByIdentity(id)
    if (!template.isHot) {
      throw new BadRequestException('模板未推荐')
    }

    const previous = snapshotTemplateState(template)
    template.isHot = false
    await template.save()
    await this.createTemplateAuditLog({
      action: AdminAuditAction.TemplateCancelRecommend,
      template,
      operator,
      reason: dto.reason?.trim() ?? '',
      previous,
    })

    return template.toObject()
  }

  private async findTemplateByIdentity(id: string) {
    const identityFilter = isValidObjectId(id)
      ? { $or: [{ _id: id }, { uuid: id }] }
      : { uuid: id }
    const template = await this.workModel
      .findOne({ ...identityFilter, isTemplate: true })
      .exec()

    if (!template) {
      throw new NotFoundException('模板不存在')
    }

    return template
  }

  private async createTemplateAuditLog({
    action,
    template,
    operator,
    reason,
    previous,
  }: {
    action: AdminAuditAction
    template: WorkDocument
    operator: AuthUser
    reason: string
    previous: Record<string, unknown>
  }) {
    await this.adminAuditService.create({
      action,
      targetType: AdminAuditTargetType.Template,
      targetId: String(template._id),
      targetUuid: template.uuid,
      operator: operator.id,
      operatorName: operator.nickName || operator.username,
      reason,
      snapshot: {
        title: template.title,
        previous,
        next: snapshotTemplateState(template),
      },
    })
  }
}

function snapshotTemplateState(template: WorkDocument) {
  return {
    status: template.status,
    isPublic: template.isPublic,
    isHot: template.isHot,
    templateTags: template.templateTags,
  }
}

function applyKeywordFilter(filter: TemplateFilter, keyword?: string) {
  const normalizedKeyword = keyword?.trim()
  if (!normalizedKeyword) return

  const keywordRegExp = new RegExp(escapeRegExp(normalizedKeyword), 'i')
  filter.$or = [
    { uuid: keywordRegExp },
    { title: keywordRegExp },
    { author: keywordRegExp },
    { templateTags: keywordRegExp },
  ]
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
