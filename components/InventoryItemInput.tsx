
import React, { useState, useEffect } from 'react';
import { Item } from '../types';
import ItemIcon from './ItemIcon';

interface InventoryItemInputProps {
  item: Item;
  quantity: number;
  onQuantityChange: (itemId: string, quantity: number) => void;
  activeForVoiceInput?: boolean;
  draggableId: string; // For drag and drop
  index: number; // For react-beautiful-dnd or similar, can be useful for HTML5 DND as well
  // Props for HTML5 Drag and Drop handlers will be set directly on the div in CollapsibleSection
}

const InventoryItemInput: React.FC<InventoryItemInputProps> = ({ 
  item, 
  quantity, 
  onQuantityChange, 
  activeForVoiceInput,
  draggableId,
  // index // index is not directly used in this component's rendering logic for HTML5 DND
}) => {
  const [displayValue, setDisplayValue] = useState<string>("");

  useEffect(() => {
    if (quantity === 0) {
      setDisplayValue("");
    } else {
      setDisplayValue(quantity.toString());
    }
  }, [quantity]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    setDisplayValue(rawValue); 

    const numValue = parseInt(rawValue, 10);
    if (!isNaN(numValue) && numValue >= 0) {
      onQuantityChange(item.id, numValue);
    } else if (rawValue.trim() === "") {
      onQuantityChange(item.id, 0); 
    }
  };

  const handleBlur = () => {
    const numValue = parseInt(displayValue, 10);
    if (!isNaN(numValue) && numValue >= 0) {
      onQuantityChange(item.id, numValue); 
      setDisplayValue(numValue.toString()); 
    } else {
      if (quantity === 0) {
        setDisplayValue("");
      } else {
        setDisplayValue(quantity.toString());
      }
      if (displayValue.trim() === "") {
        onQuantityChange(item.id, 0);
      }
    }
  };
  
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (displayValue === "0") {
        setDisplayValue("");
    }
  };


  return (
    <div 
      className={`flex items-center justify-between p-2 bg-slate-700/50 rounded hover:bg-slate-700 transition-colors duration-150 ${activeForVoiceInput ? 'ring-2 ring-pokeYellow shadow-lg' : ''}`}
      data-item-id={draggableId} // Used by drag and drop logic
      // draggable="true" // This will be set by the parent CollapsibleSection for the wrapper
    >
      <div className="flex items-center space-x-2 flex-grow">
        {/* Drag Handle */}
        <span 
            className="cursor-grab text-slate-400 hover:text-slate-200 px-1"
            title={`Drag to reorder ${item.name}`}
            // onMouseDown, onTouchStart etc. might be needed if HTML5 draggable on parent isn't enough
        >
          ☰
        </span>
        <ItemIcon itemName={item.name} spriteName={item.pokeApiSpriteName} category={item.category} />
        <label htmlFor={item.id} className={`text-sm ${activeForVoiceInput ? 'text-pokeYellow font-semibold' : 'text-slate-300'}`}>{item.name}</label>
      </div>
      <input
        type="text" 
        id={item.id}
        name={item.id}
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        placeholder={quantity === 0 && displayValue === "" ? "0" : undefined}
        min="0"
        className="w-20 p-1.5 bg-slate-800 border border-slate-600 rounded-md text-sm text-right focus:ring-pokeBlue focus:border-pokeBlue placeholder-slate-500"
        inputMode="numeric"
      />
    </div>
  );
};

export default InventoryItemInput;
