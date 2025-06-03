
import { useState, useCallback } from 'react';

type SetCalculationResultType = React.Dispatch<React.SetStateAction<any | null>>;

export const useCurrency = (setCalculationResult: SetCalculationResultType) => {
  const [leaguePointsInput, setLeaguePointsInput] = useState<string>("");
  const [pokeDollarsInput, setPokeDollarsInput] = useState<string>("");
  const [currencyPriority, setCurrencyPriority] = useState<'lp' | 'pd'>('lp');

  const handleCurrencyChange = useCallback((setter: React.Dispatch<React.SetStateAction<string>>) => (value: string) => {
    setter(value);
    setCalculationResult(null);
  }, [setCalculationResult]);

  return {
    leaguePointsInput,
    setLeaguePointsInput, // Expose for calculation hook
    pokeDollarsInput,
    setPokeDollarsInput, // Expose for calculation hook
    currencyPriority,
    setCurrencyPriority,
    handleCurrencyChange,
  };
};
