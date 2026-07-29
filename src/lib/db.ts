import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'src/data/db.json');

export interface MediaRecord {
  id: string;
  title: string;
  type: string;
  posterUrl: string;
  videoUrl: string;
  qualityBadge: string;
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

// Utility to safely read from the JSON file
export function readDB(): DatabaseSchema {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data) as DatabaseSchema;
  } catch (error) {
    console.error('Failed to read db.json:', error);
    // Return empty schema fallback
    return { media: [] };
  }
}

// Utility to safely write to the JSON file
export function writeDB(data: DatabaseSchema): void {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to write to db.json:', error);
  }
}
