import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

const ROLES = ['company_admin', 'agent'] as const;

export class UpdateTeamMemberDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  full_name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsString()
  @IsIn(ROLES)
  role?: 'company_admin' | 'agent';

  @IsOptional()
  @IsString()
  position?: string;
}
