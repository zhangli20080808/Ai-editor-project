import { randomUUID } from 'node:crypto'

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectModel } from '@nestjs/mongoose'
import { isValidObjectId, Types, type Model } from 'mongoose'
import * as QRCode from 'qrcode'
import type {
  ComponentData,
  WorkContent,
} from '@zhangli2008/ai-editor-schema' with { "resolution-mode": "import" }

import type { AppConfiguration } from '../../config/configuration'
import type { AuthUser } from '../users/users.service'
import { type CreateChannelDto } from './dto/create-channel.dto'
import { type CreateWorkDto } from './dto/create-work.dto'
import { type ListWorksDto } from './dto/list-works.dto'
import { type MarkTemplateDto } from './dto/mark-template.dto'
import { type RecordVisitDto } from './dto/record-visit.dto'
import { type TransferWorkDto } from './dto/transfer-work.dto'
import { type UpdateWorkDto } from './dto/update-work.dto'
import { MessagesService } from '../messages/messages.service'
import { UsersService } from '../users/users.service'
import {
  WorkVisit,
  type WorkVisitDocument,
} from './schemas/work-visit.schema'
import {
  WorkFavorite,
  type WorkFavoriteDocument,
} from './schemas/work-favorite.schema'
import {
  Work,
  type WorkChannel,
  type WorkDocument,
  WorkStatus,
} from './schemas/work.schema'

const defaultPageSetting = {
  backgroundColor: '#ffffff',
  backgroundImage: '',
  backgroundRepeat: 'no-repeat',
  backgroundSize: 'cover',
  height: 640,
} as const

const defaultContent = (): WorkContent => ({
  components: [],
  props: { ...defaultPageSetting },
})

type WorkFilter = Record<string, unknown>

