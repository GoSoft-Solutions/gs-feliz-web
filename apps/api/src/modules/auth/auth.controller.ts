import { Body, Controller, Delete, ForbiddenException, Get, Param, ParseUUIDPipe, Patch, Post, Req, UnauthorizedException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { AUTH_USER, type AdminSession } from './auth.types';
import { LoginDto } from './dto/login.dto';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  // Tighter than the app-wide default (100/min) — this is a credential
  // check, so it needs its own brute-force ceiling regardless of the
  // global limit.
  @Post('login')
  @Throttle({ default: { ttl: 60_000, limit: 8 } })
  login(@Body() dto: LoginDto) { return this.auth.login(dto.identifier, dto.password); }

  @Get('me') me(@Req() request: Request & { [AUTH_USER]?: AdminSession }) { return request[AUTH_USER]; }

  @Post('me/password')
  @Throttle({ default: { ttl: 60_000, limit: 8 } })
  changeMyPassword(@Req() request: Request & { [AUTH_USER]?: AdminSession }, @Body() dto: ChangePasswordDto) {
    const session = request[AUTH_USER];
    if (!session) throw new UnauthorizedException('Sesión inválida');
    return this.auth.changePassword(session.userId, dto.currentPassword, dto.newPassword);
  }

  @Get('users') users(@Req() request: Request & { [AUTH_USER]?: AdminSession }) { this.requireAdmin(request); return this.auth.listUsers(); }

  @Post('users') create(@Req() request: Request & { [AUTH_USER]?: AdminSession }, @Body() dto: CreateAdminUserDto) { this.requireAdmin(request); return this.auth.createUser(dto); }

  @Patch('users/:id') update(@Req() request: Request & { [AUTH_USER]?: AdminSession }, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAdminUserDto) { this.requireAdmin(request); return this.auth.updateUser(id, dto); }

  @Delete('users/:id') remove(@Req() request: Request & { [AUTH_USER]?: AdminSession }, @Param('id', ParseUUIDPipe) id: string) { const session = this.requireAdmin(request); return this.auth.deleteUser(id, session.userId); }

  private requireAdmin(request: Request & { [AUTH_USER]?: AdminSession }) { const user = request[AUTH_USER]; if (!user || user.role !== 'ADMIN') throw new ForbiddenException('Administrador requerido'); return user; }
}
