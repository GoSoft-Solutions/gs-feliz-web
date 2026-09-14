import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { AUTH_USER } from './auth.types';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { [AUTH_USER]?: unknown }>();
    if (request.path.endsWith('/health') || request.path.endsWith('/access') || request.path.includes('/public/') || request.path.includes('/auth/login') || request.path.includes('/integrations/manychat')) return true;
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw new UnauthorizedException('Autenticación requerida');
    const session = this.auth.verify(header.slice(7));
    if (session.role !== 'ADMIN') {
      const requiredPermission = permissionForPath(request.path);
      if (requiredPermission && !session.permissions.includes(requiredPermission)) throw new ForbiddenException('No tienes permiso para esta sección');
    }
    request[AUTH_USER] = session;
    return true;
  }
}

function permissionForPath(path: string): string | null {
  if (path.includes('/contacts/bulk-email')) return '/dashboard/newsletter';
  if (path.includes('/contacts')) return '/dashboard/contacts';
  if (path.includes('/campaigns')) return '/dashboard/campaigns';
  if (path.includes('/content')) return '/dashboard/content';
  return null;
}
