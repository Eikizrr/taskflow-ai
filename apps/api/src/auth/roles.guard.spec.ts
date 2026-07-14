import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  const context = (role?: string) =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user: role ? { role } : undefined }),
      }),
    }) as any;
  it('allows routes without role metadata', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(undefined),
    } as unknown as Reflector;
    expect(new RolesGuard(reflector).canActivate(context())).toBe(true);
  });
  it('allows an authorized role', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(['OWNER', 'ADMIN']),
    } as unknown as Reflector;
    expect(new RolesGuard(reflector).canActivate(context('ADMIN'))).toBe(true);
  });
  it('rejects an unauthorized role', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(['OWNER']),
    } as unknown as Reflector;
    expect(() =>
      new RolesGuard(reflector).canActivate(context('MEMBER')),
    ).toThrow(ForbiddenException);
  });
});