@Injectable()
export class WorksService {
  constructor(
    @InjectModel(Work.name) private readonly workModel: Model<WorkDocument>,
    @InjectModel(WorkVisit.name)
    private readonly workVisitModel: Model<WorkVisitDocument>,
    @InjectModel(WorkFavorite.name)
    private readonly workFavoriteModel: Model<WorkFavoriteDocument>,
    private readonly configService: ConfigService<AppConfiguration>,
    private readonly usersService: UsersService,
    private readonly messagesService: MessagesService,
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
      viewCount: 0,
      favoriteCount: 0,
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
    if (query.templateTag) filter.templateTags = query.templateTag
    applyKeywordFilter(filter, query.keyword)

    const [items, total] = await Promise.all([
      this.workModel
        .find(filter)
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

  async findPublicTemplates(query: ListWorksDto) {
    const page = query.page ?? 1
    const pageSize = Math.min(query.pageSize ?? 20, 100)
    const filter: WorkFilter = {
      isTemplate: true,
      isPublic: true,
      status: WorkStatus.Published,
    }

    if (query.isHot !== undefined) filter.isHot = query.isHot
    if (query.templateTag) filter.templateTags = query.templateTag
    applyKeywordFilter(filter, query.keyword)

    const [items, total] = await Promise.all([
      this.workModel
        .find(filter)
        .sort(getPublicTemplateSort(query.sort))
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

  async findPublicCases(query: ListWorksDto) {
    const page = query.page ?? 1
    const pageSize = Math.min(query.pageSize ?? 8, 24)
    const filter: WorkFilter = {
      isTemplate: false,
      isPublic: true,
      status: WorkStatus.Published,
      publishedContent: { $ne: null },
    }
    applyKeywordFilter(filter, query.keyword)

    const [items, total] = await Promise.all([
      this.workModel
        .find(filter)
        .select('uuid title desc coverImg author status isTemplate isPublic latestPublishAt viewCount updatedAt')
        .sort({ viewCount: -1, latestPublishAt: -1, updatedAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean()
        .exec(),
      this.workModel.countDocuments(filter).exec(),
    ])

    return { items, page, pageSize, total }
  }

  async findPublicTemplateByIdentity(id: string) {
    const identityFilter = isValidObjectId(id)
      ? { $or: [{ _id: id }, { uuid: id }] }
      : { uuid: id }
    const work = await this.workModel
      .findOne({
        ...identityFilter,
        isTemplate: true,
        isPublic: true,
        status: WorkStatus.Published,
      })
      .select(
        'uuid title desc coverImg author channels status publishedContent latestPublishAt updatedAt templateTags copiedCount viewCount favoriteCount isHot isPublic isTemplate',
      )
      .lean()
      .exec()

    if (!work) {
      throw new NotFoundException('模板不存在或不可用')
    }

    return work
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

    if (work.isTemplate) {
      return this.publishTemplateAsWork(work, currentUser)
    }

    work.publishedContent = work.content
    work.status = WorkStatus.Published
    work.latestPublishAt = new Date()

    await work.save()
    return work.toObject()
  }

  private async publishTemplateAsWork(
    template: WorkDocument,
    currentUser: AuthUser,
  ) {
    const userId = new Types.ObjectId(currentUser.id)
    const publishedAt = new Date()
    const existingWork = await this.workModel
      .findOne({
        user: userId,
        sourceTemplateUuid: template.uuid,
        isTemplate: false,
        status: { $ne: WorkStatus.Deleted },
      })
      .exec()

    if (existingWork) {
      existingWork.title = template.title
      existingWork.desc = template.desc
      existingWork.content = template.content
      existingWork.publishedContent = template.content
      existingWork.author = getAuthorName(currentUser)
      existingWork.coverImg = template.coverImg
      existingWork.status = WorkStatus.Published
      existingWork.latestPublishAt = publishedAt
      await existingWork.save()
      return existingWork.toObject()
    }

    const publishedWork = await this.workModel.create({
      uuid: randomUUID(),
      title: template.title,
      desc: template.desc,
      content: template.content,
      publishedContent: template.content,
      author: getAuthorName(currentUser),
      channels: [createDefaultChannel()],
      coverImg: template.coverImg,
      status: WorkStatus.Published,
      isTemplate: false,
      sourceTemplateUuid: template.uuid,
      templateTags: [],
      isHot: false,
      copiedCount: 0,
      isPublic: false,
      user: userId,
      latestPublishAt: publishedAt,
    })

    return publishedWork.toObject()
  }

  async copy(id: string, currentUser: AuthUser) {
    const source = await this.findWorkByIdentity(id, currentUser)

    const copied = await this.workModel.create({
      uuid: randomUUID(),
      title: `${source.title}-复制`,
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

  async usePublicTemplate(id: string, currentUser: AuthUser) {
    const identityFilter = isValidObjectId(id)
      ? { $or: [{ _id: id }, { uuid: id }] }
      : { uuid: id }
    const source = await this.workModel
      .findOne({
        ...identityFilter,
        isTemplate: true,
        isPublic: true,
        status: WorkStatus.Published,
      })
      .exec()

    if (!source) {
      throw new NotFoundException('模板不存在或不可用')
    }

    const copied = await this.workModel.create({
      uuid: randomUUID(),
      title: source.title,
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

  async getFavoriteTemplateIds(currentUser: AuthUser) {
    const favorites = await this.workFavoriteModel
      .find({ user: new Types.ObjectId(currentUser.id) })
      .select('workUuid')
      .lean()
      .exec()
    return { ids: favorites.map((favorite) => favorite.workUuid) }
  }

  async setTemplateFavorite(
    id: string,
    currentUser: AuthUser,
    favorite: boolean,
  ) {
    const template = await this.findPublicTemplateDocument(id)
    const filter = {
      workUuid: template.uuid,
      user: new Types.ObjectId(currentUser.id),
    }

    if (favorite) {
      await this.workFavoriteModel.updateOne(filter, { $setOnInsert: filter }, { upsert: true })
    } else {
      await this.workFavoriteModel.deleteOne(filter).exec()
    }

    const favoriteCount = await this.workFavoriteModel.countDocuments({
      workUuid: template.uuid,
    })
    template.favoriteCount = favoriteCount
    await template.save()
    return { favorite, favoriteCount }
  }

  async markAsTemplate(
    id: string,
    currentUser: AuthUser,
    markTemplateDto: MarkTemplateDto = {},
  ) {
    const source = await this.findWorkByIdentity(id, currentUser)
    const templateTags = normalizeTemplateTags(markTemplateDto.templateTags ?? [])
    const isPublic = markTemplateDto.isPublic ?? true
    const publishedAt = new Date()

    if (source.isTemplate) {
      source.isPublic = isPublic
      source.templateTags = templateTags
      source.publishedContent = source.content
      source.status = WorkStatus.Published
      source.latestPublishAt = publishedAt
      await source.save()
      return source.toObject()
    }

    const userId = new Types.ObjectId(currentUser.id)
    const existingTemplate = await this.workModel
      .findOne({
        user: userId,
        sourceWorkUuid: source.uuid,
        isTemplate: true,
        status: { $ne: WorkStatus.Deleted },
      })
      .exec()

    if (existingTemplate) {
      existingTemplate.title = source.title
      existingTemplate.desc = source.desc
      existingTemplate.content = source.content
      existingTemplate.publishedContent = source.content
      existingTemplate.author = getAuthorName(currentUser)
      existingTemplate.coverImg = source.coverImg
      existingTemplate.status = WorkStatus.Published
      existingTemplate.isPublic = isPublic
      existingTemplate.templateTags = templateTags
      existingTemplate.latestPublishAt = publishedAt
      await existingTemplate.save()
      return existingTemplate.toObject()
    }

    const template = await this.workModel.create({
      uuid: randomUUID(),
      title: source.title,
      desc: source.desc,
      content: source.content,
      publishedContent: source.content,
      author: getAuthorName(currentUser),
      channels: [createDefaultChannel()],
      coverImg: source.coverImg,
      status: WorkStatus.Published,
      isTemplate: true,
      sourceWorkUuid: source.uuid,
      templateTags,
      isHot: false,
      copiedCount: 0,
      isPublic,
      user: userId,
      latestPublishAt: publishedAt,
    })

    return template.toObject()
  }

  async transfer(
    id: string,
    transferWorkDto: TransferWorkDto,
    currentUser: AuthUser,
  ) {
    if (transferWorkDto.targetUserId === currentUser.id) {
      throw new BadRequestException('不能转赠给自己')
    }

    const work = await this.findWorkByIdentity(id, currentUser)
    const targetUser = await this.usersService.findById(
      transferWorkDto.targetUserId,
    )

    work.user = new Types.ObjectId(String(targetUser._id))
    await work.save()

    await this.messagesService.createTransferMessage({
      targetUserId: String(targetUser._id),
      fromUserId: currentUser.id,
      fromUserName: getAuthorName(currentUser),
      workTitle: work.title,
      workUuid: work.uuid,
    })

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

    const startDate = getStartOfDay(addDays(new Date(), -6))
    const [stats, dailyStats, componentEventStats] = await Promise.all([
      this.workVisitModel
        .aggregate<{ _id: string; count: number }>([
          { $match: { workUuid: work.uuid, eventName: 'page_view' } },
          { $group: { _id: '$channel', count: { $sum: 1 } } },
        ])
        .exec(),
      this.workVisitModel
        .aggregate<{ _id: string; count: number }>([
          {
            $match: {
              workUuid: work.uuid,
              eventName: 'page_view',
              createdAt: { $gte: startDate },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: {
                  date: '$createdAt',
                  format: '%Y-%m-%d',
                  timezone: 'Asia/Shanghai',
                },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ])
        .exec(),
      this.workVisitModel
        .aggregate<{
          _id: {
            componentId: string
            componentLabel: string
            componentName: string
            eventName: string
          }
          count: number
        }>([
          {
            $match: {
              workUuid: work.uuid,
              eventName: { $ne: 'page_view' },
            },
          },
          {
            $group: {
              _id: {
                componentId: '$componentId',
                componentLabel: '$componentLabel',
                componentName: '$componentName',
                eventName: '$eventName',
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1, '_id.componentLabel': 1 } },
        ])
        .exec(),
    ])
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
    const dailyCounts = new Map(
      dailyStats.map((item) => [item._id, item.count]),
    )
    const daily = Array.from({ length: 7 }, (_, index) => {
      const date = formatDate(addDays(startDate, index))
      return {
        date,
        pv: dailyCounts.get(date) ?? 0,
      }
    })
    const topChannels = [...channels]
      .sort((left, right) => right.pv - left.pv)
      .slice(0, 5)
    const componentEvents = componentEventStats.map((item) => ({
      componentId: item._id.componentId,
      componentLabel: item._id.componentLabel || '未命名组件',
      componentName: item._id.componentName || 'unknown',
      count: item.count,
      eventName: item._id.eventName,
    }))
    const totalComponentClicks = componentEvents.reduce(
      (total, item) => total + item.count,
      0,
    )

    return {
      workUuid: work.uuid,
      totalPv,
      totalComponentClicks,
      channels,
      daily,
      topChannels,
      componentEvents,
      topComponentEvents: componentEvents.slice(0, 5),
    }
  }

  async generateChannelQrCode(
    id: string,
    channelId: string,
    currentUser: AuthUser,
  ) {
    const work = await this.findWorkByIdentity(id, currentUser)
    ensureWorkChannels(work)

    const channel = work.channels.find((item) => item.id === channelId)
    if (!channel) {
      throw new NotFoundException('渠道不存在')
    }

    const link = buildChannelLink(
      this.configService.getOrThrow('h5BaseUrl', { infer: true }),
      work.uuid,
      channel.id,
    )
    const buffer = await QRCode.toBuffer(link, {
      color: {
        dark: '#1f2329',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
      margin: 2,
      type: 'png',
      width: 360,
    })

    return {
      buffer,
      filename: `channel-${channel.id}.png`,
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
      .select('uuid channels publishedContent')
      .lean()
      .exec()

    if (!work) {
      throw new NotFoundException('作品不存在或未发布')
    }

    const eventName = normalizeVisitEventName(recordVisitDto.eventName)
    const channel = recordVisitDto.channel?.trim() ?? ''
    const knownChannel = work.channels?.some((item) => item.id === channel)
    const fallbackChannel = work.channels?.[0]?.id ?? ''
    const components = normalizeWorkComponents(work.publishedContent)
    const componentId = recordVisitDto.componentId?.trim() ?? ''
    const matchedComponent =
      eventName === 'page_view'
        ? null
        : components.find((component) => component.id === componentId) ?? null

    if (eventName !== 'page_view' && !matchedComponent) {
      throw new BadRequestException('组件事件无效')
    }
    if (
      matchedComponent &&
      !hasTrackEvent(matchedComponent, eventName)
    ) {
      throw new BadRequestException('组件事件无效')
    }

    await this.workVisitModel.create({
      workUuid: uuid,
      eventName,
      channel: knownChannel ? channel : fallbackChannel,
      componentId: matchedComponent?.id ?? '',
      componentName: matchedComponent?.name ?? '',
      componentLabel:
        matchedComponent ? getComponentLabel(matchedComponent) : '',
      referer: recordVisitDto.referer ?? '',
      userAgent: recordVisitDto.userAgent ?? '',
    })

    if (eventName === 'page_view') {
      await this.workModel.updateOne({ uuid }, { $inc: { viewCount: 1 } }).exec()
    }

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

  private async findPublicTemplateDocument(id: string) {
    const identityFilter = isValidObjectId(id)
      ? { $or: [{ _id: id }, { uuid: id }] }
      : { uuid: id }
    const template = await this.workModel
      .findOne({
        ...identityFilter,
        isTemplate: true,
        isPublic: true,
        status: WorkStatus.Published,
      })
      .exec()
    if (!template) throw new NotFoundException('模板不存在或不可用')
    return template
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

function applyKeywordFilter(filter: WorkFilter, keyword?: string) {
  const normalizedKeyword = keyword?.trim()
  if (!normalizedKeyword) return

  const keywordRegExp = new RegExp(escapeRegExp(normalizedKeyword), 'i')
  filter.$or = [
    { title: keywordRegExp },
    { desc: keywordRegExp },
    { author: keywordRegExp },
  ]
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function buildChannelLink(baseUrl: string, workUuid: string, channelId: string) {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, '')
  return `${normalizedBaseUrl}/p/${workUuid}?channel=${channelId}`
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + days)
  return nextDate
}

function getStartOfDay(date: Date) {
  const nextDate = new Date(date)
  nextDate.setHours(0, 0, 0, 0)
  return nextDate
}

function formatDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getAuthorName(currentUser: AuthUser) {
  return currentUser.nickName || currentUser.username || currentUser.phoneNumber
}

function getPublicTemplateSort(sort: ListWorksDto['sort']) {
  if (sort === 'hot') {
    return {
      isHot: -1,
      favoriteCount: -1,
      viewCount: -1,
      copiedCount: -1,
      latestPublishAt: -1,
    } as const
  }

  if (sort === 'copied') {
    return { copiedCount: -1, latestPublishAt: -1, updatedAt: -1 } as const
  }

  return { latestPublishAt: -1, updatedAt: -1 } as const
}

function normalizeVisitEventName(eventName?: string) {
  const normalized = eventName?.trim()
  return normalized || 'page_view'
}

function normalizeWorkComponents(content: unknown): ComponentData[] {
  if (
    !content ||
    typeof content !== 'object' ||
    !('components' in content) ||
    !Array.isArray((content as { components?: unknown }).components)
  ) {
    return []
  }

  return (content as { components: ComponentData[] }).components
}

function getComponentLabel(component: ComponentData) {
  const label = component.layerName || component.props.label
  return typeof label === 'string' && label.trim() ? label.trim() : component.name
}

function hasTrackEvent(component: ComponentData, eventName: string) {
  return (component.events?.click ?? []).some(
    (action) =>
      action.type === 'track' &&
      action.eventName.trim() === eventName,
  )
}
