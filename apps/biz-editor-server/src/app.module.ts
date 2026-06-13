import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { MongooseModule } from '@nestjs/mongoose'

import configuration, {
  type AppConfiguration,
} from './config/configuration'
import { AuthModule } from './modules/auth/auth.module'
import { HealthModule } from './modules/health/health.module'
import { UsersModule } from './modules/users/users.module'
import { WorksModule } from './modules/works/works.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfiguration>) => ({
        uri: configService.getOrThrow('mongodbUri', { infer: true }),
        retryAttempts: 1,
        retryDelay: 1000,
        serverSelectionTimeoutMS: 3000,
      }),
    }),
    HealthModule,
    UsersModule,
    AuthModule,
    WorksModule,
  ],
})
export class AppModule {}
