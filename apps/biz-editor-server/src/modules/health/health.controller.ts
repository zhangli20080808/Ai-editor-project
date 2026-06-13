import { Controller, Get } from '@nestjs/common'
import { InjectConnection } from '@nestjs/mongoose'
import type { Connection } from 'mongoose'

const readyStates: Record<number, string> = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
}

@Controller('health')
export class HealthController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Get()
  getHealth() {
    return {
      service: 'biz-editor-server',
      status: 'ok',
      timestamp: new Date().toISOString(),
    }
  }

  @Get('mongo')
  getMongoHealth() {
    return {
      database: this.connection.name,
      readyState: this.connection.readyState,
      status: readyStates[this.connection.readyState] ?? 'unknown',
    }
  }
}
