import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { UpdateLanguageDto } from './dto/update-language.dto';

type UserRow = {
  id: string;
  email: string;
  full_name: string;
  preferred_language: string;
  tenant_id: string;
  role: string;
};

@Injectable()
export class UsersService implements OnModuleDestroy {
  private readonly pool: Pool;

  constructor(configService: ConfigService) {
    const connectionString = configService.get<string>('DATABASE_URL');
    if (!connectionString) {
      throw new InternalServerErrorException('config.database_url_missing');
    }
    this.pool = new Pool({ connectionString });
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }

  async getMe(userId: string) {
    const id = this.validateUserId(userId);
    const res = await this.pool.query<UserRow>(
      `
      SELECT u.id, u.email, u.full_name, u.preferred_language, u.tenant_id, r.code AS role
      FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE u.id = $1
      LIMIT 1
      `,
      [id],
    );
    if (!res.rowCount) {
      throw new NotFoundException('users.not_found');
    }
    return res.rows[0];
  }

  async updateLanguage(userId: string, payload: UpdateLanguageDto) {
    const id = this.validateUserId(userId);
    const res = await this.pool.query<UserRow>(
      `
      UPDATE users
      SET preferred_language = $2
      WHERE id = $1
      RETURNING id, email, full_name, preferred_language, tenant_id
      `,
      [id, payload.preferred_language],
    );
    if (!res.rowCount) {
      throw new NotFoundException('users.not_found');
    }
    return res.rows[0];
  }

  private validateUserId(userId?: string): string {
    if (!userId || !userId.trim()) {
      throw new BadRequestException('users.id_required');
    }
    return userId.trim();
  }
}
