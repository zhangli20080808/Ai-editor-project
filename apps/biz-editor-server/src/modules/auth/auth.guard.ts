import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'

import type { AuthenticatedRequest } from './current-user.decorator'
import { AuthService } from './auth.service'

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const token = getBearerToken(request.headers.authorization)
    if (!token) {
      throw new UnauthorizedException('请先登录')
    }

    request.user = await this.authService.verifyAccessToken(token)
    return true
  }
}

function getBearerToken(authorization: string | undefined) {
  if (!authorization) {
    return null
  }

  const [type, token] = authorization.split(' ')
  if (type !== 'Bearer' || !token) {
    return null
  }

  return token
}
