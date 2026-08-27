import { Global, Module } from '@nestjs/common';
import { validateEnv, type EnvConfig } from '@feliz/config';

export const ENV_CONFIG = Symbol('ENV_CONFIG');

/**
 * Global module that validates process.env once at boot (via @feliz/config)
 * and exposes the typed, validated config to the rest of the app through
 * dependency injection. Fails fast with a descriptive error if required
 * variables are missing or malformed.
 */
@Global()
@Module({
  providers: [
    {
      provide: ENV_CONFIG,
      useFactory: (): EnvConfig => validateEnv(process.env),
    },
  ],
  exports: [ENV_CONFIG],
})
export class AppConfigModule {}
