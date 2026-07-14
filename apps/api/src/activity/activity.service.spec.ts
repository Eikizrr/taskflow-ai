import { ActivityService } from './activity.service';
describe('ActivityService', () => {
  const prisma: any = { activity: { findMany: jest.fn(), create: jest.fn() } };
  const realtime: any = { emitToOrganization: jest.fn() };
  const service = new ActivityService(prisma, realtime);
  beforeEach(() => jest.clearAllMocks());
  it('always scopes history to an organization', async () => {
    prisma.activity.findMany.mockResolvedValue([]);
    await service.list('organization-a', 'task', 'task-1');
    expect(prisma.activity.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          organizationId: 'organization-a',
          entityType: 'task',
          entityId: 'task-1',
        },
      }),
    );
  });
  it('emits new activity only to its organization', async () => {
    prisma.activity.create.mockResolvedValue({ id: 'activity-1' });
    await service.record({
      action: 'task.updated',
      entityType: 'task',
      entityId: 'task-1',
      actorId: 'user-1',
      organizationId: 'organization-a',
    });
    expect(realtime.emitToOrganization).toHaveBeenCalledWith(
      'organization-a',
      'activity:new',
      { id: 'activity-1' },
    );
  });
});
