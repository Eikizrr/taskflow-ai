import assert from 'node:assert/strict';

const baseUrl = (process.env.SMOKE_API_URL ?? '').replace(/\/$/, '');
assert(baseUrl, 'Defina SMOKE_API_URL, incluindo o sufixo /api.');

const stamp = Date.now();
const password = `TaskFlow!${stamp}`;
const ownerEmail = `qa.owner.${stamp}@taskflow.test`;
const memberEmail = `qa.member.${stamp}@taskflow.test`;
const checks = [];

async function request(path, { token, method = 'GET', body, form } = {}) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: form ?? (body === undefined ? undefined : JSON.stringify(body)),
  });
  const contentType = response.headers.get('content-type') ?? '';
  const data = contentType.includes('application/json')
    ? await response.json()
    : await response.arrayBuffer();
  if (!response.ok) {
    throw new Error(
      `${method} ${path} retornou ${response.status}: ${JSON.stringify(data)}`,
    );
  }
  return { data, response };
}

async function check(name, action) {
  const started = performance.now();
  await action();
  checks.push({ name, ms: Math.round(performance.now() - started) });
  console.log(`✓ ${name}`);
}

let owner;
let member;
let project;
let task;
let subtask;
let membership;

await check('healthcheck', async () => {
  const { data } = await request('/health');
  assert.equal(data.status, 'ok');
});

await check('cadastro de proprietário', async () => {
  ({ data: owner } = await request('/auth/register', {
    method: 'POST',
    body: {
      name: 'QA Owner',
      email: ownerEmail,
      password,
      organizationName: `QA Workspace ${stamp}`,
    },
  }));
  assert(owner.accessToken);
  assert(owner.organization.id);
});

await check('login e identidade JWT', async () => {
  const { data: login } = await request('/auth/login', {
    method: 'POST',
    body: { email: ownerEmail, password },
  });
  assert(login.accessToken);
  const { data: me } = await request('/auth/me', {
    token: login.accessToken,
  });
  assert.equal(me.role, 'OWNER');
});

await check('perfil e preferências', async () => {
  const token = owner.accessToken;
  const { data: profile } = await request('/auth/profile', {
    token,
    method: 'PATCH',
    body: { name: 'QA Owner Updated' },
  });
  assert.equal(profile.name, 'QA Owner Updated');
  const { data: preferences } = await request('/auth/preferences', {
    token,
    method: 'PATCH',
    body: { mentions: true, deadline: true, weekly: false, timezone: 'America/Manaus' },
  });
  assert.equal(preferences.preferences.weekly, false);
});

await check('workspace', async () => {
  const token = owner.accessToken;
  const { data: workspace } = await request('/workspace', { token });
  assert.equal(workspace.id, owner.organization.id);
  const { data: updated } = await request('/workspace', {
    token,
    method: 'PATCH',
    body: { name: `QA Workspace Validated ${stamp}` },
  });
  assert.match(updated.name, /Validated/);
});

await check('CRUD de projeto', async () => {
  const token = owner.accessToken;
  ({ data: project } = await request('/projects', {
    token,
    method: 'POST',
    body: {
      name: `Projeto QA ${stamp}`,
      description: 'Projeto criado pelo smoke test de produção.',
      color: '#6558e8',
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString(),
    },
  }));
  const { data: projects } = await request('/projects', { token });
  assert(projects.some((item) => item.id === project.id));
  const { data: updated } = await request(`/projects/${project.id}`, {
    token,
    method: 'PATCH',
    body: { status: 'ACTIVE', description: 'Projeto validado ponta a ponta.' },
  });
  assert.equal(updated.status, 'ACTIVE');
});

await check('tarefas, subtarefas e Kanban', async () => {
  const token = owner.accessToken;
  ({ data: task } = await request('/tasks', {
    token,
    method: 'POST',
    body: {
      title: `Tarefa principal QA ${stamp}`,
      projectId: project.id,
      priority: 'HIGH',
      dueDate: new Date(Date.now() + 86400000).toISOString(),
    },
  }));
  ({ data: subtask } = await request('/tasks', {
    token,
    method: 'POST',
    body: {
      title: 'Subtarefa QA',
      projectId: project.id,
      parentId: task.id,
      priority: 'MEDIUM',
    },
  }));
  const { data: updated } = await request(`/tasks/${task.id}`, {
    token,
    method: 'PATCH',
    body: { status: 'IN_PROGRESS', position: 2 },
  });
  assert.equal(updated.status, 'IN_PROGRESS');
  const { data: detail } = await request(`/tasks/${task.id}`, { token });
  assert(detail.subtasks.some((item) => item.id === subtask.id));
});

