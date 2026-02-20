import { Body, Controller, Get, Post } from '@nestjs/common';

@Controller('subscription')
export class SubscriptionsController {
  @Get()
  current() {
    return {
      message_key: 'subscription.loaded',
      message: 'Subscription loaded',
      data: { plan: 'free', status: 'active', current_period_end: '2026-03-01T00:00:00Z' },
    };
  }

  @Post('upgrade')
  upgrade(@Body() body: { plan_code: 'pro' | 'business' }) {
    return {
      message_key: 'subscription.upgraded',
      message: 'Subscription upgraded',
      data: body,
    };
  }

  @Post('downgrade')
  downgrade(@Body() body: { plan_code: 'free' | 'pro' }) {
    return {
      message_key: 'subscription.downgrade_scheduled',
      message: 'Downgrade scheduled',
      data: body,
    };
  }
}
