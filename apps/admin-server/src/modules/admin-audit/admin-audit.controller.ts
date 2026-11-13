import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common'

import { AdminAuthGuard } from '../auth/admin-auth.guard'
import { AdminAuditService } from './admin-audit.service'
import { ListAdminAuditLogsDto } from './dto/list-admin-audit-logs.dto'

@UseGuards(AdminAuthGuard)
@Controller('admin/audit-logs')
export class AdminAuditController {
  constructor(private readonly adminAuditService: AdminAuditService) {}

  @Get()
  findAll(@Query() query: ListAdminAuditLogsDto) {
    return this.adminAuditService.findAll(query)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.adminAuditService.findOne(id)
  }
}
