"use client";

import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Maximize, Volume2, VolumeX, RotateCcw, RotateCw, Heart, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Hls from 'hls.js';

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
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [progress, setProgress] = useState(0);
  const [currentTimeStr, setCurrentTimeStr] = useState("0:00");
  const [durationStr, setDurationStr] = useState("0:00");
  
  // Buffering state for interactive spinner
  const [isBuffering, setIsBuffering] = useState(false);
  
  // Tooltip state
  const [hoverTime, setHoverTime] = useState("0:00");
  const [hoverPos, setHoverPos] = useState(0);
  const [isHoveringProgress, setIsHoveringProgress] = useState(false);

  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds)) return "0:00";
    if (!isFinite(timeInSeconds)) return "Live";
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Sync state with actual video
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const prog = (video.currentTime / video.duration) * 100;
      setProgress(isNaN(prog) ? 0 : prog);
      setCurrentTimeStr(formatTime(video.currentTime));
    };

    const handleLoadedMetadata = () => {
      setDurationStr(formatTime(video.duration));
    };

    const handleWaiting = () => setIsBuffering(true);
    const handlePlaying = () => setIsBuffering(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('canplay', handlePlaying);
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('canplay', handlePlaying);
    }
  }, []);

  // Handle HLS, MPEG-TS and Source Loading
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    let hls: Hls | null = null;
    let mpegtsPlayer: any = null;

    // Reset state when source changes
    setProgress(0);
    setCurrentTimeStr("0:00");
    setIsPlaying(false);
    setIsBuffering(true);

    const isNativeFormat = src.endsWith('.mp4') || src.endsWith('.webm') || src.endsWith('.ogg');
    const isMpegTs = src.endsWith('.ts');
    const isExternal = src.startsWith('http');
    
    // The external IPTV provider blocks Cloudflare IPs (Error 461), so we MUST use our local Next.js backend proxy!
    const proxyUrl = isExternal ? `/api/proxy?url=${encodeURIComponent(src)}` : src;

    if (isMpegTs) {
      let retryCount = 0;
      
      const loadMpegTs = async () => {
        try {
          const mpegtsModule = await import('mpegts.js');
          const mpegts = mpegtsModule.default || mpegtsModule;
          
          if (mpegts.getFeatureList().mseLivePlayback) {
            if (mpegtsPlayer) {
              mpegtsPlayer.destroy();
              mpegtsPlayer = null;
            }

            mpegtsPlayer = mpegts.createPlayer({
                type: 'mse',
                isLive: true,
                url: proxyUrl,
            }, {
                enableWorker: false, // Disabled due to NetworkError crashes with the WebWorker
                lazyLoad: false,
                liveBufferLatencyChasing: false, // Disabled to allow healthy buffering (Netflix-style) and stop stuttering
                stashInitialSize: 128, // Forces decoder to start painting earlier for near-instant channel startup
                autoCleanupSourceBuffer: true,
                autoCleanupMaxBackwardDuration: 15, // Drastically lowers GC pauses and memory pressure
                autoCleanupMinBackwardDuration: 8,
            });
            mpegtsPlayer.attachMediaElement(video);
            mpegtsPlayer.load();
            
            mpegtsPlayer.on(mpegts.Events.ERROR, (errType: any, errDetail: any) => {
                console.error(`MPEG-TS Error: ${errType}`, errDetail);
                if (errType === mpegts.ErrorTypes.NETWORK_ERROR && retryCount < 3) {
                  retryCount++;
                  console.log(`Reconnecting stream... (Attempt ${retryCount}/3)`);
                  // Exponential backoff reconnect
                  setTimeout(() => loadMpegTs(), 1000 * retryCount);
                } else if (retryCount >= 3) {
                  console.error("Max stream retries reached. Connection failed.");
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
      if (Hls.isSupported()) {
        hls = new Hls({
          maxBufferLength: 30,
          maxMaxBufferLength: 600,
        });
        hls.loadSource(proxyUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          // Ready to play
        });
        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            console.error("HLS Error:", data);
            video.src = proxyUrl;
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = proxyUrl;
      } else {
        video.src = proxyUrl;
      }
    } else {
      video.src = proxyUrl;
    }

    return () => {
      if (hls) hls.destroy();
      if (mpegtsPlayer) mpegtsPlayer.destroy();
      video.removeAttribute('src');
      video.load();
    };
  }, [src]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const video = videoRef.current;
      if (!video) return;

      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }

      switch (e.code) {
        case 'Space':
          togglePlay();
          break;
        case 'ArrowRight':
          video.currentTime = Math.min(video.currentTime + 10, video.duration);
          break;
        case 'ArrowLeft':
          video.currentTime = Math.max(video.currentTime - 5, 0);
          break;
        case 'ArrowUp':
          const newVolUp = Math.min(video.volume + 0.1, 1);
          video.volume = newVolUp;
          setVolume(newVolUp);
          if (newVolUp > 0) setIsMuted(false);
          break;
        case 'ArrowDown':
          const newVolDown = Math.max(video.volume - 0.1, 0);
          video.volume = newVolDown;
          setVolume(newVolDown);
          if (newVolDown === 0) setIsMuted(true);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.log("Play interrupted:", error);
          });
        }
      }
      setIsPlaying(!isPlaying);
    }
  };

  const skipForward = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(videoRef.current.currentTime + 10, videoRef.current.duration);
    }
  };

  const skipBackward = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(videoRef.current.currentTime - 5, 0);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
      if (isMuted && volume === 0) {
        setVolume(1);
        videoRef.current.volume = 1;
      }
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  };

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    const container = videoRef.current?.parentElement;
    if (container) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        container.requestFullscreen();
      }
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!videoRef.current || !progressContainerRef.current) return;
    
    const rect = progressContainerRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const seekTo = pos * videoRef.current.duration;
    
    if (isFinite(seekTo)) {
      videoRef.current.currentTime = seekTo;
      setProgress(pos * 100);
    }
  };

  const handleProgressMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !progressContainerRef.current) return;
    
    const rect = progressContainerRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    
    setHoverPos(pos * 100);
    setHoverTime(formatTime(pos * videoRef.current.duration));
  };

  return (
    <div className="relative group w-full rounded-xl sm:rounded-2xl overflow-hidden bg-black border border-[rgba(255,255,255,0.1)]">
      <video
        ref={videoRef}
        poster={poster}
        playsInline
        autoPlay
        preload="auto"
        className="w-full h-full aspect-video object-contain"
        onEnded={() => {
          setIsPlaying(false);
          if (onEnded) onEnded();
        }}
        onClick={togglePlay}
      />

      {/* Interactive Buffering Spinner - Only covers the video, not controls */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none transition-all z-0">
          <div className="flex flex-col items-center gap-3 bg-black/60 p-4 rounded-xl backdrop-blur-sm">
            <Loader2 className="w-12 h-12 text-red-600 animate-spin" />
            <span className="text-white font-medium tracking-wide text-sm animate-pulse">Loading Stream...</span>
          </div>
        </div>
      )}

      {/* Top Overlay */}
      <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-b from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none flex justify-between items-start">
        <h2 className="text-white text-base sm:text-xl font-bold drop-shadow-md max-w-[80%] line-clamp-2">{title}</h2>
        {onFavoriteToggle && (
          <button 
            onClick={(e) => { e.stopPropagation(); onFavoriteToggle(); }} 
            className="pointer-events-auto p-2 rounded-full bg-black/40 backdrop-blur hover:bg-black/60 transition-all hover:scale-110"
          >
            <Heart className={cn("w-5 h-5 sm:w-6 sm:h-6", isFavorite ? "fill-red-500 text-red-500" : "text-white")} />
          </button>
        )}
      </div>

      {/* Controls Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-5 bg-gradient-to-t from-black/95 via-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        
        {/* Custom Progress Bar */}
        {durationStr !== "Live" && (
          <div 
            className="relative w-full h-1.5 sm:h-2 mb-4 cursor-pointer flex items-center group/progress"
            ref={progressContainerRef}
            onClick={handleSeek}
            onMouseMove={handleProgressMouseMove}
            onMouseEnter={() => setIsHoveringProgress(true)}
            onMouseLeave={() => setIsHoveringProgress(false)}
          >
            {/* Background Track (Future loaded, light gray) */}
            <div className="absolute w-full h-full bg-gray-500/40 rounded-full overflow-hidden">
              {/* Hover Indicator */}
              {isHoveringProgress && (
                <div 
                  className="absolute top-0 bottom-0 bg-white/30"
                  style={{ left: 0, width: `${hoverPos}%` }}
                />
              )}
            </div>

            {/* Played Progress (Red) */}
            <div 
              className="absolute h-full bg-red-600 rounded-full"
              style={{ width: `${progress}%` }}
            />

            {/* Thumb (Red circle) */}
            <div 
              className="absolute w-3 h-3 sm:w-4 sm:h-4 bg-red-600 rounded-full shadow transition-transform scale-0 group-hover/progress:scale-100"
              style={{ left: `calc(${progress}% - 8px)` }}
            />

            {/* Tooltip */}
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
          
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            
            {/* Play/Pause */}
            <button 
              onClick={(e) => { e.stopPropagation(); togglePlay(); }} 
              className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 hover:bg-white/20 backdrop-blur rounded-full flex items-center justify-center transition-colors"
            >
              {isPlaying ? <Pause className="w-5 h-5 sm:w-6 sm:h-6 fill-current" /> : <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current ml-1" />}
            </button>
            
            {/* Skip Group */}
            <div className="flex items-center bg-white/10 backdrop-blur rounded-full px-1 sm:px-2 py-1">
              <button onClick={skipBackward} className="p-1.5 sm:p-2 hover:bg-white/10 rounded-full transition-colors relative flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10" title="Rewind 5s">
                <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6 absolute inset-0 m-auto" />
                <span className="text-[9px] sm:text-[10px] font-bold mt-0.5 pointer-events-none">5</span>
              </button>
              <div className="w-px h-5 bg-white/20 mx-1"></div>
              <button onClick={skipForward} className="p-1.5 sm:p-2 hover:bg-white/10 rounded-full transition-colors relative flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10" title="Forward 10s">
                <RotateCw className="w-5 h-5 sm:w-6 sm:h-6 absolute inset-0 m-auto" />
                <span className="text-[9px] sm:text-[10px] font-bold mt-0.5 pointer-events-none">10</span>
              </button>
            </div>

            {/* Volume Group */}
            <div className="hidden sm:flex items-center bg-white/10 backdrop-blur rounded-full px-3 py-1.5 gap-2 group/vol w-auto">
              <button onClick={toggleMute} className="hover:text-blue-400 transition-colors">
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: `linear-gradient(to right, white ${(isMuted ? 0 : volume) * 100}%, rgba(107, 114, 128, 0.5) ${(isMuted ? 0 : volume) * 100}%)`
                }}
                className="w-16 h-1 rounded-lg appearance-none cursor-pointer accent-white"
              />
            </div>

            {/* Time */}
            {durationStr !== "Live" ? (
              <div className="bg-white/10 backdrop-blur rounded-full px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium tabular-nums flex items-center">
                {currentTimeStr} / {durationStr}
              </div>
            ) : (
              <div className="bg-red-600/90 backdrop-blur rounded-full px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-bold tracking-widest flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                LIVE
              </div>
            )}
          </div>
          
          <button onClick={toggleFullscreen} className="bg-white/10 hover:bg-white/20 backdrop-blur rounded-full p-2 sm:p-3 transition-colors">
            <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
