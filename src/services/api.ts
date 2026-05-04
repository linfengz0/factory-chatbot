const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function createSession(): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/sessions`, { method: 'POST' });
  if (!res.ok) throw new Error(`Failed to create session: ${res.status}`);
  const { session_id } = await res.json();
  return session_id;
}

export function createWebSocket(sessionId: string): WebSocket {
  const wsBase = BASE_URL.replace(/^http/, 'ws');
  return new WebSocket(`${wsBase}/ws/${sessionId}`);
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
  const url = `${BASE_URL}/api/capacity/${encodeURIComponent(factoryId)}?demand=1000&ExFactoryDate=${today}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch capacity: ${res.status}`);
  const data = await res.json();
  return data.results ?? [];
}
