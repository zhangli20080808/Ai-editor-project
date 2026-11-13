import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { MongooseModule } from '@nestjs/mongoose'

import { AdminAuditModule } from './modules/admin-audit/admin-audit.module'
import { AdminTemplatesModule } from './modules/admin-templates/admin-templates.module'
import { AdminUsersModule } from './modules/admin-users/admin-users.module'
import { AdminWorksModule } from './modules/admin-works/admin-works.module'
import { AuthModule } from './modules/auth/auth.module'
import configuration, {
  type AppConfiguration,
} from './config/configuration'
import { HealthModule } from './modules/health/health.module'
import { UsersModule } from './modules/users/users.module'

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
    AdminAuditModule,
    AdminWorksModule,
    AdminUsersModule,
    AdminTemplatesModule,
  ],
})
export class AppModule {}
