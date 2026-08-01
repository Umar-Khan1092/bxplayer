"use client";

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { TopHeader } from "@/components/layout/TopHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, ListVideo, Key, Link as LinkIcon, Trash2, Lock, Monitor, ArrowRight, Loader2, ShieldCheck, LogOut, LayoutDashboard, Database, Edit, Save, Search, PlayCircle, Settings, Users, ArrowLeft, ChevronRight } from "lucide-react";
import type { PlaylistRecord } from "@/lib/db";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export default function PlaylistPage() {
  const { macAddress: persistentMac, userId: persistentId, isLoaded: isAuthLoaded } = useAuth();

  // Dashboard Sidebar State
  const [sidebarTab, setSidebarTab] = useState<"MANAGE_PLAYLISTS" | "ACTIVATE_DEVICE" | "DEVICE_KEY" | "PARENT_PIN" | "SWITCH_MAC" | "ACCOUNT_DETAILS">("MANAGE_PLAYLISTS");
  
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [macInput, setMacInput] = useState("");
  const [userIdInput, setUserIdInput] = useState("");
  const [authError, setAuthError] = useState("");

  // Data State
  const [playlists, setPlaylists] = useState<PlaylistRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Manage Playlists View State
  const [activeFormTab, setActiveFormTab] = useState<"LIST" | "M3U" | "XTREAM" | "CODE">("LIST");
  const [searchQuery, setSearchQuery] = useState("");

  // Form State
  const [playlistName, setPlaylistName] = useState("");
  const [m3uUrl, setM3uUrl] = useState("");
  const [xtreamServer, setXtreamServer] = useState("");
  const [xtreamUser, setXtreamUser] = useState("");
  const [xtreamPass, setXtreamPass] = useState("");
  const [isProtected, setIsProtected] = useState(false);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [formError, setFormError] = useState("");
  const [xtreamEpg, setXtreamEpg] = useState("");
  const [playlistCode, setPlaylistCode] = useState("");

  // New Tab States
  const [deviceKeyInput, setDeviceKeyInput] = useState("");
  const [parentPinInput, setParentPinInput] = useState("");
  const [switchMacInput, setSwitchMacInput] = useState("");

  const fetchPlaylists = async () => {
    setIsLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${baseUrl}/api/playlists?macAddress=${persistentMac}`);
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

  useEffect(() => {
    if (isAuthenticated && persistentMac) {
      fetchPlaylists();
    }
  }, [isAuthenticated, persistentMac]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMac = macInput.trim().toUpperCase().replace(/\s/g, '');
    const cleanId = userIdInput.trim().replace(/\s/g, '');
    const cleanPersistentMac = persistentMac?.trim().toUpperCase().replace(/\s/g, '');
    const cleanPersistentId = persistentId?.trim().replace(/\s/g, '');
    if (cleanMac === cleanPersistentMac && cleanId === cleanPersistentId) {
      setIsAuthenticated(true);
      setAuthError("");
    } else {
      setAuthError("Invalid Mac Address or User ID");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setSidebarTab("MANAGE_PLAYLISTS");
    resetForm();
    setActiveFormTab("LIST");
  };

  const resetForm = () => {
    setPlaylistName("");
    setM3uUrl("");
    setXtreamServer("");
    setXtreamUser("");
    setXtreamPass("");
    setIsProtected(false);
    setPin("");
    setConfirmPin("");
    setFormError("");
    setEditingId(null);
    setXtreamEpg("");
    setPlaylistCode("");
  };

  const handleEdit = (playlist: PlaylistRecord) => {
    if (playlist.isLocked) {
      const enteredPin = prompt("Enter PIN to access this protected playlist:");
      if (enteredPin !== playlist.pin) {
        alert("Warning: Entered PIN is incorrect.");
        return;
      }
    }

    resetForm();
    setEditingId(playlist.id);
    setActiveFormTab(playlist.type as "M3U" | "XTREAM" | "CODE");
    setPlaylistName(playlist.name);
    
    if (playlist.type === 'M3U') {
      setM3uUrl(playlist.url || "");
    } else if (playlist.type === 'XTREAM') {
      setXtreamServer(playlist.serverUrl || "");
      setXtreamUser(playlist.username || "");
      setXtreamPass(playlist.password || "");
      setXtreamEpg(playlist.epgUrl || "");
    } else {
      setPlaylistCode(playlist.code || "");
    }
    
    if (playlist.isLocked) {
      setIsProtected(true);
      setPin(playlist.pin || "");
      setConfirmPin(playlist.pin || "");
    }
    
    setSidebarTab("MANAGE_PLAYLISTS");
  };

  const handleDelete = async (id: string) => {
    const playlist = playlists.find(p => p.id === id);
    if (playlist?.isLocked) {
      const enteredPin = prompt("Enter PIN to delete this protected playlist:");
      if (enteredPin !== playlist.pin) {
        alert("Warning: Entered PIN is incorrect.");
        return;
      }
    }

    if (!confirm("Are you sure you want to delete this playlist?")) return;
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${baseUrl}/api/playlists?id=${id}&macAddress=${persistentMac}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setPlaylists(playlists.filter(p => p.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete playlist");
    }
  };

  const handleSavePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    
    if (isProtected) {
      if (!pin) {
        setFormError("PIN cannot be empty.");
        return;
      }
      if (pin !== confirmPin) {
        setFormError("PIN and Confirm PIN do not match.");
        return;
      }
    }
    
    setIsSubmitting(true);
    
    let playlistData: Partial<PlaylistRecord> = {
      name: playlistName,
      macAddress: persistentMac,
      type: activeFormTab === "M3U" ? "M3U" : activeFormTab === "XTREAM" ? "XTREAM" : "CODE",
      isLocked: isProtected,
      pin: isProtected ? pin : undefined
    };

    if (activeFormTab === 'M3U') {
      playlistData.url = m3uUrl;
    } else if (activeFormTab === 'XTREAM') {
      playlistData.serverUrl = xtreamServer;
      playlistData.username = xtreamUser;
      playlistData.password = xtreamPass;
      playlistData.epgUrl = xtreamEpg;
    } else {
      playlistData.code = playlistCode;
    }

    try {
      const method = editingId ? 'PUT' : 'POST';
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const url = `${baseUrl}/api/playlists`;
      const body = editingId ? { ...playlistData, id: editingId } : playlistData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (res.ok) {
        const savedPlaylist = await res.json();
        if (editingId) {
          setPlaylists(playlists.map(p => p.id === editingId ? savedPlaylist : p));
        } else {
          setPlaylists([...playlists, savedPlaylist]);
        }
        resetForm();
        setActiveFormTab("LIST");
      }
    } catch (error) {
      console.error("Failed to save playlist");
      setFormError("An error occurred while saving the playlist.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeviceKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (deviceKeyInput) {
      alert(`Device Key reset to: ${deviceKeyInput}`);
      setDeviceKeyInput("");
    }
  };

  const handleParentPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parentPinInput) {
      alert(`Parent Pin saved: ${parentPinInput}`);
      setParentPinInput("");
    }
  };

  const handleSwitchMacSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (switchMacInput) {
      alert(`Activation and playlists transferred to: ${switchMacInput}`);
      setSwitchMacInput("");
    }
  };

  if (!isAuthLoaded) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[80vh]">
           <Loader2 className="w-8 h-8 animate-spin text-green-500" />
        </div>
      </MainLayout>
    );
  }

  // --- LOGIN VIEW ---
  if (!isAuthenticated) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[80vh] animate-in fade-in zoom-in duration-500">
          <Card className="w-full max-w-md bg-white border-gray-200 shadow-2xl rounded-xl overflow-hidden">
            <CardHeader className="text-center pb-2 bg-gray-50 border-b border-gray-100">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 text-green-600">
                <Lock className="w-8 h-8" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900 tracking-tight">Admin Access</CardTitle>
              <p className="text-sm text-gray-500 mt-2">Enter your device credentials to manage playlists.</p>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Mac Address</label>
                  <div className="relative">
                    <Monitor className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input 
                      value={macInput}
                      onChange={(e) => setMacInput(e.target.value)}
                      placeholder="Enter MAC Address" 
                      className="pl-9 bg-gray-50 border-gray-200 focus:border-green-500 focus:ring-green-500 text-gray-900"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">User ID</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input 
                      value={userIdInput}
                      onChange={(e) => setUserIdInput(e.target.value)}
                      placeholder="Enter User ID" 
                      className="pl-9 bg-gray-50 border-gray-200 focus:border-green-500 focus:ring-green-500 text-gray-900"
                      required
                    />
                  </div>
                </div>
                {authError && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm text-center font-medium">
                    {authError}
                  </div>
                )}
                <Button type="submit" className="w-full bg-[#0F763F] hover:bg-[#0c6133] text-white mt-4 h-11 cursor-pointer font-bold tracking-wide">
                  Authenticate <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  const filteredPlaylists = playlists.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.type.toLowerCase().includes(searchQuery.toLowerCase()));

  // --- DASHBOARD VIEW ---
  return (
    <div className="h-screen bg-[#050505] overflow-hidden">
      <TopHeader />
      <div className="flex h-full pt-20 animate-in fade-in duration-500">
        
        {/* Sidebar */}
        <aside className="w-64 bg-[#0a0a0a] border-r border-white/5 flex flex-col pt-4 shadow-2xl relative z-10 overflow-y-auto">
          <div className="flex flex-col gap-1 px-4 flex-grow">
            <SidebarTab 
              icon={<LayoutDashboard className="w-4 h-4" />} 
              label="Manage Playlists" 
              isActive={sidebarTab === "MANAGE_PLAYLISTS"} 
              onClick={() => { setSidebarTab("MANAGE_PLAYLISTS"); setActiveFormTab("LIST"); }} 
            />
            
            <div className="my-2 border-b border-gray-100" />
            
            <SidebarTab 
              icon={<PlayCircle className="w-4 h-4" />} 
              label="Activate Device" 
              isActive={sidebarTab === "ACTIVATE_DEVICE"} 
              onClick={() => setSidebarTab("ACTIVATE_DEVICE")} 
            />
            <SidebarTab 
              icon={<Key className="w-4 h-4" />} 
              label="Device Key" 
              isActive={sidebarTab === "DEVICE_KEY"} 
              onClick={() => setSidebarTab("DEVICE_KEY")} 
            />
            <SidebarTab 
              icon={<Users className="w-4 h-4" />} 
              label="Parent PIN" 
              isActive={sidebarTab === "PARENT_PIN"} 
              onClick={() => setSidebarTab("PARENT_PIN")} 
            />
            <SidebarTab 
              icon={<Settings className="w-4 h-4" />} 
              label="Switch Mac" 
              isActive={sidebarTab === "SWITCH_MAC"} 
              onClick={() => setSidebarTab("SWITCH_MAC")} 
            />
            
            <div className="my-2 border-b border-gray-100" />
            
            <SidebarTab 
              icon={<Monitor className="w-4 h-4" />} 
              label="Account Details" 
              isActive={sidebarTab === "ACCOUNT_DETAILS"} 
              onClick={() => setSidebarTab("ACCOUNT_DETAILS")} 
            />
          </div>

          <div className="p-4 mt-auto border-t border-white/5 bg-[#050505]/50">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 w-full rounded-lg transition-colors cursor-pointer text-sm font-semibold text-gray-500 hover:bg-red-900/20 hover:text-red-500"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-8 sm:p-12 overflow-y-auto">
          
          {sidebarTab === "MANAGE_PLAYLISTS" && (
            <div className="max-w-6xl mx-auto animate-in fade-in duration-300">
              
              {activeFormTab === "LIST" ? (
                <>
                  {/* Top Action Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-10 bg-[#111111] p-4 rounded-lg shadow-xl border border-white/5">
                    
                    {/* Search & MAC */}
                    <div className="flex items-center gap-4 flex-1 min-w-[300px]">
                      <div className="relative flex-1 max-w-[280px]">
                        <Input 
                          placeholder="Search" 
                          value={searchQuery}
                          className="w-full bg-[#050505] border border-white/10 rounded-md h-12 pl-12 text-white focus:border-[#0F763F] focus:ring-1 focus:ring-[#0F763F] outline-none transition-all placeholder-gray-500"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      </div>
                      <div className="bg-[#050505] border border-white/10 text-[#0F763F] px-6 h-12 flex items-center justify-center rounded-md font-mono text-sm tracking-[0.2em] font-bold min-w-[180px]">
                        {persistentMac}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 overflow-x-auto pb-1 sm:pb-0">
                      <button onClick={() => { setActiveFormTab("M3U"); resetForm(); }} className="bg-[#0F763F] hover:bg-[#0c6133] text-white px-6 h-12 flex items-center justify-center rounded-md text-sm font-bold tracking-wide transition-colors whitespace-nowrap shadow-sm cursor-pointer">
                        Add Playlist
                      </button>
                      <button onClick={() => { setActiveFormTab("XTREAM"); resetForm(); }} className="bg-[#0F763F] hover:bg-[#0c6133] text-white px-6 h-12 flex items-center justify-center rounded-md text-sm font-bold tracking-wide transition-colors whitespace-nowrap shadow-sm cursor-pointer">
                        Add XC Playlist
                      </button>
                      <button onClick={() => { setActiveFormTab("CODE"); resetForm(); }} className="bg-[#0F763F] hover:bg-[#0c6133] text-white px-6 h-12 flex items-center justify-center rounded-md text-sm font-bold tracking-wide transition-colors whitespace-nowrap shadow-sm cursor-pointer">
                        Add Code Playlist
                      </button>
                    </div>
                  </div>

                  {/* Playlists List */}
                  {isLoading ? (
                    <div className="flex justify-center py-20">
                      <Loader2 className="w-8 h-8 animate-spin text-[#0F763F]" />
                    </div>
                  ) : filteredPlaylists.length > 0 ? (
                    <div className="bg-[#111111] rounded-lg shadow-xl border border-white/5 overflow-hidden">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[#050505] border-b border-white/5">
                            <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">URL / Server</th>
                            <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Protected</th>
                            <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {filteredPlaylists.map((playlist) => (
                            <tr key={playlist.id} className="hover:bg-white/5 transition-colors group">
                              <td className="px-6 py-5">
                                <span className="font-semibold text-gray-100">{playlist.name}</span>
                              </td>
                              <td className="px-6 py-5">
                                <span className={cn(
                                  "text-[10px] uppercase font-bold tracking-wider px-3 py-1.5 rounded-lg border",
                                  playlist.type === 'M3U' ? "bg-purple-900/20 text-purple-400 border-purple-500/20" : "bg-[#0F763F]/20 text-[#0F763F] border-[#0F763F]/20"
                                )}>
                                  {playlist.type}
                                </span>
                              </td>
                              <td className="px-6 py-5">
                                <span className="text-sm text-gray-400 truncate max-w-[250px] block" title={playlist.url || playlist.serverUrl}>
                                  {playlist.url || playlist.serverUrl}
                                </span>
                              </td>
                              <td className="px-6 py-5 text-center">
                                {playlist.isLocked ? (
                                  <span title="PIN Protected" className="block mx-auto w-max">
                                    <Key className="w-4 h-4 text-yellow-500" />
                                  </span>
                                ) : (
                                  <span className="text-gray-600">-</span>
                                )}
                              </td>
                              <td className="px-6 py-5 text-right">
                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button 
                                    onClick={() => handleEdit(playlist)}
                                    className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors cursor-pointer"
                                    title="Edit Playlist"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => handleDelete(playlist.id)}
                                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                                    title="Delete Playlist"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-32 text-center bg-[#111111] rounded-lg border border-white/5 shadow-xl">
                       <p className="text-2xl font-bold text-gray-100 mb-3">No Playlists to show</p>
                       <p className="text-gray-500 text-sm max-w-sm">Add a new M3U or Xtream Codes playlist using the buttons above.</p>
                    </div>
                  )}
                </>
              ) : activeFormTab === "M3U" || activeFormTab === "XTREAM" || activeFormTab === "CODE" ? (
                <div className="bg-[#111111] rounded-lg shadow-xl border border-white/5 overflow-hidden max-w-5xl animate-in slide-in-from-bottom-4 duration-300">
                  <div className="p-8 sm:p-12 relative group">
                    {/* Breadcrumb Header */}
                    <div className="flex items-center gap-4 bg-[#050505] p-4 rounded-md border border-white/5 mb-10 shadow-lg relative z-10">
                      <button onClick={() => setActiveFormTab("LIST")} className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer">
                        <ArrowLeft className="w-5 h-5 text-gray-300" />
                      </button>
                      <div className="flex items-center gap-3 text-sm font-semibold flex-wrap">
                        <div className="flex flex-col">
                          <span className="text-gray-100">Device</span>
                          <span className="text-gray-500 font-mono text-xs tracking-wider">{persistentMac}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-600" />
                        <button onClick={() => setActiveFormTab("LIST")} className="text-gray-400 hover:text-white transition-colors cursor-pointer">
                          Manage Playlist
                        </button>
                        <ChevronRight className="w-4 h-4 text-gray-600" />
                        <span className="text-[#0F763F]">
                          {activeFormTab === "M3U" ? "Add Playlist" : activeFormTab === "XTREAM" ? "Add XC Playlist" : "Add Code Playlist"}
                        </span>
                      </div>
                    </div>

                    <form onSubmit={handleSavePlaylist} className="space-y-8 relative z-10">
                      
                      {/* Horizontally aligned fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <label className="block text-gray-400 text-sm font-bold tracking-wider mb-3">Playlist Name</label>
                          <input 
                            placeholder="e.g., Family Movies" 
                            className="w-full bg-[#050505] border border-white/10 rounded-md h-14 px-5 text-white focus:border-[#0F763F] focus:ring-1 focus:ring-[#0F763F] outline-none transition-all font-medium placeholder-gray-600" 
                            value={playlistName}
                            onChange={e => setPlaylistName(e.target.value)}
                            required
                          />
                        </div>

                        {activeFormTab === "M3U" && (
                          <div>
                            <label className="block text-gray-400 text-sm font-bold tracking-wider mb-3">M3U URL</label>
                            <input 
                              placeholder="http://example.com/playlist.m3u" 
                              type="url" 
                              className="w-full bg-[#050505] border border-white/10 rounded-md h-14 px-5 text-white focus:border-[#0F763F] focus:ring-1 focus:ring-[#0F763F] outline-none transition-all font-medium placeholder-gray-600" 
                              value={m3uUrl}
                              onChange={e => setM3uUrl(e.target.value)}
                              required
                            />
                          </div>
                        )}

                        {activeFormTab === "CODE" && (
                          <div>
                            <label className="block text-gray-400 text-sm font-bold tracking-wider mb-3">Playlist Code</label>
                            <input 
                              placeholder="Enter Code" 
                              className="w-full bg-[#050505] border border-white/10 rounded-md h-14 px-5 text-white focus:border-[#0F763F] focus:ring-1 focus:ring-[#0F763F] outline-none transition-all font-medium placeholder-gray-600" 
                              value={playlistCode}
                              onChange={e => setPlaylistCode(e.target.value)}
                              required
                            />
                          </div>
                        )}

                        {activeFormTab === "XTREAM" && (
                          <>
                            <div>
                              <label className="block text-gray-400 text-sm font-bold tracking-wider mb-3">User Name</label>
                              <input 
                                placeholder="Username" 
                                className="w-full bg-[#050505] border border-white/10 rounded-md h-14 px-5 text-white focus:border-[#0F763F] focus:ring-1 focus:ring-[#0F763F] outline-none transition-all font-medium placeholder-gray-600" 
                                value={xtreamUser}
                                onChange={e => setXtreamUser(e.target.value)}
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-gray-400 text-sm font-bold tracking-wider mb-3">Password</label>
                              <input 
                                placeholder="Password" 
                                type="password" 
                                className="w-full bg-[#050505] border border-white/10 rounded-md h-14 px-5 text-white focus:border-[#0F763F] focus:ring-1 focus:ring-[#0F763F] outline-none transition-all font-medium placeholder-gray-600" 
                                value={xtreamPass}
                                onChange={e => setXtreamPass(e.target.value)}
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-gray-400 text-sm font-bold tracking-wider mb-3">Host</label>
                              <input 
                                placeholder="http://example.com:8080" 
                                type="url" 
                                className="w-full bg-[#050505] border border-white/10 rounded-md h-14 px-5 text-white focus:border-[#0F763F] focus:ring-1 focus:ring-[#0F763F] outline-none transition-all font-medium placeholder-gray-600"
                                value={xtreamServer}
                                onChange={e => setXtreamServer(e.target.value)}
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-gray-400 text-sm font-bold tracking-wider mb-3">XMLTV EPG URL (Optional)</label>
                              <input 
                                placeholder="http://example.com/epg.xml" 
                                type="url" 
                                className="w-full bg-[#050505] border border-white/10 rounded-md h-14 px-5 text-white focus:border-[#0F763F] focus:ring-1 focus:ring-[#0F763F] outline-none transition-all font-medium placeholder-gray-600"
                                value={xtreamEpg}
                                onChange={e => setXtreamEpg(e.target.value)}
                              />
                            </div>
                          </>
                        )}
                      </div>

                      <div className="border-t border-white/10 pt-8 mt-4">
                        <label className="flex items-center space-x-4 cursor-pointer group w-fit">
                          <div className={cn(
                            "w-6 h-6 rounded-md border flex items-center justify-center transition-colors",
                            isProtected ? "bg-[#0F763F] border-[#0F763F]" : "bg-[#050505] border-gray-600 group-hover:border-[#0F763F]"
                          )}>
                            {isProtected && <Lock className="w-3.5 h-3.5 text-white" />}
                          </div>
                          <input 
                            type="checkbox" 
                            className="hidden" 
                            checked={isProtected}
                            onChange={(e) => setIsProtected(e.target.checked)}
                          />
                          <span className="text-sm font-bold text-gray-300 tracking-wider">Protect playlist with PIN</span>
                        </label>
                        
                        {isProtected && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-8 animate-in slide-in-from-top-4 duration-300">
                             <div className="space-y-1.5">
                                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">PIN</label>
                                  <input 
                                  placeholder="Enter PIN" 
                                  type="password" 
                                  className="w-full bg-[#050505] border border-white/10 rounded-md h-14 px-5 text-white focus:border-[#0F763F] focus:ring-1 focus:ring-[#0F763F] outline-none transition-all font-medium placeholder-gray-600 text-left" 
                                  value={pin}
                                  onChange={e => setPin(e.target.value)}
                                  required
                                />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Confirm PIN</label>
                                  <input 
                                  placeholder="Confirm PIN" 
                                  type="password" 
                                  className="w-full bg-[#050505] border border-white/10 rounded-md h-14 px-5 text-white focus:border-[#0F763F] focus:ring-1 focus:ring-[#0F763F] outline-none transition-all font-medium placeholder-gray-600 text-left" 
                                  value={confirmPin}
                                  onChange={e => setConfirmPin(e.target.value)}
                                  required
                                />
                                </div>
                          </div>
                        )}
                      </div>

                      {formError && (
                        <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-xl text-red-400 text-sm font-bold flex items-center gap-3">
                          <ShieldCheck className="w-5 h-5" /> {formError}
                        </div>
                      )}

                      <div className="flex justify-end pt-6">
                        <button disabled={isSubmitting} type="submit" className="bg-[#0F763F] hover:bg-[#0c6133] text-white px-12 h-14 rounded-md font-bold tracking-widest cursor-pointer transition-transform hover:scale-105 active:scale-95 shadow-lg flex items-center">
                          {isSubmitting ? <Loader2 className="w-5 h-5 mr-3 animate-spin"/> : <Save className="w-5 h-5 mr-3"/>} {editingId ? "UPDATE" : "SAVE"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {sidebarTab === "ACTIVATE_DEVICE" && (
            <div className="max-w-4xl animate-in slide-in-from-bottom-4 duration-300">
              <div className="bg-[#111111] rounded-lg shadow-xl border border-white/5 overflow-hidden p-8 sm:p-12 relative group">
                 {/* Ambient Background Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-full bg-[#0F763F]/5 blur-[100px] rounded-full pointer-events-none group-hover:bg-[#0F763F]/10 transition-all duration-1000"></div>
    
                <div className="relative z-10">
                    <h3 className="text-2xl font-bold text-gray-100 mb-8">Activate on Our Store:</h3>
                    
                    <div className="w-72 h-44 bg-black/50 rounded-lg mb-14 flex items-center justify-center shadow-2xl border border-white/10 relative overflow-hidden group/card cursor-pointer transition-transform hover:scale-105 backdrop-blur-sm">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#0F763F]/20 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity"></div>
                      <div className="relative z-10 flex items-center justify-center">
                        <div className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-green-500 to-green-300 mr-3 drop-shadow-lg">
                          BX
                        </div>
                        <span className="font-bold text-gray-200 tracking-wider text-2xl mt-1 drop-shadow-md">STORE</span>
                      </div>
                    </div>
    
                    <h3 className="text-xl font-bold text-gray-400 mb-8">Or Use Other Payment Methods:</h3>
    
                    <p className="text-sm text-gray-400 leading-relaxed mb-12 max-w-3xl">
                      <span className="text-[#0F763F] font-bold text-base">NOTE:</span> BX Player does not provide contents and it is pure media player. To use BX Player, you have to upload your own playlist. If you have not playlist, then you can't use BX Player anymore so in this case do not pay. Also we are not allowing activation for the users that don't have a playlist.
                    </p>
    
                    <button disabled className="bg-[#0F763F] text-white font-bold text-sm px-14 py-4 rounded-md tracking-widest transition-all shadow-lg opacity-50 cursor-not-allowed">
                      PAY
                    </button>
                </div>
              </div>
            </div>
          )}

          {sidebarTab === "DEVICE_KEY" && (
            <div className="max-w-4xl animate-in slide-in-from-bottom-4 duration-300">
              <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden">
                <form onSubmit={handleDeviceKeySubmit} className="p-6 sm:p-10">
                  <h2 className="text-[22px] font-bold text-gray-900 mb-10">Reset Device Key</h2>
                  
                  <div className="max-w-xl">
                    <div className="mb-8">
                      <label className="block text-[#9CA3AF] text-sm font-semibold mb-2">
                        New device key <span className="text-[#0F763F]">(Max length: 6)</span>
                      </label>
                      <input 
                        type="text" 
                        maxLength={6}
                        value={deviceKeyInput}
                        onChange={(e) => setDeviceKeyInput(e.target.value)}
                        required
                        className="w-full bg-[#F3F4F6] border-none rounded-md h-12 px-4 text-gray-900 focus:ring-2 focus:ring-[#0F763F] outline-none transition-shadow"
                      />
                    </div>
                    
                    <p className="text-sm text-[#9CA3AF] mb-12">
                      <span className="text-[#0F763F] font-bold">NOTE:</span> If you forget your device key, but you can still see your device key at your device.
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <button type="submit" className="bg-[#0F763F] hover:bg-[#0c6133] text-white font-bold text-sm px-10 py-3.5 rounded-md tracking-wider transition-colors cursor-pointer shadow-sm">
                      SAVE
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {sidebarTab === "PARENT_PIN" && (
            <div className="max-w-4xl animate-in slide-in-from-bottom-4 duration-300">
              <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden">
                <form onSubmit={handleParentPinSubmit} className="p-6 sm:p-10">
                  <h2 className="text-[22px] font-bold text-gray-900 mb-10">Parent Pin</h2>
                  
                  <div className="max-w-xl">
                    <div className="mb-8">
                      <label className="block text-[#9CA3AF] text-sm font-semibold mb-2">
                        Parent Pin <span className="text-[#0F763F]">(Max length: 4)</span>
                      </label>
                      <input 
                        type="password" 
                        maxLength={4}
                        value={parentPinInput}
                        onChange={(e) => setParentPinInput(e.target.value)}
                        required
                        className="w-full bg-[#F3F4F6] border-none rounded-md h-12 px-4 text-gray-900 focus:ring-2 focus:ring-[#0F763F] outline-none transition-shadow"
                      />
                    </div>
                    
                    <p className="text-sm text-[#9CA3AF] mb-12 leading-relaxed">
                      <span className="text-[#0F763F] font-bold">NOTE:</span> Use this 4-digit PIN to restrict access to adult content or specific categories. Keep it safe.
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <button type="submit" className="bg-[#0F763F] hover:bg-[#0c6133] text-white font-bold text-sm px-10 py-3.5 rounded-md tracking-wider transition-colors cursor-pointer shadow-sm">
                      SAVE
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {sidebarTab === "SWITCH_MAC" && (
            <div className="max-w-4xl animate-in slide-in-from-bottom-4 duration-300">
              <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden">
                <form onSubmit={handleSwitchMacSubmit} className="p-6 sm:p-10">
                  <h2 className="text-[22px] font-bold text-gray-900 mb-10">Transfer your activation and playlists to another device MAC Address</h2>
                  
                  <div className="max-w-xl">
                    <div className="mb-8">
                      <label className="block text-[#9CA3AF] text-sm font-semibold mb-2">
                        New MAC Address <span className="text-[#0F763F]">(Max length: 17)</span>
                      </label>
                      <input 
                        type="text" 
                        maxLength={17}
                        value={switchMacInput}
                        onChange={(e) => setSwitchMacInput(e.target.value)}
                        required
                        className="w-full bg-[#F3F4F6] border-none rounded-md h-12 px-4 text-gray-900 focus:ring-2 focus:ring-[#0F763F] outline-none transition-shadow uppercase font-mono tracking-wider"
                      />
                    </div>
                    
                    <p className="text-sm text-[#9CA3AF] leading-relaxed mb-12">
                      <span className="text-[#0F763F] font-bold">NOTE:</span> Your device login information, playlists, and activation period shall be transferred to this new device MAC address. Your old MAC address device will no longer be attached to this account.
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <button type="submit" className="bg-[#0F763F] hover:bg-[#0c6133] text-white font-bold text-sm px-10 py-3.5 rounded-md tracking-wider transition-colors cursor-pointer shadow-sm">
                      SAVE
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {sidebarTab === "ACCOUNT_DETAILS" && (
            <div className="max-w-4xl animate-in slide-in-from-bottom-4 duration-300">
              <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden p-6 sm:p-10">
                <h2 className="text-[22px] font-bold text-gray-900 mb-8">Account Details</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">MAC Address</h4>
                      <p className="text-lg font-mono font-bold text-gray-900 bg-gray-50 border border-gray-100 px-4 py-2 rounded-md inline-block">
                        {persistentMac}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Device Key</h4>
                      <p className="text-lg font-mono font-bold text-gray-900 bg-gray-50 border border-gray-100 px-4 py-2 rounded-md inline-block">
                        {persistentId}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Subscription</h4>
                      <span className="inline-block bg-yellow-100 text-yellow-800 border border-yellow-200 px-4 py-2 rounded-md font-bold text-sm tracking-widest uppercase">
                        Trial Active
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Expires On</h4>
                      <p className="text-gray-900 font-semibold bg-gray-50 border border-gray-100 px-4 py-2 rounded-md inline-block">
                        {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

// Helper Component for Sidebar Tabs
function SidebarTab({ icon, label, isActive, onClick }: { icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 px-5 py-3.5 rounded-lg transition-all cursor-pointer text-[15px] font-semibold w-full",
        isActive 
          ? "bg-[#0F763F] text-white shadow-md shadow-[#0F763F]/20 scale-[1.02]" 
          : "text-gray-400 hover:bg-white/5 hover:text-white"
      )}
    >
      <div className={cn("opacity-80", isActive ? "text-white" : "text-gray-500")}>
        {icon}
      </div>
      {label}
    </button>
  );
}
