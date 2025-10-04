export interface Album {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  year: number;
  trackCount?: number;
}

export interface RatedAlbum extends Album {
  rating?: number; // 0-5
  listenedDate: string; // ISO string
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  albumId: string;
  albumTitle: string;
  coverUrl: string; // The album cover
}

export interface RatedSong extends Song {
  rating?: number;
  listenedDate: string;
}

export type SearchResult = (Album & { type: 'album' }) | (Song & { type: 'song' });
export type LibraryItem = (RatedAlbum & { type: 'album' }) | (RatedSong & { type: 'song' });

export interface AlbumFilters {
  artist: string;
  yearFrom: string;
  yearTo: string;
  rating: number;
}

export interface SongFilters {
  artist: string;
  album: string;
  rating: number;
}
