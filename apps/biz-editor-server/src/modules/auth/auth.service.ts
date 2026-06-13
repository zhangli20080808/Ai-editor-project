import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import type { AppConfiguration } from '../../config/configuration'
import { UsersService, type AuthUser } from '../users/users.service'
import { AuthTokenService } from './auth-token.service'
import type { LoginByPhoneDto } from './dto/login-by-phone.dto'
import type { SendCodeDto } from './dto/send-code.dto'

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService<AppConfiguration>,
    private readonly usersService: UsersService,
    private readonly authTokenService: AuthTokenService,
  ) {}

  sendCode(sendCodeDto: SendCodeDto) {
    return {
      phoneNumber: sendCodeDto.phoneNumber,
      mockCode: this.getMockSmsCode(),
      expiresIn: 300,
    }
  }

  async loginByPhone(loginDto: LoginByPhoneDto) {
    if (loginDto.code !== this.getMockSmsCode()) {
      throw new UnauthorizedException('验证码错误')
    }

    const user = await this.usersService.findOrCreateByPhone(
      loginDto.phoneNumber,
    )
    const authUser = this.usersService.toAuthUser(user)

    return {
      token: this.authTokenService.sign(authUser),
      user: authUser,
    }
  }

  async verifyAccessToken(token: string): Promise<AuthUser> {
    const payload = this.authTokenService.verify(token)
    const user = await this.usersService.findById(payload.sub)

    return this.usersService.toAuthUser(user)
  }

  private getMockSmsCode() {
    return this.configService.getOrThrow('mockSmsCode', { infer: true })
  }
}
