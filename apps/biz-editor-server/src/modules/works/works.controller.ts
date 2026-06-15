import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'

import { AuthGuard } from '../auth/auth.guard'
import { CurrentUser } from '../auth/current-user.decorator'
import type { AuthUser } from '../users/users.service'
import { CreateChannelDto } from './dto/create-channel.dto'
import { CreateWorkDto } from './dto/create-work.dto'
import { ListWorksDto } from './dto/list-works.dto'
import { MarkTemplateDto } from './dto/mark-template.dto'
import { UpdateWorkDto } from './dto/update-work.dto'
import { WorksService } from './works.service'

@UseGuards(AuthGuard)
@Controller('works')
export class WorksController {
  constructor(private readonly worksService: WorksService) {}

  @Post()
  create(
    @Body() createWorkDto: CreateWorkDto,
    @CurrentUser() currentUser: AuthUser,
  ) {
    return this.worksService.create(createWorkDto, currentUser)
  }

  @Get()
  findAll(@Query() query: ListWorksDto, @CurrentUser() currentUser: AuthUser) {
    return this.worksService.findAll(query, currentUser)
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() currentUser: AuthUser) {
    return this.worksService.findOne(id, currentUser)
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateWorkDto: UpdateWorkDto,
    @CurrentUser() currentUser: AuthUser,
  ) {
    return this.worksService.update(id, updateWorkDto, currentUser)
  }

  @Post(':id/publish')
  publish(@Param('id') id: string, @CurrentUser() currentUser: AuthUser) {
    return this.worksService.publish(id, currentUser)
  }

  @Post(':id/copy')
  copy(@Param('id') id: string, @CurrentUser() currentUser: AuthUser) {
    return this.worksService.copy(id, currentUser)
  }

  @Post(':id/template')
  markAsTemplate(
    @Param('id') id: string,
    @Body() markTemplateDto: MarkTemplateDto,
    @CurrentUser() currentUser: AuthUser,
  ) {
    return this.worksService.markAsTemplate(id, currentUser, markTemplateDto)
  }

  @Post(':id/channels')
  createChannel(
    @Param('id') id: string,
    @Body() createChannelDto: CreateChannelDto,
    @CurrentUser() currentUser: AuthUser,
  ) {
    return this.worksService.createChannel(id, createChannelDto, currentUser)
  }

  @Delete(':id/channels/:channelId')
  deleteChannel(
    @Param('id') id: string,
    @Param('channelId') channelId: string,
    @CurrentUser() currentUser: AuthUser,
  ) {
    return this.worksService.deleteChannel(id, channelId, currentUser)
  }

  @Get(':id/stats')
  getStats(@Param('id') id: string, @CurrentUser() currentUser: AuthUser) {
    return this.worksService.getStats(id, currentUser)
  }

  @Delete(':id')
  softDelete(@Param('id') id: string, @CurrentUser() currentUser: AuthUser) {
    return this.worksService.softDelete(id, currentUser)
  }

  @Post(':id/restore')
  restore(@Param('id') id: string, @CurrentUser() currentUser: AuthUser) {
    return this.worksService.restore(id, currentUser)
  }
}
