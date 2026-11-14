import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { TenantGuard } from '../auth/tenant.guard';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, TenantGuard)
export class DashboardController {
  constructor(private service: DashboardService) {}

  @Get('summary')
  summary(@Req() req: any) {
    return this.service.summary(req.tenant.organizationId);
  }

  @Get('trends')
  trends(@Req() req: any) {
    return this.service.trends(req.tenant.organizationId);
  }
}
