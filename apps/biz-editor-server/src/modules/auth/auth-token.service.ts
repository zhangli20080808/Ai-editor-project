import { createHmac, timingSafeEqual } from 'node:crypto'

import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import type { AppConfiguration } from '../../config/configuration'
import type { AuthUser } from '../users/users.service'

interface TokenPayload {
  sub: string
  username: string
  nickName: string
  phoneNumber: string
  iat: number
  exp: number
}

@Injectable()
export class AuthTokenService {
  constructor(
    private readonly configService: ConfigService<AppConfiguration>,
  ) {}

  sign(user: AuthUser) {
    const now = Math.floor(Date.now() / 1000)
    const payload: TokenPayload = {
      sub: user.id,
      username: user.username,
      nickName: user.nickName,
      phoneNumber: user.phoneNumber,
      iat: now,
      exp: now + 7 * 24 * 60 * 60,
    }
    const header = {
      alg: 'HS256',
      typ: 'JWT',
    }
    const unsignedToken = `${base64url(JSON.stringify(header))}.${base64url(
      JSON.stringify(payload),
    )}`
    const signature = this.signValue(unsignedToken)

    return `${unsignedToken}.${signature}`
  }

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

function base64url(value: string) {
  return Buffer.from(value).toString('base64url')
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
