import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import type { IncomingMessage } from 'http';
import { randomUUID } from 'crypto';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { AppConfigModule, ENV_CONFIG } from './config/app-config.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './modules/health/health.module';
import { CoreModule } from './modules/core/core.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { PublicModule } from './modules/public/public.module';
import { ContentModule } from './modules/content/content.module';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import type { EnvConfig } from '@feliz/config';

/**
 * Root application module.
 *
 * Phase 1 scope: only wires cross-cutting concerns (config, logging, rate
 * limiting) and the Health module. Business modules (Contacts, Campaigns,
 * Content, Newsletter, Payments, Memberships, Courses, Sessions,
 * Integrations, Admin) are added incrementally as their phase begins —
 * see docs/roadmap.md. This keeps the monolith modular without importing
 * empty/unused modules ahead of time.
 */
@Module({
  imports: [
    AppConfigModule,
    LoggerModule.forRootAsync({
      inject: [ENV_CONFIG],
      useFactory: (env: EnvConfig) => ({
        pinoHttp: {
          level: env.LOG_LEVEL,
          transport:
            env.NODE_ENV === 'development'
              ? { target: 'pino-pretty', options: { singleLine: true } }
              : undefined,
          // Never log sensitive headers/values (API keys, auth tokens).
          redact: {
            paths: [
              'req.headers.authorization',
              'req.headers["x-api-key"]',
              'req.headers.cookie',
            ],
            remove: true,
          },
          // Reuse the request ID assigned by RequestIdMiddleware so
          // application logs and HTTP logs share the same correlation ID.
          genReqId: (req: IncomingMessage) =>
            (req as IncomingMessage & { id?: string }).id ?? randomUUID(),
        },
      }),
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 100,
      },
    ]),
    DatabaseModule,
    HealthModule,
    CoreModule,
    IntegrationsModule,
    PublicModule,
    ContentModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
