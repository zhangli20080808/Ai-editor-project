import { createHmac, timingSafeEqual } from 'node:crypto'

import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import type { AppConfiguration } from '../../config/configuration'
import type { UserRole } from '../users/schemas/user.schema'

interface TokenPayload {
  sub: string
  username: string
  nickName: string
  phoneNumber: string
  role?: UserRole
  iat: number
  exp: number
}

@Injectable()
export class AuthTokenService {
  constructor(
    private readonly configService: ConfigService<AppConfiguration>,
  ) {}

  verify(token: string): TokenPayload {
    const [encodedHeader, encodedPayload, signature] = token.split('.')
    if (!encodedHeader || !encodedPayload || !signature) {
      throw new UnauthorizedException('登录态无效')
    }

    const unsignedToken = `${encodedHeader}.${encodedPayload}`
    const expectedSignature = this.signValue(unsignedToken)
    if (!safeCompare(signature, expectedSignature)) {
      throw new UnauthorizedException('登录态无效')
    }

    const payload = JSON.parse(base64urlDecode(encodedPayload)) as TokenPayload
    if (!payload.sub || payload.exp < Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException('登录已过期')
    }

    return payload
  }

  private signValue(value: string) {
    return createHmac('sha256', this.getSecret()).update(value).digest('base64url')
  }

  private getSecret() {
    return this.configService.getOrThrow('authSecret', { infer: true })
  }
}

function base64urlDecode(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8')
}

function safeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  )
}
