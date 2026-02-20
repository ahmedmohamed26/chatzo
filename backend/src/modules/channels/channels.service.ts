import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { ConnectWhatsappDto } from './dto/connect-whatsapp.dto';

type ChannelRow = {
  id: string;
  channel_type: 'whatsapp' | 'instagram' | 'messenger' | 'telegram';
  display_name: string;
  external_id: string;
  status: 'connected' | 'disconnected';
  created_at: string;
};

@Injectable()
export class ChannelsService implements OnModuleDestroy {
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

  async getSummary(tenantId: string) {
    await this.ensureSchema();
    const id = this.validateTenant(tenantId);
    const res = await this.pool.query<{ type: string; total: string }>(
      `SELECT type, count(*)::text AS total
       FROM channels
       WHERE tenant_id = $1
       GROUP BY type`,
      [id],
    );

    const summary = {
      whatsapp: 0,
      instagram: 0,
      messenger: 0,
      telegram: 0,
    };

    for (const row of res.rows) {
      const key = row.type as keyof typeof summary;
      if (key in summary) {
        summary[key] = Number(row.total);
      }
    }

    return summary;
  }

  async list(tenantId: string) {
    await this.ensureSchema();
    const id = this.validateTenant(tenantId);
    const res = await this.pool.query<ChannelRow>(
      `SELECT
        id,
        type::text AS channel_type,
        display_name,
        coalesce(external_account_id, '') AS external_id,
        status::text AS status,
        created_at::text AS created_at
      FROM channels
      WHERE tenant_id = $1
      ORDER BY created_at DESC`,
      [id],
    );
    return res.rows.map((row) => ({
      id: row.id,
      channelType: row.channel_type,
      displayName: row.display_name,
      externalId: row.external_id,
      status: row.status,
      createdAt: row.created_at,
    }));
  }

  async connectWhatsapp(tenantId: string, payload: ConnectWhatsappDto) {
    await this.ensureSchema();
    const id = this.validateTenant(tenantId);

    const res = await this.pool.query<ChannelRow>(
      `INSERT INTO channels
        (tenant_id, type, external_account_id, display_name, status, waba_id, access_token, verify_token)
       VALUES ($1, 'whatsapp', $2, $3, 'connected', $4, $5, $6)
       RETURNING
        id,
        type::text AS channel_type,
        display_name,
        coalesce(external_account_id, '') AS external_id,
        status::text AS status,
        created_at::text AS created_at`,
      [
        id,
        payload.phoneNumberId.trim(),
        payload.displayName.trim(),
        payload.wabaId?.trim() || null,
        payload.accessToken.trim(),
        payload.verifyToken.trim(),
      ],
    );

    const row = res.rows[0];
    return {
      id: row.id,
      channelType: row.channel_type,
      displayName: row.display_name,
      externalId: row.external_id,
      status: row.status,
      createdAt: row.created_at,
    };
  }

  async remove(tenantId: string, channelId: string) {
    await this.ensureSchema();
    const id = this.validateTenant(tenantId);
    const res = await this.pool.query('DELETE FROM channels WHERE tenant_id = $1 AND id = $2', [id, channelId]);
    if (!res.rowCount) {
      throw new NotFoundException('channels.not_found');
    }
  }

  private validateTenant(tenantId?: string): string {
    if (!tenantId || !tenantId.trim()) {
      throw new BadRequestException('tenant.required');
    }
    return tenantId.trim();
  }

  private async ensureSchema(): Promise<void> {
    if (this.schemaEnsured) return;
    await this.pool.query(
      'ALTER TABLE channels ADD COLUMN IF NOT EXISTS waba_id varchar(255), ADD COLUMN IF NOT EXISTS access_token text, ADD COLUMN IF NOT EXISTS verify_token varchar(255)',
    );
    this.schemaEnsured = true;
  }
}
