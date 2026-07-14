import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { RolesGuard } from '../auth/roles.guard';
@Module({
  controllers: [TasksController],
  providers: [TasksService, RolesGuard],
})
export class TasksModule {}
