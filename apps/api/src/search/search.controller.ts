import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { AuthUser } from '../auth/jwt.strategy';
import { PrismaService } from '../prisma/prisma.service';
@UseGuards(AuthGuard('jwt'))
@Controller('search')
export class SearchController {
  constructor(private prisma: PrismaService) {}
  @Get() async search(@Req() req: { user: AuthUser }, @Query('q') query = '') {
    const q = query.trim();
    if (q.length < 2) return { projects: [], tasks: [] };
    const [projects, tasks] = await Promise.all([
      this.prisma.project.findMany({
        where: {
          organizationId: req.user.organizationId,
          status: { not: 'ARCHIVED' },
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: { id: true, name: true, color: true, status: true },
        take: 6,
      }),
      this.prisma.task.findMany({
        where: {
          project: { organizationId: req.user.organizationId },
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          project: { select: { name: true, color: true } },
        },
        take: 8,
      }),
    ]);
    return { projects, tasks };
  }
}
