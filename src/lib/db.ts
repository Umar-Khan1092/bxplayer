import { kv } from '@vercel/kv';
import fs from 'fs';
import path from 'path';

export interface MediaRecord {
  id: string;
  title: string;
  type: string;
  posterUrl: string;
  videoUrl: string;
  qualityBadge?: string;
  duration?: string;
  category: string;
  isFavorite: boolean;
}

export interface PlaylistRecord {
  id: string;
  macAddress: string;
  name: string;
  type: 'M3U' | 'XTREAM' | 'CODE';
  url?: string;
  serverUrl?: string;
  username?: string;
  password?: string;
  epgUrl?: string;
  code?: string;
  itemsCount: number;
  isLocked: boolean;
  pin?: string;
}

export interface DatabaseSchema {
  media: MediaRecord[];
  playlists: PlaylistRecord[];
}

const DB_PATH = path.join(process.cwd(), 'src/data/db.json');
const PLAYLISTS_KEY = 'bxplayer:playlists';
const MEDIA_KEY = 'bxplayer:media';

// Check if KV is configured
const isKVConfigured = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

// Read local JSON file as fallback
function readLocalDB(): DatabaseSchema {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data) as DatabaseSchema;
  } catch {
    return { media: [], playlists: [] };
  }
}

function writeLocalDB(data: DatabaseSchema): void {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to write local db.json:', error);
  }
}

// --- Playlist operations (KV-backed) ---

export async function getPlaylists(macAddress?: string): Promise<PlaylistRecord[]> {
  if (!isKVConfigured) {
    const db = readLocalDB();
    return macAddress ? db.playlists.filter(p => p.macAddress === macAddress) : db.playlists;
  }
  try {
    const all = (await kv.get<PlaylistRecord[]>(PLAYLISTS_KEY)) || [];
    return macAddress ? all.filter(p => p.macAddress === macAddress) : all;
  } catch (error) {
    console.error('KV getPlaylists error:', error);
    return [];
  }
}

export async function savePlaylists(playlists: PlaylistRecord[]): Promise<void> {
  if (!isKVConfigured) {
    const db = readLocalDB();
    db.playlists = playlists;
    writeLocalDB(db);
    return;
  }
  try {
    await kv.set(PLAYLISTS_KEY, playlists);
  } catch (error) {
    console.error('KV savePlaylists error:', error);
  }
}

// --- Media operations (still file-backed — media is static content) ---

export async function getMedia(): Promise<MediaRecord[]> {
  if (!isKVConfigured) {
    return readLocalDB().media;
  }
  try {
    const kvMedia = await kv.get<MediaRecord[]>(MEDIA_KEY);
    if (kvMedia) return kvMedia;
    // Seed KV from local file on first run
    const local = readLocalDB().media;
    await kv.set(MEDIA_KEY, local);
    return local;
  } catch {
    return readLocalDB().media;
  }
}

export async function saveMedia(media: MediaRecord[]): Promise<void> {
  if (!isKVConfigured) {
    const db = readLocalDB();
    db.media = media;
    writeLocalDB(db);
    return;
  }
  try {
    await kv.set(MEDIA_KEY, media);
  } catch (error) {
    console.error('KV saveMedia error:', error);
  }
}
