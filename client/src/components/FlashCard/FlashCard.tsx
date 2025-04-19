import React, { useState } from 'react';
import './FlashCard.css';

interface FlashCardProps {
  front: string;
  back: string;
  onRate?: (rating: number) => void;
  showRating?: boolean;
}

const FlashCard: React.FC<FlashCardProps> = ({ 
  front, 
  back, 
  onRate,
  showRating = true
}) => {
  const [flipped, setFlipped] = useState(false);

  const handleFlip = () => {
    setFlipped(!flipped);
  };

  const handleRating = (rating: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card from flipping when rating
    if (onRate) {
      onRate(rating);
    }
  };

  return (
    <div 
      className={`flash-card ${flipped ? 'flipped' : ''}`} 
      onClick={handleFlip}
    >
      <div className="flash-card-inner">
        <div className="flash-card-front">
          <div className="content">{front}</div>
        </div>
        <div className="flash-card-back">
          <div className="content">{back}</div>
          
          {showRating && onRate && (
            <div className="rating-container" onClick={(e) => e.stopPropagation()}>
              <p>How well did you know this?</p>
              <div className="rating-buttons">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button 
                    key={rating}
                    className="rating-button"
                    onClick={(e) => handleRating(rating, e)}
                  >
                    {rating}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FlashCard;