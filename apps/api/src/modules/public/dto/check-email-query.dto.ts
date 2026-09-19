import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MaxLength } from 'class-validator';

/**
 * Used by the capture pages to decide whether to ask for a name: an
 * email that's already a Contact skips straight to sending, a new one
 * gets a name field before submitting.
 */
export class CheckEmailQueryDto {
  @ApiProperty({ example: 'israel@example.com' })
  @IsEmail()
  @MaxLength(320)
  email!: string;
}
