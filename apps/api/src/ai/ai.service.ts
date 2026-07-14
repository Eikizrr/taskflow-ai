import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import OpenAI from 'openai';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { ApplyPlanDto } from './ai.dto';

type PlanResult = {
  summary: string;
  tasks: Array<{
    title: string;
    description: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    estimateHours: number;
  }>;
};

type ProjectInsight = {
  id: string;
  name: string;
  status: string;
  dueDate: Date | null;
};

type TaskInsight = {
  title: string;
  status: string;
  priority: string;
  dueDate: Date | null;
  project: { name: string };
  assignee: { name: string } | null;
};

@Injectable()
export class AiService {
  constructor(
    private prisma: PrismaService,
    private realtime: RealtimeGateway,
  ) {}
  async ask(userId: string, organizationId: string, message: string) {
    const [projects, tasks] = await Promise.all([
      this.prisma.project.findMany({
        where: {
          organizationId,
          status: { in: ['PLANNING', 'ACTIVE', 'ON_HOLD'] },
        },
        select: { id: true, name: true, status: true, dueDate: true },
      }),
      this.prisma.task.findMany({
        where: {
          project: { organizationId },
          status: { notIn: ['DONE', 'CANCELED'] },
        },
        select: {
          title: true,
          status: true,
          priority: true,
          dueDate: true,
          project: { select: { name: true } },
          assignee: { select: { name: true } },
        },
        take: 100,
      }),
    ]);
    if (!process.env.OPENAI_API_KEY)
      return this.localInsight(message, projects, tasks);
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const response = await openai.responses.create({
        model: process.env.OPENAI_MODEL ?? 'gpt-5.6-luna',
        instructions:
          'Você é o copiloto do TaskFlow AI. Responda em português do Brasil, de forma direta e executiva. Baseie-se apenas nos dados fornecidos. Destaque riscos, prioridades, responsáveis e próximos passos. Não invente informações ausentes.',
        input: `DADOS DO ESPAÇO:\n${JSON.stringify({ projects, tasks })}\n\nSOLICITAÇÃO:\n${message}`,
        safety_identifier: createHash('sha256').update(userId).digest('hex'),
      });
      return {
        answer: response.output_text,
        source: 'openai',
        model: process.env.OPENAI_MODEL ?? 'gpt-5.6-luna',
      };
    } catch {
      throw new ServiceUnavailableException(
        'O copiloto está temporariamente indisponível',
      );
    }
  }
  async plan(
    userId: string,
    organizationId: string,
    prompt: string,
    projectId?: string,
  ) {
    const project = projectId
      ? await this.prisma.project.findFirst({
          where: { id: projectId, organizationId },
          select: { id: true, name: true, description: true, dueDate: true },
        })
      : null;
    if (projectId && !project) throw new ForbiddenException('Projeto inválido');
    if (!process.env.OPENAI_API_KEY) return this.localPlan(prompt);
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const response = await openai.responses.create({
        model: process.env.OPENAI_MODEL ?? 'gpt-5.6-luna',
        instructions:
          'Você é um especialista em planejamento de projetos. Transforme a solicitação em tarefas independentes, claras, executáveis e ordenadas. Responda em português do Brasil. Use HIGH apenas quando a tarefa bloquear outras entregas. Se a solicitação não for um plano de trabalho válido, retorne uma lista vazia e explique no resumo.',
        input: `CONTEXTO DO PROJETO:\n${JSON.stringify(project)}\n\nSOLICITAÇÃO:\n${prompt}`,
        safety_identifier: createHash('sha256').update(userId).digest('hex'),
        text: {
          format: {
            type: 'json_schema',
            name: 'task_plan',
            strict: true,
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                summary: { type: 'string' },
                tasks: {
                  type: 'array',
                  maxItems: 20,
                  items: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                      title: { type: 'string' },
                      description: { type: 'string' },
                      priority: {
                        type: 'string',
                        enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
                      },
                      estimateHours: {
                        type: 'integer',
                        minimum: 1,
                        maximum: 160,
                      },
                    },
                    required: [
                      'title',
                      'description',
                      'priority',
                      'estimateHours',
                    ],
                  },
                },
              },
              required: ['summary', 'tasks'],
            },
          },
        },
      });
      const plan = JSON.parse(response.output_text) as PlanResult;
      return {
        ...plan,
        source: 'openai',
        model: process.env.OPENAI_MODEL ?? 'gpt-5.6-luna',
      };
    } catch {
      throw new ServiceUnavailableException(
        'Não foi possível gerar o planejamento',
      );
    }
  }
  async applyPlan(userId: string, organizationId: string, dto: ApplyPlanDto) {
    if (!dto.tasks.length || dto.tasks.length > 30)
      throw new BadRequestException('O plano deve conter entre 1 e 30 tarefas');
    const project = await this.prisma.project.findFirst({
      where: { id: dto.projectId, organizationId },
    });
    if (!project) throw new ForbiddenException('Projeto inválido');
    const created = await this.prisma.$transaction(
      dto.tasks.map((task, index) =>
        this.prisma.task.create({
          data: {
            title: task.title,
            description: task.description,
            priority: task.priority,
            estimate: task.estimateHours,
            position: index + 1,
            projectId: dto.projectId,
            creatorId: userId,
          },
        }),
      ),
    );
    await this.prisma.activity.create({
      data: {
        action: 'ai.plan_applied',
        entityType: 'project',
        entityId: dto.projectId,
        actorId: userId,
        organizationId,
        metadata: { taskCount: created.length },
      },
    });
    this.realtime.emitToOrganization(organizationId, 'ai:plan-applied', {
      projectId: dto.projectId,
      taskCount: created.length,
    });
    return { created: created.length, tasks: created };
  }
  private localPlan(prompt: string) {
    const landing = prompt.toLowerCase().includes('landing');
    const titles = landing
      ? [
          'Definir objetivo e público da landing page',
          'Criar wireframe e hierarquia do conteúdo',
          'Escrever textos e chamadas para ação',
          'Desenvolver interface responsiva',
          'Configurar formulário e integrações',
          'Executar testes, SEO e publicação',
        ]
      : [
          'Definir escopo e critérios de sucesso',
          'Levantar requisitos e dependências',
          'Executar a entrega principal',
          'Revisar qualidade e validar com responsáveis',
          'Documentar e publicar o resultado',
        ];
    return {
      summary: `Plano inicial com ${titles.length} etapas para: ${prompt}`,
      tasks: titles.map((title, index) => ({
        title,
        description: `Etapa ${index + 1} do planejamento. Detalhar critérios de aceite antes de iniciar.`,
        priority: index < 2 ? 'HIGH' : 'MEDIUM',
        estimateHours: index === 0 ? 4 : 8,
      })),
      source: 'local-analysis',
      model: null,
    };
  }
  private localInsight(
    message: string,
    projects: ProjectInsight[],
    tasks: TaskInsight[],
  ) {
    const now = new Date();
    const overdue = tasks.filter((t) => t.dueDate && new Date(t.dueDate) < now);
    const urgent = tasks.filter(
      (t) => t.priority === 'URGENT' || t.priority === 'HIGH',
    );
    const answer =
      message.toLowerCase().includes('atras') ||
      message.toLowerCase().includes('risco')
        ? `${overdue.length} tarefa(s) estão atrasadas. ${urgent.length} tarefa(s) possuem prioridade alta ou urgente. ${projects.filter((p) => p.status === 'ON_HOLD').length} projeto(s) estão pausados. Recomendo revisar primeiro os itens vencidos de maior prioridade.`
        : `Há ${projects.length} projetos ativos ou em planejamento e ${tasks.length} tarefas abertas. As prioridades imediatas são ${
            urgent
              .slice(0, 3)
              .map((t) => t.title)
              .join(', ') || 'os próximos prazos do calendário'
          }.`;
    return { answer, source: 'local-analysis', model: null };
  }
}
