import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { AuthUser } from '../auth/jwt.strategy';
import { DashboardService } from './dashboard.service';
@UseGuards(AuthGuard('jwt'))
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboard: DashboardService) {}
  @Get() overview(@Req() req: { user: AuthUser }) {
    return this.dashboard.overview(req.user.organizationId, req.user.userId);
  }
  @Get('risks') risks(@Req() req: { user: AuthUser }) {
    return this.dashboard.risks(req.user.organizationId);
  }
}
