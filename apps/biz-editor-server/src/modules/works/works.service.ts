import { randomUUID } from 'node:crypto'

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { isValidObjectId, Types, type Model } from 'mongoose'

import type { AuthUser } from '../users/users.service'
import { type CreateChannelDto } from './dto/create-channel.dto'
import { type CreateWorkDto } from './dto/create-work.dto'
import { type ListWorksDto } from './dto/list-works.dto'
import { type MarkTemplateDto } from './dto/mark-template.dto'
import { type RecordVisitDto } from './dto/record-visit.dto'
import { type UpdateWorkDto } from './dto/update-work.dto'
import {
  WorkVisit,
  type WorkVisitDocument,
} from './schemas/work-visit.schema'
import {
  Work,
  type WorkChannel,
  type WorkContent,
  type WorkDocument,
  WorkStatus,
} from './schemas/work.schema'

const defaultContent = (): WorkContent => ({
  components: [],
  props: {},
})

type WorkFilter = Record<string, unknown>

@Injectable()
export class WorksService {
  constructor(
    @InjectModel(Work.name) private readonly workModel: Model<WorkDocument>,
    @InjectModel(WorkVisit.name)
    private readonly workVisitModel: Model<WorkVisitDocument>,
  ) {}

  async create(createWorkDto: CreateWorkDto, currentUser: AuthUser) {
    const work = await this.workModel.create({
      uuid: randomUUID(),
      title: createWorkDto.title ?? '',
      desc: createWorkDto.desc ?? '',
      content: createWorkDto.content ?? defaultContent(),
      author: getAuthorName(currentUser),
      channels: [createDefaultChannel()],
      coverImg: createWorkDto.coverImg ?? '',
      status: createWorkDto.status ?? WorkStatus.Unpublished,
      isTemplate: createWorkDto.isTemplate ?? false,
      templateTags: createWorkDto.templateTags ?? [],
      isHot: createWorkDto.isHot ?? false,
      copiedCount: 0,
      isPublic: createWorkDto.isPublic ?? false,
      user: new Types.ObjectId(currentUser.id),
    })

    return work.toObject()
  }

