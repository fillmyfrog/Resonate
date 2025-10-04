import type { Album, Song, SearchResult } from '../types';

const API_URL = 'https://api.deezer.com/';

const jsonpRequest = (url: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    const callbackName = `deezerCallback_${new Date().getTime()}_${Math.floor(Math.random() * 1000)}`;
    const script = document.createElement('script');

    (window as any)[callbackName] = (response: any) => {
      document.body.removeChild(script);
      delete (window as any)[callbackName];
      resolve(response);
    };

    script.onerror = () => {
      document.body.removeChild(script);
      delete (window as any)[callbackName];
      console.error(`Failed to fetch from Deezer API using JSONP for URL: ${url}`);
      reject(new Error('JSONP request failed'));
    };

    script.src = `${url}${url.includes('?') ? '&' : '?'}output=jsonp&callback=${callbackName}`;
    document.body.appendChild(script);
  });
};


/**
 * Searches the Deezer API for tracks and albums matching the query using JSONP.
 * @param query The user's search term.
 * @returns A promise that resolves to an array of SearchResult items.
 */
export const searchMusic = async (query: string): Promise<SearchResult[]> => {
  if (!query.trim()) {
    return [];
  }

  try {
    const response = await jsonpRequest(`${API_URL}search?q=${encodeURIComponent(query)}`);

    if (!response || !Array.isArray(response.data)) {
      console.error('Invalid data structure from Deezer search API');
      return [];
    }

    const tracks = response.data;
    const albumMap = new Map<string, Album>();
    const songResults: SearchResult[] = [];

    tracks.forEach((track: any) => {
      if (!track.album || !track.artist) return;

      const song: Song & { type: 'song' } = {
        id: String(track.id),
        title: track.title_short || track.title,
        artist: track.artist.name,
        albumId: String(track.album.id),
        albumTitle: track.album.title,
        coverUrl: track.album.cover_medium || 'https://e-cdns-images.dzcdn.net/images/cover/d41d8cd98f00b204e9800998ecf8427e/250x250-000000-80-0-0.jpg',
        type: 'song',
      };
      songResults.push(song);

      if (!albumMap.has(String(track.album.id))) {
        const album: Album = {
          id: String(track.album.id),
          title: track.album.title,
          artist: track.artist.name,
          coverUrl: track.album.cover_medium || 'https://e-cdns-images.dzcdn.net/images/cover/d41d8cd98f00b204e9800998ecf8427e/250x250-000000-80-0-0.jpg',
          year: 0, // Set as placeholder, will be fetched in detail view.
        };
        albumMap.set(album.id, album);
      }
    });

    const albumResults: SearchResult[] = Array.from(albumMap.values()).map(album => ({ ...album, type: 'album' }));
    return [...albumResults, ...songResults];
  } catch (error) {
    return [];
  }
};

/**
 * Fetches the tracklist for a specific album ID.
 * @param albumId The ID of the album.
 * @returns A promise that resolves to an array of Song items.
 */
export const getAlbumTracks = async (album: Album): Promise<Song[]> => {
  try {
    const response = await jsonpRequest(`${API_URL}album/${album.id}/tracks`);
    
    if (!response || !Array.isArray(response.data)) {
      console.error('Invalid data structure from Deezer album tracks API');
      return [];
    }
    
    return response.data.map((track: any): Song => ({
      id: String(track.id),
      title: track.title_short || track.title,
      artist: track.artist.name,
      albumId: album.id,
      albumTitle: album.title,
      coverUrl: album.coverUrl,
    }));
  } catch (error) {
    return [];
  }
};

/**
 * Fetches the full details for a specific album ID.
 * @param albumId The ID of the album.
 * @returns A promise that resolves to a full Album object, or null if not found.
 */
export const getAlbumDetails = async (albumId: string): Promise<Album | null> => {
  try {
    const response = await jsonpRequest(`${API_URL}album/${albumId}`);

    if (!response || response.error) {
      console.error('Error from Deezer get album details API', response?.error);
      return null;
    }

    let year = 0;
    if (response.release_date) {
        try {
            year = new Date(response.release_date).getFullYear();
        } catch (e) { /* ignore invalid date */ }
    }

    return {
      id: String(response.id),
      title: response.title,
      artist: response.artist.name,
      coverUrl: response.cover_medium || 'https://e-cdns-images.dzcdn.net/images/cover/d41d8cd98f00b204e9800998ecf8427e/250x250-000000-80-0-0.jpg',
      year: year,
      trackCount: response.nb_tracks || 0,
    };
  } catch (error) {
    console.error(`Failed to fetch album details for ID ${albumId}`, error);
    return null;
  }
};