import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Album, RatedAlbum, Song, RatedSong, SearchResult, LibraryItem, AlbumFilters, SongFilters } from './types';
import { searchMusic, getAlbumDetails } from './services/musicService';
import { AlbumCard } from './components/AlbumCard';
import { SongCard } from './components/SongCard';
import { RatingModal } from './components/RatingModal';
import { MusicIcon } from './components/icons/MusicIcon';
import { SearchIcon } from './components/icons/SearchIcon';
import { AlbumDetailView } from './components/AlbumDetailView';
import { FilterBar } from './components/FilterBar';

const initialAlbumFilters: AlbumFilters = { artist: '', yearFrom: '', yearTo: '', rating: 0 };
const initialSongFilters: SongFilters = { artist: '', album: '', rating: 0 };

const App: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [myAlbums, setMyAlbums] = useState<RatedAlbum[]>([]);
  const [mySongs, setMySongs] = useState<RatedSong[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<SearchResult | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [viewingAlbum, setViewingAlbum] = useState<Album | RatedAlbum | null>(null);
  
  const [filters, setFilters] = useState({
    searchAlbums: { artist: '' },
    searchSongs: { artist: '', album: '' },
    myAlbums: initialAlbumFilters,
    mySongs: initialSongFilters
  });

  useEffect(() => {
    try {
      const storedAlbums = localStorage.getItem('myAlbums');
      if (storedAlbums) {
        setMyAlbums(JSON.parse(storedAlbums));
      }
      const storedSongs = localStorage.getItem('mySongs');
      if (storedSongs) {
        setMySongs(JSON.parse(storedSongs));
      }
    } catch (error) {
      console.error("Failed to parse music from localStorage", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('myAlbums', JSON.stringify(myAlbums));
    } catch (error) {
      console.error("Failed to save albums to localStorage", error);
    }
  }, [myAlbums]);
  
  useEffect(() => {
    try {
      localStorage.setItem('mySongs', JSON.stringify(mySongs));
    } catch (error) {
      console.error("Failed to save songs to localStorage", error);
    }
  }, [mySongs]);

  const handleSearch = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setSearchResults([]);
    setViewingAlbum(null);
    const results = await searchMusic(searchQuery);
    setSearchResults(results);
    setIsLoading(false);
  }, [searchQuery]);
  
  const handleOpenModal = (item: SearchResult | LibraryItem) => {
    if ('type' in item) {
      setSelectedItem(item);
    } else {
      console.warn("Item without type passed to handleOpenModal");
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const handleMarkAsListened = async (item: SearchResult) => {
    if (item.type === 'album') {
      if (myAlbums.some(a => a.id === item.id)) return;
      
      const albumDetails = await getAlbumDetails(item.id);

      const newLoggedAlbum: RatedAlbum = {
        ...item,
        ...(albumDetails || {}),
        listenedDate: new Date().toISOString(),
      };
      setMyAlbums(prev => [...prev, newLoggedAlbum]);
    } else {
      if (mySongs.some(s => s.id === item.id)) {
         handleOpenModal({...item, type: 'song'});
         return;
      }
      const newLoggedSong: RatedSong = {
        ...item,
        listenedDate: new Date().toISOString(),
      };
      setMySongs(prev => [...prev, newLoggedSong]);
      handleOpenModal({...item, type: 'song'});
    }
  };

  const handleSaveRating = (item: SearchResult, rating: number) => {
    if (item.type === 'album') {
      setMyAlbums(prevAlbums => 
        prevAlbums.map(album => 
          album.id === item.id ? { ...album, rating } : album
        )
      );
      if (viewingAlbum && viewingAlbum.id === item.id) {
        setViewingAlbum(prev => prev ? { ...prev, rating } as RatedAlbum : null);
      }
    } else if (item.type === 'song') {
      setMySongs(prevSongs =>
        prevSongs.map(song =>
          song.id === item.id ? { ...song, rating } : song
        )
      );
    }
    handleCloseModal();
  };

  const handleMarkAllSongsAsListened = (songsToLog: Song[]) => {
    const loggedSongIds = new Set(mySongs.map(s => s.id));
    const newSongs = songsToLog
      .filter(track => !loggedSongIds.has(track.id))
      .map((track): RatedSong => ({
        ...track,
        listenedDate: new Date().toISOString(),
      }));

    if (newSongs.length > 0) {
      setMySongs(prev => [...prev, ...newSongs]);
    }
  };
  
  const albumResults = useMemo(() => searchResults.filter((r): r is Album & { type: 'album' } => r.type === 'album'), [searchResults]);
  const songResults = useMemo(() => searchResults.filter((r): r is Song & { type: 'song' } => r.type === 'song'), [searchResults]);

  const filteredAlbumResults = useMemo(() => {
      const { artist } = filters.searchAlbums;
      if (!artist) return albumResults;
      return albumResults.filter(album => album.artist.toLowerCase().includes(artist.toLowerCase()));
  }, [albumResults, filters.searchAlbums]);

  const filteredSongResults = useMemo(() => {
    const { artist, album } = filters.searchSongs;
    return songResults.filter(song => {
      const artistMatch = !artist || song.artist.toLowerCase().includes(artist.toLowerCase());
      const albumMatch = !album || song.albumTitle.toLowerCase().includes(album.toLowerCase());
      return artistMatch && albumMatch;
    });
  }, [songResults, filters.searchSongs]);

  const sortedAlbums = useMemo(() => {
    return [...myAlbums].sort((a, b) => new Date(b.listenedDate).getTime() - new Date(a.listenedDate).getTime());
  }, [myAlbums]);

  const filteredMyAlbums = useMemo(() => {
    const { artist, yearFrom, yearTo, rating } = filters.myAlbums;
    return sortedAlbums.filter(album => {
      const artistMatch = !artist || album.artist.toLowerCase().includes(artist.toLowerCase());
      const ratingMatch = !rating || album.rating === rating;
      const yearFromMatch = !yearFrom || album.year >= parseInt(yearFrom);
      const yearToMatch = !yearTo || album.year <= parseInt(yearTo);
      return artistMatch && ratingMatch && yearFromMatch && yearToMatch;
    });
  }, [sortedAlbums, filters.myAlbums]);

  const sortedSongs = useMemo(() => {
    return [...mySongs].sort((a, b) => new Date(b.listenedDate).getTime() - new Date(a.listenedDate).getTime());
  }, [mySongs]);

  const filteredMySongs = useMemo(() => {
    const { artist, album, rating } = filters.mySongs;
    return sortedSongs.filter(song => {
      const artistMatch = !artist || song.artist.toLowerCase().includes(artist.toLowerCase());
      const albumMatch = !album || song.albumTitle.toLowerCase().includes(album.toLowerCase());
      const ratingMatch = !rating || song.rating === rating;
      return artistMatch && albumMatch && ratingMatch;
    });
  }, [sortedSongs, filters.mySongs]);
  
  const myAlbumYears = useMemo(() => {
    const years = myAlbums.map(a => a.year).filter(y => y > 0);
    return {
        min: years.length > 0 ? Math.min(...years) : new Date().getFullYear() - 20,
        max: years.length > 0 ? Math.max(...years) : new Date().getFullYear(),
    }
  }, [myAlbums]);

  const handleViewAlbum = (album: Album | RatedAlbum) => {
    setViewingAlbum(album);
  }

  const handleCloseAlbumView = () => {
    setViewingAlbum(null);
  }
  
  const isViewingAlbumLogged = useMemo(() => {
    if (!viewingAlbum) return false;
    return myAlbums.some(a => a.id === viewingAlbum.id);
  }, [viewingAlbum, myAlbums]);

  const renderContent = () => {
    if (viewingAlbum) {
      return (
        <AlbumDetailView 
          album={viewingAlbum}
          isLogged={isViewingAlbumLogged}
          mySongs={mySongs}
          onBack={handleCloseAlbumView}
          onMarkAlbumAsListened={() => handleMarkAsListened({ ...viewingAlbum, type: 'album' })}
          onMarkSongAsListened={handleMarkAsListened}
          onMarkAllSongsAsListened={handleMarkAllSongsAsListened}
          onRateSong={(song) => handleOpenModal({...song, type: 'song'})}
          onUpdateAlbumRating={handleSaveRating}
        />
      );
    }

    return (
      <>
        {isLoading && <p className="text-center text-lg animate-pulse">Loading results...</p>}
        
        {!isLoading && searchResults.length > 0 && (
          <section className="mb-12 space-y-8">
            <h2 className="text-2xl font-semibold border-b-2 border-cyan-500/30 pb-2">Search Results</h2>
            
            {albumResults.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-4 text-cyan-400">Albums</h3>
                <FilterBar
                  config={{ artist: true }}
                  filters={filters.searchAlbums}
                  // Fix for type error on line 248.
                  // The `f` parameter from `onFilterChange` has a broad type that is not directly assignable to `filters.searchAlbums`.
                  // We construct a new object with the correct shape and type, ensuring type safety.
                  onFilterChange={(f) => setFilters(prev => ({...prev, searchAlbums: { artist: f.artist ?? '' }}))}
                  onReset={() => setFilters(prev => ({...prev, searchAlbums: { artist: '' }}))}
                />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pt-4">
                  {filteredAlbumResults.length > 0 ? filteredAlbumResults.map(item => (
                    <AlbumCard 
                      key={`search-album-${item.id}`} 
                      album={item} 
                      onClick={() => handleViewAlbum(item)}
                      onMarkAsListened={() => handleMarkAsListened(item)}
                      isLogged={myAlbums.some(a => a.id === item.id)}
                    />
                  )) : <p className="col-span-full text-gray-400">No albums match your filter.</p>}
                </div>
              </div>
            )}

            {songResults.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-4 text-cyan-400">Songs</h3>
                <FilterBar
                  config={{ artist: true, album: true }}
                  filters={filters.searchSongs}
                  // Fix for type error on line 271.
                  // The `f` parameter from `onFilterChange` has a broad type `Partial<AlbumFilters> | Partial<SongFilters>`.
                  // `Partial<AlbumFilters>` does not have an `album` property, causing an error.
                  // We construct a new object, casting `f` to access `album` and ensuring type safety.
                  onFilterChange={(f) => setFilters(prev => ({...prev, searchSongs: { artist: f.artist ?? '', album: (f as Partial<SongFilters>).album ?? '' }}))}
                  onReset={() => setFilters(prev => ({...prev, searchSongs: { artist: '', album: '' }}))}
                />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pt-4">
                  {filteredSongResults.length > 0 ? filteredSongResults.map(item => (
                    <SongCard 
                      key={`search-song-${item.id}`}
                      song={item}
                      onClick={() => handleViewAlbum({ id: item.albumId, title: item.albumTitle, artist: item.artist, coverUrl: item.coverUrl, year: 0 })}
                      onMarkAsListened={() => handleMarkAsListened(item)}
                      isLogged={mySongs.some(s => s.id === item.id)}
                    />
                  )) : <p className="col-span-full text-gray-400">No songs match your filters.</p>}
                </div>
              </div>
            )}
          </section>
        )}

        <section>
          <h2 className="text-2xl font-semibold mb-4 border-b-2 border-cyan-500/30 pb-2">My Music Log</h2>
          {myAlbums.length === 0 && mySongs.length === 0 && !searchQuery ? (
            <div className="text-center py-10 bg-gray-800 rounded-lg">
              <p className="text-gray-400">You haven't logged any music yet.</p>
              <p className="text-gray-500 text-sm mt-2">Use the search bar to find and log your first album or song!</p>
            </div>
          ) : (
            <div className="space-y-12">
              {myAlbums.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-cyan-400">My Albums</h3>
                  <FilterBar
                    config={{ artist: true, year: true, rating: true }}
                    filters={filters.myAlbums}
                    onFilterChange={(f) => setFilters(prev => ({...prev, myAlbums: f as AlbumFilters}))}
                    onReset={() => setFilters(prev => ({...prev, myAlbums: initialAlbumFilters}))}
                    yearRange={myAlbumYears}
                  />
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pt-4">
                    {filteredMyAlbums.length > 0 ? filteredMyAlbums.map(album => {
                        const listenedSongsCount = mySongs.filter(song => song.albumId === album.id).length;
                        return (
                            <AlbumCard 
                                key={`lib-album-${album.id}`} 
                                album={album} 
                                onClick={() => handleViewAlbum(album)} 
                                ratedAlbum={album} 
                                listenedSongsCount={listenedSongsCount}
                            />
                        );
                    }) : <p className="col-span-full text-gray-400">No albums match your filters.</p>}
                  </div>
                </div>
              )}

              {mySongs.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-cyan-400">My Songs</h3>
                   <FilterBar
                    config={{ artist: true, album: true, rating: true }}
                    filters={filters.mySongs}
                    onFilterChange={(f) => setFilters(prev => ({...prev, mySongs: f as SongFilters}))}
                    onReset={() => setFilters(prev => ({...prev, mySongs: initialSongFilters}))}
                  />
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pt-4">
                    {filteredMySongs.length > 0 ? filteredMySongs.map(song => (
                        <SongCard key={`lib-song-${song.id}`} song={song} onClick={() => handleOpenModal({...song, type: 'song'})} ratedSong={song} />
                    )) : <p className="col-span-full text-gray-400">No songs match your filters.</p>}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <header className="bg-gray-800/50 backdrop-blur-lg sticky top-0 z-20 shadow-lg">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <MusicIcon className="h-8 w-8 text-cyan-400"/>
            <h1 className="text-3xl font-bold text-white tracking-tight">MusicLog</h1>
          </div>
          <form onSubmit={handleSearch} className="w-full sm:w-auto sm:max-w-xs flex-grow">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for albums or songs..."
                className="w-full bg-gray-700 text-white placeholder-gray-400 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-300"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-gray-400"/>
              </div>
            </div>
          </form>
        </div>
      </header>
      
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        {renderContent()}
      </main>

      {isModalOpen && selectedItem && (
        <RatingModal
          item={selectedItem}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveRating}
          existingRating={
            selectedItem.type === 'album' 
            ? myAlbums.find(a => a.id === selectedItem.id)?.rating
            : mySongs.find(s => s.id === selectedItem.id)?.rating
          }
        />
      )}
    </div>
  );
};

export default App;
