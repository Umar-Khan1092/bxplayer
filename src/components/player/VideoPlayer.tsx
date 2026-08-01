"use client";

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Play, Pause, Maximize, Volume2, VolumeX, RotateCcw, RotateCw, Heart, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Hls from 'hls.js';
import { Capacitor } from '@capacitor/core';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  isFavorite?: boolean;
  onFavoriteToggle?: () => void;
  onEnded?: () => void;
}

export function VideoPlayer({ src, poster, title, isFavorite, onFavoriteToggle, onEnded }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ─── State ────────────────────────────────────────────────────────────────
  // isPlaying is driven by native video events (not toggle state) to ensure
  // it is always accurate even when autoPlay fires before React renders.
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [progress, setProgress] = useState(0);
  const [currentTimeStr, setCurrentTimeStr] = useState("0:00");
  const [durationStr, setDurationStr] = useState("0:00");
  const [isBuffering, setIsBuffering] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [retryTrigger, setRetryTrigger] = useState(0);

  // Tooltip state
  const [hoverTime, setHoverTime] = useState("0:00");
  const [hoverPos, setHoverPos] = useState(0);
  const [isHoveringProgress, setIsHoveringProgress] = useState(false);

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds)) return "0:00";
    if (!isFinite(timeInSeconds)) return "Live";
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // ─── Controls visibility ──────────────────────────────────────────────────
  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      // Don't hide if paused — controls must remain visible when paused
      if (videoRef.current && !videoRef.current.paused) {
        setShowControls(false);
      }
    }, 4000);
  }, []);

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  // ─── Native video event listeners (source of truth for isPlaying) ─────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay     = () => { setIsPlaying(true);  setIsBuffering(false); showControlsTemporarily(); };
    const onPause    = () => { setIsPlaying(false); setShowControls(true); };
    const onWaiting  = () => setIsBuffering(true);
    const onPlaying  = () => setIsBuffering(false);
    const onCanPlay  = () => setIsBuffering(false);
    const onEnded    = () => { setIsPlaying(false); setShowControls(true); if (onEnded) onEnded(); };

    const onTimeUpdate = () => {
      const prog = (video.currentTime / video.duration) * 100;
      setProgress(isNaN(prog) ? 0 : prog);
      setCurrentTimeStr(formatTime(video.currentTime));
    };

    const onLoadedMetadata = () => {
      const dur = formatTime(video.duration);
      setDurationStr(dur);
      setIsLive(dur === "Live" || !isFinite(video.duration));
    };

    video.addEventListener('play',            onPlay);
    video.addEventListener('pause',           onPause);
    video.addEventListener('waiting',         onWaiting);
    video.addEventListener('playing',         onPlaying);
    video.addEventListener('canplay',         onCanPlay);
    video.addEventListener('ended',           onEnded);
    video.addEventListener('timeupdate',      onTimeUpdate);
    video.addEventListener('loadedmetadata',  onLoadedMetadata);

    return () => {
      video.removeEventListener('play',            onPlay);
      video.removeEventListener('pause',           onPause);
      video.removeEventListener('waiting',         onWaiting);
      video.removeEventListener('playing',         onPlaying);
      video.removeEventListener('canplay',         onCanPlay);
      video.removeEventListener('ended',           onEnded);
      video.removeEventListener('timeupdate',      onTimeUpdate);
      video.removeEventListener('loadedmetadata',  onLoadedMetadata);
    };
  }, [onEnded, showControlsTemporarily]);

  // ─── Auto-Reconnect (Stall Detector) ──────────────────────────────────────
  // Vercel forcefully terminates connections after ~5 minutes. This detects when
  // the video is stuck buffering for 5 seconds and instantly forces a reconnect.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isPlaying) return;

    let lastTime = video.currentTime;
    let stallCount = 0;

    const interval = setInterval(() => {
      if (video.paused) return;
      
      if (video.currentTime === lastTime) {
        stallCount++;
        if (stallCount >= 5) {
          console.warn("Stream stalled for 5 seconds (Vercel timeout). Forcing reconnect...");
          stallCount = 0;
          setIsBuffering(true);
          setRetryTrigger(prev => prev + 1); // Trigger the source loader effect to run again
        }
      } else {
        stallCount = 0;
        lastTime = video.currentTime;
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, retryTrigger]);

  // ─── HLS / MPEG-TS / Native source loading ────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    let hls: Hls | null = null;
    let mpegtsPlayer: any = null;

    // Reset state on source change
    setProgress(0);
    setCurrentTimeStr("0:00");
    setIsBuffering(true);
    setIsLive(false);

    const isNativeFormat  = /\.(mp4|webm|ogg)$/i.test(src);
    const isMpegTs        = /\.ts(\?.*)?$/i.test(src);
    const isExternal      = src.startsWith('http');

    // For MPEG-TS live streams we must proxy (CORS blocked by IPTV providers).
    // For HLS, the proxy rewrites the .m3u8 manifest to use direct chunk URLs,
    // so chunks are fetched browser→IPTV server directly (no proxy overhead).
    // If running natively (Capacitor), bypass proxy since native ignores CORS.
    // Otherwise, route through our Vercel API proxy for web.
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://bxplayer.vercel.app';
    const isNative = typeof window !== 'undefined' && Capacitor.isNativePlatform();
    const proxyUrl = isNative ? src : (isExternal ? `${baseUrl}/api/proxy?url=${encodeURIComponent(src)}` : src);

    if (isMpegTs) {
      // ── MPEG-TS live stream via mpegts.js ──────────────────────────────
      let retryCount = 0;

      const loadMpegTs = async () => {
        try {
          const mpegtsModule = await import('mpegts.js');
          const mpegts = mpegtsModule.default || mpegtsModule;

          if (mpegts.getFeatureList().mseLivePlayback) {
            if (mpegtsPlayer) { mpegtsPlayer.destroy(); mpegtsPlayer = null; }

            mpegtsPlayer = mpegts.createPlayer({
              type: 'mse',
              isLive: true,
              url: proxyUrl,
            }, {
              enableWorker: true,               // Offload demux to Web Worker → main thread stays smooth
              lazyLoad: false,
              liveBufferLatencyChasing: true,   // Actively chase live edge (like YouTube Live)
              liveBufferLatencyMaxLatency: 6.0, // Drift up to 6s behind live before jumping
              liveBufferLatencyMinRemain: 1.0,  // Jump when only 1s of buffer remains
              stashInitialSize: 512 * 1024,     // 512 KB initial IO buffer → faster first frame
              autoCleanupSourceBuffer: true,
              autoCleanupMaxBackwardDuration: 20,
              autoCleanupMinBackwardDuration: 10,
            });

            mpegtsPlayer.attachMediaElement(video);
            mpegtsPlayer.load();

            mpegtsPlayer.on(mpegts.Events.ERROR, (errType: any, errDetail: any) => {
              console.error(`MPEG-TS Error: ${errType}`, errDetail);
              if (errType === mpegts.ErrorTypes.NETWORK_ERROR && retryCount < 5) {
                retryCount++;
                setTimeout(() => loadMpegTs(), 1500 * retryCount);
              }
            });
          } else {
            video.src = proxyUrl;
          }
        } catch (error) {
          console.error("Failed to load mpegts.js", error);
          video.src = proxyUrl;
        }
      };

      loadMpegTs();

    } else if (!isNativeFormat) {
      // ── HLS stream via hls.js ──────────────────────────────────────────
      if (Hls.isSupported()) {
        hls = new Hls({
          // Buffer tuning — low latency live TV config
          maxBufferLength: 8,               // Only buffer 8s ahead (was 30) → much faster start
          maxMaxBufferLength: 30,
          liveSyncDurationCount: 3,         // Target 3 segments from live edge
          liveMaxLatencyDurationCount: 6,   // Max 6 segments behind live → jump forward
          // Adaptive bitrate
          startLevel: -1,                   // Auto-select best quality for network
          abrEwmaFastLive: 3,               // Fast ABR response (3s window)
          abrEwmaSlowLive: 9,               // Slow ABR response (9s window)
          // Performance
          enableWorker: true,               // Offload parsing to Web Worker
          lowLatencyMode: true,             // Enable LL-HLS if the server supports it
          backBufferLength: 10,             // Keep only 10s of back buffer
        });
        hls.loadSource(proxyUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls?.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls?.recoverMediaError();
                break;
              default:
                console.error("HLS fatal error:", data);
                video.src = proxyUrl;
            }
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS (iOS Safari) — use direct URL, Safari handles it natively
        video.src = proxyUrl;
      } else {
        video.src = proxyUrl;
      }

    } else {
      // Native MP4/WebM/Ogg
      video.src = src;
    }

    return () => {
      if (hls) hls.destroy();
      if (mpegtsPlayer) { mpegtsPlayer.destroy(); }
      video.removeAttribute('src');
      video.load();
    };
  }, [src, retryTrigger]);

  // ─── Keyboard controls (desktop + TV remote) ──────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const video = videoRef.current;
      if (!video) return;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(e.code)) {
        e.preventDefault();
      }
      showControlsTemporarily();
      switch (e.code) {
        case 'Space':
        case 'Enter':
          video.paused ? video.play() : video.pause();
          break;
        case 'ArrowRight':
          if (!isLive) video.currentTime = Math.min(video.currentTime + 10, video.duration);
          break;
        case 'ArrowLeft':
          if (!isLive) video.currentTime = Math.max(video.currentTime - 5, 0);
          break;
        case 'ArrowUp': {
          const v = Math.min(video.volume + 0.1, 1);
          video.volume = v; setVolume(v); if (v > 0) setIsMuted(false);
          break;
        }
        case 'ArrowDown': {
          const v = Math.max(video.volume - 0.1, 0);
          video.volume = v; setVolume(v); if (v === 0) setIsMuted(true);
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLive, showControlsTemporarily]);

  // ─── Actions ──────────────────────────────────────────────────────────────
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch((err) => console.warn("Play interrupted:", err));
    } else {
      video.pause();
    }
    // Note: isPlaying state is updated by the native play/pause event listeners above
  };

  const skipForward = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current && !isLive) {
      videoRef.current.currentTime = Math.min(videoRef.current.currentTime + 10, videoRef.current.duration);
    }
  };

  const skipBackward = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current && !isLive) {
      videoRef.current.currentTime = Math.max(videoRef.current.currentTime - 5, 0);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
    if (isMuted && volume === 0) { setVolume(1); video.volume = 1; }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (videoRef.current) { videoRef.current.volume = v; setIsMuted(v === 0); }
  };

  const toggleFullscreen = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const container = containerRef.current as any;
    const video = videoRef.current as any;
    if (!container) return;

    if (document.fullscreenElement || (document as any).webkitFullscreenElement) {
      if (document.exitFullscreen) document.exitFullscreen();
      else if ((document as any).webkitExitFullscreen) (document as any).webkitExitFullscreen();
      try {
        const o = screen.orientation as any;
        if (o?.unlock) o.unlock();
      } catch (_) {}
    } else {
      try {
        if (container.requestFullscreen)       await container.requestFullscreen();
        else if (container.webkitRequestFullscreen) await container.webkitRequestFullscreen();
        else if (video?.webkitEnterFullscreen)  video.webkitEnterFullscreen();
        const o = screen.orientation as any;
        if (o?.lock) await o.lock('landscape');
      } catch (_) {}
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!videoRef.current || !progressContainerRef.current || isLive) return;
    const rect = progressContainerRef.current.getBoundingClientRect();
    const pos  = (e.clientX - rect.left) / rect.width;
    const seekTo = pos * videoRef.current.duration;
    if (isFinite(seekTo)) { videoRef.current.currentTime = seekTo; setProgress(pos * 100); }
  };

  const handleProgressMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !progressContainerRef.current) return;
    const rect = progressContainerRef.current.getBoundingClientRect();
    const pos  = (e.clientX - rect.left) / rect.width;
    setHoverPos(pos * 100);
    setHoverTime(formatTime(pos * videoRef.current.duration));
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className="bxp-player relative w-full rounded-xl sm:rounded-2xl overflow-hidden bg-black border border-[rgba(255,255,255,0.1)]"
      onMouseMove={showControlsTemporarily}
      onTouchStart={showControlsTemporarily}
      onMouseLeave={() => { if (isPlaying) setShowControls(false); }}
      onFocus={showControlsTemporarily}  /* TV D-pad navigation */
    >
      <video
        ref={videoRef}
        poster={poster}
        playsInline
        autoPlay
        preload="auto"
        className="w-full h-full aspect-video object-contain"
        onClick={togglePlay}
      />

      {/* Buffering Spinner */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="flex flex-col items-center gap-3 bg-black/60 p-4 rounded-xl backdrop-blur-sm">
            <Loader2 className="w-12 h-12 text-red-600 animate-spin" />
            <span className="text-white font-medium tracking-wide text-sm animate-pulse">
              {isLive ? "Connecting to stream..." : "Loading..."}
            </span>
          </div>
        </div>
      )}

      {/* Top Overlay — title + favorite */}
      <div className={cn(
        "bxp-controls absolute top-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-b from-black/80 to-transparent transition-opacity duration-300 pointer-events-none flex justify-between items-start",
        showControls ? "opacity-100" : "opacity-0"
      )}>
        <h2 className="text-white text-base sm:text-xl font-bold drop-shadow-md max-w-[80%] line-clamp-2">{title}</h2>
        {onFavoriteToggle && (
          <button
            onClick={(e) => { e.stopPropagation(); onFavoriteToggle(); }}
            className="pointer-events-auto p-2 rounded-full bg-black/40 backdrop-blur hover:bg-black/60 transition-all hover:scale-110 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
          >
            <Heart className={cn("w-5 h-5 sm:w-6 sm:h-6", isFavorite ? "fill-red-500 text-red-500" : "text-white")} />
          </button>
        )}
      </div>

      {/* Bottom Controls Overlay */}
      <div className={cn(
        "bxp-controls absolute bottom-0 left-0 right-0 p-3 sm:p-5 bg-gradient-to-t from-black/95 via-black/70 to-transparent transition-opacity duration-300",
        showControls ? "opacity-100" : "opacity-0"
      )}>

        {/* Progress Bar — hidden for live streams */}
        {!isLive && (
          <div
            className="relative w-full h-1.5 sm:h-2 mb-4 cursor-pointer flex items-center group/progress"
            ref={progressContainerRef}
            onClick={handleSeek}
            onMouseMove={handleProgressMouseMove}
            onMouseEnter={() => setIsHoveringProgress(true)}
            onMouseLeave={() => setIsHoveringProgress(false)}
          >
            <div className="absolute w-full h-full bg-gray-500/40 rounded-full overflow-hidden">
              {isHoveringProgress && (
                <div className="absolute top-0 bottom-0 bg-white/30" style={{ left: 0, width: `${hoverPos}%` }} />
              )}
            </div>
            <div className="absolute h-full bg-red-600 rounded-full" style={{ width: `${progress}%` }} />
            <div
              className="absolute w-3 h-3 sm:w-4 sm:h-4 bg-red-600 rounded-full shadow transition-transform scale-0 group-hover/progress:scale-100"
              style={{ left: `calc(${progress}% - 8px)` }}
            />
            {isHoveringProgress && (
              <div
                className="absolute -top-10 -ml-4 bg-black/80 text-white text-xs px-2 py-1 rounded font-medium whitespace-nowrap"
                style={{ left: `${hoverPos}%` }}
              >
                {hoverTime}
              </div>
            )}
          </div>
        )}

        {/* Buttons Row */}
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2 sm:gap-3">

            {/* Play/Pause */}
            <button
              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 hover:bg-white/20 backdrop-blur rounded-full flex items-center justify-center transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            >
              {isPlaying
                ? <Pause className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
                : <Play  className="w-5 h-5 sm:w-6 sm:h-6 fill-current ml-1" />}
            </button>

            {/* Skip group — hidden for live streams */}
            {!isLive && (
              <div className="flex items-center bg-white/10 backdrop-blur rounded-full px-1 sm:px-2 py-1">
                <button
                  onClick={skipBackward}
                  className="p-1.5 sm:p-2 hover:bg-white/10 rounded-full transition-colors relative flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
                  title="Rewind 5s"
                >
                  <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6 absolute inset-0 m-auto" />
                  <span className="text-[9px] sm:text-[10px] font-bold mt-0.5 pointer-events-none">5</span>
                </button>
                <div className="w-px h-5 bg-white/20 mx-1" />
                <button
                  onClick={skipForward}
                  className="p-1.5 sm:p-2 hover:bg-white/10 rounded-full transition-colors relative flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
                  title="Forward 10s"
                >
                  <RotateCw className="w-5 h-5 sm:w-6 sm:h-6 absolute inset-0 m-auto" />
                  <span className="text-[9px] sm:text-[10px] font-bold mt-0.5 pointer-events-none">10</span>
                </button>
              </div>
            )}

            {/* Volume — desktop only */}
            <div className="hidden sm:flex items-center bg-white/10 backdrop-blur rounded-full px-3 py-1.5 gap-2">
              <button
                onClick={toggleMute}
                className="hover:text-blue-400 transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none rounded-full"
              >
                {isMuted || volume === 0
                  ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />
                  : <Volume2  className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
              <input
                type="range" min="0" max="1" step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                onClick={(e) => e.stopPropagation()}
                style={{ background: `linear-gradient(to right, white ${(isMuted ? 0 : volume) * 100}%, rgba(107,114,128,0.5) ${(isMuted ? 0 : volume) * 100}%)` }}
                className="w-16 h-1 rounded-lg appearance-none cursor-pointer accent-white"
              />
            </div>

            {/* Time / LIVE badge */}
            {!isLive ? (
              <div className="bg-white/10 backdrop-blur rounded-full px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium tabular-nums">
                {currentTimeStr} / {durationStr}
              </div>
            ) : (
              <div className="bg-red-600/90 backdrop-blur rounded-full px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-bold tracking-widest flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                LIVE
              </div>
            )}
          </div>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="bg-white/10 hover:bg-white/20 backdrop-blur rounded-full p-2 sm:p-3 transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
          >
            <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
