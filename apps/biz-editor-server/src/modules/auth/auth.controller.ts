import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common'

import { CurrentUser } from './current-user.decorator'
import { AuthGuard } from './auth.guard'
import { AuthService } from './auth.service'
import { LoginByPhoneDto } from './dto/login-by-phone.dto'
import { SendCodeDto } from './dto/send-code.dto'
import type { AuthUser } from '../users/users.service'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-code')
  sendCode(@Body() sendCodeDto: SendCodeDto) {
    return this.authService.sendCode(sendCodeDto)
  }

  @Post('login-by-phone')
  loginByPhone(@Body() loginDto: LoginByPhoneDto) {
    return this.authService.loginByPhone(loginDto)
  }

  @UseGuards(AuthGuard)
  @Get('me')
  me(@CurrentUser() currentUser: AuthUser) {
    return currentUser
  }
}
