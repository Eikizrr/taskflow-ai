import { Module } from '@nestjs/common';
import { TeamController } from './team.controller';
import { TeamService } from './team.service';
import { RolesGuard } from '../auth/roles.guard';
@Module({
  controllers: [TeamController],
  providers: [TeamService, RolesGuard],
})
export class TeamModule {}
