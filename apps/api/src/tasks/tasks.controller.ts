import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { AuthUser } from '../auth/jwt.strategy';
import { CreateTaskDto, UpdateTaskDto } from './tasks.dto';
import { TasksService } from './tasks.service';
import { Roles } from '../auth/roles.decorator';
@UseGuards(AuthGuard('jwt'))
@Controller('tasks')
export class TasksController {
  constructor(private tasks: TasksService) {}
  @Get() list(
    @Req() req: { user: AuthUser },
    @Query('projectId') projectId?: string,
    @Query('assigneeId') assigneeId?: string,
  ) {
    return this.tasks.list(req.user.organizationId, projectId, assigneeId);
  }
  @Post() create(@Req() req: { user: AuthUser }, @Body() dto: CreateTaskDto) {
    return this.tasks.create(req.user.userId, req.user.organizationId, dto);
  }
  @Get(':id') one(@Req() req: { user: AuthUser }, @Param('id') id: string) {
    return this.tasks.findOne(req.user.organizationId, id);
  }
  @Patch(':id') update(
    @Req() req: { user: AuthUser },
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasks.update(req.user.userId, req.user.organizationId, id, dto);
  }
  @Roles('OWNER', 'ADMIN', 'MANAGER') @Delete(':id') remove(
    @Req() req: { user: AuthUser },
    @Param('id') id: string,
  ) {
    return this.tasks.remove(req.user.userId, req.user.organizationId, id);
  }
}
