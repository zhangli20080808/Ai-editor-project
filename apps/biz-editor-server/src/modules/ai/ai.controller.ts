import { Body, Controller, Get, NotFoundException, Param, Post, Res, UseGuards } from '@nestjs/common'
import type { Response } from 'express'

import { AuthGuard } from '../auth/auth.guard'
import { CurrentUser } from '../auth/current-user.decorator'
import type { AuthUser } from '../users/users.service'
import { AiService } from './ai.service'
import { CreateCopySuggestionsDto } from './dto/create-copy-suggestions.dto'
import { CreatePageAuditDto } from './dto/create-page-audit.dto'
import { CreatePageCopyOptimizationDto } from './dto/create-page-copy-optimization.dto'
import { CreatePageDraftDto } from './dto/create-page-draft.dto'

@UseGuards(AuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('page-drafts/stream')
  async streamPageDraft(@Body() dto: CreatePageDraftDto, @CurrentUser() user: AuthUser, @Res() response: Response) {
    response.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
    response.setHeader('Cache-Control', 'no-cache, no-transform')
    response.setHeader('Connection', 'keep-alive')
    response.flushHeaders()
    await this.aiService.streamPageDraft(dto, user, response)
  }

  @Post('copy-suggestions/stream')
  async streamCopySuggestions(@Body() dto: CreateCopySuggestionsDto, @Res() response: Response) {
    response.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
    response.setHeader('Cache-Control', 'no-cache, no-transform')
    response.setHeader('Connection', 'keep-alive')
    response.flushHeaders()
    await this.aiService.streamCopySuggestions(dto, response)
  }

  @Post('page-copy-optimization/stream')
  async streamPageCopyOptimization(@Body() dto: CreatePageCopyOptimizationDto, @Res() response: Response) {
    response.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
    response.setHeader('Cache-Control', 'no-cache, no-transform')
    response.setHeader('Connection', 'keep-alive')
    response.flushHeaders()
    await this.aiService.streamPageCopyOptimization(dto, response)
  }

  @Post('page-audit/stream')
  async streamPageAudit(@Body() dto: CreatePageAuditDto, @Res() response: Response) {
    response.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
    response.setHeader('Cache-Control', 'no-cache, no-transform')
    response.setHeader('Connection', 'keep-alive')
    response.flushHeaders()
    await this.aiService.streamPageAudit(dto, response)
  }

  @Get('runs')
  listRuns(@CurrentUser() user: AuthUser) {
    return this.aiService.listRuns(user)
  }

  @Get('runs/:id')
  async getRun(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const run = await this.aiService.getRun(id, user)
    if (!run) throw new NotFoundException('AI 创作记录不存在')
    return run
  }
}
