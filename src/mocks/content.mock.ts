export interface MediaItem {
  id: string;
  title: string;
  type: 'LIVE' | 'MOVIE' | 'SERIES';
  posterUrl: string;
  qualityBadge: 'HD' | 'FHD' | '4K';
  duration?: string; // e.g. "1h 45m"
  rating?: string; // e.g. "PG-13", "8.5"
  category: string;
  isFavorite: boolean;
  resumePosition?: number; // percentage 0-100
}

export const mockLiveTV: MediaItem[] = [
  { id: 'L-1', title: 'Sky Sports Main Event', type: 'LIVE', posterUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=400&q=80', qualityBadge: 'FHD', category: 'Sports', isFavorite: true },
  { id: 'L-2', title: 'BBC News HD', type: 'LIVE', posterUrl: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=400&q=80', qualityBadge: 'HD', category: 'News', isFavorite: false },
  { id: 'L-3', title: 'National Geographic', type: 'LIVE', posterUrl: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d1b5?w=400&q=80', qualityBadge: '4K', category: 'Documentary', isFavorite: false },
];

export const mockMovies: MediaItem[] = [
  { id: 'M-1', title: 'Dune: Part Two', type: 'MOVIE', posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&q=80', qualityBadge: '4K', duration: '2h 46m', rating: '8.8', category: 'Sci-Fi', isFavorite: true, resumePosition: 35 },
  { id: 'M-2', title: 'Oppenheimer', type: 'MOVIE', posterUrl: 'https://images.unsplash.com/photo-1440407876336-5433604f3319?w=400&q=80', qualityBadge: '4K', duration: '3h 0m', rating: '8.4', category: 'Biography', isFavorite: false },
];

export const mockContinueWatching: MediaItem[] = [
  mockMovies[0]
];
