import { createClient } from '@vercel/kv';
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

/**
 * Resolve the KV REST API URL and TOKEN from env vars.
 * Vercel may have stored them under a custom prefix (e.g. BXPLAYER_URL_)
 * depending on what was typed into "Custom Environment Variable Prefix" when
 * the database was connected. We check every known variant so the code works
 * regardless of which prefix Vercel chose.
 */
function getKVCredentials(): { url: string; token: string } | null {
  const url =
    process.env.KV_REST_API_URL ||
    process.env.BXPLAYER_URL_KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL;

  const token =
    process.env.KV_REST_API_TOKEN ||
    process.env.BXPLAYER_URL_KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return null;
  return { url, token };
}

// Lazily created KV client (one per cold-start)
let _kv: ReturnType<typeof createClient> | null = null;

function getKV(): ReturnType<typeof createClient> | null {
  if (_kv) return _kv;
  const creds = getKVCredentials();
  if (!creds) return null;
  _kv = createClient({ url: creds.url, token: creds.token });
  return _kv;
}

// ─── Local JSON fallback (dev only) ────────────────────────────────────────

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

// ─── Playlist operations ────────────────────────────────────────────────────

export async function getPlaylists(macAddress?: string): Promise<PlaylistRecord[]> {
  const kv = getKV();

  if (!kv) {
    // Local dev fallback
    const db = readLocalDB();
    const all = db.playlists || [];
    return macAddress ? all.filter((p) => p.macAddress === macAddress) : all;
  }

  try {
    const all = (await kv.get<PlaylistRecord[]>(PLAYLISTS_KEY)) || [];
    return macAddress ? all.filter((p) => p.macAddress === macAddress) : all;
  } catch (error) {
    console.error('KV getPlaylists error:', error);
    return [];
  }
}

export async function savePlaylists(playlists: PlaylistRecord[]): Promise<void> {
  const kv = getKV();

  if (!kv) {
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

// ─── Media operations ────────────────────────────────────────────────────────

export async function getMedia(): Promise<MediaRecord[]> {
  const kv = getKV();

  if (!kv) {
    return readLocalDB().media;
  }

  try {
    const kvMedia = await kv.get<MediaRecord[]>(MEDIA_KEY);
    if (kvMedia) return kvMedia;
    // Seed KV from local static file on first cold-start
    const local = readLocalDB().media;
    if (local.length > 0) await kv.set(MEDIA_KEY, local);
    return local;
  } catch {
    return readLocalDB().media;
  }
}

export async function saveMedia(media: MediaRecord[]): Promise<void> {
  const kv = getKV();

  if (!kv) {
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
