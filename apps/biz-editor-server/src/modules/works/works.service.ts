import { randomUUID } from 'node:crypto'

import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { isValidObjectId, type Model } from 'mongoose'

import { type CreateWorkDto } from './dto/create-work.dto'
import { type ListWorksDto } from './dto/list-works.dto'
import { type UpdateWorkDto } from './dto/update-work.dto'
import {
  Work,
  type WorkContent,
  type WorkDocument,
  WorkStatus,
} from './schemas/work.schema'

const mockUser = {
  author: 'mock-user',
}

const defaultContent = (): WorkContent => ({
  components: [],
  props: {},
})

type WorkFilter = Record<string, unknown>

@Injectable()
export class WorksService {
  constructor(
    @InjectModel(Work.name) private readonly workModel: Model<WorkDocument>,
  ) {}

  async create(createWorkDto: CreateWorkDto) {
    const work = await this.workModel.create({
      uuid: randomUUID(),
      title: createWorkDto.title ?? '未命名作品',
      desc: createWorkDto.desc ?? '',
      content: createWorkDto.content ?? defaultContent(),
      author: mockUser.author,
      coverImg: createWorkDto.coverImg ?? '',
      status: createWorkDto.status ?? WorkStatus.Unpublished,
      isTemplate: createWorkDto.isTemplate ?? false,
      isHot: createWorkDto.isHot ?? false,
      copiedCount: 0,
      isPublic: createWorkDto.isPublic ?? false,
    })

    return work.toObject()
  }

  async findAll(query: ListWorksDto) {
    const page = query.page ?? 1
    const pageSize = Math.min(query.pageSize ?? 20, 100)
    const filter: WorkFilter = {}

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

  async findOne(id: string) {
    return this.findWorkByIdentity(id)
  }

  async update(id: string, updateWorkDto: UpdateWorkDto) {
    const work = await this.findWorkByIdentity(id)

    if (updateWorkDto.title !== undefined) work.title = updateWorkDto.title
    if (updateWorkDto.desc !== undefined) work.desc = updateWorkDto.desc
    if (updateWorkDto.content !== undefined) work.content = updateWorkDto.content
    if (updateWorkDto.coverImg !== undefined) work.coverImg = updateWorkDto.coverImg
    if (updateWorkDto.isTemplate !== undefined) {
      work.isTemplate = updateWorkDto.isTemplate
    }
    if (updateWorkDto.isHot !== undefined) work.isHot = updateWorkDto.isHot
    if (updateWorkDto.isPublic !== undefined) {
      work.isPublic = updateWorkDto.isPublic
    }
    if (updateWorkDto.status !== undefined) work.status = updateWorkDto.status

    await work.save()
    return work.toObject()
  }

  async publish(id: string) {
    const work = await this.findWorkByIdentity(id)

    work.publishedContent = work.content
    work.status = WorkStatus.Published
    work.latestPublishAt = new Date()

    await work.save()
    return work.toObject()
  }

  async copy(id: string) {
    const source = await this.findWorkByIdentity(id)

    const copied = await this.workModel.create({
      uuid: randomUUID(),
      title: `${source.title} 副本`,
      desc: source.desc,
      content: source.content,
      publishedContent: null,
      author: mockUser.author,
      coverImg: source.coverImg,
      status: WorkStatus.Unpublished,
      isTemplate: false,
      isHot: false,
      copiedCount: 0,
      isPublic: false,
    })

    source.copiedCount += 1
    await source.save()

    return copied.toObject()
  }

  async softDelete(id: string) {
    const work = await this.findWorkByIdentity(id)

    work.status = WorkStatus.Deleted
    await work.save()

    return work.toObject()
  }

  async restore(id: string) {
    const work = await this.findWorkByIdentity(id)

    work.status = WorkStatus.Unpublished
    await work.save()

    return work.toObject()
  }

  private async findWorkByIdentity(id: string) {
    const filter: WorkFilter = isValidObjectId(id)
      ? { $or: [{ _id: id }, { uuid: id }] }
      : { uuid: id }

    const work = await this.workModel.findOne(filter).exec()

    if (!work) {
      throw new NotFoundException('作品不存在')
    }

    return work
  }
}
