import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { RolesGuard } from '../auth/roles.guard';
@Module({
  controllers: [ProjectsController],
  providers: [ProjectsService, RolesGuard],
})
export class ProjectsModule {}
