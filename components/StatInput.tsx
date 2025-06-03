
import React from 'react';
import { Stat } from '../types';
import { MAX_EV_PER_STAT, MAX_TOTAL_EVS, STAT_COLORS } from '../constants';

interface StatInputProps {
  stat: Stat;
  currentEV: number;
  targetEV: number;
  onCurrentEVChange: (stat: Stat, value: number) => void;
  onTargetEVChange: (stat: Stat, value: number) => void;
  totalTargetEVs: number;
  isTotalEVsMaxed: boolean; // New prop
}

const StatInput: React.FC<StatInputProps> = ({ stat, currentEV, targetEV, onCurrentEVChange, onTargetEVChange, totalTargetEVs, isTotalEVsMaxed }) => {
  const handleTargetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = parseInt(e.target.value, 10);
    if (isNaN(value)) value = 0;
    
    // Ensure value aligns with step if necessary, though browser handles step for UI.
    // For direct input, it might not. However, range input usually snaps.
    value = Math.max(0, Math.min(value, MAX_EV_PER_STAT));
    
    const otherStatsTotal = totalTargetEVs - targetEV;
    
    if (value + otherStatsTotal > MAX_TOTAL_EVS) {
      value = MAX_TOTAL_EVS - otherStatsTotal;
    }
    value = Math.max(0, value); 
    onTargetEVChange(stat, value);
  };

  const handleCurrentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = parseInt(e.target.value, 10);
    if (isNaN(value)) value = 0;
    value = Math.max(0, Math.min(value, MAX_EV_PER_STAT));
    onCurrentEVChange(stat, value);
  };
  
  const baseStatColor = STAT_COLORS[stat] || 'bg-gray-500';
  const sliderColor = isTotalEVsMaxed && targetEV === 0 ? 'bg-slate-500 hover:bg-slate-400' : `${baseStatColor} hover:opacity-90`;
  const statDotColor = isTotalEVsMaxed && targetEV === 0 ? 'bg-slate-400' : baseStatColor;


  return (
    <div className="p-3 bg-slate-700 rounded-lg shadow">
      <div className="flex justify-between items-center mb-2">
        <label htmlFor={`${stat}-target-slider`} className="font-semibold text-sm text-slate-200 flex items-center">
          <span className={`w-3 h-3 rounded-full mr-2 ${statDotColor}`}></span>
          {stat}
        </label>
        <span className="text-xs text-slate-400">Max: {MAX_EV_PER_STAT}</span>
      </div>

      <div className="mb-3">
        <label htmlFor={`${stat}-current`} className="block text-xs font-medium text-slate-400 mb-1">Current EVs</label>
        <input
          type="number"
          id={`${stat}-current`}
          name={`${stat}-current`}
          value={currentEV}
          onChange={handleCurrentChange}
          min="0"
          max={MAX_EV_PER_STAT}
          step="1" // Keep number input step fine-grained
          className="w-full p-2 bg-slate-800 border border-slate-600 rounded-md text-sm focus:ring-pokeBlue focus:border-pokeBlue"
          aria-label={`Current EVs for ${stat}`}
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
          step="4" // Slider step changed to 4
          className={`w-full h-3 rounded-lg appearance-none cursor-pointer transition-colors duration-150 ${sliderColor}`}
          aria-label={`Target EVs for ${stat}`}
          title={`Target: ${targetEV} EVs`} // Tooltip for slider value
        />
      </div>
    </div>
  );
};

export default StatInput;
