
import { useState, useCallback, useEffect } from 'react';
import { CalculationResult, StatsTable, Inventory, Item, VITAMIN_COST } from '../types'; 
import { STAT_ORDER, ITEMS, MAX_TOTAL_EVS, INITIAL_CURRENT_EVS, MAX_EV_PER_STAT, INITIAL_INVENTORY } from '../constants'; 
import { parseCurrency } from '../utils/helpers';

export interface CalculationParams { // Export for App.tsx
  targetEVs: StatsTable;
  currentEVs: StatsTable;
  inventory: Inventory;
  leaguePointsInput: string;
  pokeDollarsInput: string;
  currencyPriority: 'lp' | 'pd';
  itemSortOrders: Record<Item['category'], string[]>;
  setInventory: React.Dispatch<React.SetStateAction<Inventory>>;
  setLeaguePointsInput: React.Dispatch<React.SetStateAction<string>>;
  setPokeDollarsInput: React.Dispatch<React.SetStateAction<string>>;
  setGlobalParseMessage: React.Dispatch<React.SetStateAction<string | null>>;
  setGlobalQuickUpdateMessages: React.Dispatch<React.SetStateAction<Record<Item['category'], string | null>>>;
  setGlobalOcrMessage: React.Dispatch<React.SetStateAction<string | null>>;
  setGlobalVoiceInputMessage: React.Dispatch<React.SetStateAction<string | null>>;
}

const initialQuickUpdateMessages: Record<Item['category'], string | null> = {
  'Vitamin': null, Mochi: null, Feather: null,
};


