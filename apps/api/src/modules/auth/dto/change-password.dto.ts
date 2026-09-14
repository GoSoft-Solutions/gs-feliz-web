import { IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Self-service password change for the currently logged-in user. Requires
 * the current password (unlike admin-managed PATCH /users/:id, which lets
 * an ADMIN reset anyone's password without knowing the old one) — this is
 * the "I know my password and want to change it myself" path.
 */
export class ChangePasswordDto {
  @IsString()
  @MaxLength(200)
  currentPassword!: string;

  @IsString()
  @MinLength(8, { message: 'La nueva contraseña debe tener al menos 8 caracteres' })
  @MaxLength(200)
  newPassword!: string;
}
