import { Body, Controller, Delete, ForbiddenException, Get, Param, ParseUUIDPipe, Patch, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { AUTH_USER, type AdminSession } from './auth.types';
import { LoginDto } from './dto/login.dto';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login') login(@Body() dto: LoginDto) { return this.auth.login(dto.identifier, dto.password); }

  @Get('me') me(@Req() request: Request & { [AUTH_USER]?: AdminSession }) { return request[AUTH_USER]; }

  @Get('users') users(@Req() request: Request & { [AUTH_USER]?: AdminSession }) { this.requireAdmin(request); return this.auth.listUsers(); }

  @Post('users') create(@Req() request: Request & { [AUTH_USER]?: AdminSession }, @Body() dto: CreateAdminUserDto) { this.requireAdmin(request); return this.auth.createUser(dto); }

  @Patch('users/:id') update(@Req() request: Request & { [AUTH_USER]?: AdminSession }, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAdminUserDto) { this.requireAdmin(request); return this.auth.updateUser(id, dto); }

  @Delete('users/:id') remove(@Req() request: Request & { [AUTH_USER]?: AdminSession }, @Param('id', ParseUUIDPipe) id: string) { const session = this.requireAdmin(request); return this.auth.deleteUser(id, session.userId); }

  private requireAdmin(request: Request & { [AUTH_USER]?: AdminSession }) { const user = request[AUTH_USER]; if (!user || user.role !== 'ADMIN') throw new ForbiddenException('Administrador requerido'); return user; }
}
