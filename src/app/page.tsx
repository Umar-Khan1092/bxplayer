"use client";

import { useEffect, useState } from "react";
import { VideoPlayer } from "@/components/player/VideoPlayer";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { MediaRecord, PlaylistRecord } from "@/lib/db";
import { Heart, PlaySquare, Monitor, Film, Tv, Server, MoreVertical, Copy, Check, Link as LinkIcon, ListVideo, Key, EyeOff, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const DEFAULT_TABS = ["Live TV", "Movies", "Series"];

export default function Home() {
  const [mediaList, setMediaList] = useState<MediaRecord[]>([]);
  const [customPlaylists, setCustomPlaylists] = useState<PlaylistRecord[]>([]);
  const [activeVideo, setActiveVideo] = useState<MediaRecord | null>(null);
  const [isWatching, setIsWatching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaylistsLoading, setIsPlaylistsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("Home");
  const [history, setHistory] = useState<MediaRecord[]>([]);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isAccountInfoVisible, setIsAccountInfoVisible] = useState(true);
  const [dynamicTabs, setDynamicTabs] = useState<string[]>(["Home", "Playlists"]);
  const { macAddress: persistentMac, userId: persistentId, isLoaded: isAuthLoaded } = useAuth();

  const handleCopyAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    const textToCopy = `Mac Address: ${persistentMac}\nUser ID: ${persistentId}`;
    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  useEffect(() => {
    if (activeVideo && isWatching) {
      setHistory(prev => {
        const filtered = prev.filter(m => m.id !== activeVideo.id);
        return [activeVideo, ...filtered].slice(0, 10);
      });
    }
  }, [activeVideo, isWatching]);

  const fetchMedia = async () => {
    try {
      const res = await fetch('/api/media');
      const data = await res.json();
      setMediaList(data);
      if (data.length > 0) {
        setDynamicTabs(["Home", "Playlists"]);
      }
    } catch (error) {
      console.error("Failed to load media", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPlaylists = async () => {
    if (!persistentMac) return;
    setIsPlaylistsLoading(true);
    try {
      const res = await fetch(`/api/playlists?macAddress=${persistentMac}`);
      const data = await res.json();
      setCustomPlaylists(data);
    } catch (error) {
      console.error("Failed to load custom playlists");
    } finally {
      setIsPlaylistsLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handlePlaylistClick = async (playlist: PlaylistRecord) => {
    setIsLoading(true);
    setActiveTab("Home"); // Switch immediately to show the loading skeleton
    window.scrollTo(0, 0); // Scroll to top to ensure skeleton is visible
    try {
      const res = await fetch(`/api/media?playlistId=${playlist.id}`);
      if (res.ok) {
        const data = await res.json();
        setMediaList(data);
        setCustomPlaylists(prev => prev.map(p => p.id === playlist.id ? { ...p, itemsCount: data.length } : p));
        if (data.length > 0) {
          setActiveTab("Home");
        } else {
          alert("No media found in this playlist.");
        }
      } else {
        alert(`Failed to load playlist from server. (Status: ${res.status})`);
      }
    } catch (error) {
      console.error("Failed to load playlist media", error);
      alert("Failed to load playlist media.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (persistentMac && activeTab === "Playlists") {
      fetchPlaylists();
    }
  }, [persistentMac, activeTab]);

  const handleFavoriteToggle = async () => {
    if (!activeVideo) return;
    const previousState = activeVideo.isFavorite;
    const newState = !previousState;
    setActiveVideo({ ...activeVideo, isFavorite: newState });
    setMediaList(prevList => prevList.map(m => m.id === activeVideo.id ? { ...m, isFavorite: newState } : m));
    try {
      await fetch('/api/media/favorite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: activeVideo.id })
      });
    } catch (error) {
      console.error("Failed to toggle favorite", error);
      setActiveVideo({ ...activeVideo, isFavorite: previousState });
      setMediaList(prevList => prevList.map(m => m.id === activeVideo.id ? { ...m, isFavorite: previousState } : m));
    }
  };

  const handleCardFavoriteToggle = async (e: React.MouseEvent, media: MediaRecord) => {
    e.stopPropagation();
    const previousState = media.isFavorite;
    const newState = !previousState;
    setMediaList(prevList => prevList.map(m => m.id === media.id ? { ...m, isFavorite: newState } : m));
    if (activeVideo?.id === media.id) {
      setActiveVideo({ ...activeVideo, isFavorite: newState });
    }
    try {
      await fetch('/api/media/favorite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: media.id })
      });
    } catch (error) {
      console.error("Failed to toggle favorite on card", error);
      setMediaList(prevList => prevList.map(m => m.id === media.id ? { ...m, isFavorite: previousState } : m));
      if (activeVideo?.id === media.id) {
        setActiveVideo({ ...activeVideo, isFavorite: previousState });
      }
    }
  };

  const handleVideoClick = (media: MediaRecord) => {
    setActiveVideo(media);
    setIsWatching(true);
    window.scrollTo(0, 0);
  };

  // Group Media by Category
  const groupedMedia = mediaList.reduce((acc, media) => {
    const cat = media.category || "Live TV";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(media);
    return acc;
  }, {} as Record<string, MediaRecord[]>);

  // Dedicated Player Page View
  if (isWatching && activeVideo) {
    const relatedVideos = mediaList.filter(m => m.category === activeVideo.category && m.id !== activeVideo.id).slice(0, 10);
    
    return (
      <div className="fixed inset-0 z-50 bg-[#050505] text-white flex flex-col font-sans overflow-y-auto overflow-x-hidden">
        {/* Header Back Button */}
        <div className="p-4 flex items-center gap-4 bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-10 pointer-events-none">
           <button onClick={() => setIsWatching(false)} className="pointer-events-auto p-2 bg-black/50 hover:bg-black/80 rounded-full backdrop-blur-md transition-colors">
             <ArrowLeft className="w-6 h-6 text-white" />
           </button>
           <h2 className="text-lg font-bold text-white drop-shadow-md line-clamp-1 pointer-events-auto">{activeVideo.title}</h2>
        </div>

        {/* Player */}
        <div className="w-full bg-black relative flex-shrink-0 pt-0">
          <VideoPlayer 
            key={activeVideo.id} 
            src={activeVideo.videoUrl} 
            poster={activeVideo.posterUrl}
            title={activeVideo.title}
            isFavorite={activeVideo.isFavorite}
            onFavoriteToggle={handleFavoriteToggle}
          />
        </div>

        {/* Metadata & Related */}
        <div className="p-4 sm:p-8 flex-grow">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">{activeVideo.title}</h1>
          <p className="text-gray-400 text-sm mb-6 uppercase tracking-wider">{activeVideo.category}</p>
          
          {relatedVideos.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-white mb-4 tracking-tight">More like this</h3>
              <div className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar pb-4">
                {relatedVideos.map((media) => (
                  <div key={media.id} className="relative w-32 sm:w-40 flex-shrink-0 group cursor-pointer" onClick={() => handleVideoClick(media)}>
                    <Card className="hover-scale overflow-hidden border-white/5 bg-[#111]">
                      <div className="aspect-[2/3] w-full relative">
                        <img src={media.posterUrl} alt={media.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-2 flex flex-col justify-center">
                        <h4 className="font-semibold text-[11px] sm:text-xs text-white line-clamp-1">{media.title}</h4>
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Home Screen Layout
  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans relative overflow-hidden pt-4 sm:pt-8">
      <div className="w-full max-w-7xl mx-auto flex-grow flex flex-col gap-6">
        
        {/* Category Tabs */}
        <div className="flex items-center gap-2 sm:gap-4 py-2 sm:py-4 px-4 overflow-x-auto no-scrollbar scroll-smooth">
          {dynamicTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-shrink-0 cursor-pointer px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base transition-all duration-300 shadow-lg ${
                activeTab === tab && tab !== "Playlists"
                  ? 'bg-red-600 text-white transform sm:scale-105' 
                  : tab === "Playlists"
                    ? (activeTab === "Playlists" ? 'bg-purple-600 text-white transform sm:scale-105' : 'glass text-purple-400 border border-purple-500/30 hover:bg-purple-600/20')
                    : 'glass text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-2">
                {tab === "Home" && <Film className="w-4 h-4 sm:w-5 sm:h-5" />}
                {tab === "Playlists" && <Server className="w-4 h-4 sm:w-5 sm:h-5" />}
                {tab}
              </div>
            </button>
          ))}
        </div>

        {activeTab === "Playlists" ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-6 px-4 pb-24 sm:pb-20">
             {isPlaylistsLoading ? (
               Array(4).fill(0).map((_, i) => <Skeleton key={i} className="aspect-[2/3] w-full rounded-xl" />)
             ) : customPlaylists.length > 0 ? (
               customPlaylists.map((playlist) => (
                 <Card 
                   key={playlist.id} 
                   className="cursor-pointer hover-scale overflow-hidden border-purple-500/30 bg-purple-900/10 hover:border-purple-500/60 transition-colors group"
                   onClick={() => handlePlaylistClick(playlist)}
                 >
                   <div className="flex flex-col h-full bg-[#111]">
                     <div className="aspect-[2/3] w-full flex items-center justify-center bg-gradient-to-br from-purple-900/40 to-black relative">
                        {playlist.type === 'M3U' ? (
                          <LinkIcon className="w-8 h-8 text-purple-400/50 group-hover:scale-110 transition-transform" />
                        ) : (
                          <ListVideo className="w-8 h-8 text-green-400/50 group-hover:scale-110 transition-transform" />
                        )}
                        {playlist.isLocked && (
                          <div className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-full">
                            <Key className="w-3 h-3 text-yellow-500" />
                          </div>
                        )}
                     </div>
                     <div className="p-2 sm:p-3 flex flex-col justify-center">
                       <h4 className="font-semibold text-xs sm:text-sm text-white line-clamp-1 group-hover:text-purple-400 transition-colors">{playlist.name}</h4>
                       <span className="text-[10px] sm:text-xs text-gray-400 mt-0.5">{playlist.type} • {playlist.itemsCount || 0}</span>
                     </div>
                   </div>
                 </Card>
               ))
             ) : (
               <div className="col-span-full py-16 text-center text-gray-500 glass rounded-xl border border-white/5">
                  <Server className="w-8 h-8 mx-auto mb-3 text-purple-500/50" />
                  <p className="text-lg">No playlists found.</p>
               </div>
             )}
          </div>
        ) : (
          <div className="pb-24 sm:pb-20">
            {isLoading ? (
              <div className="px-4"><Skeleton className="w-full h-40 rounded-xl" /></div>
            ) : mediaList.length > 0 ? (
              <>
                {/* Watching Continuously Row */}
                {history.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-white mb-3 px-4">Watching Continuously</h3>
                    <div className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar px-4 pb-2">
                      {history.map((media) => (
                        <div key={media.id} className="relative w-32 sm:w-40 flex-shrink-0 group cursor-pointer" onClick={() => handleVideoClick(media)}>
                          <Card className="hover-scale overflow-hidden border-white/5 bg-[#111]">
                            <div className="aspect-[2/3] w-full relative">
                              <img src={media.posterUrl} alt={media.title} className="w-full h-full object-cover" />
                              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-600">
                                <div className="h-full bg-red-600 w-2/3" />
                              </div>
                            </div>
                            <div className="p-2 flex flex-col justify-center">
                              <h4 className="font-semibold text-[11px] sm:text-xs text-white line-clamp-1">{media.title}</h4>
                            </div>
                          </Card>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Category Rows */}
                {Object.entries(groupedMedia).map(([category, items]) => (
                  <div key={category} className="mb-8">
                    <div className="flex items-center justify-between px-4 mb-3">
                      <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">{category}</h3>
                    </div>
                    <div className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar px-4 pb-4">
                      {items.map((media) => (
                        <div key={media.id} className="relative w-32 sm:w-40 flex-shrink-0 group cursor-pointer" onClick={() => handleVideoClick(media)}>
                          <Card className="hover-scale overflow-hidden border-white/5 bg-[#111] h-full">
                            <div className="aspect-[2/3] w-full relative">
                              <img src={media.posterUrl} alt={media.title} className="w-full h-full object-cover" />
                              <button 
                                onClick={(e) => handleCardFavoriteToggle(e, media)}
                                className="absolute top-1 right-1 bg-black/50 hover:bg-black/80 transition-colors p-1.5 rounded-full backdrop-blur-md z-10"
                              >
                                <Heart className={cn("w-3.5 h-3.5", media.isFavorite ? "text-red-500 fill-red-500" : "text-white")} />
                              </button>
                            </div>
                            <div className="p-2 flex flex-col justify-center">
                              <h4 className="font-semibold text-[11px] sm:text-xs text-white line-clamp-1">{media.title}</h4>
                              <div className="flex gap-0.5 mt-1">
                                {[1,2,3,4].map(star => (
                                  <svg key={star} className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-yellow-500 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                ))}
                                <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-600 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                              </div>
                            </div>
                          </Card>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            ) : (
               <div className="py-12 text-center text-gray-500 glass mx-4 rounded-xl border border-white/5">
                  No videos found.
               </div>
            )}
          </div>
        )}
      </div>
      
      {/* Account Info Card */}
      {!isWatching && (
        <div className="fixed bottom-20 left-4 sm:bottom-6 sm:left-6 z-40">
          {isAccountInfoVisible ? (
            <div className="glass px-4 py-3 sm:px-6 sm:py-4 rounded-xl border border-white/10 shadow-2xl backdrop-blur-xl flex items-center gap-3 sm:gap-4 hover-scale group relative">
              <button 
                onClick={() => setIsAccountInfoVisible(false)}
                className="absolute -top-3 -right-3 bg-red-600 hover:bg-red-500 text-white p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-pointer"
              >
                <EyeOff className="w-3.5 h-3.5" />
              </button>
              <div>
                <p className="text-[10px] sm:text-xs text-gray-400 font-medium tracking-wide uppercase">Device Details</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-200">Mac Address:</span>
                  <div className="flex items-center bg-black/30 px-1.5 py-0.5 rounded min-w-[120px] h-[24px]">
                    {isAuthLoaded ? <span className="text-xs font-mono font-bold text-white">{persistentMac}</span> : <Skeleton className="w-24 h-4 rounded" />}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setIsAccountInfoVisible(true)}
              className="glass p-3 rounded-full border border-white/10 shadow-2xl backdrop-blur-xl hover:bg-white/10 text-gray-400 hover:text-white"
            >
              <Monitor className="w-5 h-5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
