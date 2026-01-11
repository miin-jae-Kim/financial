import { NextRequest, NextResponse } from 'next/server';
import { getEntryById, updateEntry } from '@/lib/journal.server';
import { JournalEntry } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const entry = getEntryById(params.id);
    if (!entry) {
      return NextResponse.json(null, { status: 404 });
    }
    return NextResponse.json(entry);
  } catch (error) {
    console.error('Journal API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const entry = updateEntry(params.id, body as Partial<JournalEntry>);
    if (!entry) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(entry);
  } catch (error) {
    console.error('Journal API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
