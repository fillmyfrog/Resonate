import React from 'react';
import type { Album, RatedAlbum } from '../types';
import { StarIcon } from './icons/StarIcon';
import { PlusIcon } from './icons/PlusIcon';
import { CheckIcon } from './icons/CheckIcon';

interface AlbumCardProps {
  album: Album;
  onClick?: () => void;
  ratedAlbum?: RatedAlbum;
  onMarkAsListened?: (album: Album) => void;
  isLogged?: boolean;
  listenedSongsCount?: number;
}

export const AlbumCard: React.FC<AlbumCardProps> = ({ album, onClick, ratedAlbum, onMarkAsListened, isLogged, listenedSongsCount }) => {
  const handleListenClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMarkAsListened && !isLogged) {
      onMarkAsListened(album);
    }
  };

  const totalTracks = ratedAlbum?.trackCount;

  return (
    <div 
      className={`group relative ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      aria-label={onClick ? `Rate or edit rating for ${album.title}` : album.title}
    >
      <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-800 shadow-lg">
        <img 
          src={album.coverUrl} 
          alt={`${album.title} cover`} 
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

      {ratedAlbum?.rating && (
        <div className="absolute top-1 right-1 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1 text-xs text-yellow-400">
          <StarIcon className="w-3 h-3" />
          <span>{ratedAlbum.rating}</span>
        </div>
      )}

      {typeof listenedSongsCount === 'number' && typeof totalTracks === 'number' && totalTracks > 0 && (
        <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1 text-xs text-gray-200">
          <span>{listenedSongsCount}/{totalTracks}</span>
        </div>
      )}

      <div className="mt-2 text-center sm:text-left">
        <h3 className="font-semibold text-sm text-white truncate group-hover:text-cyan-400 transition-colors">{album.title}</h3>
        <p className="text-xs text-gray-400 truncate">{album.artist}</p>
      </div>
    </div>
  );
};