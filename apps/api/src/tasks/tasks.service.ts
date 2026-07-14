import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto, UpdateTaskDto } from './tasks.dto';
import { ActivityService } from '../activity/activity.service';
@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private activity: ActivityService,
  ) {}
  list(organizationId: string, projectId?: string, assigneeId?: string) {
    return this.prisma.task.findMany({
      where: { project: { organizationId }, projectId, assigneeId },
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        project: { select: { id: true, name: true, color: true } },
        _count: {
          select: { comments: true, attachments: true, subtasks: true },
        },
      },
      orderBy: [{ status: 'asc' }, { position: 'asc' }],
    });
  }
  async create(userId: string, organizationId: string, dto: CreateTaskDto) {
    const project = await this.prisma.project.findFirst({
      where: { id: dto.projectId, organizationId },
    });
    if (!project) throw new ForbiddenException('Projeto inválido');
    const task = await this.prisma.task.create({
      data: {
        ...dto,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        creatorId: userId,
      },
    });
    await this.activity.record({
      action: 'task.created',
      entityType: 'task',
      entityId: task.id,
      actorId: userId,
      organizationId,
      metadata: { title: task.title, projectId: task.projectId },
    });
    return task;
  }
  async findOne(organizationId: string, id: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, project: { organizationId } },
      include: {
        subtasks: true,
        comments: {
          include: {
            author: { select: { id: true, name: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        attachments: true,
      },
    });
    if (!task) throw new NotFoundException('Tarefa não encontrada');
    return task;
  }
  async update(
    userId: string,
    organizationId: string,
    id: string,
    dto: UpdateTaskDto,
  ) {
    const previous = await this.findOne(organizationId, id);
    const task = await this.prisma.task.update({
      where: { id },
      data: {
        ...dto,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        completedAt:
          dto.status === 'DONE' ? new Date() : dto.status ? null : undefined,
      },
    });
    await this.activity.record({
      action:
        dto.status && dto.status !== previous.status
          ? 'task.status_changed'
          : 'task.updated',
      entityType: 'task',
      entityId: id,
      actorId: userId,
      organizationId,
      metadata: {
        title: task.title,
        fields: Object.keys(dto),
        from: previous.status,
        to: task.status,
        projectId: task.projectId,
      },
    });
    return task;
  }
  async remove(userId: string, organizationId: string, id: string) {
    const previous = await this.findOne(organizationId, id);
    const task = await this.prisma.task.delete({ where: { id } });
    await this.activity.record({
      action: 'task.deleted',
      entityType: 'task',
      entityId: id,
      actorId: userId,
      organizationId,
      metadata: { title: previous.title, projectId: previous.projectId },
    });
    return task;
  }
}
