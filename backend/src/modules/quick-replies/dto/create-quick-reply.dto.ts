import { IsIn, IsNotEmpty, MinLength } from 'class-validator';

export class CreateQuickReplyDto {
  @IsNotEmpty()
  @MinLength(2)
  title!: string;

  @IsIn(['general', 'sales', 'support', 'follow-up'])
  category!: 'general' | 'sales' | 'support' | 'follow-up';

  @IsNotEmpty()
  @MinLength(2)
  content!: string;
}
