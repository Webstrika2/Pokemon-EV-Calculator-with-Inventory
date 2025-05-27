import React, { useState, useEffect } from 'react';
import { VITAMIN_COST } from '../constants';

interface CurrencyInputsProps {
  pokeDollars: number;
  leaguePoints: number;
  onCurrencyChange: (type: 'pokeDollars' | 'leaguePoints', value: number) => void;
}

const CurrencyInputs: React.FC<CurrencyInputsProps> = ({ pokeDollars, leaguePoints, onCurrencyChange }) => {
  const [pokeDollarsInput, setPokeDollarsInput] = useState(pokeDollars.toString());
  const [leaguePointsInput, setLeaguePointsInput] = useState(leaguePoints.toString());

  useEffect(() => {
    if (parseInt(pokeDollarsInput, 10) !== pokeDollars) {
        setPokeDollarsInput(pokeDollars.toString());
    }
  }, [pokeDollars]);

  useEffect(() => {
     if (parseInt(leaguePointsInput, 10) !== leaguePoints) {
        setLeaguePointsInput(leaguePoints.toString());
    }
  }, [leaguePoints]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'pokeDollars' | 'leaguePoints') => {
    const valStr = e.target.value;
    
    if (type === 'pokeDollars') {
      setPokeDollarsInput(valStr);
    } else {
      setLeaguePointsInput(valStr);
    }

    if (valStr === "") {
      onCurrencyChange(type, 0);
      return;
    }
    
    const value = parseInt(valStr, 10);
    if (!isNaN(value)) {
      onCurrencyChange(type, Math.max(0, value));
    }
  };
  
  const handleBlur = (type: 'pokeDollars' | 'leaguePoints') => {
    const currentInputValStr = type === 'pokeDollars' ? pokeDollarsInput : leaguePointsInput;
    const currentNumericVal = type === 'pokeDollars' ? pokeDollars : leaguePoints;

    if (currentInputValStr === "" || isNaN(parseInt(currentInputValStr, 10))) {
        if (type === 'pokeDollars') setPokeDollarsInput(currentNumericVal.toString());
        else setLeaguePointsInput(currentNumericVal.toString());
    } else {
         const value = parseInt(currentInputValStr, 10);
         if (!isNaN(value)) {
             const boundedValue = Math.max(0, value);
             if (boundedValue !== value) {
                 if (type === 'pokeDollars') setPokeDollarsInput(boundedValue.toString());
                 else setLeaguePointsInput(boundedValue.toString());
             }
         } else { // Should not happen if previous check is good
            if (type === 'pokeDollars') setPokeDollarsInput(currentNumericVal.toString());
            else setLeaguePointsInput(currentNumericVal.toString());
         }
    }
  };


  return (
    <section className="p-5 sm:p-6 bg-slate-800 rounded-xl shadow-2xl">
      <h2 className="text-2xl sm:text-3xl font-semibold mb-4 text-slate-100">Your Currencies</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div>
          <label htmlFor="pokeDollars" className="block text-sm font-medium text-slate-300 mb-1.5">Poké Dollars ($)</label>
          <input
            type="text" // text for better UX
            inputMode="numeric"
            id="pokeDollars"
            name="pokeDollars"
            value={pokeDollarsInput}
            onChange={(e) => handleInputChange(e, 'pokeDollars')}
            onBlur={() => handleBlur('pokeDollars')}
            className="w-full p-2.5 bg-slate-900/70 border border-slate-700 rounded-md text-sm focus:ring-pokeYellow focus:border-pokeYellow placeholder-slate-500"
            placeholder="e.g. 100000"
            aria-label="Poké Dollars"
          />
        </div>
        <div>
          <label htmlFor="leaguePoints" className="block text-sm font-medium text-slate-300 mb-1.5">League Points (LP)</label>
          <input
            type="text" // text for better UX
            inputMode="numeric"
            id="leaguePoints"
            name="leaguePoints"
            value={leaguePointsInput}
            onChange={(e) => handleInputChange(e, 'leaguePoints')}
            onBlur={() => handleBlur('leaguePoints')}
            className="w-full p-2.5 bg-slate-900/70 border border-slate-700 rounded-md text-sm focus:ring-pokeYellow focus:border-pokeYellow placeholder-slate-500"
            placeholder="e.g. 50000"
            aria-label="League Points"
          />
        </div>
      </div>
       <p className="text-xs text-slate-500 mt-4">Vitamins cost {VITAMIN_COST.toLocaleString()} of either currency.</p>
    </section>
  );
};

export default CurrencyInputs;
