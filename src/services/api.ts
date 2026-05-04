/**
 * API origin. Leave empty (default) so requests use same origin `/api/...`
 * and are proxied by Vercel (vercel.json) or Vite dev server (vite.config).
 * Override in `.env.local` for direct backend, e.g. `VITE_API_BASE_URL=http://127.0.0.1:18888`
 */
const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';

function apiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_URL}${p}`;
}

export async function createSession(): Promise<string> {
  const res = await fetch(apiUrl('/api/sessions'), { method: 'POST' });
  if (!res.ok) throw new Error(`Failed to create session: ${res.status}`);
  const { session_id } = await res.json();
  return session_id;
}

export function createWebSocket(sessionId: string): WebSocket {
  if (BASE_URL) {
    const wsBase = BASE_URL.replace(/^http/, 'ws');
    return new WebSocket(`${wsBase}/ws/${sessionId}`);
  }
  const { protocol, host } = window.location;
  const wsProto = protocol === 'https:' ? 'wss:' : 'ws:';
  return new WebSocket(`${wsProto}//${host}/ws/${sessionId}`);
}

export interface CapacityApiItem {
  factoryId: string;
  factoryName: string;
  factoryCode: string;
  productCat: string;
  coO: string;
  month: string;
  monthLabel: string;
  originalCapacity: number;
  totalDemand: number;
  remainingCapacity: number;
  status: string;
}

export async function fetchCapacity(
  factoryId: string
): Promise<CapacityApiItem[]> {
  const today = new Date().toISOString().slice(0, 10);
  const url = `${apiUrl('/api/capacity/' + encodeURIComponent(factoryId))}?demand=1000&ExFactoryDate=${today}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch capacity: ${res.status}`);
  const data = await res.json();
  return data.results ?? [];
}
