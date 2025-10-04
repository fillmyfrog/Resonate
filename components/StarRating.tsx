
import React, { useState } from 'react';
import { StarIcon } from './icons/StarIcon';

interface StarRatingProps {
  rating: number;
  setRating: (rating: number) => void;
}

export const StarRating: React.FC<StarRatingProps> = ({ rating, setRating }) => {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex items-center space-x-1">
      {[...Array(5)].map((_, index) => {
        const ratingValue = index + 1;
        return (
          <button
            key={ratingValue}
            type="button"
            className="transition-transform duration-150 ease-in-out hover:scale-125"
            onClick={() => setRating(ratingValue)}
            onMouseEnter={() => setHover(ratingValue)}
            onMouseLeave={() => setHover(0)}
          >
            <StarIcon 
              className={`w-8 h-8 ${ratingValue <= (hover || rating) ? 'text-yellow-400' : 'text-gray-600'}`}
            />
          </button>
        );
      })}
    </div>
  );
};
