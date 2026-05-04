export function splitCSV(str: string | null | undefined): string[] {
  return str ? str.split(/[/,]/).map((s) => s.trim()).filter(Boolean) : [];
}

export function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function generateId(): string {
  return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
}
