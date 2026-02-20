import { Body, Controller, Delete, Get, Headers, Param, Patch, Post } from '@nestjs/common';
import { CreateQuickReplyDto } from './dto/create-quick-reply.dto';
import { UpdateQuickReplyDto } from './dto/update-quick-reply.dto';
import { QuickRepliesService } from './quick-replies.service';

@Controller('quick-replies')
export class QuickRepliesController {
  constructor(private readonly quickRepliesService: QuickRepliesService) {}

  @Get()
  async list(@Headers('x-tenant-id') tenantId: string) {
    return {
      message_key: 'quick_replies.listed',
      message: 'Quick replies loaded',
      data: await this.quickRepliesService.list(tenantId),
    };
  }

  @Post()
  async create(@Headers('x-tenant-id') tenantId: string, @Body() body: CreateQuickReplyDto) {
    return {
      message_key: 'quick_replies.created',
      message: 'Quick reply created',
      data: await this.quickRepliesService.create(tenantId, body),
    };
  }

  @Patch(':id')
  async update(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() body: UpdateQuickReplyDto,
  ) {
    return {
      message_key: 'quick_replies.updated',
      message: 'Quick reply updated',
      data: await this.quickRepliesService.update(tenantId, id, body),
    };
  }

  @Delete(':id')
  async remove(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    await this.quickRepliesService.remove(tenantId, id);
    return {
      message_key: 'quick_replies.deleted',
      message: 'Quick reply deleted',
      data: { id },
    };
  }
}
