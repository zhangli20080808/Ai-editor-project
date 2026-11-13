import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'

import { AdminAuthGuard } from '../auth/admin-auth.guard'
import { CurrentUser } from '../auth/current-user.decorator'
import { type AuthUser } from '../users/users.service'
import { AdminWorksService } from './admin-works.service'
import { ListAdminWorksDto } from './dto/list-admin-works.dto'
import { OfflineWorkDto } from './dto/offline-work.dto'
import { RestorePublishWorkDto } from './dto/restore-publish-work.dto'

@UseGuards(AdminAuthGuard)
@Controller('admin/works')
export class AdminWorksController {
  constructor(private readonly adminWorksService: AdminWorksService) {}

  @Get()
  findAll(@Query() query: ListAdminWorksDto) {
    return this.adminWorksService.findAll(query)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.adminWorksService.findOne(id)
  }

  @Post(':id/offline')
  offline(
    @Param('id') id: string,
    @Body() body: OfflineWorkDto,
    @CurrentUser() currentUser: AuthUser,
  ) {
    return this.adminWorksService.offline(id, body, currentUser)
  }

  @Post(':id/restore-publish')
  restorePublish(
    @Param('id') id: string,
    @Body() body: RestorePublishWorkDto,
    @CurrentUser() currentUser: AuthUser,
  ) {
    return this.adminWorksService.restorePublish(id, body, currentUser)
  }
}
