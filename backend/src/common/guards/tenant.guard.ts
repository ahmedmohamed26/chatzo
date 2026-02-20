import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const userTenant = req.user?.tenant_id;
    const requestedTenant = req.headers['x-tenant-id'];

    if (requestedTenant && userTenant && requestedTenant !== userTenant) {
      throw new ForbiddenException('tenant.access_denied');
    }

    req.tenantId = userTenant ?? requestedTenant;
    return true;
  }
}