const calculateLogic = (params: CalculationParams): CalculationResult => {
    const currentLP = parseCurrency(params.leaguePointsInput);
    const currentPD = parseCurrency(params.pokeDollarsInput);
    let tempInventory = { ...params.inventory };
    const itemsToUseFromInventory: Record<string, number> = {};
    const itemUsageDetails: CalculationResult['itemUsageDetails'] = [];
    const evsGainedPerStat: StatsTable = STAT_ORDER.reduce((acc, stat) => { acc[stat] = 0; return acc; }, {} as StatsTable);
    const localWarnings: string[] = [];

    STAT_ORDER.forEach(stat => {
        let evsNeededForStat = Math.max(0, params.targetEVs[stat] - params.currentEVs[stat]);
        if (evsNeededForStat === 0) return;

        const categoryOfStat = ITEMS.find(item => item.affectedStat === stat)?.category;
        let itemsForStatConsideration: Item[] = [];
        // Prioritize items based on current sort order for that category if defined, then by EV gain
        const itemsToConsiderForStat = ITEMS.filter(item => item.affectedStat === stat);

        if (categoryOfStat && params.itemSortOrders[categoryOfStat]) {
          const orderedIds = params.itemSortOrders[categoryOfStat];
          // Map IDs to items, preserving order, then append any missing items (e.g., if a new item was added to constants)
          const orderedItems = orderedIds.map(id => itemsToConsiderForStat.find(i => i.id === id)).filter(Boolean) as Item[];
          const remainingItems = itemsToConsiderForStat.filter(i => !orderedIds.includes(i.id));
          itemsForStatConsideration = [...orderedItems, ...remainingItems];
        } else {
          itemsForStatConsideration = [...itemsToConsiderForStat];
        }
        
        // Further sort by EV gain (desc) as a secondary criteria within the established order (if any)
        // This sort primarily affects items if no specific user order is set for a category,
        // or if items within the user's order have same EV gain.
        // The primary sort by user preference from itemSortOrders should be done before this.
        // The current logic gets items for the stat, then applies user order.
        // Let's refine: get all items for stat, sort them by default (EV gain, then type), then apply user order *if available*.
        // Actually, the current logic in calculateLogic for `itemsForStat` is better:
        // It gets user-ordered items if available, OR all items for that stat.
        // Then it sorts *that list* by EV gain. This is correct.

        const itemsForStat = itemsForStatConsideration.sort((a, b) => {
                if (a.evGain !== b.evGain) return b.evGain - a.evGain; 
                if (a.category === 'Vitamin' && b.category !== 'Vitamin') return -1;
                if (a.category !== 'Vitamin' && b.category === 'Vitamin') return 1;
                return 0; 
            });

        for (const item of itemsForStat) {
            if (evsNeededForStat <= 0) break;
            let itemsAvailable = tempInventory[item.id] || 0;
            if (itemsAvailable === 0) continue;
            if (item.evGain === 0) continue; 
            
            const itemsToUseCount = Math.min(Math.floor(evsNeededForStat / item.evGain), itemsAvailable);
            if (itemsToUseCount > 0) {
                const gainedEVs = itemsToUseCount * item.evGain;
                evsGainedPerStat[stat] += gainedEVs;
                evsNeededForStat -= gainedEVs;
                tempInventory[item.id] = itemsAvailable - itemsToUseCount;
                itemsToUseFromInventory[item.id] = (itemsToUseFromInventory[item.id] || 0) + itemsToUseCount;
                itemUsageDetails.push({ stat, itemName: item.name, quantity: itemsToUseCount, evsGained: gainedEVs, source: 'inventory' });
            }
        }
    });
    
    const vitaminsToPurchaseDict: Record<string, number> = {};
    let totalPurchaseCost = 0;
    let purchaseAttempted = false;

    STAT_ORDER.forEach(stat => {
        let evsStillNeededAfterInventory = Math.max(0, (params.targetEVs[stat] - params.currentEVs[stat]) - evsGainedPerStat[stat]);
        if (evsStillNeededAfterInventory <= 0) return;
        const vitaminForItem = ITEMS.find(item => item.category === 'Vitamin' && item.affectedStat === stat);
        if (vitaminForItem && vitaminForItem.evGain > 0) {
             const numVitaminsToBuy = Math.ceil(evsStillNeededAfterInventory / vitaminForItem.evGain);
             if (numVitaminsToBuy > 0) {
                purchaseAttempted = true;
                vitaminsToPurchaseDict[vitaminForItem.id] = (vitaminsToPurchaseDict[vitaminForItem.id] || 0) + numVitaminsToBuy;
                totalPurchaseCost += numVitaminsToBuy * VITAMIN_COST;
             }
        }
    });

    let finalEvsGainedPerStat = { ...evsGainedPerStat };
    let finalItemsToUse = { ...itemsToUseFromInventory };
    let finalItemUsageDetails = [...itemUsageDetails];
    let remainingLP = currentLP;
    let remainingPD = currentPD;
    let monetaryShortfall: number | undefined = undefined;
    let itemShortfall: Record<string, number> | undefined = undefined;
    let fundsUsed = { lp: 0, pd: 0 };
    let overallStatusMessage = "";
    const totalEVsToGainInitially = STAT_ORDER.reduce((sum, stat) => sum + Math.max(0, params.targetEVs[stat] - params.currentEVs[stat]), 0);

    if (totalPurchaseCost > 0 && (currentLP + currentPD) >= totalPurchaseCost) { 
        let costRemaining = totalPurchaseCost;
        if (params.currencyPriority === 'lp') {
            const lpToUse = Math.min(costRemaining, currentLP);
            remainingLP -= lpToUse; costRemaining -= lpToUse; fundsUsed.lp = lpToUse;
            if (costRemaining > 0) {
                const pdToUse = Math.min(costRemaining, currentPD);
                remainingPD -= pdToUse; fundsUsed.pd = pdToUse;
            }
        } else { 
            const pdToUse = Math.min(costRemaining, currentPD);
            remainingPD -= pdToUse; costRemaining -= pdToUse; fundsUsed.pd = pdToUse;
            if (costRemaining > 0) {
                const lpToUse = Math.min(costRemaining, currentLP);
                remainingLP -= lpToUse; fundsUsed.lp = lpToUse;
            }
        }
        for (const itemId in vitaminsToPurchaseDict) {
            const item = ITEMS.find(i => i.id === itemId)!;
            const quantity = vitaminsToPurchaseDict[itemId];
            const evsGainedFromPurchase = quantity * item.evGain;
            finalEvsGainedPerStat[item.affectedStat] += evsGainedFromPurchase;
            finalItemsToUse[itemId] = (finalItemsToUse[itemId] || 0) + quantity; 
            finalItemUsageDetails.push({ stat: item.affectedStat, itemName: item.name, quantity, evsGained: evsGainedFromPurchase, source: 'purchase' });
        }
    } else if (totalPurchaseCost > 0) { 
        monetaryShortfall = totalPurchaseCost - (currentLP + currentPD);
        itemShortfall = vitaminsToPurchaseDict; 
        localWarnings.push(`You are short ${monetaryShortfall.toLocaleString()} LP/$ for required Vitamins.`);
    }

    const evsStillNeeded: StatsTable = STAT_ORDER.reduce((acc, stat) => {
        acc[stat] = Math.max(0, (params.targetEVs[stat] - params.currentEVs[stat]) - finalEvsGainedPerStat[stat]);
        return acc;
    }, {} as StatsTable);
    let allGoalsMet = STAT_ORDER.every(stat => evsStillNeeded[stat] === 0);

    if (totalEVsToGainInitially === 0) overallStatusMessage = "No EV changes targeted or goals already met. No items needed.";
    else if (!purchaseAttempted && allGoalsMet && finalItemUsageDetails.length === 0) overallStatusMessage = "EV goals already met. No items needed.";
    else if (!purchaseAttempted && allGoalsMet && finalItemUsageDetails.length > 0) overallStatusMessage = "Successfully calculated item usage from inventory!";
    else if (purchaseAttempted && monetaryShortfall === undefined && allGoalsMet) overallStatusMessage = "Successfully calculated item usage, including purchases!";
    else if (purchaseAttempted && monetaryShortfall !== undefined) overallStatusMessage = "Insufficient funds to purchase all needed Vitamins.";
    else if (!allGoalsMet && !purchaseAttempted) overallStatusMessage = "Could not meet all EV goals with available inventory.";
    else if (!allGoalsMet && purchaseAttempted && monetaryShortfall === undefined) overallStatusMessage = "Met some EV goals with purchases, but some targets still not fully achieved.";
    
    STAT_ORDER.forEach(stat => {
        if (evsStillNeeded[stat] > 0) localWarnings.push(`Still need ${evsStillNeeded[stat]} EVs for ${stat}.`);
    });
    
    return {
        itemsToUse: finalItemsToUse, itemUsageDetails: finalItemUsageDetails, remainingInventory: tempInventory, 
        evsGainedPerStat: finalEvsGainedPerStat, evsStillNeeded, warnings: localWarnings, overallStatusMessage,
        vitaminsToPurchase: (monetaryShortfall === undefined && totalPurchaseCost > 0) ? vitaminsToPurchaseDict : undefined,
        totalPurchaseCost: (totalPurchaseCost > 0) ? totalPurchaseCost : undefined,
        fundsUsed: (monetaryShortfall === undefined && totalPurchaseCost > 0) ? fundsUsed : undefined, 
        remainingLeaguePoints: (monetaryShortfall === undefined && totalPurchaseCost > 0) ? remainingLP : currentLP,
        remainingPokeDollars: (monetaryShortfall === undefined && totalPurchaseCost > 0) ? remainingPD : currentPD,
        monetaryShortfall, itemShortfall, purchaseAttempted
    };
};


