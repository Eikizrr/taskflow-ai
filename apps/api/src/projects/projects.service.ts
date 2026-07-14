import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto, UpdateProjectDto } from './projects.dto';
import { ActivityService } from '../activity/activity.service';

@Injectable()
export class ProjectsService {
  constructor(
    private prisma: PrismaService,
    private activity: ActivityService,
  ) {}
  list(organizationId: string) {
    return this.prisma.project.findMany({
      where: { organizationId, status: { not: 'ARCHIVED' } },
      include: {
        _count: { select: { tasks: true } },
        tasks: { select: { status: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }
  async create(userId: string, organizationId: string, dto: CreateProjectDto) {
    const project = await this.prisma.project.create({
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        organizationId,
      },
    });
    await this.activity.record({
      action: 'project.created',
      entityType: 'project',
      entityId: project.id,
      actorId: userId,
      organizationId,
      metadata: { name: project.name },
    });
    return project;
  }
  async findOne(organizationId: string, id: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, organizationId },
      include: { tasks: { orderBy: [{ status: 'asc' }, { position: 'asc' }] } },
    });
    if (!project) throw new NotFoundException('Projeto não encontrado');
    return project;
  }
  async update(
    userId: string,
    organizationId: string,
    id: string,
    dto: UpdateProjectDto,
  ) {
    const previous = await this.findOne(organizationId, id);
    const project = await this.prisma.project.update({
      where: { id },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
    });
    await this.activity.record({
      action: 'project.updated',
      entityType: 'project',
      entityId: id,
      actorId: userId,
      organizationId,
      metadata: {
        name: project.name,
        fields: Object.keys(dto),
        previousStatus: previous.status,
        status: project.status,
      },
    });
    return project;
  }
  async remove(userId: string, organizationId: string, id: string) {
    const previous = await this.findOne(organizationId, id);
    const project = await this.prisma.project.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });
    await this.activity.record({
      action: 'project.archived',
      entityType: 'project',
      entityId: id,
      actorId: userId,
      organizationId,
      metadata: { name: previous.name },
    });
    return project;
  }
}
