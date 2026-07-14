# TaskFlow AI

Plataforma web SaaS para centralizar projetos, tarefas, equipes e indicadores de produtividade, com colaboração em tempo real e um copiloto de inteligência artificial.

## Funcionalidades entregues

- Landing page, cadastro, login, recuperação de senha e onboarding.
- Dashboard executivo, projetos, detalhes, tarefas, subtarefas, Kanban com arrastar e soltar e calendário.
- Equipe, perfis, permissões RBAC, comentários, anexos, notificações e histórico em tempo real.
- Relatórios, riscos, busca global, exportação CSV, preferências, tema claro/escuro e layout responsivo.
- Copiloto capaz de analisar o workspace, gerar planos estruturados, recomendar prioridades e criar tarefas após confirmação.
- Administração, limitação de requisições, headers de segurança, isolamento dos dados por organização e armazenamento local ou S3.

## Stack

Frontend: React 19, TypeScript, Vite, Socket.IO e CSS responsivo.  
Backend: NestJS 11, TypeScript, Prisma 7, PostgreSQL, JWT, WebSocket e OpenAI Responses API.  
Infraestrutura: Docker, GitHub Actions, Vercel, Render/Railway e storage compatível com S3.

## Execução local

Requisitos: Node.js 22+, npm e PostgreSQL 16. Docker é opcional para subir PostgreSQL e Redis.

```bash
docker compose up -d
copy .env.example apps\api\.env
cd apps/api
npm install
npm run db:generate
npm run db:deploy
npm run db:seed
npm run start:dev
```

Em outro terminal:

```bash
cd apps/web
npm install
npm run dev
```

Acesse `http://localhost:5173`. A API fica em `http://localhost:3000/api`.

Conta de demonstração criada pelo seed:

- E-mail: `demo@taskflow.ai`
- Senha: `taskflow`

Para usar outra URL de API, crie `apps/web/.env.local` com:

```env
VITE_API_URL=https://sua-api.example.com/api
```

## Variáveis de ambiente

Copie `.env.example` para `apps/api/.env`. `DATABASE_URL` e um `JWT_SECRET` longo são obrigatórios em produção. As demais integrações são opcionais:

- `OPENAI_API_KEY` e `OPENAI_MODEL`: copiloto via OpenAI; sem chave, a demonstração usa análise local.
- `RESEND_API_KEY`, `EMAIL_FROM` e `WEB_URL`: e-mail de recuperação de senha.
- `STORAGE_ENDPOINT`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`, `STORAGE_BUCKET` e `STORAGE_REGION`: S3, Supabase Storage ou serviço compatível. Sem configuração, os anexos ficam locais.

## Comandos de qualidade

```bash
npm run build
npm run test
npm run lint
```

O estado validado possui 7 suítes e 16 testes automatizados. O schema inicial está versionado em `apps/api/prisma/migrations`.

## API principal

- `POST /api/auth/register`, `/login`, `/forgot-password` e `/reset-password`
- `GET|POST|PATCH|DELETE /api/projects` e `/api/tasks`
- `GET|POST /api/tasks/:taskId/comments` e anexos autenticados
- `GET|PATCH /api/notifications`, `/api/team`, `/api/workspace` e `/api/activity`
- `GET /api/dashboard`, `/api/dashboard/risks` e `/api/search`
- `POST /api/ai/ask`, `/api/ai/plan` e `/api/ai/apply-plan`
- WebSocket autenticado no namespace `/workspace`

As funções disponíveis são `OWNER`, `ADMIN`, `MANAGER`, `MEMBER` e `VIEWER`. As autorizações são verificadas no backend e as consultas de negócio são limitadas à organização registrada no JWT.

## Implantação

- Frontend: use `apps/web` como diretório raiz na Vercel e defina `VITE_API_URL`.
- API: `render.yaml` provisiona API e PostgreSQL no Render; `apps/api/railway.json` atende ao Railway.
- Banco: execute `npm run db:deploy` na publicação e `npm run db:seed` apenas quando quiser os dados de demonstração.
- Arquivos: configure um bucket compatível com S3 para persistência em produção.

O workflow `.github/workflows/ci.yml` instala dependências, gera o Prisma Client, executa lint, build e testes automaticamente.
