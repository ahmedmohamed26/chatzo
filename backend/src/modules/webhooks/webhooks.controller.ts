import { Body, Controller, Post } from '@nestjs/common';

@Controller('webhooks/whatsapp')
export class WebhooksController {
  @Post()
  receive(@Body() payload: unknown) {
    return {
      message_key: 'webhooks.received',
      message: 'Webhook received',
      data: { accepted: true, payload },
    };
  }
}
