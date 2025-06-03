
import React from 'react';
import { MAX_TOTAL_EVS } from '../constants'; // MAX_TOTAL_EVS is imported for direct use here

interface TotalEVBarProps {
  totalEVs: number;
  maxEVs: number; // Should be MAX_TOTAL_EVS from constants
}

const TotalEVBar: React.FC<TotalEVBarProps> = ({ totalEVs, maxEVs }) => {
  const percentage = Math.min((totalEVs / maxEVs) * 100, 100); // Cap at 100% for display

  let barColor = 'bg-green-500'; // Default green
  if (totalEVs > maxEVs * 0.90 && totalEVs <= maxEVs) {
    barColor = 'bg-yellow-500'; // Yellow when approaching max
  } else if (totalEVs > maxEVs) {
    barColor = 'bg-red-600'; // Red if somehow over (logic should prevent this state)
  }
   if (totalEVs === maxEVs) {
    barColor = 'bg-pokeRed'; // Distinct red for exactly at max
  }


  return (
    <div className="my-4 p-4 bg-slate-700 rounded-lg shadow">
      <div className="flex justify-between items-center mb-1">
        <h3 className="text-lg font-semibold text-slate-100">Total Target EVs</h3>
        <span className={`text-lg font-bold ${totalEVs > maxEVs ? 'text-red-400' : 'text-slate-200'}`}>
          {totalEVs} / {maxEVs}
        </span>
      </div>
      <div className="w-full bg-slate-600 rounded-full h-4 overflow-hidden shadow-inner">
        <div
          className={`h-4 rounded-full transition-all duration-300 ease-out ${barColor}`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={totalEVs}
          aria-valuemin={0}
          aria-valuemax={maxEVs}
          aria-label="Total EVs allocated"
        ></div>
      </div>
      {totalEVs > maxEVs && (
        <p className="text-red-400 text-xs mt-1 text-center">
          Total EVs exceed the maximum of {maxEVs}. Please adjust.
        </p>
      )}
       {totalEVs === maxEVs && (
        <p className="text-pokeRed text-xs mt-1 text-center font-semibold">
          Maximum total EVs reached!
        </p>
      )}
    </div>
  );
};

export default TotalEVBar;
