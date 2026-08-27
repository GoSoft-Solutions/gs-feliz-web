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

  app.enableCors({
    origin: env.CORS_ORIGINS.length > 0 ? env.CORS_ORIGINS : false,
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
