import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { AuthUser } from '../auth/jwt.strategy';
import { Roles } from '../auth/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateWorkspaceDto } from './workspace.dto';
@UseGuards(AuthGuard('jwt'))
@Controller('workspace')
export class WorkspaceController {
  constructor(private prisma: PrismaService) {}
  @Get() async get(@Req() req: { user: AuthUser }) {
    const workspace = await this.prisma.organization.findUnique({
      where: { id: req.user.organizationId },
      select: { id: true, name: true, slug: true, logoUrl: true },
    });
    if (!workspace) throw new NotFoundException('Espaço não encontrado');
    return workspace;
  }
  @Roles('OWNER', 'ADMIN') @Patch() update(
    @Req() req: { user: AuthUser },
    @Body() dto: UpdateWorkspaceDto,
  ) {
    return this.prisma.organization.update({
      where: { id: req.user.organizationId },
      data: { name: dto.name },
      select: { id: true, name: true, slug: true, logoUrl: true },
    });
  }
}
