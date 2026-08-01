import { NextResponse } from 'next/server';
import { getPlaylists, savePlaylists } from '@/lib/db';

export const dynamic = "force-static";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const macAddress = searchParams.get('macAddress') || undefined;
    const playlists = await getPlaylists(macAddress);
    return NextResponse.json(playlists);
  } catch (error) {
    console.error('GET /api/playlists error:', error);
    return NextResponse.json({ error: 'Failed to read playlists' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const newPlaylist = await req.json();

    if (!newPlaylist.macAddress) {
      return NextResponse.json({ error: 'MAC Address is required' }, { status: 400 });
    }

    newPlaylist.id = `PL-${Date.now()}`;
    newPlaylist.itemsCount = 0;

    const all = await getPlaylists();
    all.push(newPlaylist);
    await savePlaylists(all);

    return NextResponse.json(newPlaylist);
  } catch (error) {
    console.error('POST /api/playlists error:', error);
    return NextResponse.json({ error: 'Failed to add playlist' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const updatedPlaylist = await req.json();

    if (!updatedPlaylist.id || !updatedPlaylist.macAddress) {
      return NextResponse.json({ error: 'ID and MAC Address are required' }, { status: 400 });
    }

    const all = await getPlaylists();
    const index = all.findIndex(
      (p) => p.id === updatedPlaylist.id && p.macAddress === updatedPlaylist.macAddress
    );

    if (index === -1) {
      return NextResponse.json({ error: 'Playlist not found or unauthorized' }, { status: 404 });
    }

    all[index] = { ...all[index], ...updatedPlaylist };
    await savePlaylists(all);

    return NextResponse.json(all[index]);
  } catch (error) {
    console.error('PUT /api/playlists error:', error);
    return NextResponse.json({ error: 'Failed to update playlist' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const macAddress = searchParams.get('macAddress');

    if (!id || !macAddress) {
      return NextResponse.json({ error: 'ID and MAC Address are required' }, { status: 400 });
    }

    const all = await getPlaylists();
    const filtered = all.filter((p) => !(p.id === id && p.macAddress === macAddress));

    if (filtered.length === all.length) {
      return NextResponse.json({ error: 'Playlist not found or unauthorized' }, { status: 404 });
    }

    await savePlaylists(filtered);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/playlists error:', error);
    return NextResponse.json({ error: 'Failed to delete playlist' }, { status: 500 });
  }
}
