import type { MediaRecord } from "./db";

export function parseM3U(content: string): MediaRecord[] {
  const lines = content.replace(/\r/g, '').split('\n');
  const media: MediaRecord[] = [];
  let currentMedia: Partial<MediaRecord> = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith('#EXTINF:')) {
      // Parse tvg-logo and group-title
      const logoMatch = line.match(/tvg-logo="([^"]+)"/);
      const groupMatch = line.match(/group-title="([^"]+)"/);
      
      const splitByComma = line.split(',');
      const title = splitByComma.length > 1 ? splitByComma.slice(1).join(',').trim() : 'Unknown';

      currentMedia = {
        id: crypto.randomUUID(),
        title: title,
        posterUrl: logoMatch ? logoMatch[1] : 'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=800&q=80',
        category: groupMatch ? groupMatch[1] : 'Live TV',
        isFavorite: false,
      };
    } else if (!line.startsWith('#')) {
      // This is a URL
      if (currentMedia.title) {
        currentMedia.videoUrl = line;
        
        let finalCategory = currentMedia.category || 'Live TV';
        const lowerTitle = currentMedia.title.toLowerCase();
        
        // Simple heuristic for category mapping
        if (finalCategory === 'Live TV' || !finalCategory) {
           if (line.includes('/movie/') || lowerTitle.includes('movie')) {
               finalCategory = 'Movies';
           } else if (line.includes('/series/') || lowerTitle.includes('s01')) {
               finalCategory = 'Series';
           } else {
               finalCategory = 'Live TV';
           }
        } else if (finalCategory.toLowerCase().includes('movie')) {
           finalCategory = 'Movies';
        } else if (finalCategory.toLowerCase().includes('series') || finalCategory.toLowerCase().includes('show')) {
           finalCategory = 'Series';
        }

        currentMedia.category = finalCategory;
        media.push(currentMedia as MediaRecord);
        currentMedia = {};
      }
    }
  }

  return media;
}

export async function fetchXtream(serverUrl: string, username: string, password: string): Promise<MediaRecord[]> {
   const baseUrl = `${serverUrl}/player_api.php?username=${username}&password=${password}`;
   const media: MediaRecord[] = [];
   
   try {
     // Fetch Live Streams
     const liveRes = await fetch(`${baseUrl}&action=get_live_streams`, {
       headers: { 'User-Agent': 'VLC/3.0.16 LibVLC/3.0.16' }
     });
     if (liveRes.ok) {
       const liveData = await liveRes.json();
       if (Array.isArray(liveData)) {
          // Limit to first 100 for dev purposes so we don't crash
          liveData.slice(0, 100).forEach((stream: any) => {
             media.push({
                id: String(stream.stream_id || crypto.randomUUID()),
                title: stream.name || 'Unknown Live TV',
                posterUrl: stream.stream_icon || 'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=800&q=80',
                category: 'Live TV', 
                videoUrl: `${serverUrl}/live/${username}/${password}/${stream.stream_id}.m3u8`,
                isFavorite: false,
                type: 'video/mp4'
             });
          });
       }
     }
  
     // Fetch VODs
     const vodRes = await fetch(`${baseUrl}&action=get_vod_streams`, {
       headers: { 'User-Agent': 'VLC/3.0.16 LibVLC/3.0.16' }
     });
     if (vodRes.ok) {
       const vodData = await vodRes.json();
       if (Array.isArray(vodData)) {
          // Limit to first 100 for dev purposes
          vodData.slice(0, 100).forEach((stream: any) => {
             media.push({
                id: String(stream.stream_id || crypto.randomUUID()),
                title: stream.name || stream.title || 'Unknown Movie',
                posterUrl: stream.stream_icon || 'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=800&q=80',
                category: 'Movies',
                videoUrl: `${serverUrl}/movie/${username}/${password}/${stream.stream_id}.${stream.container_extension || 'mp4'}`,
                isFavorite: false,
                type: 'video/mp4'
             });
          });
       }
     }
   } catch (error) {
     console.error("Failed to fetch Xtream API", error);
   }
   
   return media;
}
