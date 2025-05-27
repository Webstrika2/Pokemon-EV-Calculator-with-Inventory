import React, { useState, useCallback, useMemo } from 'react';
import { Stat, StatsTable, Inventory, CalculationResult, Item, UsedOwnedItemDetail, SuggestedPurchaseDetail, StatCalculationDetail } from './types';
import { STAT_ORDER, MAX_EV_PER_STAT, MAX_TOTAL_EVS, ITEMS, INITIAL_TARGET_EVS, INITIAL_CURRENT_EVS, INITIAL_INVENTORY, VITAMIN_COST, INITIAL_POKE_DOLLARS, INITIAL_LEAGUE_POINTS, getItemById } from './constants';
import StatInput from './components/StatInput';
import InventoryItemInput from './components/InventoryItemInput';
import CollapsibleSection from './components/CollapsibleSection';
import ResultsDisplay from './components/ResultsDisplay';
import TotalEVBar from './components/TotalEVBar';
import CurrencyInputs from './components/CurrencyInputs';

const App: React.FC = () => {
  const [targetEVs, setTargetEVs] = useState<StatsTable>({...INITIAL_TARGET_EVS});
  const [currentEVs, setCurrentEVs] = useState<StatsTable>({...INITIAL_CURRENT_EVS});
  const [inventory, setInventory] = useState<Inventory>({...INITIAL_INVENTORY});
  const [pokeDollars, setPokeDollars] = useState<number>(INITIAL_POKE_DOLLARS);
  const [leaguePoints, setLeaguePoints] = useState<number>(INITIAL_LEAGUE_POINTS);
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);

  const totalTargetEVs = useMemo(() => {
    return STAT_ORDER.reduce((sum, stat) => sum + targetEVs[stat], 0);
  }, [targetEVs]);

  const isTotalEVsMaxed = useMemo(() => totalTargetEVs >= MAX_TOTAL_EVS, [totalTargetEVs]);

  const handleTargetEVChange = useCallback((stat: Stat, value: number) => {
    setTargetEVs(prev => {
      const newTargets = { ...prev, [stat]: value };
      let currentTotalConsideringNewValue = STAT_ORDER.reduce((sum, s) => sum + (s === stat ? value : prev[s]), 0);

      if (currentTotalConsideringNewValue > MAX_TOTAL_EVS) {
        const overflow = currentTotalConsideringNewValue - MAX_TOTAL_EVS;
        newTargets[stat] = Math.max(0, value - overflow);
      }
      return newTargets;
    });
    setCalculationResult(null); // Clear results on EV change
  }, []);

  const handleCurrentEVChange = useCallback((stat: Stat, value: number) => {
    setCurrentEVs(prev => ({ ...prev, [stat]: value }));
    setCalculationResult(null); // Clear results
  }, []);

  const handleInventoryChange = useCallback((itemId: string, quantity: number) => {
    setInventory(prev => ({ ...prev, [itemId]: quantity }));
    setCalculationResult(null); // Clear results
  }, []);

  const handleCurrencyChange = useCallback((type: 'pokeDollars' | 'leaguePoints', value: number) => {
    if (type === 'pokeDollars') {
      setPokeDollars(Math.max(0, value));
    } else {
      setLeaguePoints(Math.max(0, value));
    }
    setCalculationResult(null); // Clear results
  }, []);
  
  const resetTargetEVs = useCallback(() => {
    const zeroEVs = STAT_ORDER.reduce((acc, stat) => {
        acc[stat] = 0;
        return acc;
    }, {} as StatsTable);
    setTargetEVs(zeroEVs);
    setCalculationResult(null);
  }, []);


  const calculateOptimalUsage = useCallback(() => {
    let tempInventory = { ...inventory };
    const warnings: string[] = [];

    const statDetailsInitialize: Record<Stat, StatCalculationDetail> = STAT_ORDER.reduce((acc, stat) => {
        const initialNeed = Math.max(0, targetEVs[stat] - currentEVs[stat]);
        acc[stat] = {
            targetEV: targetEVs[stat],
            currentEV: currentEVs[stat],
            initialNeed: initialNeed,
            evsGainedFromOwned: 0,
            usedOwnedItems: [],
            evsGainedFromAffordablePurchases: 0,
            suggestedPurchases: [],
            finalEVs: currentEVs[stat], // Start with current
            evsStillNeeded: initialNeed,
        };
        return acc;
    }, {} as Record<Stat, StatCalculationDetail>);

    const workingStatDetails = JSON.parse(JSON.stringify(statDetailsInitialize)) as Record<Stat, StatCalculationDetail>;

    // Phase 1: Use existing inventory
    ['Vitamin', 'Mochi', 'Feather'].forEach(category => {
      ITEMS.filter(item => item.category === category).forEach(item => {
        const stat = item.affectedStat;
        if (workingStatDetails[stat].evsStillNeeded <= 0) return;

        let itemsAvailable = tempInventory[item.id] || 0;
        if (itemsAvailable <= 0) return;

        let itemsToUseForStat: number;
        if (item.evGain === 1) { // Feathers - use as many as needed or available
            itemsToUseForStat = Math.min(workingStatDetails[stat].evsStillNeeded, itemsAvailable);
        } else { // Vitamins or Mochi - use whole items
            itemsToUseForStat = Math.min(Math.floor(workingStatDetails[stat].evsStillNeeded / item.evGain), itemsAvailable);
        }

        if (itemsToUseForStat > 0) {
          const gainedEVs = itemsToUseForStat * item.evGain;
          workingStatDetails[stat].evsGainedFromOwned += gainedEVs;
          workingStatDetails[stat].usedOwnedItems.push({ itemId: item.id, itemName: item.name, quantity: itemsToUseForStat, evsGained: gainedEVs });
          workingStatDetails[stat].finalEVs += gainedEVs;
          workingStatDetails[stat].evsStillNeeded -= gainedEVs;
          tempInventory[item.id] = itemsAvailable - itemsToUseForStat;
        }
      });
    });
    
    // Phase 2: Determine purchase needs for Vitamins if still needed
    let totalPurchaseCostAllSuggestions = 0;

    STAT_ORDER.forEach(stat => {
        if (workingStatDetails[stat].evsStillNeeded > 0) {
            const vitaminForItem = ITEMS.find(item => item.category === 'Vitamin' && item.affectedStat === stat);
            if (vitaminForItem) {
                const vitaminsNeededCount = Math.ceil(workingStatDetails[stat].evsStillNeeded / vitaminForItem.evGain);
                if (vitaminsNeededCount > 0) {
                    const cost = vitaminsNeededCount * VITAMIN_COST;
                    const evsGainedThisPurchase = vitaminsNeededCount * vitaminForItem.evGain;
                    workingStatDetails[stat].suggestedPurchases.push({
                        itemId: vitaminForItem.id,
                        itemName: vitaminForItem.name,
                        costPerItem: VITAMIN_COST,
                        quantitySuggested: vitaminsNeededCount,
                        totalCostSuggested: cost,
                        evsGainedIfFullyPurchased: evsGainedThisPurchase,
                        quantityAffordable: 0, // Initialize, will be calculated in Phase 3
                        costPaid: 0,
                        evsGainedFromThisPurchase: 0,
                        isPartialPurchase: false,
                        quantityStillNeeded: vitaminsNeededCount, // Initially, all are needed
                        costForStillNeeded: cost,
                    });
                    totalPurchaseCostAllSuggestions += cost;
                }
            }
        }
    });
    
    // Phase 3: Financial Calculation & applying affordable purchases
    let currentPokeDollars = pokeDollars;
    let currentLeaguePoints = leaguePoints;
    let totalCostAffordablePurchases = 0;
    
    STAT_ORDER.forEach(stat => {
        workingStatDetails[stat].suggestedPurchases.forEach(purchase => {
            if (purchase.quantitySuggested === 0) return; // Already handled or no purchase needed

            const currentTotalCurrency = currentPokeDollars + currentLeaguePoints;
            const maxAffordableForThisItem = Math.floor(currentTotalCurrency / purchase.costPerItem);
            
            purchase.quantityAffordable = Math.min(purchase.quantitySuggested, maxAffordableForThisItem);

            if (purchase.quantityAffordable > 0) {
                purchase.costPaid = purchase.quantityAffordable * purchase.costPerItem;
                const itemDetails = getItemById(purchase.itemId);
                if (itemDetails) {
                     purchase.evsGainedFromThisPurchase = purchase.quantityAffordable * itemDetails.evGain;
                }


                workingStatDetails[stat].evsGainedFromAffordablePurchases += purchase.evsGainedFromThisPurchase;
                workingStatDetails[stat].finalEVs += purchase.evsGainedFromThisPurchase;
                totalCostAffordablePurchases += purchase.costPaid;

                // Deduct from currency pools (Poké Dollars first)
                let costRemainingForThisPurchasePayment = purchase.costPaid;
                const spentPokeDollars = Math.min(costRemainingForThisPurchasePayment, currentPokeDollars);
                currentPokeDollars -= spentPokeDollars;
                costRemainingForThisPurchasePayment -= spentPokeDollars;
                
                const spentLeaguePoints = Math.min(costRemainingForThisPurchasePayment, currentLeaguePoints);
                currentLeaguePoints -= spentLeaguePoints;

                if (purchase.quantityAffordable < purchase.quantitySuggested) {
                    purchase.isPartialPurchase = true;
                }
            }
            
            // Update still needed based on what was affordable for THIS specific suggestion
            purchase.quantityStillNeeded = purchase.quantitySuggested - purchase.quantityAffordable;
            purchase.costForStillNeeded = purchase.quantityStillNeeded * purchase.costPerItem;
        });
         // After iterating all purchases for a stat, update its evsStillNeeded based on affordable ones
        workingStatDetails[stat].evsStillNeeded = Math.max(0, workingStatDetails[stat].targetEV - workingStatDetails[stat].finalEVs);
    });

    let totalAdditionalCurrencyNeededToMeetAllGoals = 0;
    STAT_ORDER.forEach(stat => {
        workingStatDetails[stat].suggestedPurchases.forEach(purchase => {
            if (purchase.quantityStillNeeded > 0) {
                totalAdditionalCurrencyNeededToMeetAllGoals += purchase.costForStillNeeded;
            }
        });
    });
    
    const canAffordAllSuggestedPurchases = totalAdditionalCurrencyNeededToMeetAllGoals === 0;

    // Phase 4: Final messages
    let overallStatusMessage = "";
    const allGoalsMetBasedOnFinalEVs = STAT_ORDER.every(stat => workingStatDetails[stat].evsStillNeeded === 0 || workingStatDetails[stat].initialNeed <= 0);
    const anyChangeMade = STAT_ORDER.some(stat => workingStatDetails[stat].evsGainedFromOwned > 0 || workingStatDetails[stat].evsGainedFromAffordablePurchases > 0);
    const anyVitaminsWereSuggested = totalPurchaseCostAllSuggestions > 0;
    const anyVitaminsActuallyBought = totalCostAffordablePurchases > 0;


    if (STAT_ORDER.every(stat => workingStatDetails[stat].initialNeed <= 0)) {
        overallStatusMessage = "Targets match current EVs or require no increase. No items needed.";
    } else if (allGoalsMetBasedOnFinalEVs) {
        if (anyVitaminsActuallyBought) {
            overallStatusMessage = "Success! All EV goals met using your items and affordable purchases.";
        } else if (anyChangeMade) { // Goals met with owned items only
            overallStatusMessage = "Success! All EV goals met using items from your inventory.";
        } else { // Goals were already met (initialNeed <= 0 for all), but target might have been non-zero
             overallStatusMessage = "Success! All EV goals already met.";
        }
    } else { // Not all goals met
        overallStatusMessage = "Could not meet all EV goals. See breakdown below.";
        if (anyVitaminsWereSuggested && !canAffordAllSuggestedPurchases) {
             warnings.push(`Some vitamin purchases could not be fully completed. You need an additional ${totalAdditionalCurrencyNeededToMeetAllGoals.toLocaleString()} for all suggested vitamins.`);
        }
         STAT_ORDER.forEach(stat => {
            if(workingStatDetails[stat].evsStillNeeded > 0 && workingStatDetails[stat].initialNeed > 0) {
                 warnings.push(`For ${stat}, ${workingStatDetails[stat].evsStillNeeded} EVs are still needed.`);
            }
        });
         if (warnings.length === 0 && !allGoalsMetBasedOnFinalEVs) { // Generic fallback if no specific purchase/stat warning was added
             warnings.push("Some EV goals remain unmet. This might be due to item unavailability or insufficient currency for all needs.");
         }
    }
    
    setCalculationResult({
      statDetails: workingStatDetails,
      totalPurchaseCostAllSuggestions,
      totalCostAffordablePurchases,
      totalAdditionalCurrencyNeededToMeetAllGoals,
      canAffordAllSuggestedPurchases,
      pokeDollarsAfterAffordablePurchases: currentPokeDollars,
      leaguePointsAfterAffordablePurchases: currentLeaguePoints,
      warnings,
      overallStatusMessage,
      targetEVs: targetEVs,
      currentEVs: currentEVs,
    });

  }, [targetEVs, currentEVs, inventory, pokeDollars, leaguePoints]);

  const itemCategories = useMemo(() => {
    const categories: { [key: string]: Item[] } = {
        Vitamins: [],
        Mochi: [],
        Feathers: [],
    };
    ITEMS.forEach(item => {
        if (item.category === 'Vitamin') categories.Vitamins.push(item);
        else if (item.category === 'Mochi') categories.Mochi.push(item);
        else if (item.category === 'Feather') categories.Feathers.push(item);
    });
    // Ensure vitamins are in the specified order for display
    const vitaminOrder = ['hp-up', 'protein', 'iron', 'carbos', 'calcium', 'zinc'];
    categories.Vitamins.sort((a,b) => vitaminOrder.indexOf(a.id) - vitaminOrder.indexOf(b.id));
    return categories;
  }, []);

  return (
    <div className="min-h-screen container mx-auto p-4 flex flex-col items-center">
      <header className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold text-pokeYellow tracking-tight">Pokémon EV Calculator</h1>
        <p className="text-slate-300 mt-2 text-sm sm:text-base">Optimize Effort Values with your items and currency!</p>
      </header>

      <div className="w-full max-w-5xl space-y-8">
        <section className="p-5 sm:p-6 bg-slate-800 rounded-xl shadow-2xl">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-3">
            <h2 className="text-2xl sm:text-3xl font-semibold text-slate-100 mb-2 sm:mb-0">EV Configuration</h2>
            <button
                onClick={resetTargetEVs}
                className="px-4 py-2 bg-pokeRed/80 hover:bg-pokeRed text-white text-xs font-semibold rounded-md shadow-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75"
                aria-label="Reset all target EVs to zero"
            >
                Reset All Target EVs
            </button>
          </div>
          <p className="text-sm text-slate-400 mb-4">Set your Pokémon's current EVs and desired target EVs.</p>
          
          <TotalEVBar totalEVs={totalTargetEVs} maxEVs={MAX_TOTAL_EVS} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {STAT_ORDER.map(stat => (
              <StatInput
                key={stat}
                stat={stat}
                currentEV={currentEVs[stat]}
                targetEV={targetEVs[stat]}
                onCurrentEVChange={handleCurrentEVChange}
                onTargetEVChange={handleTargetEVChange}
                totalTargetEVs={totalTargetEVs}
                isTotalEVsMaxed={isTotalEVsMaxed}
              />
            ))}
          </div>
        </section>
        
        <CurrencyInputs
            pokeDollars={pokeDollars}
            leaguePoints={leaguePoints}
            onCurrencyChange={handleCurrencyChange}
        />

        <section>
           <h2 className="text-2xl sm:text-3xl font-semibold mb-4 text-slate-100 text-center">Your Inventory</h2>
          {Object.entries(itemCategories).map(([categoryName, items]) => {
            if (items.length === 0) return null;
            const categoryEmoji = items[0].category === 'Vitamin' ? '🧪' : items[0].category === 'Mochi' ? '🍡' : '🪶';
            return (
            <CollapsibleSection key={categoryName} title={`${categoryName} ${categoryEmoji}`} defaultOpen={categoryName === 'Vitamins'}>
              <div className="space-y-2">
              {items.map(item => (
                <InventoryItemInput
                  key={item.id}
                  item={item}
                  quantity={inventory[item.id] || 0}
                  onQuantityChange={handleInventoryChange}
                />
              ))}
              </div>
            </CollapsibleSection>
          )})}
        </section>

        <button
          onClick={calculateOptimalUsage}
          className="w-full py-3.5 px-6 bg-pokeBlue hover:bg-blue-600 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all duration-150 text-lg focus:outline-none focus:ring-4 focus:ring-blue-400 focus:ring-opacity-50 active:bg-blue-700"
          aria-label="Calculate optimal item usage based on inventory and currency"
        >
          Calculate Optimal Item Usage
        </button>

        {calculationResult && <ResultsDisplay result={calculationResult} />}
      </div>
       <footer className="text-center mt-16 py-6 border-t border-slate-700">
        <p className="text-sm text-slate-500">Pokémon EV Calculator. Pokémon and Pokémon character names are trademarks of Nintendo.</p>
        <p className="text-xs text-slate-600 mt-1">Vitamin cost: {VITAMIN_COST.toLocaleString()} Poké Dollars or League Points each.</p>
      </footer>
    </div>
  );
};

export default App;