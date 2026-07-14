import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
describe('AuthService password recovery', () => {
  const prisma: any = {
    user: { findUnique: jest.fn(), update: jest.fn() },
    passwordResetToken: {
      deleteMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  const jwt: any = { signAsync: jest.fn() };
  const service = new AuthService(prisma, jwt);
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('does not reveal whether an email exists', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(
      service.forgotPassword('unknown@example.com'),
    ).resolves.toEqual({
      message: 'Se o e-mail existir, as instruções serão enviadas.',
    });
    expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
  });
  it('rejects an expired or unknown reset token', async () => {
    prisma.passwordResetToken.findUnique.mockResolvedValue(null);
    await expect(
      service.resetPassword(
        'invalid-token-that-is-long-enough',
        'new-password',
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
