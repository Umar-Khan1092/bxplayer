import React, { useState, useEffect } from 'react';
import { X, Server, Link as LinkIcon, ListVideo, Key, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import type { PlaylistRecord } from '@/lib/db';

interface IPTVModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function IPTVModal({ isOpen, onClose }: IPTVModalProps) {
  const { macAddress, isLoaded } = useAuth();
  const [playlists, setPlaylists] = useState<PlaylistRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && isLoaded && macAddress) {
      const fetchPlaylists = async () => {
        setIsLoading(true);
        try {
          const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
          const res = await fetch(`${baseUrl}/api/playlists?macAddress=${macAddress}`);
          if (res.ok) {
            const data = await res.json();
            setPlaylists(data);
          }
        } catch (error) {
          console.error("Failed to fetch playlists");
        } finally {
          setIsLoading(false);
        }
      };
      fetchPlaylists();
    }
  }, [isOpen, isLoaded, macAddress]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="glass max-w-2xl w-full rounded-2xl p-8 relative shadow-2xl animate-in zoom-in-95 duration-200 border border-white/10">
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-2">
          <Server className="w-6 h-6 text-red-500" />
          <h2 className="text-2xl font-bold text-white tracking-tight">Your IPTV Panel</h2>
        </div>
        <p className="text-gray-400 text-sm mb-6">Select a connected playlist to load your media sources.</p>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-red-500" />
          </div>
        ) : playlists.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {playlists.map((playlist) => (
              <div key={playlist.id} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-red-500/50 hover:bg-white/10 transition-all cursor-pointer group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {playlist.type === 'M3U' ? (
                       <LinkIcon className="w-4 h-4 text-purple-400" />
                    ) : (
                       <ListVideo className="w-4 h-4 text-green-400" />
                    )}
                    <h3 className="font-semibold text-white group-hover:text-red-400 transition-colors">{playlist.name}</h3>
                  </div>
                  {playlist.isLocked && (
                    <span title="PIN Protected">
                      <Key className="w-4 h-4 text-yellow-500" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 truncate mb-4">
                  {playlist.url || playlist.serverUrl}
                </p>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 bg-black/40 px-2 py-1 rounded">
                    {playlist.type}
                  </span>
                  <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="text-xs font-semibold text-white bg-red-600 hover:bg-red-700 px-4 py-1.5 rounded-lg transition-colors cursor-pointer">
                    Load
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-black/40 rounded-xl border border-white/5">
            <p className="text-gray-400 mb-4">No playlists connected to this device.</p>
            <a href="/playlist" className="inline-flex items-center justify-center text-sm font-semibold text-white bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg transition-colors cursor-pointer">
              Manage Playlists
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
