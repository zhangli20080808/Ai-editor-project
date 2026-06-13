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
import { CreateWorkDto } from './dto/create-work.dto'
import { ListWorksDto } from './dto/list-works.dto'
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

  @Delete(':id')
  softDelete(@Param('id') id: string, @CurrentUser() currentUser: AuthUser) {
    return this.worksService.softDelete(id, currentUser)
  }

  @Post(':id/restore')
  restore(@Param('id') id: string, @CurrentUser() currentUser: AuthUser) {
    return this.worksService.restore(id, currentUser)
  }
}
