import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class CollaborationService {
  constructor(
    private prisma: PrismaService,
    private realtime: RealtimeGateway,
    private storage: StorageService,
  ) {}
  private async taskForOrganization(taskId: string, organizationId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, project: { organizationId } },
      include: { project: true },
    });
    if (!task) throw new NotFoundException('Tarefa não encontrada');
    return task;
  }
  async comments(taskId: string, organizationId: string) {
    await this.taskForOrganization(taskId, organizationId);
    return this.prisma.comment.findMany({
      where: { taskId },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }
  async addComment(
    taskId: string,
    organizationId: string,
    userId: string,
    body: string,
  ) {
    const task = await this.taskForOrganization(taskId, organizationId);
    const comment = await this.prisma.comment.create({
      data: { taskId, authorId: userId, body },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
    await this.prisma.activity.create({
      data: {
        action: 'comment.created',
        entityType: 'task',
        entityId: taskId,
        actorId: userId,
        organizationId,
        metadata: { commentId: comment.id },
      },
    });
    if (task.assigneeId && task.assigneeId !== userId) {
      const notification = await this.prisma.notification.create({
        data: {
          type: 'TASK_COMMENT',
          title: 'Novo comentário',
          body: `Um comentário foi adicionado em ${task.title}`,
          userId: task.assigneeId,
          organizationId,
          data: { taskId, projectId: task.projectId },
        },
      });
      this.realtime.emitToUser(
        task.assigneeId,
        'notification:new',
        notification,
      );
    }
    this.realtime.emitToOrganization(
      organizationId,
      'comment:created',
      comment,
    );
    return comment;
  }
  async attach(
    taskId: string,
    organizationId: string,
    file: Express.Multer.File,
  ) {
    await this.taskForOrganization(taskId, organizationId);
    const reference = await this.storage.save(file, organizationId, taskId);
    const attachment = await this.prisma.attachment.create({
      data: {
        taskId,
        name: file.originalname,
        url: reference,
        mimeType: file.mimetype,
        size: file.size,
      },
    });
    this.realtime.emitToOrganization(
      organizationId,
      'attachment:created',
      attachment,
    );
    return attachment;
  }
  async attachment(id: string, organizationId: string) {
    const item = await this.prisma.attachment.findFirst({
      where: { id, task: { project: { organizationId } } },
    });
    if (!item) throw new NotFoundException('Anexo não encontrado');
    return { item, stream: await this.storage.read(item.url) };
  }
  notifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
  async readNotification(id: string, userId: string) {
    const item = await this.prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!item) throw new NotFoundException('Notificação não encontrada');
    return this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }
  async readAll(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { success: true };
  }
}
