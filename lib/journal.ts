// 클라이언트 사이드에서 사용할 수 있는 API 함수들
import { JournalEntry } from '@/types';

export async function fetchAllEntries(): Promise<JournalEntry[]> {
  const response = await fetch('/api/journal');
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return await response.json();
}

export async function fetchEntryById(id: string): Promise<JournalEntry | null> {
  const response = await fetch(`/api/journal/${id}`);
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`HTTP ${response.status}`);
  }
  return await response.json();
}

export async function fetchEntryByEventId(eventId: string): Promise<JournalEntry | null> {
  const response = await fetch(`/api/journal?eventId=${eventId}`);
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`HTTP ${response.status}`);
  }
  return await response.json();
}

export async function createEntryAPI(entry: Omit<JournalEntry, 'id' | 'createdAt'>): Promise<JournalEntry> {
  const response = await fetch('/api/journal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return await response.json();
}

export async function updateEntryAPI(id: string, updates: Partial<JournalEntry>): Promise<JournalEntry> {
  const response = await fetch(`/api/journal/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return await response.json();
}
