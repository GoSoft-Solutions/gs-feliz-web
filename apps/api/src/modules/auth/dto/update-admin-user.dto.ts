import { IsArray, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { AdminRole } from '../auth.types';

export class UpdateAdminUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  password?: string;

  @IsOptional()
  @IsEnum(AdminRole)
  role?: AdminRole;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];
}
