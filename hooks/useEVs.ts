
import { useState, useCallback, useMemo } from 'react';
import { Stat, StatsTable } from '../types';
import { STAT_ORDER, MAX_EV_PER_STAT, MAX_TOTAL_EVS, INITIAL_TARGET_EVS, INITIAL_CURRENT_EVS } from '../constants';
import { parseEVString, EVParseResult } from '../utils/evParser'; // Import from new location

type SetCalculationResultType = React.Dispatch<React.SetStateAction<any | null>>; // Adjust 'any' to actual CalculationResult type if possible
type SetParseMessageType = React.Dispatch<React.SetStateAction<string | null>>;


export const useEVs = (
    setCalculationResult: SetCalculationResultType,
    setAppParseMessage: SetParseMessageType // To set global message in App.tsx
) => {
  const [targetEVs, setTargetEVs] = useState<StatsTable>(INITIAL_TARGET_EVS);
  const [currentEVs, setCurrentEVs] = useState<StatsTable>(INITIAL_CURRENT_EVS);
  const [evInputString, setEvInputString] = useState<string>("");
  const [parseMessage, setParseMessage] = useState<string | null>(null); // Local message for this hook

  const totalTargetEVs = useMemo(() => {
    return STAT_ORDER.reduce((sum, stat) => sum + targetEVs[stat], 0);
  }, [targetEVs]);

  const isTotalEVsMaxed = useMemo(() => totalTargetEVs >= MAX_TOTAL_EVS, [totalTargetEVs]);

  const handleTargetEVChange = useCallback((stat: Stat, value: number) => {
    setTargetEVs(prev => {
      const newTargets = { ...prev, [stat]: value };
      let currentTotalConsideringNewValue = STAT_ORDER.reduce((sum, s) => sum + newTargets[s], 0);
      if (currentTotalConsideringNewValue > MAX_TOTAL_EVS) {
        const overflow = currentTotalConsideringNewValue - MAX_TOTAL_EVS;
        newTargets[stat] = Math.max(0, newTargets[stat] - overflow);
      }
      return newTargets;
    });
    setAppParseMessage(null);
    setCalculationResult(null);
  }, [setAppParseMessage, setCalculationResult]);

  const handleCurrentEVChange = useCallback((stat: Stat, value: number) => {
    setCurrentEVs(prev => ({ ...prev, [stat]: value }));
    setCalculationResult(null);
  }, [setCalculationResult]);

  const handleParseAndApplyEVs = useCallback(() => {
    const { parsedEVs, message: parseAttemptMessage, rawFoundEVString } = parseEVString(evInputString);
    
    if (Object.keys(parsedEVs).length === 0 && evInputString.trim() !== "") {
        setParseMessage(`❌ ${parseAttemptMessage || "Could not parse EV string or no valid 'EVs:' line found. Please check format (e.g., 'EVs: 248 HP / 56 Def / 204 SpD')."}`);
        setAppParseMessage(`❌ ${parseAttemptMessage || "Could not parse EV string or no valid 'EVs:' line found. Please check format (e.g., 'EVs: 248 HP / 56 Def / 204 SpD')."}`);
        return;
    }
    if (Object.keys(parsedEVs).length === 0 && evInputString.trim() === "") {
        setParseMessage("❌ Input is empty. Please enter an EV string or Showdown import.");
        setAppParseMessage("❌ Input is empty. Please enter an EV string or Showdown import.");
        return;
    }

    let newTargetEVsState: StatsTable = STAT_ORDER.reduce((acc, stat) => {
      acc[stat] = 0; 
      return acc;
    }, {} as StatsTable);
    
    let currentTotal = 0;
    let appliedCount = 0;
    let localWarnings: string[] = [];

    STAT_ORDER.forEach(stat => {
        const valueFromParser = parsedEVs[stat] || 0;
        if (valueFromParser > 0) {
            if (currentTotal + valueFromParser <= MAX_TOTAL_EVS) {
                newTargetEVsState[stat] = valueFromParser;
                currentTotal += valueFromParser;
                appliedCount++;
            } else {
                const remainingCapacity = MAX_TOTAL_EVS - currentTotal;
                if (remainingCapacity > 0) {
                    newTargetEVsState[stat] = remainingCapacity;
                    currentTotal += remainingCapacity;
                    localWarnings.push(`Partially applied ${stat}: ${remainingCapacity} EVs (total limit ${MAX_TOTAL_EVS} reached).`);
                    appliedCount++;
                } else {
                   localWarnings.push(`Could not apply EVs for ${stat}: total limit of ${MAX_TOTAL_EVS} already reached.`);
                }
            }
        }
    });
    setTargetEVs(newTargetEVsState);

    let finalMessage = "";
    if (parseAttemptMessage) {
        finalMessage = `⚠️ ${parseAttemptMessage} `;
    }

    if (localWarnings.length > 0) {
        finalMessage += `EVs applied with adjustments: ${localWarnings.join(' ')}`;
    } else if (appliedCount > 0) {
        finalMessage = (finalMessage ? finalMessage + " " : "") + `✅ EVs successfully applied from ${rawFoundEVString ? `'${rawFoundEVString}'` : 'input'}!`;
    } else if (evInputString.trim() !== "" && Object.keys(parsedEVs).length > 0 ) { 
        finalMessage = (finalMessage ? finalMessage + " " : "") + "⚠️ Parsed string resulted in no EV changes (e.g., all values were 0 or became 0 due to limits).";
    } else if (evInputString.trim() !== "") { 
       finalMessage = (finalMessage ? finalMessage + " " : "") + "❌ Could not effectively apply EVs from the string. Please check format.";
    }
    
    const finalMsgToSet = finalMessage.trim() || null;
    setParseMessage(finalMsgToSet);
    setAppParseMessage(finalMsgToSet);
    
    if (Object.keys(parsedEVs).length > 0 || appliedCount > 0 || localWarnings.length > 0 || parseAttemptMessage) {
       setEvInputString(""); 
    }
    setCalculationResult(null);
  }, [evInputString, setCalculationResult, setAppParseMessage]);

  return {
    targetEVs,
    currentEVs,
    evInputString,
    setEvInputString,
    parseMessage, // This hook's local parse message
    setParseMessage, // Setter for local parse message (App.tsx might use setAppParseMessage instead)
    handleTargetEVChange,
    handleCurrentEVChange,
    handleParseAndApplyEVs,
    totalTargetEVs,
    isTotalEVsMaxed,
  };
};
