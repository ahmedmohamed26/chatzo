import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

const ROLES = ['company_admin', 'agent'] as const;

export class CreateTeamMemberDto {
  @IsString()
  @MinLength(2)
  full_name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsString()
  @IsIn(ROLES)
  role!: 'company_admin' | 'agent';

  @IsOptional()
  @IsString()
  position?: string;
}
