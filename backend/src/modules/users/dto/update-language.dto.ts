import { IsIn } from 'class-validator';

export class UpdateLanguageDto {
  @IsIn(['en', 'ar'])
  preferred_language!: 'en' | 'ar';
}
