import React from 'react';
import type { Song, RatedSong } from '../types';
import { StarIcon } from './icons/StarIcon';
import { PlusIcon } from './icons/PlusIcon';
import { CheckIcon } from './icons/CheckIcon';

interface SongCardProps {
  song: Song;
  onClick?: () => void;
  ratedSong?: RatedSong;
  onMarkAsListened?: (song: Song) => void;
  isLogged?: boolean;
}

export const SongCard: React.FC<SongCardProps> = ({ song, onClick, ratedSong, onMarkAsListened, isLogged }) => {
  const handleListenClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMarkAsListened && !isLogged) {
      onMarkAsListened(song);
    }
  };

  return (
    <div 
      className={`group relative ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      aria-label={onClick ? `Rate or edit rating for ${song.title}` : song.title}
    >
      <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-800 shadow-lg">
        <img 
          src={song.coverUrl} 
          alt={`${song.albumTitle} cover`} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-in-out"
        />
      </div>

      {onMarkAsListened && (
         <button 
          onClick={handleListenClick}
          className={`absolute top-2 right-2 z-10 p-2 rounded-full transition-all duration-200 ${isLogged ? 'bg-green-500 cursor-default' : 'bg-black/60 hover:bg-cyan-500 hover:scale-110'}`}
          aria-label={isLogged ? 'In your music log' : 'Mark as listened'}
          title={isLogged ? 'In your music log' : 'Mark as listened'}
        >
          {isLogged ? <CheckIcon className="w-4 h-4 text-white" /> : <PlusIcon className="w-4 h-4 text-white" />}
        </button>
      )}

      {ratedSong?.rating && (
        <div className="absolute top-1 right-1 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1 text-xs text-yellow-400">
          <StarIcon className="w-3 h-3" />
          <span>{ratedSong.rating}</span>
        </div>
      )}
      <div className="mt-2 text-center sm:text-left">
        <h3 className="font-semibold text-sm text-white truncate group-hover:text-cyan-400 transition-colors">{song.title}</h3>
        <p className="text-xs text-gray-400 truncate">{song.artist}</p>
        <p className="text-xs text-gray-500 truncate italic">from {song.albumTitle}</p>
      </div>
    </div>
  );
};