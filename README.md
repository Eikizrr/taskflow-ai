# TaskFlow AI

TaskFlow AI é uma plataforma SaaS para gestão de projetos, tarefas, equipes e indicadores operacionais. O projeto foi desenvolvido como uma aplicação full stack, com autenticação, permissões, dados em tempo real, upload de arquivos, relatórios e um copiloto para apoiar o planejamento do trabalho.

- Aplicação online: https://taskflow-ai-brown.vercel.app
- API: https://taskflow-ai-production-e208.up.railway.app/api
- Repositório: https://github.com/Eikizrr/taskflow-ai

## Visão Geral

O objetivo do TaskFlow AI é reunir em um único produto os fluxos mais comuns de uma ferramenta de produtividade para empresas: criação de workspaces, organização de projetos, acompanhamento de tarefas, colaboração da equipe e visibilidade executiva.

A aplicação foi pensada para demonstrar uma arquitetura próxima de um SaaS real, com separação entre frontend e backend, persistência em banco relacional, regras de acesso no servidor, deploy independente dos serviços e testes automatizados para os principais fluxos.

## Funcionalidades

- Cadastro, login, recuperação de senha e onboarding.
- Criação de empresas, workspaces, projetos e equipes.
- Dashboard executivo com indicadores de produtividade.
- Gestão de tarefas com prioridades, prazos, status, responsáveis e subtarefas.
- Quadro Kanban com arrastar e soltar.
- Calendário de atividades.
- Comentários, anexos e histórico de alterações.
- Notificações em tempo real via WebSocket.
- Busca global, relatórios, análise de risco e exportação CSV.
- Perfis e permissões com níveis de acesso.
- Tema claro e escuro, layout responsivo e interface de produto SaaS.
- Copiloto para criar tarefas, sugerir prioridades, resumir projetos e gerar planos de execução.

## Stack

| Camada | Tecnologias |
| --- | --- |
| Frontend | React, TypeScript, Vite, Tailwind CSS, TanStack Query, Zustand, React Hook Form, Zod, Framer Motion, Recharts, DnD Kit |
| Backend | Node.js, TypeScript, NestJS, Prisma ORM, PostgreSQL, Redis, JWT, WebSocket |
| Infraestrutura | Docker, GitHub Actions, Railway, Vercel, storage compatível com S3 |
| Inteligência artificial | OpenAI API com fallback local para demonstração |

## Estrutura do Projeto

```text
.
├── apps
│   ├── api       # API NestJS, Prisma, autenticação, permissões e WebSocket
│   └── web       # Aplicação React com dashboard, Kanban, calendário e copiloto
├── scripts       # Rotinas auxiliares, incluindo smoke test de produção
├── docker-compose.yml
└── README.md
```

## Execução Local

Requisitos:

- Node.js 22 ou superior
- npm
- PostgreSQL 16
- Docker, opcional para subir serviços locais

Suba os serviços locais:

```bash
docker compose up -d
```

Configure e execute a API:

```bash
copy .env.example apps\api\.env
cd apps/api
npm install
npm run db:generate
npm run db:deploy
npm run db:seed
npm run start:dev
```

Em outro terminal, execute o frontend:

```bash
cd apps/web
npm install
npm run dev
```

Frontend local: `http://localhost:5173`
API local: `http://localhost:3000/api`

## Conta de Demonstração

Ao executar o seed local, a seguinte conta é criada:

```text
E-mail: demo@taskflow.ai
Senha: taskflow
```

## Variáveis de Ambiente

### API

Copie `.env.example` para `apps/api/.env` e configure os valores conforme o ambiente.

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `DATABASE_URL` | Sim | String de conexão do PostgreSQL |
| `JWT_SECRET` | Sim | Chave usada para assinar tokens de autenticação |
| `WEB_URL` | Produção | URL do frontend, usada em CORS e links de recuperação |
| `OPENAI_API_KEY` | Opcional | Habilita respostas reais do copiloto |
| `OPENAI_MODEL` | Opcional | Modelo usado pelo copiloto |
| `RESEND_API_KEY` | Opcional | Envio de e-mails transacionais |
| `EMAIL_FROM` | Opcional | Remetente dos e-mails |
| `STORAGE_ENDPOINT` | Opcional | Endpoint S3 ou compatível |
| `STORAGE_ACCESS_KEY` | Opcional | Chave de acesso do storage |
| `STORAGE_SECRET_KEY` | Opcional | Chave secreta do storage |
| `STORAGE_BUCKET` | Opcional | Bucket para anexos |
| `STORAGE_REGION` | Opcional | Região do bucket |

### Frontend

Crie `apps/web/.env.local` quando precisar apontar o frontend para uma API específica:

```env
VITE_API_URL=http://localhost:3000/api
```

Em produção, use a URL pública da API:

```env
VITE_API_URL=https://taskflow-ai-production-e208.up.railway.app/api
```

## Qualidade

Comandos principais:

```bash
npm run build
npm run test
npm run lint
```

Também há um smoke test para validar os principais fluxos em produção:

```bash
node scripts/production-smoke.mjs
```

O pipeline em `.github/workflows/ci.yml` executa instalação, geração do Prisma Client, lint, build e testes.

## API

Principais grupos de rotas:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET|POST|PATCH|DELETE /api/projects`
- `GET|POST|PATCH|DELETE /api/tasks`
- `GET|POST /api/tasks/:taskId/comments`
- `GET|POST /api/tasks/:taskId/attachments`
- `GET|PATCH /api/notifications`
- `GET /api/dashboard`
- `GET /api/dashboard/risks`
- `GET /api/search`
- `POST /api/ai/ask`
- `POST /api/ai/plan`
- `POST /api/ai/apply-plan`

O WebSocket autenticado usa o namespace `/workspace` para eventos de comentários, tarefas e notificações.

## Permissões

O backend trabalha com os seguintes papéis:

- `OWNER`
- `ADMIN`
- `MANAGER`
- `MEMBER`
- `VIEWER`

As regras de autorização são aplicadas no servidor. As consultas de negócio também respeitam o workspace registrado no token do usuário.

## Deploy

### Frontend

Deploy na Vercel usando `apps/web` como root directory.

Variável necessária:

```env
VITE_API_URL=https://taskflow-ai-production-e208.up.railway.app/api
```

### API

Deploy no Railway usando `apps/api` como root directory.

Configurações importantes:

- Healthcheck: `/api/health`
- Start command: `node dist/src/main.js`
- Migrations: `npx prisma migrate deploy`
- Porta: definida pela variável `PORT` do provedor

### Banco de Dados

O projeto usa PostgreSQL com Prisma Migrate. As migrations ficam versionadas em `apps/api/prisma/migrations`.

Em produção, rode apenas:

```bash
npx prisma migrate deploy
```

O comando de seed deve ser usado somente quando for necessário criar dados de demonstração.

## Observações

- Sem configuração de S3, os anexos ficam armazenados localmente.
- Sem `OPENAI_API_KEY`, o copiloto continua funcionando em modo demonstração com análise local.
- Para recuperação de senha por e-mail, configure `RESEND_API_KEY`, `EMAIL_FROM` e `WEB_URL`.
