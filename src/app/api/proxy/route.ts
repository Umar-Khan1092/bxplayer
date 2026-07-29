import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return new NextResponse('Missing URL parameter', { status: 400 });
  }

  try {
    const response = await fetch(targetUrl, {
      signal: request.signal,
      headers: {
        'User-Agent': 'VLC/3.0.16 LibVLC/3.0.16',
        'Accept': '*/*'
      }
    });

    if (!response.ok) {
      return new NextResponse(`Proxy Error: Target returned ${response.status}`, { status: response.status });
    }

    const contentType = response.headers.get('content-type') || '';
    const isM3U8 = targetUrl.includes('.m3u8') || contentType.includes('mpegurl') || contentType.includes('x-mpegURL');

    if (isM3U8) {
      const text = await response.text();
      const baseUrl = new URL(targetUrl);
      // Remove filename from path to get base directory
      const basePath = baseUrl.pathname.substring(0, baseUrl.pathname.lastIndexOf('/') + 1);
      
      const rewrittenLines = text.split('\n').map(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) {
          return line;
        }
        
        let chunkUrl = trimmed;
        // Resolve relative URL to absolute
        if (!chunkUrl.startsWith('http')) {
          if (chunkUrl.startsWith('/')) {
            chunkUrl = `${baseUrl.origin}${chunkUrl}`;
          } else {
            chunkUrl = `${baseUrl.origin}${basePath}${chunkUrl}`;
          }
        }
        
        // Return proxied URL
        const requestBase = new URL(request.url).origin;
        return `${requestBase}/api/proxy?url=${encodeURIComponent(chunkUrl)}`;
      });

      return new NextResponse(rewrittenLines.join('\n'), {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Cache-Control': 'no-cache'
        }
      });
    }

    if (!response.body) {
      return new NextResponse('Empty response from target', { status: 500 });
    }

    return new Response(response.body, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': contentType || 'video/mp2t',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Connection': 'keep-alive'
      }
    });
    
  } catch (error) {
    console.error('Proxy Error:', error);
    return new NextResponse('Internal Proxy Error', { status: 500 });
  }
}
