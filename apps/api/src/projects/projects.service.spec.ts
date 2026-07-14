import { NotFoundException } from '@nestjs/common';
import { ProjectsService } from './projects.service';
describe('ProjectsService tenant isolation', () => {
  const prisma: any = { project: { findFirst: jest.fn() } };
  const service = new ProjectsService(prisma, { record: jest.fn() } as any);
  beforeEach(() => jest.clearAllMocks());
  it('always scopes project lookup to the current organization', async () => {
    prisma.project.findFirst.mockResolvedValue({ id: 'project-1' });
    await service.findOne('organization-a', 'project-1');
    expect(prisma.project.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'project-1', organizationId: 'organization-a' },
      }),
    );
  });
  it('hides projects belonging to another organization', async () => {
    prisma.project.findFirst.mockResolvedValue(null);
    await expect(
      service.findOne('organization-b', 'project-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
