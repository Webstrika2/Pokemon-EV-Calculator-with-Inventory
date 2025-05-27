import React from 'react';
import { MAX_TOTAL_EVS } from '../constants'; // MAX_TOTAL_EVS is imported for direct use here

interface TotalEVBarProps {
  totalEVs: number;
  maxEVs: number; // Should be MAX_TOTAL_EVS from constants
}

const TotalEVBar: React.FC<TotalEVBarProps> = ({ totalEVs, maxEVs }) => {
  const percentage = Math.min((totalEVs / maxEVs) * 100, 100);

  let barColor = 'bg-green-500';
  let textColor = 'text-slate-200';

  if (totalEVs > maxEVs) {
    barColor = 'bg-red-600'; // Over limit
    textColor = 'text-red-300';
  } else if (totalEVs === maxEVs) {
    barColor = 'bg-pokeRed'; // Exactly at max
    textColor = 'text-pokeRed';
  } else if (totalEVs > maxEVs * 0.85) {
    barColor = 'bg-yellow-500'; // Approaching max
    textColor = 'text-yellow-300';
  }


  return (
    <div className="my-4 p-4 bg-slate-700/70 rounded-lg shadow-inner">
      <div className="flex justify-between items-center mb-1.5">
        <h3 className="text-lg font-semibold text-slate-100">Total Target EVs Allocated</h3>
        <span className={`text-xl font-bold ${textColor}`}>
          {totalEVs} / {maxEVs}
        </span>
      </div>
      <div className="w-full bg-slate-600 rounded-full h-5 overflow-hidden shadow-md">
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out flex items-center justify-center text-xs font-medium text-white/80 ${barColor}`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={totalEVs}
          aria-valuemin={0}
          aria-valuemax={maxEVs}
          aria-label="Total EVs allocated"
        >
         {/* {percentage > 10 ? `${Math.round(percentage)}%` : ''} */}
        </div>
      </div>
      {totalEVs > maxEVs && (
        <p className="text-red-400 text-xs mt-1.5 text-center font-medium">
          Total EVs exceed the maximum of {maxEVs}. Please adjust.
        </p>
      )}
       {totalEVs === maxEVs && totalEVs > 0 && (
        <p className="text-pokeRed text-xs mt-1.5 text-center font-semibold">
          Maximum total EVs reached!
        </p>
      )}
    </div>
  );
};

export default TotalEVBar;
