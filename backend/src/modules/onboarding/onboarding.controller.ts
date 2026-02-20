import { Controller, Get, Param, Post } from '@nestjs/common';

@Controller('onboarding')
export class OnboardingController {
  @Get('state')
  state() {
    return {
      message_key: 'onboarding.state_loaded',
      message: 'Onboarding state loaded',
      data: {
        current_step: 1,
        completed_steps: [],
        total_steps: 5,
      },
    };
  }

  @Post('step/:step/complete')
  complete(@Param('step') step: string) {
    return {
      message_key: 'onboarding.step_completed',
      message: 'Step completed',
      data: { completed_step: Number(step) },
    };
  }

  @Post('resume')
  resume() {
    return {
      message_key: 'onboarding.resumed',
      message: 'Onboarding resumed',
      data: { redirect_step: 1 },
    };
  }
}