  async findAll(query: ListWorksDto, currentUser: AuthUser) {
    const page = query.page ?? 1
    const pageSize = Math.min(query.pageSize ?? 20, 100)
    const filter: WorkFilter = {
      user: new Types.ObjectId(currentUser.id),
    }

    if (query.status === undefined) {
      filter.status = { $ne: WorkStatus.Deleted }
    } else {
      filter.status = query.status
    }

    if (query.isTemplate !== undefined) filter.isTemplate = query.isTemplate
    if (query.isHot !== undefined) filter.isHot = query.isHot
    if (query.isPublic !== undefined) filter.isPublic = query.isPublic

    const [items, total] = await Promise.all([
      this.workModel
        .find(filter)
        .sort({ createdAt: -1 })
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

  async findOne(id: string, currentUser: AuthUser) {
    return this.findWorkByIdentity(id, currentUser)
  }

  async update(id: string, updateWorkDto: UpdateWorkDto, currentUser: AuthUser) {
    const work = await this.findWorkByIdentity(id, currentUser)

    if (updateWorkDto.title !== undefined) work.title = updateWorkDto.title
    if (updateWorkDto.desc !== undefined) work.desc = updateWorkDto.desc
    if (updateWorkDto.content !== undefined) work.content = updateWorkDto.content
    if (updateWorkDto.coverImg !== undefined) work.coverImg = updateWorkDto.coverImg
    if (updateWorkDto.isTemplate !== undefined) {
      work.isTemplate = updateWorkDto.isTemplate
    }
    if (updateWorkDto.templateTags !== undefined) {
      work.templateTags = normalizeTemplateTags(updateWorkDto.templateTags)
    }
    if (updateWorkDto.isHot !== undefined) work.isHot = updateWorkDto.isHot
    if (updateWorkDto.isPublic !== undefined) {
      work.isPublic = updateWorkDto.isPublic
    }
    if (updateWorkDto.status !== undefined) work.status = updateWorkDto.status

    await work.save()
    return work.toObject()
  }

  async publish(id: string, currentUser: AuthUser) {
    const work = await this.findWorkByIdentity(id, currentUser)

    work.publishedContent = work.content
    work.status = WorkStatus.Published
    work.latestPublishAt = new Date()

    await work.save()
    return work.toObject()
  }

  async copy(id: string, currentUser: AuthUser) {
    const source = await this.findWorkByIdentity(id, currentUser)

    const copied = await this.workModel.create({
      uuid: randomUUID(),
      title: `${source.title} 副本`,
      desc: source.desc,
      content: source.content,
      publishedContent: null,
      author: getAuthorName(currentUser),
      channels: [createDefaultChannel()],
      coverImg: source.coverImg,
      status: WorkStatus.Unpublished,
      isTemplate: false,
      templateTags: [],
      isHot: false,
      copiedCount: 0,
      isPublic: false,
      user: new Types.ObjectId(currentUser.id),
    })

    source.copiedCount += 1
    await source.save()

    return copied.toObject()
  }

  async markAsTemplate(
    id: string,
    currentUser: AuthUser,
    markTemplateDto: MarkTemplateDto = {},
  ) {
    const work = await this.findWorkByIdentity(id, currentUser)

    work.isTemplate = true
    work.isPublic = markTemplateDto.isPublic ?? true
    work.templateTags = normalizeTemplateTags(markTemplateDto.templateTags ?? [])

    await work.save()
    return work.toObject()
  }

  async createChannel(
    id: string,
    createChannelDto: CreateChannelDto,
    currentUser: AuthUser,
  ) {
    const work = await this.findWorkByIdentity(id, currentUser)
    const name = createChannelDto.name.trim()

    ensureWorkChannels(work)

    if (!name) {
      throw new BadRequestException('渠道名称不能为空')
    }

    if (work.channels.some((channel) => channel.name === name)) {
      throw new BadRequestException('渠道名称不能重复')
    }

    work.channels.push({
      id: randomUUID(),
      name,
      createdAt: new Date(),
    })
    await work.save()

    return work.toObject()
  }

  async deleteChannel(
    id: string,
    channelId: string,
    currentUser: AuthUser,
  ) {
    const work = await this.findWorkByIdentity(id, currentUser)

    ensureWorkChannels(work)

    if (work.channels.length <= 1) {
      throw new BadRequestException('至少保留一个渠道')
    }

    const nextChannels = work.channels.filter(
      (channel) => channel.id !== channelId,
    )

    if (nextChannels.length === work.channels.length) {
      throw new NotFoundException('渠道不存在')
    }

    work.channels = nextChannels
    await work.save()

    return work.toObject()
  }

  async getStats(id: string, currentUser: AuthUser) {
    const work = await this.findWorkByIdentity(id, currentUser)
    ensureWorkChannels(work)

    const stats = await this.workVisitModel
      .aggregate<{ _id: string; count: number }>([
        { $match: { workUuid: work.uuid, eventName: 'page_view' } },
        { $group: { _id: '$channel', count: { $sum: 1 } } },
      ])
      .exec()
    const channelCounts = new Map(
      stats.map((item) => [item._id || '', item.count]),
    )
    const channels = work.channels.map((channel) => ({
      id: channel.id,
      name: channel.name,
      createdAt: channel.createdAt,
      pv: channelCounts.get(channel.id) ?? 0,
    }))
    const totalPv = stats.reduce((total, item) => total + item.count, 0)

    return {
      workUuid: work.uuid,
      totalPv,
      channels,
    }
  }

  async softDelete(id: string, currentUser: AuthUser) {
    const work = await this.findWorkByIdentity(id, currentUser)

    work.status = WorkStatus.Deleted
    await work.save()

    return work.toObject()
  }

  async restore(id: string, currentUser: AuthUser) {
    const work = await this.findWorkByIdentity(id, currentUser)

    work.status = WorkStatus.Unpublished
    await work.save()

    return work.toObject()
  }

  async findPublishedByUuid(uuid: string) {
    const work = await this.workModel
      .findOne({ uuid })
      .select(
        'uuid title desc coverImg channels status publishedContent latestPublishAt updatedAt',
      )
      .lean()
      .exec()

    if (!work) {
      throw new NotFoundException({
        code: 'WORK_NOT_FOUND',
        message: '作品不存在',
      })
    }

    if (work.status === WorkStatus.Deleted) {
      throw new NotFoundException({
        code: 'WORK_DELETED',
        message: '作品已删除',
        status: work.status,
      })
    }

    if (work.status === WorkStatus.ForceOffline) {
      throw new NotFoundException({
        code: 'WORK_FORCE_OFFLINE',
        message: '作品已被管理员下线',
        status: work.status,
      })
    }

    if (work.status !== WorkStatus.Published) {
      throw new NotFoundException({
        code: 'WORK_UNPUBLISHED',
        message: '作品尚未发布',
        status: work.status,
      })
    }

    if (!work.publishedContent) {
      throw new NotFoundException({
        code: 'WORK_NO_PUBLISHED_CONTENT',
        message: '作品还没有发布内容',
        status: work.status,
      })
    }

    return work
  }

  async recordVisit(uuid: string, recordVisitDto: RecordVisitDto) {
    const work = await this.workModel
      .findOne({
        uuid,
        status: WorkStatus.Published,
        publishedContent: { $ne: null },
      })
      .select('uuid channels')
      .lean()
      .exec()

    if (!work) {
      throw new NotFoundException('作品不存在或未发布')
    }

    const channel = recordVisitDto.channel?.trim() ?? ''
    const knownChannel = work.channels?.some((item) => item.id === channel)
    const fallbackChannel = work.channels?.[0]?.id ?? ''

    await this.workVisitModel.create({
      workUuid: uuid,
      eventName: 'page_view',
      channel: knownChannel ? channel : fallbackChannel,
      referer: recordVisitDto.referer ?? '',
      userAgent: recordVisitDto.userAgent ?? '',
    })

    return { ok: true }
  }

  private async findWorkByIdentity(id: string, currentUser: AuthUser) {
    const identityFilter = isValidObjectId(id)
      ? { $or: [{ _id: id }, { uuid: id }] }
      : { uuid: id }
    const filter: WorkFilter = {
      ...identityFilter,
      user: new Types.ObjectId(currentUser.id),
    }

    const work = await this.workModel.findOne(filter).exec()

    if (!work) {
      throw new NotFoundException('作品不存在')
    }

    if (!Array.isArray(work.channels) || work.channels.length === 0) {
      work.channels = [createDefaultChannel()]
      await work.save()
    }

    return work
  }
}

function createDefaultChannel(): WorkChannel {
  return {
    id: randomUUID(),
    name: '默认',
    createdAt: new Date(),
  }
}

function ensureWorkChannels(work: WorkDocument) {
  if (Array.isArray(work.channels) && work.channels.length > 0) {
    return
  }

  work.channels = [createDefaultChannel()]
}

function normalizeTemplateTags(tags: string[]) {
  return Array.from(
    new Set(tags.map((tag) => tag.trim()).filter(Boolean)),
  ).slice(0, 10)
}

function getAuthorName(currentUser: AuthUser) {
  return currentUser.nickName || currentUser.username || currentUser.phoneNumber
}
