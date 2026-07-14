import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { AuthUser } from '../auth/jwt.strategy';
import { CreateProjectDto, UpdateProjectDto } from './projects.dto';
import { ProjectsService } from './projects.service';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private projects: ProjectsService) {}
  @Get() list(@Req() req: { user: AuthUser }) {
    return this.projects.list(req.user.organizationId);
  }
  @Roles('OWNER', 'ADMIN', 'MANAGER') @Post() create(
    @Req() req: { user: AuthUser },
    @Body() dto: CreateProjectDto,
  ) {
    return this.projects.create(req.user.userId, req.user.organizationId, dto);
  }
  @Get(':id') one(@Req() req: { user: AuthUser }, @Param('id') id: string) {
    return this.projects.findOne(req.user.organizationId, id);
  }
  @Patch(':id') update(
    @Req() req: { user: AuthUser },
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projects.update(
      req.user.userId,
      req.user.organizationId,
      id,
      dto,
    );
  }
  @Roles('OWNER', 'ADMIN') @Delete(':id') remove(
    @Req() req: { user: AuthUser },
    @Param('id') id: string,
  ) {
    return this.projects.remove(req.user.userId, req.user.organizationId, id);
  }
}
