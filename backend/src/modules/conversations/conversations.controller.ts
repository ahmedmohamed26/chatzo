import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';

@Controller('conversations')
export class ConversationsController {
  @Get()
  list() {
    return {
      message_key: 'conversations.listed',
      message: 'Conversations loaded',
      data: [],
    };
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return {
      message_key: 'conversations.loaded',
      message: 'Conversation loaded',
      data: { id },
    };
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: 'open' | 'pending' | 'resolved' }) {
    return {
      message_key: 'conversations.status_updated',
      message: 'Conversation status updated',
      data: { id, ...body },
    };
  }

  @Patch(':id/assign')
  assign(@Param('id') id: string, @Body() body: { user_id: string }) {
    return {
      message_key: 'conversations.assigned',
      message: 'Conversation assigned',
      data: { id, ...body },
    };
  }

  @Get(':id/messages')
  messages(@Param('id') id: string) {
    return {
      message_key: 'messages.listed',
      message: 'Messages loaded',
      data: { conversation_id: id, items: [] },
    };
  }

  @Post(':id/messages')
  sendMessage(@Param('id') id: string, @Body() body: { body: string }) {
    return {
      message_key: 'messages.sent',
      message: 'Message sent',
      data: { conversation_id: id, ...body },
    };
  }
}
