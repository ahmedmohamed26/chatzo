import { IsOptional, IsString, MinLength } from 'class-validator';

export class ConnectWhatsappDto {
  @IsString()
  @MinLength(2)
  displayName!: string;

  @IsString()
  @MinLength(3)
  phoneNumberId!: string;

  @IsOptional()
  @IsString()
  wabaId?: string;

  @IsString()
  @MinLength(6)
  accessToken!: string;

  @IsString()
  @MinLength(6)
  verifyToken!: string;
}
