import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
@Injectable()
export class ActivityService {
  constructor(
    private prisma: PrismaService,
    private realtime: RealtimeGateway,
  ) {}
  async record(input: {
    action: string;
    entityType: string;
    entityId: string;
    actorId: string;
    organizationId: string;
    metadata?: Record<string, unknown>;
  }) {
    const activity = await this.prisma.activity.create({
      data: {
        ...input,
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
      },
      include: { actor: { select: { id: true, name: true, avatarUrl: true } } },
    });
    this.realtime.emitToOrganization(
      input.organizationId,
      'activity:new',
      activity,
    );
    return activity;
  }
  list(organizationId: string, entityType?: string, entityId?: string) {
    return this.prisma.activity.findMany({
      where: { organizationId, entityType, entityId },
      include: { actor: { select: { id: true, name: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
