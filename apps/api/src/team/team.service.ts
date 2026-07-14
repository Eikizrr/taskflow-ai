import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
@Injectable()
export class TeamService {
  constructor(private prisma: PrismaService) {}
  list(organizationId: string) {
    return this.prisma.membership.findMany({
      where: { organizationId },
      select: {
        id: true,
        role: true,
        joinedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            _count: { select: { assignedTasks: true } },
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });
  }
  async add(organizationId: string, email: string, role: Role) {
    if (role === 'OWNER')
      throw new ForbiddenException('Use a transferência de propriedade');
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!user)
      throw new NotFoundException(
        'O usuário precisa criar uma conta antes de entrar na equipe',
      );
    if (
      await this.prisma.membership.findUnique({
        where: { userId_organizationId: { userId: user.id, organizationId } },
      })
    )
      throw new ConflictException('Este usuário já pertence à equipe');
    return this.prisma.membership.create({
      data: { userId: user.id, organizationId, role },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });
  }
  async role(
    organizationId: string,
    membershipId: string,
    role: Role,
    currentUserId: string,
  ) {
    const member = await this.prisma.membership.findFirst({
      where: { id: membershipId, organizationId },
    });
    if (!member) throw new NotFoundException('Membro não encontrado');
    if (member.userId === currentUserId && member.role === 'OWNER')
      throw new ForbiddenException(
        'O proprietário não pode alterar a própria função',
      );
    if (role === 'OWNER')
      throw new ForbiddenException(
        'Transferência de propriedade requer fluxo dedicado',
      );
    return this.prisma.membership.update({
      where: { id: membershipId },
      data: { role },
    });
  }
  async remove(
    organizationId: string,
    membershipId: string,
    currentUserId: string,
  ) {
    const member = await this.prisma.membership.findFirst({
      where: { id: membershipId, organizationId },
    });
    if (!member) throw new NotFoundException('Membro não encontrado');
    if (member.role === 'OWNER' || member.userId === currentUserId)
      throw new ForbiddenException('Não é possível remover este membro');
    return this.prisma.membership.delete({ where: { id: membershipId } });
  }
}
