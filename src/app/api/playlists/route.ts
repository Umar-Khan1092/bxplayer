import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const macAddress = searchParams.get('macAddress');
    
    const db = readDB();
    const playlists = db.playlists || [];
    
    const filteredPlaylists = macAddress ? playlists.filter((p: any) => p.macAddress === macAddress) : playlists;
    
    return NextResponse.json(filteredPlaylists);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read playlists' }, { status: 500 });
  }
}

import { parseM3U, fetchXtream } from '@/lib/iptv';

export async function POST(req: Request) {
  try {
    const db = readDB();
    const newPlaylist = await req.json();
    
    if (!newPlaylist.macAddress) {
      return NextResponse.json({ error: 'MAC Address is required' }, { status: 400 });
    }
    
    newPlaylist.id = `PL-${Date.now()}`;
    newPlaylist.itemsCount = 0;

    // Try to pre-fetch and calculate items count
    try {
      if (newPlaylist.type === 'M3U' && newPlaylist.url) {
        const res = await fetch(newPlaylist.url, {
           headers: {
             'User-Agent': 'VLC/3.0.16 LibVLC/3.0.16'
           }
        });
        if (res.ok) {
          const reader = res.body?.getReader();
          if (reader) {
            const decoder = new TextDecoder();
            let chunk = '';
            let count = 0;
            let inExtinf = false;
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                chunk += decoder.decode(value, { stream: true });
                const lines = chunk.replace(/\r/g, '').split('\n');
                chunk = lines.pop() || '';
                for (const line of lines) {
                  const trimmed = line.trim();
                  if (trimmed.startsWith('#EXTINF:')) {
                    inExtinf = true;
                  } else if (!trimmed.startsWith('#') && inExtinf) {
                    count++;
                    inExtinf = false;
                    if (count >= 2000) {
                      reader.cancel();
                      break;
                    }
                  }
                }
                if (count >= 2000) break;
              }
            } catch (e) {
              console.error("Stream count error", e);
            }
            newPlaylist.itemsCount = count;
          } else {
             const content = await res.text();
             newPlaylist.itemsCount = parseM3U(content).length;
          }
        }
      } else if (newPlaylist.type === 'XTREAM' && newPlaylist.serverUrl && newPlaylist.username && newPlaylist.password) {
        const media = await fetchXtream(newPlaylist.serverUrl, newPlaylist.username, newPlaylist.password);
        newPlaylist.itemsCount = media.length;
      }
    } catch (fetchErr) {
      console.warn("Could not pre-fetch playlist items count", fetchErr);
    }
    
    if (!db.playlists) {
      db.playlists = [];
    }
    
    db.playlists.push(newPlaylist);
    writeDB(db);
    
    return NextResponse.json(newPlaylist);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add playlist' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const db = readDB();
    const updatedPlaylist = await req.json();

    if (!updatedPlaylist.id || !updatedPlaylist.macAddress) {
      return NextResponse.json({ error: 'ID and MAC Address are required' }, { status: 400 });
    }

    if (!db.playlists) {
      db.playlists = [];
    }

    const index = db.playlists.findIndex((p: any) => p.id === updatedPlaylist.id && p.macAddress === updatedPlaylist.macAddress);
    
    if (index === -1) {
      return NextResponse.json({ error: 'Playlist not found or unauthorized' }, { status: 404 });
    }

    // Preserve itemsCount and other unchanged fields
    db.playlists[index] = { ...db.playlists[index], ...updatedPlaylist };
    writeDB(db);

    return NextResponse.json(db.playlists[index]);
  } catch (error) {
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

    const db = readDB();
    if (!db.playlists) {
      db.playlists = [];
    }

    const initialLength = db.playlists.length;
    db.playlists = db.playlists.filter((p: any) => !(p.id === id && p.macAddress === macAddress));

    if (db.playlists.length === initialLength) {
      return NextResponse.json({ error: 'Playlist not found or unauthorized' }, { status: 404 });
    }

    writeDB(db);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete playlist' }, { status: 500 });
  }
}
