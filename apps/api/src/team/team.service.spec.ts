import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { TeamService } from './team.service';

describe('TeamService', () => {
  const prisma: any = {
    user: { findUnique: jest.fn() },
    membership: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
  const service = new TeamService(prisma);
  beforeEach(() => jest.clearAllMocks());
  it('does not allow adding another owner', async () => {
    await expect(
      service.add('org', 'user@example.com', 'OWNER'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
  it('requires the invited user to have an account', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(
      service.add('org', 'new@example.com', 'MEMBER'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
  it('does not duplicate memberships', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
    prisma.membership.findUnique.mockResolvedValue({ id: 'm1' });
    await expect(
      service.add('org', 'member@example.com', 'MEMBER'),
    ).rejects.toBeInstanceOf(ConflictException);
  });
  it('protects the organization owner from removal', async () => {
    prisma.membership.findFirst.mockResolvedValue({
      id: 'm1',
      userId: 'u1',
      role: 'OWNER',
    });
    await expect(service.remove('org', 'm1', 'u2')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
