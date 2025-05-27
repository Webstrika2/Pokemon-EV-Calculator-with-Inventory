import React, { useState } from 'react';

interface ItemIconProps {
  itemName: string;
  spriteName: string;
  category: 'Vitamin' | 'Mochi' | 'Feather';
  className?: string;
  isLarge?: boolean; // For results display potentially
}

const SPRITE_BASE_URL = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/';

const ItemIcon: React.FC<ItemIconProps> = ({ itemName, spriteName, category, className, isLarge }) => {
  const [error, setError] = useState(false);
  const spriteUrl = `${SPRITE_BASE_URL}${spriteName}.png`;

  const getFallbackEmoji = () => {
    switch (category) {
      case 'Vitamin': return '🧪';
      case 'Mochi': return '🍡';
      case 'Feather': return '🪶';
      default: return '❓';
    }
  };
  
  const sizeClass = className ?? (isLarge ? 'w-10 h-10' : 'w-8 h-8'); // Default to w-8 h-8, or w-10 h-10 if isLarge

  if (error || !spriteName || spriteName.includes('placeholder') || spriteName.endsWith('-mochi')) { // Mochi sprites aren't in items usually
    return (
      <span title={itemName} className={`text-2xl flex items-center justify-center ${sizeClass}`}>
        {getFallbackEmoji()}
      </span>
    );
  }

  return (
    <img
      src={spriteUrl}
      alt={itemName}
      className={`${sizeClass} object-contain`}
      onError={() => setError(true)}
      loading="lazy"
    />
  );
};

export default ItemIcon;
