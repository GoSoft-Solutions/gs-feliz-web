import 'reflect-metadata';
// Load .env before anything reads process.env. In deployed environments
// (Elastic Beanstalk) real environment variables take precedence, since
// dotenv never overwrites variables that are already set.
//
// Two locations are checked, in order: this app's own .env, then the
// monorepo root .env. This makes `node dist/main.js` work regardless of
// which directory the process was started from.
import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';

loadEnv({ path: resolve(__dirname, '../.env') });
loadEnv({ path: resolve(__dirname, '../../../.env') });

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { validateEnv } from '@feliz/config';

async function bootstrap(): Promise<void> {
  // Validate env vars before the Nest container even boots, so
  // misconfiguration fails immediately with a clear message.
  const env = validateEnv(process.env);

  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useLogger(app.get(Logger));
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS: allow the explicitly configured origins (CORS_ORIGINS) plus any
  // Vercel deployment (*.vercel.app) and the danielcorral.com.mx domain and
  // its subdomains. Using a callback keeps this resilient to exact-string
  // mismatches (trailing slashes, preview URLs) that would otherwise block
  // the browser's preflight while direct API calls still work.
  const allowedExact = new Set(env.CORS_ORIGINS);
  const allowedPatterns = [
    /^https?:\/\/localhost(:\d+)?$/,
    /^https:\/\/([a-z0-9-]+\.)*vercel\.app$/,
    /^https:\/\/([a-z0-9-]+\.)*danielcorral\.com\.mx$/,
  ];
  app.enableCors({
    origin(origin, callback) {
      // Non-browser clients (curl, server-to-server) send no Origin — allow.
      if (!origin) return callback(null, true);
      if (allowedExact.has(origin)) return callback(null, true);
      if (allowedPatterns.some((re) => re.test(origin))) return callback(null, true);
      return callback(null, false);
    },
    credentials: true,
  });

  app.setGlobalPrefix('api/v1', { exclude: ['health'] });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('FELIZ Platform API')
    .setDescription('Central API for contacts, campaigns, content, and integrations.')
    .setVersion('1.0')
    .addApiKey({ type: 'apiKey', name: 'X-API-Key', in: 'header' }, 'manychat-api-key')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument);

  await app.listen(env.PORT);
}

bootstrap();