await check('comentários', async () => {
  const token = owner.accessToken;
  const { data: comment } = await request(`/tasks/${task.id}/comments`, {
    token,
    method: 'POST',
    body: { body: 'Comentário real criado pelo smoke test.' },
  });
  assert(comment.id);
  const { data: comments } = await request(`/tasks/${task.id}/comments`, {
    token,
  });
  assert(comments.some((item) => item.id === comment.id));
});

await check('upload e download de anexo', async () => {
  const form = new FormData();
  const original = `TaskFlow smoke ${stamp}`;
  form.append('file', new Blob([original], { type: 'text/plain' }), 'smoke.txt');
  const { data: attachment } = await request(`/tasks/${task.id}/attachments`, {
    token: owner.accessToken,
    method: 'POST',
    form,
  });
  assert(attachment.id);
  const { data: downloaded } = await request(
    `/attachments/${attachment.id}/download`,
    { token: owner.accessToken },
  );
  assert.equal(Buffer.from(downloaded).toString(), original);
});

await check('equipe e RBAC', async () => {
  ({ data: member } = await request('/auth/register', {
    method: 'POST',
    body: {
      name: 'QA Member',
      email: memberEmail,
      password,
      organizationName: `QA Member Workspace ${stamp}`,
    },
  }));
  ({ data: membership } = await request('/team', {
    token: owner.accessToken,
    method: 'POST',
    body: { email: memberEmail, role: 'MEMBER' },
  }));
  const { data: changed } = await request(`/team/${membership.id}/role`, {
    token: owner.accessToken,
    method: 'PATCH',
    body: { role: 'MANAGER' },
  });
  assert.equal(changed.role, 'MANAGER');
  const { data: team } = await request('/team', { token: owner.accessToken });
  assert(team.some((item) => item.id === membership.id));
});

await check('dashboard, riscos, busca e histórico', async () => {
  const token = owner.accessToken;
  const [{ data: dashboard }, { data: risks }, { data: search }, { data: activity }] =
    await Promise.all([
      request('/dashboard', { token }),
      request('/dashboard/risks', { token }),
      request(`/search?q=${encodeURIComponent('Projeto QA')}`, { token }),
      request('/activities', { token }),
    ]);
  assert(dashboard.stats);
  assert(Array.isArray(risks));
  assert(search.projects.some((item) => item.id === project.id));
  assert(activity.some((item) => item.action === 'project.created'));
});

await check('notificações', async () => {
  const token = owner.accessToken;
  const { data: notifications } = await request('/notifications', { token });
  assert(Array.isArray(notifications));
  const { data: result } = await request('/notifications/read-all', {
    token,
    method: 'PATCH',
  });
  assert.equal(result.success, true);
});

await check('copiloto: análise, plano e aplicação', async () => {
  const token = owner.accessToken;
  const { data: insight } = await request('/ai/ask', {
    token,
    method: 'POST',
    body: { message: 'Mostre os projetos em risco e recomende prioridades.' },
  });
  assert(insight.answer);
  const { data: plan } = await request('/ai/plan', {
    token,
    method: 'POST',
    body: { prompt: 'Crie um plano simples para uma landing page.', projectId: project.id },
  });
  assert(plan.tasks.length > 0);
  const { data: applied } = await request('/ai/apply-plan', {
    token,
    method: 'POST',
    body: { projectId: project.id, tasks: plan.tasks.slice(0, 2) },
  });
  assert.equal(applied.created, 2);
});

await check('limpeza de dados operacionais', async () => {
  await request(`/team/${membership.id}`, {
    token: owner.accessToken,
    method: 'DELETE',
  });
  await request(`/tasks/${subtask.id}`, {
    token: owner.accessToken,
    method: 'DELETE',
  });
  await request(`/tasks/${task.id}`, {
    token: owner.accessToken,
    method: 'DELETE',
  });
  const { data: archived } = await request(`/projects/${project.id}`, {
    token: owner.accessToken,
    method: 'DELETE',
  });
  assert.equal(archived.status, 'ARCHIVED');
});

const total = checks.reduce((sum, item) => sum + item.ms, 0);
console.log(`\n${checks.length} fluxos aprovados em ${total} ms.`);
console.log(`Organizações isoladas de QA: ${ownerEmail} e ${memberEmail}.`);
