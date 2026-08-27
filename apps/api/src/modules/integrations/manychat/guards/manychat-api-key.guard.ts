import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { ENV_CONFIG } from '../../../../config/app-config.module';
import { Inject } from '@nestjs/common';
import type { EnvConfig } from '@feliz/config';

/**
 * Authenticates ManyChat webhook requests via a shared secret in the
 * X-API-Key header. This is intentionally simple (no JWT, no OAuth) —
 * ManyChat only supports static headers on outgoing HTTP requests, and a
 * single shared secret is enough for a single trusted integration.
 */
@Injectable()
export class ManyChatApiKeyGuard implements CanActivate {
  constructor(@Inject(ENV_CONFIG) private readonly env: EnvConfig) {}

  canActivate(context: ExecutionContext): boolean {
    if (!this.env.MANYCHAT_API_KEY) {
      // Fails closed: if no key is configured, the integration is
      // treated as disabled rather than silently accepting any request.
      throw new UnauthorizedException('ManyChat integration is not configured');
    }

    const request = context.switchToHttp().getRequest<Request>();
    const providedKey = request.headers['x-api-key'];

    if (providedKey !== this.env.MANYCHAT_API_KEY) {
      throw new UnauthorizedException('Invalid API key');
    }

    return true;
  }
}
