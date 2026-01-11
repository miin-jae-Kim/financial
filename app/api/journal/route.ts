import { NextRequest, NextResponse } from 'next/server';
import { getAllEntries, getEntryByEventId, createEntry } from '@/lib/journal.server';
import { JournalEntry } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (eventId) {
      const entry = getEntryByEventId(eventId);
      if (!entry) {
        return NextResponse.json(null, { status: 404 });
      }
      return NextResponse.json(entry);
    }

    const entries = getAllEntries();
    return NextResponse.json(entries);
  } catch (error) {
    console.error('Journal API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const entry = createEntry(body as Omit<JournalEntry, 'id' | 'createdAt'>);
    return NextResponse.json(entry);
  } catch (error) {
    console.error('Journal API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
