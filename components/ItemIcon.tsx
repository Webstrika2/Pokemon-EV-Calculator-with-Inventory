
import React, { useState } from 'react';

interface ItemIconProps {
  itemName: string;
  spriteName: string;
  category: 'Vitamin' | 'Mochi' | 'Feather';
  className?: string;
}

const SPRITE_BASE_URL = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/';

const ItemIcon: React.FC<ItemIconProps> = ({ itemName, spriteName, category, className = 'w-6 h-6' }) => {
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

  if (error || !spriteName.trim() || spriteName.includes('placeholder')) { // Enhanced check for placeholder names
    return (
      <span title={itemName} className={`text-xl flex items-center justify-center ${className}`}>
        {getFallbackEmoji()}
      </span>
    );
  }

  return (
    <img
      src={spriteUrl}
      alt={itemName}
      className={`${className} object-contain`}
      onError={() => setError(true)}
      loading="lazy"
    />
  );
};

export default ItemIcon;
