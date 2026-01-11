import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { Journal, JournalEntry } from '@/types';

const JOURNAL_FILE_PATH = join(process.cwd(), 'data', 'journal.json');

function readJournal(): Journal {
  try {
    const fileContents = readFileSync(JOURNAL_FILE_PATH, 'utf8');
    return JSON.parse(fileContents) as Journal;
  } catch (error) {
    // 파일이 없으면 빈 journal 반환
    return { entries: [] };
  }
}

function writeJournal(journal: Journal): void {
  writeFileSync(JOURNAL_FILE_PATH, JSON.stringify(journal, null, 2), 'utf8');
}

export function getAllEntries(): JournalEntry[] {
  const journal = readJournal();
  return journal.entries;
}

export function getEntryById(id: string): JournalEntry | null {
  const journal = readJournal();
  return journal.entries.find((entry) => entry.id === id) || null;
}

export function getEntryByEventId(eventId: string): JournalEntry | null {
  const journal = readJournal();
  return journal.entries.find((entry) => entry.eventId === eventId) || null;
}

export function createEntry(entry: Omit<JournalEntry, 'id' | 'createdAt'>): JournalEntry {
  const journal = readJournal();
  const newEntry: JournalEntry = {
    ...entry,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
  };
  journal.entries.push(newEntry);
  writeJournal(journal);
  return newEntry;
}

export function updateEntry(id: string, updates: Partial<JournalEntry>): JournalEntry | null {
  const journal = readJournal();
  const index = journal.entries.findIndex((entry) => entry.id === id);
  if (index === -1) return null;
  
  journal.entries[index] = { ...journal.entries[index], ...updates };
  writeJournal(journal);
  return journal.entries[index];
}

export function deleteEntry(id: string): boolean {
  const journal = readJournal();
  const index = journal.entries.findIndex((entry) => entry.id === id);
  if (index === -1) return false;
  
  journal.entries.splice(index, 1);
  writeJournal(journal);
  return true;
}
