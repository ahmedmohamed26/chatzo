import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { CreateQuickReplyDto } from './dto/create-quick-reply.dto';
import { UpdateQuickReplyDto } from './dto/update-quick-reply.dto';

type QuickReplyRow = {
  id: string;
  title: string;
  category: 'general' | 'sales' | 'support' | 'follow-up';
  content: string;
};

@Injectable()
export class QuickRepliesService implements OnModuleDestroy {
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
    const res = await this.pool.query<QuickReplyRow>(
      `SELECT id, title, category, content
       FROM quick_replies
       WHERE tenant_id = $1 AND is_active = true
       ORDER BY created_at DESC`,
      [id],
    );
    return res.rows;
  }

  async create(tenantId: string, payload: CreateQuickReplyDto) {
    await this.ensureSchema();
    const id = this.validateTenant(tenantId);
    const shortcut = this.generateShortcut(payload.title);
    const res = await this.pool.query<QuickReplyRow>(
      `INSERT INTO quick_replies (tenant_id, title, shortcut, category, content, language, is_active)
       VALUES ($1, $2, $3, $4, $5, 'en', true)
       RETURNING id, title, category, content`,
      [id, payload.title.trim(), shortcut, payload.category, payload.content.trim()],
    );
    return res.rows[0];
  }

  async update(tenantId: string, replyId: string, payload: UpdateQuickReplyDto) {
    await this.ensureSchema();
    const id = this.validateTenant(tenantId);
    const existing = await this.pool.query<{ id: string }>(
      'SELECT id FROM quick_replies WHERE tenant_id = $1 AND id = $2 AND is_active = true LIMIT 1',
      [id, replyId],
    );
    if (!existing.rowCount) {
      throw new NotFoundException('quick_replies.not_found');
    }

    const updates: string[] = [];
    const values: Array<string> = [id, replyId];
    let idx = 3;

    if (payload.title !== undefined) {
      updates.push(`title = $${idx++}`);
      values.push(payload.title.trim());
    }
    if (payload.category !== undefined) {
      updates.push(`category = $${idx++}`);
      values.push(payload.category);
    }
    if (payload.content !== undefined) {
      updates.push(`content = $${idx++}`);
      values.push(payload.content.trim());
    }
    if (updates.length === 0) {
      throw new BadRequestException('quick_replies.no_fields_to_update');
    }

    const res = await this.pool.query<QuickReplyRow>(
      `UPDATE quick_replies
       SET ${updates.join(', ')}
       WHERE tenant_id = $1 AND id = $2
       RETURNING id, title, category, content`,
      values,
    );
    return res.rows[0];
  }

  async remove(tenantId: string, replyId: string) {
    await this.ensureSchema();
    const id = this.validateTenant(tenantId);
    const res = await this.pool.query(
      `UPDATE quick_replies
       SET is_active = false
       WHERE tenant_id = $1 AND id = $2 AND is_active = true`,
      [id, replyId],
    );
    if (!res.rowCount) {
      throw new NotFoundException('quick_replies.not_found');
    }
  }

  private validateTenant(tenantId?: string): string {
    if (!tenantId || !tenantId.trim()) {
      throw new BadRequestException('tenant.required');
    }
    return tenantId.trim();
  }

  private generateShortcut(title: string): string {
    const base = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 40);
    return `${base || 'reply'}_${Date.now().toString().slice(-5)}`;
  }

  private async ensureSchema(): Promise<void> {
    if (this.schemaEnsured) return;
    await this.pool.query(
      "ALTER TABLE quick_replies ADD COLUMN IF NOT EXISTS category varchar(30) not null default 'general'",
    );
    this.schemaEnsured = true;
  }
}
