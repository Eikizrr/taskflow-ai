import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from 'bcryptjs';

const connectionString = process.env.DATABASE_URL ?? 'postgresql://taskflow:taskflow@localhost:5432/taskflow';
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  const passwordHash = await hash('taskflow', 12);
  const user = await prisma.user.upsert({ where: { email: 'demo@taskflow.ai' }, update: {}, create: { name: 'Erick Reis', email: 'demo@taskflow.ai', passwordHash } });
  const organization = await prisma.organization.upsert({ where: { slug: 'nexora-labs' }, update: {}, create: { name: 'Nexora Labs', slug: 'nexora-labs' } });
  await prisma.membership.upsert({ where: { userId_organizationId: { userId: user.id, organizationId: organization.id } }, update: { role: 'OWNER' }, create: { userId: user.id, organizationId: organization.id, role: 'OWNER' } });
  const project = await prisma.project.upsert({ where: { id: 'demo-nexusops' }, update: {}, create: { id: 'demo-nexusops', name: 'NexusOps AI', description: 'Plataforma inteligente de operações', color: '#7765e8', status: 'ACTIVE', dueDate: new Date('2026-07-28'), organizationId: organization.id } });
  const count = await prisma.task.count({ where: { projectId: project.id } });
  if (!count) await prisma.task.createMany({ data: [
    { title: 'Finalizar protótipo da nova experiência', projectId: project.id, creatorId: user.id, assigneeId: user.id, priority: 'HIGH', status: 'IN_PROGRESS', dueDate: new Date('2026-07-13'), position: 1 },
    { title: 'Documentar endpoints da API', projectId: project.id, creatorId: user.id, assigneeId: user.id, priority: 'LOW', status: 'DONE', position: 2, completedAt: new Date() },
    { title: 'Configurar notificações em tempo real', projectId: project.id, creatorId: user.id, priority: 'MEDIUM', status: 'TODO', position: 3 },
  ]});
}
main().finally(() => prisma.$disconnect());
