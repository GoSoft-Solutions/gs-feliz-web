import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import type { AdminUser } from '@feliz/database';
import { AdminRole } from './auth.types';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';

const DEFAULT_PERMISSIONS = ['/dashboard', '/dashboard/contacts', '/dashboard/campaigns', '/dashboard/newsletter', '/dashboard/content', '/dashboard/memberships', '/dashboard/courses', '/dashboard/analytics'];

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async login(identifier: string, password: string) {
    const user = await this.prisma.adminUser.findFirst({ where: { OR: [{ username: identifier.toLowerCase() }, { email: identifier.toLowerCase() }] } });
    if (!user || !verifyPassword(password, user.passwordHash)) throw new UnauthorizedException('Credenciales incorrectas');
    return { token: this.sign(user), user: this.publicUser(user) };
  }

  /**
   * Self-service password change: the caller must prove they already know
   * the current password (unlike updateUser, which lets an ADMIN reset
   * anyone's password without it).
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.adminUser.findUnique({ where: { id: userId } });
    if (!user || !verifyPassword(currentPassword, user.passwordHash)) {
      throw new UnauthorizedException('La contraseña actual no es correcta');
    }
    await this.prisma.adminUser.update({ where: { id: userId }, data: { passwordHash: hashPassword(newPassword) } });
    return { success: true };
  }

  verify(token: string) {
    const [encoded, signature] = token.split('.');
    if (!encoded || !signature || !safeEqual(signature, signValue(encoded))) throw new UnauthorizedException('Sesión inválida');
    const session = JSON.parse(Buffer.from(encoded, 'base64url').toString()) as { sub: string; username: string; email: string; name: string; role: AdminRole; permissions: string[]; exp: number };
    if (session.exp < Date.now()) throw new UnauthorizedException('Sesión expirada');
    return { userId: session.sub, username: session.username, email: session.email, name: session.name, role: session.role, permissions: session.permissions, exp: session.exp };
  }

  async listUsers() { return (await this.prisma.adminUser.findMany({ orderBy: { createdAt: 'asc' } })).map((user) => this.publicUser(user)); }

  async createUser(dto: CreateAdminUserDto) {
    const exists = await this.prisma.adminUser.findFirst({ where: { OR: [{ username: dto.username.toLowerCase() }, { email: dto.email.toLowerCase() }] } });
    if (exists) throw new ConflictException('El usuario o email ya existe');
    const user = await this.prisma.adminUser.create({ data: { username: dto.username.toLowerCase(), email: dto.email.toLowerCase(), name: dto.name, role: dto.role, permissions: dto.role === AdminRole.ADMIN ? DEFAULT_PERMISSIONS : (dto.permissions ?? []), passwordHash: hashPassword(dto.password) } });
    return this.publicUser(user);
  }

  async deleteUser(id: string, currentUserId: string) {
    if (id === currentUserId) throw new ConflictException('No puedes eliminar tu propia sesión');
    await this.prisma.adminUser.delete({ where: { id } });
    return { success: true };
  }

  async updateUser(id: string, dto: UpdateAdminUserDto) {
    const user = await this.prisma.adminUser.update({ where: { id }, data: { ...(dto.name !== undefined ? { name: dto.name } : {}), ...(dto.password ? { passwordHash: hashPassword(dto.password) } : {}), ...(dto.role ? { role: dto.role } : {}), ...(dto.permissions ? { permissions: dto.permissions } : {}) } });
    return this.publicUser(user);
  }

  private sign(user: AdminUser) {
    const payload = Buffer.from(JSON.stringify({ sub: user.id, username: user.username, email: user.email, name: user.name, role: user.role, permissions: user.role === AdminRole.ADMIN ? DEFAULT_PERMISSIONS : (user.permissions as string[]), exp: Date.now() + 8 * 60 * 60 * 1000 })).toString('base64url');
    return `${payload}.${signValue(payload)}`;
  }

  private publicUser(user: AdminUser) { return { id: user.id, username: user.username, email: user.email, name: user.name, role: user.role, permissions: user.role === AdminRole.ADMIN ? DEFAULT_PERMISSIONS : (user.permissions as string[]) }; }
}

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, key] = stored.split(':');
  if (!salt || !key) return false;
  const derived = scryptSync(password, salt, 64);
  return safeEqual(derived.toString('hex'), key);
}

function signValue(value: string): string {
  return createHmac('sha256', process.env.JWT_SECRET || 'feliz-admin-session-secret').update(value).digest('base64url');
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a); const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
