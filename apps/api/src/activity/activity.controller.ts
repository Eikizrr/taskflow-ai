import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { AuthUser } from '../auth/jwt.strategy';
import { ActivityService } from './activity.service';
@UseGuards(AuthGuard('jwt'))
@Controller('activities')
export class ActivityController {
  constructor(private activity: ActivityService) {}
  @Get() list(
    @Req() req: { user: AuthUser },
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
  ) {
    return this.activity.list(req.user.organizationId, entityType, entityId);
  }
}
