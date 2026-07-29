import { NextResponse } from 'next/server';
import { readDB } from '@/lib/db';

import { parseM3U, fetchXtream } from '@/lib/iptv';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const playlistId = searchParams.get('playlistId');
    const db = readDB();

    if (playlistId) {
      const playlist = db.playlists.find((p: any) => p.id === playlistId);
      if (!playlist) return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
      
      if (playlist.type === 'M3U' && playlist.url) {
        // Fetch M3U playlist with User-Agent
        const res = await fetch(playlist.url, {
           headers: {
             'User-Agent': 'VLC/3.0.16 LibVLC/3.0.16'
           }
        });
        if (!res.ok) throw new Error('Failed to fetch M3U playlist from URL');
        
        const reader = res.body?.getReader();
        if (!reader) {
           const content = await res.text();
           return NextResponse.json(parseM3U(content));
        }

        const decoder = new TextDecoder();
        let chunk = '';
        const media: any[] = [];
        let currentMedia: any = {};
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            chunk += decoder.decode(value, { stream: true });
            const lines = chunk.replace(/\r/g, '').split('\n');
            chunk = lines.pop() || '';
            
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed) continue;
              
              if (trimmed.startsWith('#EXTINF:')) {
                const logoMatch = trimmed.match(/tvg-logo="([^"]+)"/);
                const groupMatch = trimmed.match(/group-title="([^"]+)"/);
                const splitByComma = trimmed.split(',');
                const title = splitByComma.length > 1 ? splitByComma.slice(1).join(',').trim() : 'Unknown';
                
                currentMedia = {
                  id: crypto.randomUUID(),
                  title: title,
                  posterUrl: logoMatch ? logoMatch[1] : 'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=800&q=80',
                  category: groupMatch ? groupMatch[1] : 'Live TV',
                  isFavorite: false,
                };
              } else if (!trimmed.startsWith('#') && currentMedia.title) {
                let url = trimmed;
                
                // Rewrite extensionless Xtream Codes URLs (e.g. http://domain/user/pass/1234)
                const xtreamRegex = /^(http[s]?:\/\/[^\/]+)\/([^\/]+)\/([^\/]+)\/([0-9]+)$/;
                const match = url.match(xtreamRegex);
                if (match) {
                    // For live streams, append .ts since .m3u8 is disabled on this server
                    url = `${match[1]}/live/${match[2]}/${match[3]}/${match[4]}.ts`;
                }

                currentMedia.videoUrl = url;
                
                let finalCategory = currentMedia.category || 'Live TV';
                const lowerTitle = currentMedia.title.toLowerCase();
                
                if (finalCategory === 'Live TV' || !finalCategory) {
                   if (trimmed.includes('/movie/') || lowerTitle.includes('movie')) {
                       finalCategory = 'Movies';
                   } else if (trimmed.includes('/series/') || lowerTitle.includes('s01')) {
                       finalCategory = 'Series';
                   } else {
                       finalCategory = 'Live TV';
                   }
                }
                currentMedia.category = finalCategory;
                media.push(currentMedia);
                currentMedia = {};
                
                if (media.length >= 2000) {
                   reader.cancel();
                   return NextResponse.json(media);
                }
              }
            }
          }
        } catch (e) {
           console.error("Stream error", e);
        }
        
        return NextResponse.json(media);
      } else if (playlist.type === 'XTREAM' && playlist.serverUrl && playlist.username && playlist.password) {
        // Fetch Xtream Codes playlist
        const media = await fetchXtream(playlist.serverUrl, playlist.username, playlist.password);
        return NextResponse.json(media);
      }
      
      // For CODE, return empty for now until parser is implemented
      return NextResponse.json([]);
    }

    return NextResponse.json(db.media);
  } catch (error) {
    console.error('API Media Error:', error);
    return NextResponse.json({ error: 'Failed to fetch media' }, { status: 500 });
  }
}
