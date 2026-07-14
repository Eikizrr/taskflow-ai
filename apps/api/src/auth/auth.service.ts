import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto, UpdatePreferencesDto } from './auth.dto';
import { Prisma } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';

type SessionUser = Prisma.UserGetPayload<{
  include: { memberships: { include: { organization: true } } };
}>;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}
  async register(dto: RegisterDto) {
    if (
      await this.prisma.user.findUnique({
        where: { email: dto.email.toLowerCase() },
      })
    )
      throw new ConflictException('E-mail já cadastrado');
    const slugBase = dto.organizationName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email.toLowerCase(),
        passwordHash: await hash(dto.password, 12),
        memberships: {
          create: {
            role: 'OWNER',
            organization: {
              create: {
                name: dto.organizationName,
                slug: `${slugBase}-${Date.now().toString(36)}`,
              },
            },
          },
        },
      },
      include: { memberships: { include: { organization: true } } },
    });
    return this.session(user);
  }
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: { memberships: { include: { organization: true } } },
    });
    if (!user || !(await compare(dto.password, user.passwordHash)))
      throw new UnauthorizedException('E-mail ou senha inválidos');
    return this.session(user);
  }
  async updateProfile(userId: string, name: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { name },
      select: { id: true, name: true, email: true, avatarUrl: true },
    });
  }
  async updatePreferences(userId: string, preferences: UpdatePreferencesDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { preferences: preferences as Prisma.InputJsonValue },
      select: { id: true, preferences: true },
    });
  }
  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!user)
      return { message: 'Se o e-mail existir, as instruções serão enviadas.' };
    const token = randomBytes(32).toString('hex'),
      tokenHash = createHash('sha256').update(token).digest('hex');
    await this.prisma.passwordResetToken.deleteMany({
      where: { userId: user.id, usedAt: null },
    });
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      },
    });
    const resetUrl = `${process.env.WEB_URL ?? 'http://localhost:5173'}/?resetToken=${token}`;
    if (process.env.RESEND_API_KEY) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM ?? 'TaskFlow AI <onboarding@resend.dev>',
          to: [user.email],
          subject: 'Redefina sua senha do TaskFlow AI',
          html: `<h2>Redefinição de senha</h2><p>Este link expira em 30 minutos.</p><p><a href="${resetUrl}">Criar nova senha</a></p>`,
        }),
      });
    }
    return {
      message: 'Se o e-mail existir, as instruções serão enviadas.',
      ...(process.env.NODE_ENV !== 'production' && !process.env.RESEND_API_KEY
        ? { developmentToken: token }
        : {}),
    };
  }
  async resetPassword(token: string, password: string) {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const reset = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });
    if (!reset || reset.usedAt || reset.expiresAt < new Date())
      throw new UnauthorizedException('Token inválido ou expirado');
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: reset.userId },
        data: { passwordHash: await hash(password, 12) },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: reset.id },
        data: { usedAt: new Date() },
      }),
    ]);
    return { message: 'Senha alterada com sucesso.' };
  }
  private async session(user: SessionUser) {
    const membership = user.memberships[0];
    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      organizationId: membership?.organizationId,
      role: membership?.role,
    });
    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        preferences: user.preferences,
      },
      organization: membership?.organization,
    };
  }
}
