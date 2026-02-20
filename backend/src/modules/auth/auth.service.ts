import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  OnModuleDestroy,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'crypto';
import { Pool } from 'pg';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

type DbUser = {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  position: string | null;
  preferred_language: string;
  tenant_id: string;
  role: string;
};

@Injectable()
export class AuthService implements OnModuleDestroy {
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

  async register(payload: RegisterDto) {
    const client = await this.pool.connect();
    let txStarted = false;

    try {
      await client.query('BEGIN');
      txStarted = true;

      const email = payload.email.trim().toLowerCase();
      const exists = await client.query('SELECT id FROM users WHERE lower(email) = $1 LIMIT 1', [email]);
      if (exists.rowCount && exists.rowCount > 0) {
        throw new ConflictException('auth.email_already_exists');
      }

      const tenantName = payload.organization_name.trim();
      const tenantSlug = this.buildTenantSlug(tenantName);
      const tenantRes = await client.query<{ id: string }>(
        'INSERT INTO tenants (name, slug) VALUES ($1, $2) RETURNING id',
        [tenantName, tenantSlug],
      );
      const tenantId = tenantRes.rows[0]?.id;
      if (!tenantId) {
        throw new InternalServerErrorException('tenant.create_failed');
      }

      const roleRes = await client.query<{ id: number }>('SELECT id FROM roles WHERE code = $1 LIMIT 1', ['company_admin']);
      const roleId = roleRes.rows[0]?.id;
      if (!roleId) {
        throw new InternalServerErrorException('auth.role_not_found');
      }

      const fullName = `${payload.first_name.trim()} ${payload.last_name.trim()}`.trim();
      const passwordHash = this.hashPassword(payload.password);

      await client.query(
        `INSERT INTO users
          (tenant_id, role_id, email, password_hash, full_name, preferred_language, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [tenantId, roleId, email, passwordHash, fullName, 'en', 'active'],
      );

      await client.query(
        `INSERT INTO subscriptions
          (tenant_id, plan_id, status, current_period_start, current_period_end, cancel_at_period_end)
         VALUES (
          $1,
          (SELECT id FROM plans WHERE code = 'free' LIMIT 1),
          'active',
          now(),
          now() + interval '30 days',
          false
         )`,
        [tenantId],
      );

      await client.query('COMMIT');

      return {
        message_key: 'auth.registered',
        message: 'Registered successfully',
        data: {
          email,
          full_name: fullName,
          organization_name: tenantName,
        },
      };
    } catch (error) {
      if (txStarted) {
        await client.query('ROLLBACK');
      }
      throw error;
    } finally {
      client.release();
    }
  }

  async login(payload: LoginDto) {
    const email = payload.email.trim().toLowerCase();
    const user = await this.findUserByEmail(email);

    if (!user || !this.verifyPassword(payload.password, user.password_hash)) {
      throw new UnauthorizedException('auth.invalid_credentials');
    }

    return {
      message_key: 'auth.logged_in',
      message: 'Logged in successfully',
      data: {
        access_token: `access_${randomUUID()}`,
        refresh_token: `refresh_${randomUUID()}`,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          position: user.position ?? '',
          preferred_language: user.preferred_language,
          tenant_id: user.tenant_id,
          role: user.role,
        },
      },
    };
  }

  private async findUserByEmail(email: string): Promise<DbUser | null> {
    const res = await this.pool.query<DbUser>(
      `
      SELECT
        u.id,
        u.email,
        u.password_hash,
        u.full_name,
        u.position,
        u.preferred_language,
        u.tenant_id,
        r.code AS role
      FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE lower(u.email) = $1
      LIMIT 1
      `,
      [email],
    );

    return res.rows[0] ?? null;
  }

  private buildTenantSlug(name: string): string {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return `${base || 'company'}-${Date.now().toString().slice(-6)}`;
  }

  private hashPassword(password: string): string {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
  }

  private verifyPassword(password: string, storedHash: string): boolean {
    const [salt, hash] = storedHash.split(':');
    if (!salt || !hash) return false;
    const hashBuffer = Buffer.from(hash, 'hex');
    const compareBuffer = scryptSync(password, salt, 64);
    return timingSafeEqual(hashBuffer, compareBuffer);
  }
}
