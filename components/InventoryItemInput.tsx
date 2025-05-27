import React, { useState, useEffect } from 'react';
import { Item } from '../types';
import ItemIcon from './ItemIcon';

interface InventoryItemInputProps {
  item: Item;
  quantity: number;
  onQuantityChange: (itemId: string, quantity: number) => void;
}

const InventoryItemInput: React.FC<InventoryItemInputProps> = ({ item, quantity, onQuantityChange }) => {
  const [inputValue, setInputValue] = useState(quantity.toString());

  useEffect(() => {
     // Sync local input if prop changes from outside (e.g. reset)
    if (parseInt(inputValue, 10) !== quantity) {
       setInputValue(quantity.toString());
    }
  }, [quantity]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valStr = e.target.value;
    setInputValue(valStr); // Allow displaying "empty" or partial input

    if (valStr === "") {
      onQuantityChange(item.id, 0);
      return;
    }
    
    const value = parseInt(valStr, 10);
    if (!isNaN(value)) {
      onQuantityChange(item.id, Math.max(0, value)); // No upper limit for inventory quantity
    }
  };

  const handleBlur = () => {
    // On blur, ensure the input reflects the actual numeric state
     if (inputValue === "" || isNaN(parseInt(inputValue,10))) {
         setInputValue(quantity.toString());
    } else {
        const value = parseInt(inputValue, 10);
         if (!isNaN(value)) {
             const boundedValue = Math.max(0, value); // ensure positive
             if (boundedValue !== value) {
                setInputValue(boundedValue.toString());
             }
             // Parent should already be updated via onChange if it was a valid number
        } else {
            setInputValue(quantity.toString()); // revert to last valid
        }
    }
  };

  const increment = () => {
    const currentVal = parseInt(inputValue, 10);
    const newVal = (isNaN(currentVal) ? 0 : currentVal) + 1;
    setInputValue(newVal.toString());
    onQuantityChange(item.id, newVal);
  };

  const decrement = () => {
    const currentVal = parseInt(inputValue, 10);
    const newVal = Math.max(0, (isNaN(currentVal) ? 0 : currentVal) - 1);
    setInputValue(newVal.toString());
    onQuantityChange(item.id, newVal);
  };

  return (
    <div className="flex items-center justify-between p-2.5 bg-slate-700/60 rounded hover:bg-slate-700/90 transition-colors duration-150">
      <div className="flex items-center space-x-3">
        <ItemIcon itemName={item.name} spriteName={item.pokeApiSpriteName} category={item.category} isLarge={false} />
        <label htmlFor={item.id} className="text-sm text-slate-200">{item.name}</label>
      </div>
      <div className="flex items-center space-x-1.5">
        <button 
          onClick={decrement} 
          className="px-2 py-1 bg-slate-600 hover:bg-pokeRed text-slate-100 rounded text-sm leading-none"
          aria-label={`Decrease quantity of ${item.name}`}
        >-</button>
        <input
          type="text" // Changed to text for better UX with empty string
          inputMode="numeric"
          id={item.id}
          name={item.id}
          value={inputValue}
          onChange={handleChange}
          onBlur={handleBlur}
          className="w-16 p-1.5 bg-slate-800 border border-slate-600 rounded-md text-sm text-center focus:ring-pokeBlue focus:border-pokeBlue"
          placeholder="0"
        />
        <button 
          onClick={increment} 
          className="px-2 py-1 bg-slate-600 hover:bg-pokeGreen text-slate-100 rounded text-sm leading-none"
          aria-label={`Increase quantity of ${item.name}`}
        >+</button>
      </div>
    </div>
  );
};

export default InventoryItemInput;
