import { IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @MaxLength(120)
  identifier!: string;

  @IsString()
  @MaxLength(200)
  password!: string;
}
