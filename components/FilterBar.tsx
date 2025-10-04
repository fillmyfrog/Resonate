import React from 'react';
import type { AlbumFilters, SongFilters } from '../types';
import { FilterIcon } from './icons/FilterIcon';
import { StarIcon } from './icons/StarIcon';

type FilterConfig = {
  artist?: boolean;
  album?: boolean;
  year?: boolean;
  rating?: boolean;
};

interface FilterBarProps {
  config: FilterConfig;
  filters: Partial<AlbumFilters> | Partial<SongFilters>;
  onFilterChange: (newFilters: Partial<AlbumFilters> | Partial<SongFilters>) => void;
  onReset: () => void;
  yearRange?: { min: number; max: number };
}

export const FilterBar: React.FC<FilterBarProps> = ({
  config,
  filters,
  onFilterChange,
  onReset,
  yearRange,
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onFilterChange({ ...filters, [name]: value });
  };

  const handleRatingChange = (newRating: number) => {
    const currentRating = 'rating' in filters ? filters.rating : 0;
    onFilterChange({ ...filters, rating: currentRating === newRating ? 0 : newRating });
  };

  const hasActiveFilters = Object.values(filters).some(value => {
    if (typeof value === 'string') return value.length > 0;
    if (typeof value === 'number') return value > 0;
    return false;
  });

  return (
    <div className="bg-gray-800/50 p-3 rounded-lg mb-4 text-sm">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-cyan-400 font-semibold">
          <FilterIcon className="w-5 h-5" />
          <span>Filters</span>
        </div>

        {config.artist && (
          <input
            type="text"
            name="artist"
            placeholder="Artist..."
            value={'artist' in filters ? filters.artist : ''}
            onChange={handleInputChange}
            className="bg-gray-700 text-white placeholder-gray-400 rounded-full py-1 px-3 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-xs w-28"
          />
        )}
        {config.album && (
          <input
            type="text"
            name="album"
            placeholder="Album..."
            value={'album' in filters ? filters.album : ''}
            onChange={handleInputChange}
            className="bg-gray-700 text-white placeholder-gray-400 rounded-full py-1 px-3 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-xs w-28"
          />
        )}
        {config.year && yearRange && (
          <div className="flex items-center gap-2 text-gray-400">
            <span>Year:</span>
            <input
              type="number"
              name="yearFrom"
              placeholder={String(yearRange.min)}
              value={'yearFrom' in filters ? filters.yearFrom : ''}
              onChange={handleInputChange}
              className="bg-gray-700 text-white rounded-md py-1 px-2 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-xs w-20"
            />
            <span>-</span>
            <input
              type="number"
              name="yearTo"
              placeholder={String(yearRange.max)}
              value={'yearTo' in filters ? filters.yearTo : ''}
              onChange={handleInputChange}
              className="bg-gray-700 text-white rounded-md py-1 px-2 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-xs w-20"
            />
          </div>
        )}
        {config.rating && (
          <div className="flex items-center gap-2">
             <span className="text-gray-400">Rating:</span>
             <div className="flex items-center">
                {[...Array(5)].map((_, i) => {
                    const ratingValue = i + 1;
                    const isSelected = 'rating' in filters && filters.rating === ratingValue;
                    return (
                        <button key={ratingValue} onClick={() => handleRatingChange(ratingValue)} className="p-1">
                            <StarIcon className={`w-5 h-5 transition-colors ${isSelected ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-500'}`} />
                        </button>
                    )
                })}
             </div>
          </div>
        )}
        
        {hasActiveFilters && (
          <button onClick={onReset} className="text-xs text-cyan-400 hover:text-cyan-300 hover:underline ml-auto">
            Reset
          </button>
        )}
      </div>
    </div>
  );
};
