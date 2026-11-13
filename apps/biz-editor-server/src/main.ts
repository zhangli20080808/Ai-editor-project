import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import type { NestExpressApplication } from '@nestjs/platform-express'
import 'reflect-metadata'

import { AppModule } from './app.module'
import type { AppConfiguration } from './config/configuration'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  })
  const configService = app.get(ConfigService<AppConfiguration>)
  const port = configService.getOrThrow('port', { infer: true })

  app.useBodyParser('json', { limit: '2mb' })
  app.useBodyParser('urlencoded', { extended: true, limit: '2mb' })
  app.setGlobalPrefix('api')
  app.enableCors()
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  )

  await app.listen(port)
}

void bootstrap()
