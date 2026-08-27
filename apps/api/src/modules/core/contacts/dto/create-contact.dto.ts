import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsObject, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

// Loose E.164-ish phone validation (+ followed by 8-15 digits). Full
// libphonenumber-based validation is not worth the dependency weight for
// a field that is optional and only lightly used today.
const PHONE_REGEX = /^\+?[1-9]\d{7,14}$/;

export class CreateContactDto {
  @ApiPropertyOptional({ example: 'juan@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'Juan' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Perez' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  lastName?: string;

  @ApiPropertyOptional({ example: '+521234567890' })
  @IsOptional()
  @Matches(PHONE_REGEX, { message: 'phone must be a valid phone number (E.164-like format)' })
  phone?: string;

  @ApiPropertyOptional({ description: 'Arbitrary extra data', example: {} })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
