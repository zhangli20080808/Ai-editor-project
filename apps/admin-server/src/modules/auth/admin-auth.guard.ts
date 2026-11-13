import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'

import type { AuthenticatedRequest } from './current-user.decorator'
import { AuthTokenService } from './auth-token.service'
import { UsersService } from '../users/users.service'
import { UserRole, UserStatus } from '../users/schemas/user.schema'

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(
    private readonly authTokenService: AuthTokenService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const token = getBearerToken(request.headers.authorization)
    if (!token) {
      throw new UnauthorizedException('请先登录')
    }

    const payload = this.authTokenService.verify(token)
    const user = await this.usersService.findById(payload.sub)
    const authUser = this.usersService.toAuthUser(user)

    if (authUser.role !== UserRole.Admin) {
      throw new ForbiddenException('无后台访问权限')
    }
    if (authUser.status === UserStatus.Frozen) {
      throw new ForbiddenException('账号已被冻结')
    }

    request.user = authUser
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
