import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
    }

    const db = readDB();
    const videoIndex = db.media.findIndex(v => v.id === id);

    if (videoIndex === -1) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    // Toggle favorite status
    const isFavorite = !db.media[videoIndex].isFavorite;
    db.media[videoIndex].isFavorite = isFavorite;

    // Save DB
    writeDB(db);

    return NextResponse.json({ success: true, isFavorite, id });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update favorite status' }, { status: 500 });
  }
}
