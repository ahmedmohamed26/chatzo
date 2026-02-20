import { IsIn, IsOptional, MinLength } from 'class-validator';

export class UpdateQuickReplyDto {
  @IsOptional()
  @MinLength(2)
  title?: string;

  @IsOptional()
  @IsIn(['general', 'sales', 'support', 'follow-up'])
  category?: 'general' | 'sales' | 'support' | 'follow-up';

  @IsOptional()
  @MinLength(2)
  content?: string;
}
