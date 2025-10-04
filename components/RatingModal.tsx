import React, { useState, useEffect } from 'react';
import type { SearchResult } from '../types';
import { StarRating } from './StarRating';
import { CloseIcon } from './icons/CloseIcon';
import { getMusicFunFact } from '../services/geminiService';

interface RatingModalProps {
  item: SearchResult;
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: SearchResult, rating: number) => void;
  existingRating?: number;
}

export const RatingModal: React.FC<RatingModalProps> = ({ item, isOpen, onClose, onSave, existingRating }) => {
  const [rating, setRating] = useState(existingRating || 0);
  const [funFact, setFunFact] = useState<string>('');
  const [isFactLoading, setIsFactLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setRating(existingRating || 0);
      setIsFactLoading(true);
      getMusicFunFact(item)
        .then(fact => setFunFact(fact))
        .catch(err => setFunFact("Could not load fun fact."))
        .finally(() => setIsFactLoading(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, item, existingRating]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (rating > 0) {
      onSave(item, rating);
    }
  };

  const isAlbum = item.type === 'album';

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose} role="dialog" aria-modal="true">
      <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-md relative animate-fade-in" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors" aria-label="Close modal">
          <CloseIcon className="w-6 h-6" />
        </button>
        <div className="flex flex-col sm:flex-row">
            <div className="w-full sm:w-1/3">
                <img src={item.coverUrl} alt={item.title} className="w-full h-auto object-cover rounded-t-lg sm:rounded-l-lg sm:rounded-t-none aspect-square" />
            </div>
            <div className="p-6 flex flex-col justify-between flex-1">
                <div>
                    <h2 className="text-2xl font-bold text-white">{item.title}</h2>
                    <p className="text-lg text-gray-300">{item.artist}</p>
                    {!isAlbum && <p className="text-sm text-gray-400 italic">from {item.albumTitle}</p>}
                    {isAlbum && <p className="text-sm text-gray-400">{item.year}</p>}
                    
                    <div className="my-6">
                        <p className="text-sm text-gray-400 mb-2">Your Rating</p>
                        <StarRating rating={rating} setRating={setRating} />
                    </div>
                </div>

                <div className="bg-gray-900/50 p-3 rounded-md mt-4 text-sm text-gray-300 min-h-[60px]">
                  <p className="font-semibold text-cyan-400 mb-1">AI Fun Fact</p>
                  {isFactLoading ? (
                    <div className="space-y-2">
                        <div className="h-3 bg-gray-700 rounded-full w-3/4 animate-pulse"></div>
                        <div className="h-3 bg-gray-700 rounded-full w-1/2 animate-pulse"></div>
                    </div>
                  ) : (
                    <p>{funFact}</p>
                  )}
                </div>

                <button
                    onClick={handleSave}
                    disabled={rating === 0}
                    className="w-full mt-6 bg-cyan-600 text-white font-bold py-3 rounded-lg hover:bg-cyan-500 transition-all duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {existingRating ? 'Update Rating' : 'Save Rating'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
