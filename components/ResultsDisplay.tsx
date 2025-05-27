import React from 'react';
import { CalculationResult, Stat, UsedOwnedItemDetail, SuggestedPurchaseDetail } from '../types';
import { STAT_ORDER, STAT_COLORS, STAT_TEXT_COLORS, getItemById } from '../constants';
import ItemIcon from './ItemIcon';

interface ResultsDisplayProps {
  result: CalculationResult | null;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ result }) => {
  if (!result) {
    return null;
  }

  const { 
    statDetails,
    totalPurchaseCostAllSuggestions,
    totalCostAffordablePurchases,
    totalAdditionalCurrencyNeededToMeetAllGoals,
    canAffordAllSuggestedPurchases,
    pokeDollarsAfterAffordablePurchases,
    leaguePointsAfterAffordablePurchases,
    warnings, 
    overallStatusMessage,
    targetEVs,
    currentEVs
  } = result;

  const isAnyEVChangeIntended = STAT_ORDER.some(stat => targetEVs[stat] > currentEVs[stat]);
  const isAnythingNeededOverall = STAT_ORDER.some(stat => statDetails[stat].initialNeed > 0);

  return (
    <div className="mt-8 p-5 bg-slate-800/70 rounded-xl shadow-2xl">
      <h2 className="text-3xl font-bold mb-6 text-pokeYellow text-center">Calculation Results</h2>
      
      <div className={`p-4 rounded-lg mb-6 text-center font-semibold text-lg 
        ${!isAnyEVChangeIntended && !isAnythingNeededOverall ? 'bg-blue-500/30 text-blue-200' : 
          (warnings.length > 0 || STAT_ORDER.some(s => statDetails[s].evsStillNeeded > 0 && statDetails[s].initialNeed > 0)) ? 'bg-red-500/30 text-red-200' : 
          'bg-green-500/30 text-green-200'}`}>
        {overallStatusMessage}
      </div>

      {/* Purchase Summary Section */}
      {(totalPurchaseCostAllSuggestions > 0) && (
        <div className="mb-6 p-4 border border-pokeBlue/60 rounded-lg bg-slate-700/30">
          <h3 className="text-xl font-semibold mb-3 text-pokeBlue">Purchase Overview:</h3>
          <p className="text-md text-slate-200 mb-1">Total ideal cost for all suggested Vitamins: <span className="font-bold text-pokeYellow">{totalPurchaseCostAllSuggestions.toLocaleString()}</span></p>
          {totalCostAffordablePurchases > 0 && 
            <p className="text-md text-slate-200 mb-1">Actual amount spent on affordable Vitamins: <span className="font-bold text-green-400">{totalCostAffordablePurchases.toLocaleString()}</span></p>
          }
          
          {canAffordAllSuggestedPurchases ? (
            <div className="p-3 bg-green-600/30 rounded text-green-200 text-sm mt-2">
              <p className="font-semibold">✅ You have enough currency for all suggested purchases.</p>
              <p>Poké Dollars Remaining (if all bought): {pokeDollarsAfterAffordablePurchases.toLocaleString()}</p>
              <p>League Points Remaining (if all bought): {leaguePointsAfterAffordablePurchases.toLocaleString()}</p>
            </div>
          ) : (
            <div className="p-3 bg-red-600/30 rounded text-red-200 text-sm mt-2">
              <p className="font-semibold">❌ Insufficient currency for all suggested purchases.</p>
              {totalAdditionalCurrencyNeededToMeetAllGoals > 0 &&
                <p>Total additional currency needed for all unmet goals: <strong className="text-red-100">{totalAdditionalCurrencyNeededToMeetAllGoals.toLocaleString()}</strong></p>
              }
               <p className="text-xs mt-1 text-slate-400">(Calculations below reflect what's possible with current funds.)</p>
            </div>
          )}
        </div>
      )}
      
      {/* Per-Stat Breakdown */}
      <div className="space-y-6">
        {STAT_ORDER.map(stat => {
          const detail = statDetails[stat];
          
          if (detail.initialNeed <= 0 && detail.usedOwnedItems.length === 0 && detail.suggestedPurchases.every(p => p.quantitySuggested === 0)) {
             if (targetEVs[stat] === 0 && currentEVs[stat] === 0 && detail.initialNeed === 0) return null;
          }

          return (
            <div key={stat} className={`p-4 rounded-lg bg-slate-700/70 shadow-lg border-l-4 ${STAT_COLORS[stat]?.replace('bg-', 'border-')}`}>
              <div className="flex items-center mb-3">
                <span className={`w-4 h-4 rounded-full mr-3 ${STAT_COLORS[stat]}`}></span>
                <h4 className={`text-xl font-semibold ${STAT_TEXT_COLORS[stat]}`}>{stat}</h4>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs text-slate-300 mb-3 pb-2 border-b border-slate-600">
                <p>Target: <span className="font-bold text-slate-100">{detail.targetEV}</span></p>
                <p>Current: <span className="font-bold text-slate-100">{detail.currentEV}</span></p>
                <p>Initial Need: <span className="font-bold text-slate-100">{Math.max(0,detail.initialNeed)} EVs</span></p>
              </div>
              
              {detail.usedOwnedItems.length === 0 && detail.suggestedPurchases.every(p => p.quantitySuggested === 0) && detail.initialNeed <=0 && (
                 <p className="text-sm text-slate-400 italic">No changes needed or no items applicable for this stat.</p>
              )}

              {detail.usedOwnedItems.length > 0 && (
                <div className="mb-2">
                  <p className="text-sm font-medium text-slate-300 mb-1">From Your Inventory:</p>
                  <ul className="space-y-1.5">
                    {detail.usedOwnedItems.map((used, index) => {
                       const itemDetails = getItemById(used.itemId);
                       return (
                        <li key={`owned-${stat}-${index}`} className="flex items-center text-sm text-slate-200">
                          {itemDetails && <ItemIcon itemName={used.itemName} spriteName={itemDetails.pokeApiSpriteName} category={itemDetails.category} isLarge={true} className="mr-2 w-7 h-7"/>}
                          <span className="font-semibold">{used.quantity}x {used.itemName}</span>
                          <span className="ml-1 text-green-400">(+{used.evsGained} EVs)</span>
                        </li>
                       );
                    })}
                  </ul>
                </div>
              )}

              {detail.suggestedPurchases.some(p => p.quantitySuggested > 0) && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-slate-300 mb-1">To Purchase (Vitamins):</p>
                  <ul className="space-y-2">
                    {detail.suggestedPurchases.filter(p => p.quantitySuggested > 0).map((purchase, index) => {
                      const itemDetails = getItemById(purchase.itemId);
                      return (
                      <li key={`purchase-${stat}-${index}`} className="text-sm text-slate-200">
                        <div className="flex items-center">
                            {itemDetails && <ItemIcon itemName={purchase.itemName} spriteName={itemDetails.pokeApiSpriteName} category={itemDetails.category} isLarge={true} className="mr-2 w-7 h-7"/>}
                            {purchase.isPartialPurchase ? (
                                <span className="font-semibold text-yellow-400">BUY (Partial):</span>
                            ) : purchase.quantityAffordable > 0 ? (
                                <span className="font-semibold text-pokeBlue">BUY:</span>
                            ) : (
                                <span className="font-semibold text-red-400">UNABLE TO BUY:</span>
                            )}
                            <span className="ml-1 font-semibold">
                                {purchase.quantityAffordable > 0 ? `${purchase.quantityAffordable} of ${purchase.quantitySuggested}` : purchase.quantitySuggested}x {purchase.itemName}
                            </span>
                            {purchase.quantityAffordable > 0 && 
                                <span className="ml-1 text-green-400">(+{purchase.evsGainedFromThisPurchase} EVs)</span>
                            }
                            {purchase.quantityAffordable > 0 &&
                                <span className="ml-2 text-xs text-slate-400">- Cost: {purchase.costPaid.toLocaleString()}</span>
                            }
                             {purchase.quantityAffordable === 0 && purchase.quantitySuggested > 0 &&
                                <span className="ml-2 text-xs text-red-400">- Needs: {purchase.totalCostSuggested.toLocaleString()}</span>
                            }
                        </div>
                        {purchase.quantityStillNeeded > 0 && (
                             <p className="text-xs text-yellow-300 pl-9 mt-0.5">
                                (Still need {purchase.quantityStillNeeded} more {purchase.itemName}. Additional cost: {purchase.costForStillNeeded.toLocaleString()})
                             </p>
                        )}
                      </li>
                    )})}
                  </ul>
                </div>
              )}
              
              <div className="mt-4 pt-3 border-t border-slate-600 text-sm">
                <p className="text-slate-200">Final EVs: <span className="font-bold text-lg">{detail.finalEVs}</span> (Gained: +{detail.evsGainedFromOwned + detail.evsGainedFromAffordablePurchases})</p>
                {detail.evsStillNeeded > 0 ? (
                  <p className="text-red-300">Still Need: <span className="font-bold">{detail.evsStillNeeded} EVs</span></p>
                ) : detail.initialNeed > 0 ? ( // Only show target met if there was an initial need
                  <p className="text-green-300 font-semibold">✅ Target Met!</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="mt-8 p-4 border border-red-500/60 rounded-lg bg-red-900/30">
          <h3 className="text-lg font-semibold mb-2 text-red-300">Important Notes & Warnings:</h3>
          <ul className="list-disc list-inside pl-2 space-y-1 text-sm text-red-300">
            {warnings.map((warning, index) => (
              <li key={`warning-${index}`}>{warning}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ResultsDisplay;