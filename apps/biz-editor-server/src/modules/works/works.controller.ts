import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common'
import type { Response } from 'express'

import { AuthGuard } from '../auth/auth.guard'
import { CurrentUser } from '../auth/current-user.decorator'
import type { AuthUser } from '../users/users.service'
import { CreateChannelDto } from './dto/create-channel.dto'
import { CreateWorkDto } from './dto/create-work.dto'
import { ListWorksDto } from './dto/list-works.dto'
import { MarkTemplateDto } from './dto/mark-template.dto'
import { TransferWorkDto } from './dto/transfer-work.dto'
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

  @Post('templates/:id/use')
  usePublicTemplate(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthUser,
  ) {
    return this.worksService.usePublicTemplate(id, currentUser)
  }

  @Get('templates/favorites')
  getFavoriteTemplates(@CurrentUser() currentUser: AuthUser) {
    return this.worksService.getFavoriteTemplateIds(currentUser)
  }

  @Post('templates/:id/favorite')
  favoriteTemplate(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthUser,
  ) {
    return this.worksService.setTemplateFavorite(id, currentUser, true)
  }

  @Delete('templates/:id/favorite')
  unfavoriteTemplate(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthUser,
  ) {
    return this.worksService.setTemplateFavorite(id, currentUser, false)
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

  @Post(':id/transfer')
  transfer(
    @Param('id') id: string,
    @Body() transferWorkDto: TransferWorkDto,
    @CurrentUser() currentUser: AuthUser,
  ) {
    return this.worksService.transfer(id, transferWorkDto, currentUser)
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

  @Get(':id/channels/:channelId/qrcode')
  async downloadChannelQrCode(
    @Param('id') id: string,
    @Param('channelId') channelId: string,
    @CurrentUser() currentUser: AuthUser,
    @Res() response: Response,
  ) {
    const qrCode = await this.worksService.generateChannelQrCode(
      id,
      channelId,
      currentUser,
    )

    response.setHeader('Content-Type', 'image/png')
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${qrCode.filename}"`,
    )
    response.send(qrCode.buffer)
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
