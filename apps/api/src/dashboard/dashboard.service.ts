import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}
  async overview(organizationId: string, userId: string) {
    const now = new Date(),
      weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1),
      endToday = new Date(now);
    endToday.setHours(23, 59, 59, 999);
    const projectWhere = {
        organizationId,
        status: { not: 'ARCHIVED' as const },
      },
      taskWhere = { project: { organizationId } };
    const [
      activeProjects,
      projectsThisMonth,
      completed,
      completedWeek,
      inProgress,
      dueToday,
      members,
      tasks,
      recentProjects,
    ] = await Promise.all([
      this.prisma.project.count({
        where: { organizationId, status: 'ACTIVE' },
      }),
      this.prisma.project.count({
        where: { organizationId, createdAt: { gte: monthStart } },
      }),
      this.prisma.task.count({ where: { ...taskWhere, status: 'DONE' } }),
      this.prisma.task.count({
        where: {
          ...taskWhere,
          status: 'DONE',
          completedAt: { gte: weekStart },
        },
      }),
      this.prisma.task.count({
        where: { ...taskWhere, status: { in: ['IN_PROGRESS', 'REVIEW'] } },
      }),
      this.prisma.task.count({
        where: {
          ...taskWhere,
          status: { notIn: ['DONE', 'CANCELED'] },
          dueDate: {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            lte: endToday,
          },
        },
      }),
      this.prisma.membership.count({ where: { organizationId } }),
      this.prisma.task.findMany({
        where: {
          ...taskWhere,
          OR: [{ assigneeId: userId }, { creatorId: userId }],
        },
        include: {
          project: { select: { name: true, color: true } },
          assignee: { select: { name: true } },
        },
        orderBy: [{ dueDate: 'asc' }, { priority: 'desc' }],
        take: 6,
      }),
      this.prisma.project.findMany({
        where: projectWhere,
        include: { tasks: { select: { status: true } } },
        orderBy: { updatedAt: 'desc' },
        take: 4,
      }),
    ]);
    const completedDays = await this.prisma.task.findMany({
      where: { ...taskWhere, status: 'DONE', completedAt: { gte: weekStart } },
      select: { completedAt: true },
    });
    const productivity = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      return {
        date: date.toISOString().slice(0, 10),
        value: completedDays.filter(
          (t) =>
            t.completedAt?.toISOString().slice(0, 10) ===
            date.toISOString().slice(0, 10),
        ).length,
      };
    });
    const grouped = await this.prisma.task.groupBy({
      by: ['status'],
      where: taskWhere,
      _count: { _all: true },
    });
    const distribution = Object.fromEntries(
      grouped.map((g) => [g.status, g._count._all]),
    );
    return {
      stats: {
        activeProjects,
        projectsThisMonth,
        completed,
        completedWeek,
        inProgress,
        dueToday,
        members,
      },
      productivity,
      distribution,
      tasks,
      recentProjects: recentProjects.map((p) => ({
        ...p,
        progress: p.tasks.length
          ? Math.round(
              (p.tasks.filter((t) => t.status === 'DONE').length /
                p.tasks.length) *
                100,
            )
          : 0,
      })),
    };
  }
  async risks(organizationId: string) {
    const now = new Date();
    const projects = await this.prisma.project.findMany({
      where: {
        organizationId,
        status: { in: ['ACTIVE', 'PLANNING', 'ON_HOLD'] },
      },
      include: {
        tasks: {
          where: { status: { notIn: ['DONE', 'CANCELED'] } },
          select: { dueDate: true, priority: true, status: true },
        },
      },
    });
    return projects
      .map((p) => {
        const overdue = p.tasks.filter(
            (t) => t.dueDate && t.dueDate < now,
          ).length,
          urgent = p.tasks.filter(
            (t) => t.priority === 'URGENT' || t.priority === 'HIGH',
          ).length,
          days = p.dueDate
            ? Math.ceil((p.dueDate.getTime() - now.getTime()) / 86400000)
            : null;
        const score =
          overdue * 20 +
          urgent * 5 +
          (p.status === 'ON_HOLD' ? 30 : 0) +
          (days !== null && days < 7 ? 15 : 0);
        return {
          id: p.id,
          name: p.name,
          score: Math.min(100, score),
          level: score >= 60 ? 'HIGH' : score >= 30 ? 'MEDIUM' : 'LOW',
          overdueTasks: overdue,
          highPriorityTasks: urgent,
          daysToDeadline: days,
        };
      })
      .sort((a, b) => b.score - a.score);
  }
}
