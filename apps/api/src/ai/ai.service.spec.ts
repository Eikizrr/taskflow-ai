import { BadRequestException } from '@nestjs/common';
import { AiService } from './ai.service';
describe('AiService planning', () => {
  const prisma: any = {
    project: { findFirst: jest.fn() },
    task: { create: jest.fn() },
    activity: { create: jest.fn() },
    $transaction: jest.fn(),
  };
  const realtime: any = { emitToOrganization: jest.fn() };
  const service = new AiService(prisma, realtime);
  const previous = process.env.OPENAI_API_KEY;
  beforeEach(() => {
    delete process.env.OPENAI_API_KEY;
    jest.clearAllMocks();
  });
  afterAll(() => {
    if (previous) process.env.OPENAI_API_KEY = previous;
  });
  it('creates a useful local plan without an API key', async () => {
    const result = await service.plan(
      'user',
      'org',
      'Crie as tarefas necessárias para uma landing page',
    );
    expect(result.tasks).toHaveLength(6);
    expect(result.tasks[0]).toMatchObject({ priority: 'HIGH' });
    expect(result.source).toBe('local-analysis');
  });
  it('does not apply an empty plan', async () => {
    await expect(
      service.applyPlan('user', 'org', { projectId: 'project', tasks: [] }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
