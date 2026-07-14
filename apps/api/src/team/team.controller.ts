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
import { Roles } from '../auth/roles.decorator';
import { AddMemberDto, UpdateRoleDto } from './team.dto';
import { TeamService } from './team.service';
@UseGuards(AuthGuard('jwt'))
@Controller('team')
export class TeamController {
  constructor(private team: TeamService) {}
  @Get() list(@Req() req: { user: AuthUser }) {
    return this.team.list(req.user.organizationId);
  }
  @Roles('OWNER', 'ADMIN') @Post() add(
    @Req() req: { user: AuthUser },
    @Body() dto: AddMemberDto,
  ) {
    return this.team.add(req.user.organizationId, dto.email, dto.role);
  }
  @Roles('OWNER', 'ADMIN') @Patch(':id/role') role(
    @Req() req: { user: AuthUser },
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.team.role(
      req.user.organizationId,
      id,
      dto.role,
      req.user.userId,
    );
  }
  @Roles('OWNER', 'ADMIN') @Delete(':id') remove(
    @Req() req: { user: AuthUser },
    @Param('id') id: string,
  ) {
    return this.team.remove(req.user.organizationId, id, req.user.userId);
  }
}
