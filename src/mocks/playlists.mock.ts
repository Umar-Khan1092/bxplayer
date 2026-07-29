export type PlaylistType = 'M3U' | 'XC' | 'CODE';

export interface Playlist {
  id: string;
  name: string;
  type: PlaylistType;
  isProtected: boolean;
  pin?: string;
  dateAdded: string;
  status: 'Active' | 'Error' | 'Disabled';
  
  // Type specific details
  url?: string; // For M3U
  host?: string; // For XC
  username?: string; // For XC
  password?: string; // For XC
  code?: string; // For CODE
  epgUrl?: string; // Optional
}

export const mockPlaylists: Playlist[] = [
  {
    id: 'PL-1',
    name: 'Family Panel (Main)',
    type: 'XC',
    isProtected: false,
    dateAdded: '2026-07-20T10:00:00Z',
    status: 'Active',
    host: 'http://example-xtream.com:8080',
    username: 'umar123',
    password: 'password123'
  },
  {
    id: 'PL-2',
    name: 'Sports & Premium',
    type: 'M3U',
    isProtected: true,
    pin: '1234',
    dateAdded: '2026-07-25T14:30:00Z',
    status: 'Active',
    url: 'http://example.com/playlist.m3u'
  },
  {
    id: 'PL-3',
    name: 'Old Provider (Expired)',
    type: 'CODE',
    isProtected: false,
    dateAdded: '2025-12-01T09:00:00Z',
    status: 'Disabled',
    code: 'BX-99420'
  }
];
