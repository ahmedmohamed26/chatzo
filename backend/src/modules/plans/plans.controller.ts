import { Controller, Get } from '@nestjs/common';

@Controller('plans')
export class PlansController {
  @Get()
  list() {
    return {
      message_key: 'plans.listed',
      message: 'Plans loaded',
      data: [
        {
          code: 'free',
          limits: { numbers: 1, agents: 1, conversations: 300 },
          features: { quick_replies: false, assignment: false, ai_enabled: false },
        },
        {
          code: 'pro',
          limits: { numbers: 3, agents: 5, conversations: -1 },
          features: { quick_replies: true, assignment: true, ai_enabled: false },
        },
        {
          code: 'business',
          limits: { numbers: -1, agents: -1, conversations: -1 },
          features: { quick_replies: true, assignment: true, advanced_analytics: true, ai_enabled: false },
        },
      ],
    };
  }
}
