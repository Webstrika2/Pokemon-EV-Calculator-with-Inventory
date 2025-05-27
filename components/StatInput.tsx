import React, { useState, useEffect } from 'react';
import { Stat } from '../types';
import { MAX_EV_PER_STAT, MAX_TOTAL_EVS, STAT_COLORS, STAT_TEXT_COLORS } from '../constants';

interface StatInputProps {
  stat: Stat;
  currentEV: number;
  targetEV: number;
  onCurrentEVChange: (stat: Stat, value: number) => void;
  onTargetEVChange: (stat: Stat, value: number) => void;
  totalTargetEVs: number;
  isTotalEVsMaxed: boolean;
}

const StatInput: React.FC<StatInputProps> = ({ stat, currentEV, targetEV, onCurrentEVChange, onTargetEVChange, totalTargetEVs, isTotalEVsMaxed }) => {
  const [currentEvInput, setCurrentEvInput] = useState(currentEV.toString());

  useEffect(() => {
    // Sync local input if prop changes from outside (e.g. reset)
    if (parseInt(currentEvInput, 10) !== currentEV) {
        setCurrentEvInput(currentEV.toString());
    }
  }, [currentEV]);

  const handleTargetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = parseInt(e.target.value, 10);
    if (isNaN(value)) value = 0;
    value = Math.max(0, Math.min(value, MAX_EV_PER_STAT));
    
    const otherStatsTotal = totalTargetEVs - targetEV;
    
    if (value + otherStatsTotal > MAX_TOTAL_EVS) {
      value = MAX_TOTAL_EVS - otherStatsTotal;
    }
    value = Math.max(0, value); 
    onTargetEVChange(stat, value);
  };

  const handleCurrentEvInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valStr = e.target.value;
    setCurrentEvInput(valStr); // Allow displaying "empty" or partial input

    if (valStr === "") {
      onCurrentEVChange(stat, 0); // Treat empty as 0 for calculation
      return;
    }
    
    const value = parseInt(valStr, 10);
    if (!isNaN(value)) {
      onCurrentEVChange(stat, Math.max(0, Math.min(value, MAX_EV_PER_STAT)));
    }
    // If not a number, parent state doesn't change, input field shows the invalid text until corrected
  };
  
  const handleCurrentEvInputBlur = () => {
    // On blur, ensure the input reflects the actual numeric state if it was invalid
    if (currentEvInput === "" || isNaN(parseInt(currentEvInput,10))) {
         setCurrentEvInput(currentEV.toString());
    } else {
        // Ensure it's within bounds if user typed something like 999
        const value = parseInt(currentEvInput, 10);
        if (!isNaN(value)) {
             const boundedValue = Math.max(0, Math.min(value, MAX_EV_PER_STAT));
             if (boundedValue !== value) {
                setCurrentEvInput(boundedValue.toString());
             }
             // Parent should already be updated via onChange if it was a valid number
        } else {
            setCurrentEvInput(currentEV.toString()); // revert to last valid
        }
    }
  };
  
  const baseStatColor = STAT_COLORS[stat] || 'bg-gray-500';
  const sliderColor = isTotalEVsMaxed ? 'bg-slate-500 hover:bg-slate-400' : `${baseStatColor} hover:opacity-90`;
  const statDotColor = isTotalEVsMaxed ? 'bg-slate-400' : baseStatColor;

  return (
    <div className="p-3 bg-slate-700/80 rounded-lg shadow-md hover:shadow-slate-600/50 transition-shadow">
      <div className="flex justify-between items-center mb-2">
        <label htmlFor={`${stat}-target-slider`} className={`font-semibold text-sm ${STAT_TEXT_COLORS[stat]} flex items-center`}>
          <span className={`w-3 h-3 rounded-full mr-2 ${statDotColor}`}></span>
          {stat}
        </label>
        <span className="text-xs text-slate-400">Max: {MAX_EV_PER_STAT}</span>
      </div>

      <div className="mb-3">
        <label htmlFor={`${stat}-current`} className="block text-xs font-medium text-slate-400 mb-1">Current EVs</label>
        <input
          type="text" // Changed to text to allow empty string display
          inputMode="numeric" // Hint for numeric keyboard on mobile
          id={`${stat}-current`}
          name={`${stat}-current`}
          value={currentEvInput}
          onChange={handleCurrentEvInputChange}
          onBlur={handleCurrentEvInputBlur}
          className="w-full p-2 bg-slate-800 border border-slate-600 rounded-md text-sm focus:ring-pokeBlue focus:border-pokeBlue"
          aria-label={`Current EVs for ${stat}`}
          placeholder="0"
        />
      </div>

      <div>
        <label htmlFor={`${stat}-target-slider`} className="block text-xs font-medium text-slate-400 mb-1">Target EVs: {targetEV}</label>
        <input
          type="range"
          id={`${stat}-target-slider`}
          name={`${stat}-target-slider`}
          value={targetEV}
          onChange={handleTargetChange}
          min="0"
          max={MAX_EV_PER_STAT}
          step="1"
          className={`w-full h-3 rounded-lg appearance-none cursor-pointer transition-colors duration-150 ${sliderColor}`}
          aria-label={`Target EVs for ${stat}`}
        />
      </div>
    </div>
  );
};

export default StatInput;
