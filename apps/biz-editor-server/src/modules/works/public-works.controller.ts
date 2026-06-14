import { Controller, Get, Param } from '@nestjs/common'

import { WorksService } from './works.service'

@Controller('public/works')
export class PublicWorksController {
  constructor(private readonly worksService: WorksService) {}

  @Get(':uuid')
  findPublishedWork(@Param('uuid') uuid: string) {
    return this.worksService.findPublishedByUuid(uuid)
  }
}
