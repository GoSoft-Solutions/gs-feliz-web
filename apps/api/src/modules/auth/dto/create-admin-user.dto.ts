import { IsArray, IsEmail, IsEnum, IsOptional, IsString, MaxLength, Matches } from 'class-validator';
import { AdminRole } from '../auth.types';

export class CreateAdminUserDto {
  @IsString()
  @Matches(/^[a-z0-9._-]+$/)
  @MaxLength(60)
  username!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MaxLength(160)
  name!: string;

  @IsString()
  @MaxLength(200)
  password!: string;

  @IsEnum(AdminRole)
  role!: AdminRole;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];
}
