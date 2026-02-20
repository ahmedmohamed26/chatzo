import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes, scryptSync } from 'crypto';
import { Pool } from 'pg';
import { CreateTeamMemberDto } from './dto/create-team-member.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';

type TeamRow = {
  id: string;
  full_name: string;
  email: string;
  preferred_language: string;
  status: string;
  position: string | null;
  role_code: string;
  created_at: string;
};

@Injectable()
export class TeamService implements OnModuleDestroy {
  private readonly pool: Pool;
  private schemaEnsured = false;

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

  async list(tenantId: string) {
    await this.ensureSchema();
    const id = this.validateTenant(tenantId);
    const res = await this.pool.query<TeamRow>(
      `SELECT
        u.id,
        u.full_name,
        u.email,
        u.preferred_language,
        u.status,
        u.position,
        r.code AS role_code,
        u.created_at::text AS created_at
      FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE u.tenant_id = $1
      ORDER BY u.created_at DESC`,
      [id],
    );
    return res.rows.map((row) => this.mapRow(row));
  }

  async create(tenantId: string, payload: CreateTeamMemberDto) {
    await this.ensureSchema();
    const id = this.validateTenant(tenantId);
    const email = payload.email.trim().toLowerCase();

    const existing = await this.pool.query(
      'SELECT id FROM users WHERE tenant_id = $1 AND lower(email) = $2 LIMIT 1',
      [id, email],
    );
    if (existing.rowCount) {
      throw new ConflictException('team.email_exists');
    }

    const roleId = await this.getRoleId(payload.role);
    const passwordHash = this.hashPassword(payload.password);
    const res = await this.pool.query<TeamRow>(
      `INSERT INTO users
        (tenant_id, role_id, email, password_hash, full_name, preferred_language, status, position)
       VALUES ($1, $2, $3, $4, $5, 'en', 'active', $6)
       RETURNING
        id,
        full_name,
        email,
        preferred_language,
        status,
        position,
        (SELECT code FROM roles WHERE id = role_id) AS role_code,
        created_at::text AS created_at`,
      [id, roleId, email, passwordHash, payload.full_name.trim(), payload.position?.trim() || null],
    );

    return this.mapRow(res.rows[0]);
  }

  async update(tenantId: string, memberId: string, payload: UpdateTeamMemberDto) {
    await this.ensureSchema();
    const id = this.validateTenant(tenantId);
    const exists = await this.pool.query('SELECT id FROM users WHERE tenant_id = $1 AND id = $2 LIMIT 1', [id, memberId]);
    if (!exists.rowCount) {
      throw new NotFoundException('team.not_found');
    }

    const updates: string[] = [];
    const values: Array<string | null> = [id, memberId];
    let idx = 3;

    if (payload.full_name !== undefined) {
      updates.push(`full_name = $${idx++}`);
      values.push(payload.full_name.trim());
    }
    if (payload.email !== undefined) {
      const email = payload.email.trim().toLowerCase();
      const emailExists = await this.pool.query(
        'SELECT id FROM users WHERE tenant_id = $1 AND lower(email) = $2 AND id <> $3 LIMIT 1',
        [id, email, memberId],
      );
      if (emailExists.rowCount) {
        throw new ConflictException('team.email_exists');
      }
      updates.push(`email = $${idx++}`);
      values.push(email);
    }
    if (payload.password !== undefined) {
      updates.push(`password_hash = $${idx++}`);
      values.push(this.hashPassword(payload.password));
    }
    if (payload.position !== undefined) {
      updates.push(`position = $${idx++}`);
      values.push(payload.position.trim() || null);
    }
    if (payload.role !== undefined) {
      const roleId = await this.getRoleId(payload.role);
      updates.push(`role_id = $${idx++}`);
      values.push(String(roleId));
    }

    if (!updates.length) {
      throw new BadRequestException('team.no_fields_to_update');
    }

    const res = await this.pool.query<TeamRow>(
      `UPDATE users
       SET ${updates.join(', ')}, updated_at = now()
       WHERE tenant_id = $1 AND id = $2
       RETURNING
        id,
        full_name,
        email,
        preferred_language,
        status,
        position,
        (SELECT code FROM roles WHERE id = role_id) AS role_code,
        created_at::text AS created_at`,
      values,
    );

    return this.mapRow(res.rows[0]);
  }

  async remove(tenantId: string, memberId: string) {
    await this.ensureSchema();
    const id = this.validateTenant(tenantId);
    const roleCheck = await this.pool.query<{ role_code: string }>(
      `SELECT r.code AS role_code
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE u.tenant_id = $1 AND u.id = $2
       LIMIT 1`,
      [id, memberId],
    );
    if (!roleCheck.rowCount) {
      throw new NotFoundException('team.not_found');
    }
    if (roleCheck.rows[0].role_code === 'company_admin') {
      throw new ConflictException('team.cannot_delete_admin');
    }
    const res = await this.pool.query('DELETE FROM users WHERE tenant_id = $1 AND id = $2', [id, memberId]);
    if (!res.rowCount) {
      throw new NotFoundException('team.not_found');
    }
  }

  private async getRoleId(roleCode: 'company_admin' | 'agent'): Promise<number> {
    const role = await this.pool.query<{ id: number }>('SELECT id FROM roles WHERE code = $1 LIMIT 1', [roleCode]);
    const roleId = role.rows[0]?.id;
    if (!roleId) {
      throw new InternalServerErrorException('team.role_not_found');
    }
    return roleId;
  }

  private validateTenant(tenantId?: string): string {
    if (!tenantId || !tenantId.trim()) {
      throw new BadRequestException('tenant.required');
    }
    return tenantId.trim();
  }

  private mapRow(row: TeamRow) {
    return {
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      role: row.role_code,
      status: row.status,
      position: row.position ?? '',
      preferredLanguage: row.preferred_language,
      createdAt: row.created_at,
    };
  }

  private hashPassword(password: string): string {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
  }

  private async ensureSchema(): Promise<void> {
    if (this.schemaEnsured) return;
    await this.pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS position varchar(120)');
    this.schemaEnsured = true;
  }
}
