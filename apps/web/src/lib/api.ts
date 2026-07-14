export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('taskflow-token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers); headers.set('Content-Type', 'application/json');
  for (const [key, value] of Object.entries(authHeaders())) headers.set(key, value);
  const response = await fetch(`${API_URL}${path}`, { ...init, headers });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message ?? 'Não foi possível concluir a operação');
  return data as T;
}

export async function upload<T>(path: string, file: File): Promise<T> {
  const body = new FormData(); body.append('file', file);
  const response = await fetch(`${API_URL}${path}`, { method: 'POST', headers: authHeaders(), body });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message ?? 'Não foi possível enviar o arquivo');
  return data as T;
}

export async function download(path: string, filename: string) {
  const response = await fetch(`${API_URL}${path}`, { headers: authHeaders() });
  if (!response.ok) throw new Error('Não foi possível baixar o arquivo');
  const url = URL.createObjectURL(await response.blob());
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export type Session = { accessToken: string; user: { id:string; name:string; email:string }; organization: { id:string; name:string } };
export function saveSession(session: Session) { localStorage.setItem('taskflow-token', session.accessToken); localStorage.setItem('taskflow-session', JSON.stringify(session)); }
