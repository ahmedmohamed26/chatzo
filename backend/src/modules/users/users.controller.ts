import { Body, Controller, Get, Headers, Patch } from '@nestjs/common';
import { UpdateLanguageDto } from './dto/update-language.dto';
import { UsersService } from './users.service';

@Controller('me')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async me(@Headers('x-user-id') userId: string) {
    return {
      message_key: 'users.profile_loaded',
      message: 'Profile loaded',
      data: await this.usersService.getMe(userId),
    };
  }

  @Patch('language')
  async setLanguage(@Headers('x-user-id') userId: string, @Body() body: UpdateLanguageDto) {
    return {
      message_key: 'users.language_updated',
      message: 'Language updated',
      data: await this.usersService.updateLanguage(userId, body),
    };
  }
}
