import { NextResponse } from 'next/server';
import { getMedia, saveMedia } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
    }

    const media = await getMedia();
    const videoIndex = media.findIndex((v) => v.id === id);

    if (videoIndex === -1) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    const isFavorite = !media[videoIndex].isFavorite;
    media[videoIndex].isFavorite = isFavorite;

    await saveMedia(media);

    return NextResponse.json({ success: true, isFavorite, id });
  } catch (error) {
    console.error('Favorite toggle error:', error);
    return NextResponse.json({ error: 'Failed to update favorite status' }, { status: 500 });
  }
}
