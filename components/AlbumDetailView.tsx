import React, { useState, useEffect, useMemo } from 'react';
import type { Album, RatedAlbum, Song, RatedSong, SearchResult } from '../types';
import { getAlbumTracks, getAlbumDetails } from '../services/musicService';
import { getAlbumOverview } from '../services/geminiService';
import { StarRating } from './StarRating';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { PlusIcon } from './icons/PlusIcon';
import { CheckIcon } from './icons/CheckIcon';
import { StarIcon } from './icons/StarIcon';

interface AlbumDetailViewProps {
  album: Album | RatedAlbum;
  isLogged: boolean;
  mySongs: RatedSong[];
  onBack: () => void;
  onMarkAlbumAsListened: () => void;
  onMarkSongAsListened: (song: SearchResult) => void;
  onMarkAllSongsAsListened: (songs: Song[]) => void;
  onRateSong: (song: Song) => void;
  onUpdateAlbumRating: (album: SearchResult, rating: number) => void;
}

export const AlbumDetailView: React.FC<AlbumDetailViewProps> = ({
  album,
  isLogged,
  mySongs,
  onBack,
  onMarkAlbumAsListened,
  onMarkSongAsListened,
  onMarkAllSongsAsListened,
  onRateSong,
  onUpdateAlbumRating
}) => {
  const [tracks, setTracks] = useState<Song[]>([]);
  const [overview, setOverview] = useState('');
  const [albumDetails, setAlbumDetails] = useState<Album | null>(null);
  const [isTracksLoading, setIsTracksLoading] = useState(true);
  const [isOverviewLoading, setIsOverviewLoading] = useState(true);
  const [albumRating, setAlbumRating] = useState(('rating' in album && album.rating) || 0);

  // Update internal rating state only when the album prop changes
  useEffect(() => {
    setAlbumRating(('rating' in album && album.rating) || 0);
  }, [album]);

  // Effect for essential data (details, tracks) - runs only when album ID changes
  useEffect(() => {
    const fetchEssentialData = async () => {
      setIsTracksLoading(true);
      setAlbumDetails(null);
      
      const [fetchedTracks, fetchedDetails] = await Promise.all([
        getAlbumTracks(album),
        getAlbumDetails(album.id)
      ]);
      
      setTracks(fetchedTracks);
      if (fetchedDetails) {
        setAlbumDetails(fetchedDetails);
      }
      setIsTracksLoading(false);
    };
    fetchEssentialData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [album.id]);

  // Effect for non-essential AI data - runs only when album ID changes
  useEffect(() => {
    const fetchAiData = async () => {
      setIsOverviewLoading(true);
      const fetchedOverview = await getAlbumOverview(album);
      setOverview(fetchedOverview);
      setIsOverviewLoading(false);
    };
    fetchAiData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [album.id]);

  const handleRatingChange = (newRating: number) => {
    setAlbumRating(newRating);
    const albumToUpdate = { ...album, ...(albumDetails || {}) };
    onUpdateAlbumRating({ ...albumToUpdate, type: 'album' }, newRating);
  };

  const loggedSongIds = useMemo(() => new Set(mySongs.map(s => s.id)), [mySongs]);
  const allTracksLogged = useMemo(() => tracks.length > 0 && tracks.every(t => loggedSongIds.has(t.id)), [tracks, loggedSongIds]);

  const displayAlbum = albumDetails || album;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans animate-fade-in">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <header className="flex items-center mb-6">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-800 transition-colors mr-4">
            <ArrowLeftIcon className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold text-white tracking-tight truncate">{displayAlbum.title}</h1>
        </header>

        <main className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <aside className="md:col-span-1">
            <div className="sticky top-24 space-y-4">
              <img src={displayAlbum.coverUrl} alt={`${displayAlbum.title} cover`} className="w-full aspect-square rounded-lg shadow-2xl" />
              <h2 className="text-3xl font-bold">{displayAlbum.title}</h2>
              <div className="flex items-baseline gap-3">
                <p className="text-xl text-gray-300">{displayAlbum.artist}</p>
                <p className="text-lg text-gray-400">{displayAlbum.year > 0 ? displayAlbum.year : ''}</p>
              </div>

              {isLogged ? (
                <div className="p-4 bg-gray-800/50 rounded-lg">
                  <p className="text-sm text-gray-400 mb-2">Rate this album</p>
                  <StarRating rating={albumRating} setRating={handleRatingChange} />
                </div>
              ) : (
                <button
                  onClick={onMarkAlbumAsListened}
                  className="w-full mt-4 bg-cyan-600 text-white font-bold py-3 rounded-lg hover:bg-cyan-500 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <PlusIcon className="w-5 h-5" /> Mark as Listened
                </button>
              )}

              <div className="bg-gray-800/50 p-4 rounded-lg text-sm text-gray-300 min-h-[100px]">
                <p className="font-semibold text-cyan-400 mb-2">AI Overview</p>
                {isOverviewLoading ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-4 bg-gray-700 rounded-full animate-pulse" style={{ width: `${100 - i * 15}%` }}></div>
                    ))}
                  </div>
                ) : (
                  <p>{overview}</p>
                )}
              </div>
            </div>
          </aside>

          <section className="md:col-span-2">
            <div className="flex justify-between items-center mb-4 border-b-2 border-cyan-500/30 pb-2">
              <h3 className="text-xl font-semibold text-cyan-400">Tracklist</h3>
              {!isTracksLoading && tracks.length > 0 && (
                <button
                  onClick={() => onMarkAllSongsAsListened(tracks)}
                  disabled={allTracksLogged}
                  className="px-3 py-1 text-xs font-semibold rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-gray-700 hover:bg-cyan-600 disabled:bg-gray-600"
                >
                  {allTracksLogged ? 'All Logged' : 'Mark All As Listened'}
                </button>
              )}
            </div>
            {isTracksLoading ? (
              <div className="space-y-4">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-800 rounded-md animate-pulse"></div>
                ))}
              </div>
            ) : (
              <ul className="space-y-2">
                {tracks.map((track, index) => {
                  const loggedSong = mySongs.find(s => s.id === track.id);
                  const isSongLogged = !!loggedSong;

                  return (
                    <li
                      key={track.id}
                      onClick={() => {
                        if (isSongLogged) {
                          onRateSong(track);
                        } else {
                          onMarkSongAsListened({ ...track, type: 'song' });
                        }
                      }}
                      className="flex items-center justify-between p-3 rounded-md transition-colors bg-gray-800/50 hover:bg-gray-800 cursor-pointer"
                    >
                      <div className="flex items-center overflow-hidden">
                        <span className="text-gray-400 w-8 text-center flex-shrink-0">{index + 1}.</span>
                        <div className="truncate">
                          <p className="font-medium text-white truncate">{track.title}</p>
                          <p className="text-sm text-gray-400 truncate">{track.artist}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                        {isSongLogged && loggedSong.rating && (
                          <div className="flex items-center gap-1 text-yellow-400">
                            <StarIcon className="w-4 h-4" />
                            <span>{loggedSong.rating}</span>
                          </div>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isSongLogged) {
                              onRateSong(track);
                            } else {
                              onMarkSongAsListened({ ...track, type: 'song' });
                            }
                          }}
                          className={`p-2 rounded-full transition-all duration-200 ${isSongLogged ? 'bg-green-500' : 'bg-gray-700 hover:bg-cyan-500 hover:scale-110'}`}
                          aria-label={isSongLogged ? 'Edit rating' : 'Mark as listened'}
                        >
                          {isSongLogged ? <CheckIcon className="w-4 h-4 text-white" /> : <PlusIcon className="w-4 h-4 text-white" />}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            {tracks.length === 0 && !isTracksLoading && (
              <p className="text-gray-500 mt-4">Could not find a tracklist for this album.</p>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};
