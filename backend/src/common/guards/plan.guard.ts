import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

@Injectable()
export class PlanGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const subscription = req.subscription ?? { status: 'active' };
    if (!['active', 'trialing'].includes(subscription.status)) {
      throw new ForbiddenException('subscription.inactive');
    }
    return true;
  }
}