export const useCalculation = () => {
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [subtractItemsAfterCalc, setSubtractItemsAfterCalc] = useState<boolean>(false);
  const [calcEffectParams, setCalcEffectParams] = useState<Partial<CalculationParams> | null>(null);


  const handleCalculateButtonClick = useCallback((params: CalculationParams) => {
    // Clear global messages first
    params.setGlobalParseMessage(null);
    params.setGlobalQuickUpdateMessages(initialQuickUpdateMessages);
    // Assuming OCR and Voice messages are handled by their respective hooks / App.tsx based on activity
    // params.setGlobalOcrMessage(null); // Or a default "ready" message if OCR engine is fine
    // params.setGlobalVoiceInputMessage(null);
    
    setIsCalculating(true);
    setCalcEffectParams(params); // Store params for the subtraction effect

    // Use setTimeout to allow UI to update to "Calculating..." state
    setTimeout(() => {
      try {
        const result = calculateLogic(params);
        setCalculationResult(result);
      } catch (error) {
        console.error("Error during calculation:", error);
        params.setGlobalParseMessage("❌ An unexpected error occurred during calculation.");
        setCalculationResult(null);
      } finally {
        setIsCalculating(false);
      }
    }, 0);
  }, []);


  useEffect(() => {
    if (calculationResult && subtractItemsAfterCalc && calcEffectParams) {
        const { inventory, leaguePointsInput, pokeDollarsInput, setInventory, setLeaguePointsInput, setPokeDollarsInput, setGlobalParseMessage } = calcEffectParams;
        if (!setInventory || !setLeaguePointsInput || !setPokeDollarsInput || !setGlobalParseMessage || !inventory || leaguePointsInput === undefined || pokeDollarsInput === undefined) return;

        let messages: string[] = [];
        let inventoryWasChanged = false;
        let fundsWereChanged = false;

        if (calculationResult.itemUsageDetails.some(d => d.source === 'inventory' && d.quantity > 0) && calculationResult.remainingInventory) {
            let newInventoryRequired = false;
            const newInventoryState: Inventory = { ...INITIAL_INVENTORY }; // Start with a clean slate of all possible items at 0
            
            // Populate with actual remaining quantities
            for (const item of ITEMS) {
                const newQty = calculationResult.remainingInventory[item.id] !== undefined 
                               ? Math.max(0, calculationResult.remainingInventory[item.id]) 
                               : (inventory[item.id] || 0); // If not touched by calc, keep original or 0
                newInventoryState[item.id] = newQty;
                if (inventory[item.id] !== newQty) newInventoryRequired = true;
            }

            if (newInventoryRequired) { setInventory(newInventoryState); inventoryWasChanged = true; }
        }

        if (calculationResult.purchaseAttempted && calculationResult.monetaryShortfall === undefined &&
            calculationResult.fundsUsed && calculationResult.remainingLeaguePoints !== undefined && 
            calculationResult.remainingPokeDollars !== undefined) {
            const currentStoredLP = parseCurrency(leaguePointsInput);
            const currentStoredPD = parseCurrency(pokeDollarsInput);
            if (calculationResult.remainingLeaguePoints !== currentStoredLP) {
                setLeaguePointsInput(calculationResult.remainingLeaguePoints.toString()); fundsWereChanged = true; 
            }
            if (calculationResult.remainingPokeDollars !== currentStoredPD) {
                setPokeDollarsInput(calculationResult.remainingPokeDollars.toString()); fundsWereChanged = true; 
            }
        }
        
        if (inventoryWasChanged) messages.push("ℹ️ Inventory updated based on used items.");
        if (fundsWereChanged) messages.push("💰 Player funds updated after purchases.");
        if (messages.length > 0) setGlobalParseMessage(messages.join(" "));
    }
  }, [calculationResult, subtractItemsAfterCalc, calcEffectParams]);

  return {
    calculationResult,
    setCalculationResult, 
    isCalculating,
    subtractItemsAfterCalc,
    setSubtractItemsAfterCalc,
    handleCalculateButtonClick, 
  };
};
