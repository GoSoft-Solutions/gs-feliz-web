import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Payload for sending a one-off personalized email to a single contact
 * from the admin. Body is HTML (or plain text, which renders fine as HTML).
 */
export class SendContactEmailDto {
  @ApiProperty({ example: 'Un mensaje para ti' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  subject!: string;

  @ApiProperty({ example: 'Hola {{nombre}}, ...' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50000)
  html!: string;

  @ApiProperty({ required: false, example: 'Daniel Corral' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  fromName?: string;
}
