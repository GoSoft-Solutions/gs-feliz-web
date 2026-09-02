import { Body, Controller, Get, Header, HttpCode, HttpStatus, Inject, Post, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { EnvConfig } from '@feliz/config';
import { ENV_CONFIG } from '../../config/app-config.module';
import { PublicService } from './public.service';
import { SubscribeDto } from './dto/subscribe.dto';
import { verifyUnsubscribeToken } from '../email/unsubscribe.util';

/**
 * Public, unauthenticated endpoints called directly by the capture pages.
 * No API key — but rate-limited per IP to blunt abuse/spam, tighter than
 * the app-wide default.
 */
@ApiTags('public')
@Controller('public')
export class PublicController {
  constructor(
    private readonly publicService: PublicService,
    @Inject(ENV_CONFIG) private readonly env: EnvConfig,
  ) {}

  @Post('subscribe')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @ApiOperation({
    summary: 'Subscribe from a capture page (creates/associates the contact and sends the welcome email)',
  })
  subscribe(@Body() dto: SubscribeDto): ReturnType<PublicService['subscribe']> {
    return this.publicService.subscribe(dto);
  }

  /**
   * Unsubscribe link target embedded in every email. Validates the HMAC
   * token so a link only works for its intended recipient, flags the
   * contact as opted out, and returns a simple confirmation page.
   */
  @Get('unsubscribe')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @ApiOperation({ summary: 'Unsubscribe a contact from email (from the link in emails)' })
  async unsubscribe(
    @Query('email') email: string,
    @Query('token') token: string,
  ): Promise<string> {
    const valid =
      email && token && verifyUnsubscribeToken(email, token, this.env.UNSUBSCRIBE_SECRET);
    if (valid) {
      await this.publicService.unsubscribe(email);
    }
    // Always show the same page whether or not the email existed, to avoid
    // leaking which addresses are subscribed.
    return unsubscribePage(Boolean(valid));
  }
}

function unsubscribePage(ok: boolean): string {
  const msg = ok
    ? 'Tu suscripción fue cancelada. No recibirás más correos.'
    : 'No pudimos procesar tu solicitud. El enlace puede haber expirado.';
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Cancelar suscripción</title></head><body style="font-family:system-ui,sans-serif;background:#0A0A0A;color:#F0EDE6;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0"><div style="text-align:center;max-width:420px;padding:24px"><h1 style="font-size:28px;letter-spacing:2px">DANIEL CORRAL</h1><p style="color:rgba(240,237,230,0.7);font-size:16px;line-height:1.6">${msg}</p></div></body></html>`;
}
