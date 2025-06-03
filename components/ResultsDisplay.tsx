
import React, { useState, useMemo, useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
import { CalculationResult, Stat, StatsTable, Item, VITAMIN_COST } from '../types';
import { STAT_ORDER, ITEMS, STAT_COLORS, STAT_ICONS, MAX_EV_PER_STAT, MAX_TOTAL_EVS } from '../constants';
import ItemIcon from './ItemIcon';

interface StatResultCardProps {
  stat: Stat;
  currentEV: number;
  targetEV: number;
  gainedEV: number;
  neededEV: number;
  itemsUsed: Array<{ stat: Stat; itemName: string; quantity: number; evsGained: number; source: 'inventory' | 'purchase' }>;
  id: string; // For scrolling
}

export interface StatResultCardRef {
  expandItems: () => void;
  collapseItems: () => void;
  scrollIntoView: () => void;
}

interface ResultsDisplayProps {
  result: CalculationResult;
  currentEVs: StatsTable;
  targetEVs: StatsTable;
}

interface GamePlanItem {
  id: string;
  name: string;
  category: Item['category'];
  totalQuantity: number;
  quantityFromInventory: number;
  quantityToPurchase: number;
  pokeApiSpriteName: string;
}

interface GamePlanCategory {
  categoryName: Item['category'];
  items: GamePlanItem[];
}

const StatResultCard = forwardRef<StatResultCardRef, StatResultCardProps>(
  ({ stat, currentEV, targetEV, gainedEV, neededEV, itemsUsed, id }, ref) => {
    const [isItemsExpanded, setIsItemsExpanded] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const achievedEV = currentEV + gainedEV;
    
    const progressBarPercent = (achievedEV / MAX_EV_PER_STAT) * 100;
    const targetMarkerPercent = (targetEV / MAX_EV_PER_STAT) * 100;

    const isTargetMet = achievedEV >= targetEV && (targetEV > 0 || (targetEV === 0 && currentEV === 0 && gainedEV === 0)) && neededEV === 0;
    const noChangeOriginallyNeeded = targetEV === currentEV && gainedEV === 0 && neededEV === 0;

    useImperativeHandle(ref, () => ({
      expandItems: () => setIsItemsExpanded(true),
      collapseItems: () => setIsItemsExpanded(false),
      scrollIntoView: () => cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
    }));

    const getIconForItem = (itemName: string) => {
      const item = ITEMS.find(i => i.name === itemName);
      if (item) {
        return <ItemIcon itemName={item.name} spriteName={item.pokeApiSpriteName} category={item.category} className="w-4 h-4 inline-block mr-1 align-middle" />;
      }
      return '▫️';
    };
    
    let statusText = "";
    let statusColor = "text-slate-400";

    if (noChangeOriginallyNeeded) {
      statusText = "No change needed.";
      statusColor = "text-slate-400";
    } else if (isTargetMet) {
      statusText = "Target Met!";
      statusColor = "text-green-400";
    } else if (neededEV > 0) {
      statusText = `Still Need: ${neededEV} EVs`;
      statusColor = "text-red-400";
    } else if (achievedEV < targetEV) {
      statusText = `Partially met. Needs ${targetEV - achievedEV} more.`;
      statusColor = "text-yellow-400";
    }


    const itemsSummaryTooltip = useMemo(() => {
      if (itemsUsed.length === 0) return "No items used for this stat.";
      return itemsUsed.map(use => `${use.quantity}x ${use.itemName}`).join(', ');
    }, [itemsUsed]);


    return (
      <div id={id} ref={cardRef} className={`p-4 rounded-lg shadow-lg ${STAT_COLORS[stat]}/20 border ${STAT_COLORS[stat]}/50 ${isTargetMet && !noChangeOriginallyNeeded ? 'ring-2 ring-offset-2 ring-offset-slate-800 ring-green-400' : ''} transition-all duration-150 hover:shadow-xl hover:scale-[1.02]`}>
        <div className="flex justify-between items-center mb-2">
            <h4 className="text-lg font-semibold text-slate-100 flex items-center">
                <span className="text-xl mr-2">{STAT_ICONS[stat]}</span>
                {stat}
            </h4>
            <span className="text-sm font-normal text-slate-300">
                Target: {targetEV} | Achieved: {achievedEV}
                {isTargetMet && !noChangeOriginallyNeeded && <span className="ml-2 text-green-400">✔️</span>}
            </span>
        </div>

        <div className="h-6 bg-slate-700 rounded-full overflow-hidden relative mb-2 shadow-inner">
          {/* Filled portion */}
          <div
            className={`h-full ${STAT_COLORS[stat]} transition-all duration-500 ease-out`}
            style={{ width: `${Math.min(progressBarPercent, 100)}%` }}
            role="progressbar"
            aria-valuenow={achievedEV}
            aria-valuemin={0}
            aria-valuemax={MAX_EV_PER_STAT}
          >
            {/* Intentionally empty, just for background color of filled part */}
          </div>
           {/* Text, centered over the whole bar */}
           <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-medium text-white px-1" 
                  style={{textShadow: '0px 0px 2px rgba(0,0,0,0.7)'}}> {/* Added slight shadow for readability */}
              {achievedEV} / {MAX_EV_PER_STAT}
            </span>
          </div>
          {/* Target marker */}
          {targetEV > 0 && targetEV <= MAX_EV_PER_STAT && (
            <div 
              className="absolute top-0 h-full w-1 bg-slate-100/70 opacity-75 z-10" 
              style={{ left: `calc(${Math.min(targetMarkerPercent, 100)}% - 2px)` }}
              title={`Target: ${targetEV} EVs`}
            ></div>
          )}
        </div>
        
        <div className="text-xs space-y-0.5 text-slate-300 mb-3">
          <p>Current: <span className="font-medium text-slate-100">{currentEV}</span></p>
          <p>Gained: <span className="font-medium text-green-300">+{gainedEV}</span></p>
          <p>New Total: <span className="font-medium text-sky-300">{achievedEV}</span> (of {MAX_EV_PER_STAT} max)</p>
        </div>
        <p className={`text-xs font-semibold mb-3 ${statusColor}`}>{statusText}</p>

        {itemsUsed.length > 0 && (
          <div>
            <button
              onClick={() => setIsItemsExpanded(!isItemsExpanded)}
              className="text-xs text-slate-400 hover:text-slate-200 mb-1 w-full text-left flex justify-between items-center"
              title={isItemsExpanded ? "Collapse item list" : itemsSummaryTooltip}
            >
              <span>Items Used ({itemsUsed.reduce((sum, item) => sum + item.quantity, 0)} total):</span>
              <span className={`transform transition-transform duration-200 ${isItemsExpanded ? 'rotate-180' : 'rotate-0'}`}>▼</span>
            </button>
            {isItemsExpanded && (
              <ul className="text-xs space-y-1 pl-2 mt-1 border-l border-slate-600">
                {itemsUsed.map((use, index) => (
                  <li key={index} className="text-slate-300">
                    {getIconForItem(use.itemName)}
                    <strong>{use.quantity} {use.itemName}</strong> (+{use.evsGained})
                    {use.source === 'purchase' && <span className="text-xs text-sky-400 ml-1">(to purchase)</span>}
                    {use.source === 'inventory' && <span className="text-xs text-slate-500 ml-1">(from inventory)</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        {itemsUsed.length === 0 && !noChangeOriginallyNeeded && gainedEV > 0 && (
          <p className="text-xs text-slate-400 italic">EVs gained without items (e.g. current > target initially, or base EVs sufficient).</p>
        )}
          {itemsUsed.length === 0 && gainedEV === 0 && !noChangeOriginallyNeeded && (
          <p className="text-xs text-slate-400 italic">No items needed or used for this stat's change.</p>
        )}
      </div>
    );
  }
);


const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ result, currentEVs, targetEVs }) => {
  const statCardRefs = useRef<Record<string, StatResultCardRef | null>>({});
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const [activeResultsView, setActiveResultsView] = useState<'statBreakdown' | 'gamePlan'>('statBreakdown');


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    if (isExportMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExportMenuOpen]);

  if (!result) {
    return null;
  }

  const { 
    itemsToUse, 
    itemUsageDetails, 
    evsGainedPerStat, 
    evsStillNeeded, 
    warnings, 
    overallStatusMessage,
    vitaminsToPurchase, 
    totalPurchaseCost, 
    fundsUsed, 
    remainingLeaguePoints, 
    remainingPokeDollars,  
    monetaryShortfall,    
    itemShortfall,        
    purchaseAttempted
  } = result;

  const getIconForItem = (itemName: string) => {
    const item = ITEMS.find(i => i.name === itemName);
    if (item) {
      return <ItemIcon itemName={item.name} spriteName={item.pokeApiSpriteName} category={item.category} className="w-5 h-5 inline-block mr-1" />;
    }
    return '▫️';
  };
  
  const getOverallMessageInfo = () => {
    let icon = 'ℹ️';
    let bgColor = 'bg-slate-700/50 text-slate-300';

    if (monetaryShortfall !== undefined && monetaryShortfall > 0) { 
      icon = '❗'; 
      bgColor = 'bg-red-500/30 text-red-300';
    } else if (warnings.some(w => w.toLowerCase().includes("still need")) || Object.values(evsStillNeeded).some(val => val > 0)) {
      icon = '⚠️'; 
      bgColor = 'bg-yellow-500/30 text-yellow-300';
    } else if (overallStatusMessage.toLowerCase().includes("successfully") || overallStatusMessage.toLowerCase().includes("goals met") || overallStatusMessage.toLowerCase().includes("no change needed") || overallStatusMessage.toLowerCase().includes("no items needed")) {
      icon = '✅'; 
      bgColor = 'bg-green-500/30 text-green-300';
    }
    return { icon, bgColor };
  };

  const { icon: overallIcon, bgColor: overallBgColor } = getOverallMessageInfo();

  const generatePlanText = () => {
    let planText = `Pokémon EV Plan\n================\n\n`;
    planText += `Overall Status: ${overallStatusMessage}\n\n`;
    
    const totalAchievedEVs = STAT_ORDER.reduce((sum, stat) => sum + (currentEVs[stat] + evsGainedPerStat[stat]), 0);
    const totalItemsUsedCount = Object.values(itemsToUse).reduce((sum, quantity) => sum + quantity, 0);

    planText += "Global Summary:\n";
    planText += `  Total EVs Achieved: ${totalAchievedEVs} / ${MAX_TOTAL_EVS}\n`;
    planText += `  EVs Remaining to Cap: ${Math.max(0, MAX_TOTAL_EVS - totalAchievedEVs)}\n`;
    planText += `  Total Items Used in Plan: ${totalItemsUsedCount}\n\n`;


    planText += "Target EVs & Item Usage:\n--------------------------\n";
    STAT_ORDER.forEach(stat => {
      const achieved = currentEVs[stat] + evsGainedPerStat[stat];
      planText += `${STAT_ICONS[stat]} ${stat}:\n`;
      planText += `  Target: ${targetEVs[stat]}, Achieved: ${achieved} (Current: ${currentEVs[stat]}, Gained: +${evsGainedPerStat[stat]})\n`;
      if (evsStillNeeded[stat] > 0) {
        planText += `  Still Needs: ${evsStillNeeded[stat]} EVs\n`;
      }
      const itemsForStat = itemUsageDetails.filter(item => item.stat === stat);
      if (itemsForStat.length > 0) {
        planText += `  Items Used/Needed:\n`;
        itemsForStat.forEach(use => {
          const itemMeta = ITEMS.find(i => i.name === use.itemName);
          const itemEmoji = itemMeta ? (itemMeta.category === 'Vitamin' ? '🧪' : itemMeta.category === 'Mochi' ? '🍡' : '🪶') : '▫️';
          const sourceText = use.source === 'purchase' ? 'to purchase' : 'from inventory';
          planText += `    - ${itemEmoji} ${use.quantity} ${use.itemName} (+${use.evsGained} EVs) (${sourceText})\n`;
        });
      }
      planText += "\n";
    });

    if (purchaseAttempted) {
      planText += "Shopping List:\n-----------------\n";
      if (vitaminsToPurchase && totalPurchaseCost !== undefined && totalPurchaseCost > 0 && monetaryShortfall === undefined) {
        planText += "  Vitamins to Purchase:\n";
        Object.entries(vitaminsToPurchase).forEach(([itemId, quantity]) => {
          const item = ITEMS.find(i => i.id === itemId);
          if (item) planText += `    - ${quantity} ${item.name} (Cost: ${(quantity * VITAMIN_COST).toLocaleString()} LP/$)\n`;
        });
        planText += `  Total Purchase Cost: ${totalPurchaseCost.toLocaleString()} LP/$ \n`;
        if(fundsUsed) planText += `  Will be Paid with: ${fundsUsed.lp.toLocaleString()} LP, ${fundsUsed.pd.toLocaleString()} $\n`;
        if(remainingLeaguePoints !== undefined && remainingPokeDollars !== undefined) {
             planText += `  Funds After Purchase: ${remainingLeaguePoints.toLocaleString()} LP, ${remainingPokeDollars.toLocaleString()} $\n`;
        }
      } else if (monetaryShortfall !== undefined && itemShortfall) {
        planText += `  Insufficient Funds! Shortfall: ${monetaryShortfall.toLocaleString()} LP/$\n`;
        planText += "  Vitamins you need to buy but can't afford:\n";
         Object.entries(itemShortfall).forEach(([itemId, quantity]) => {
          const item = ITEMS.find(i => i.id === itemId);
          if (item) planText += `    - ${quantity} ${item.name} (Would cost: ${(quantity * VITAMIN_COST).toLocaleString()} LP/$)\n`;
        });
         planText += `  Total cost of unaffordable items: ${(totalPurchaseCost ?? 0).toLocaleString()} LP/$\n`;
      } else if (totalPurchaseCost === 0 || totalPurchaseCost === undefined) {
        planText += "  No vitamin purchases are necessary.\n";
      }
      planText += "\n";
    }

    if (warnings.length > 0) {
      planText += "Warnings & Notes:\n-----------------\n";
      warnings.forEach(warning => {
        planText += `- ${warning}\n`;
      });
    }
    return planText;
  };
  
  const generateShowdownString = (): string => {
    const parts: string[] = [];
    STAT_ORDER.forEach(stat => {
      const value = targetEVs[stat]; // Use targetEVs for Showdown string
      if (value > 0) {
        const statAbbrev = {
          [Stat.HP]: "HP",
          [Stat.Attack]: "Atk",
          [Stat.Defense]: "Def",
          [Stat.SpAttack]: "SpA",
          [Stat.SpDefense]: "SpD",
          [Stat.Speed]: "Spe",
        }[stat];
        parts.push(`${value} ${statAbbrev}`);
      }
    });
    if (parts.length === 0) return "0 HP / 0 Atk / 0 Def / 0 SpA / 0 SpD / 0 Spe"; // Or "No EVs allocated"
    return parts.join(" / ");
  };

  const downloadFile = (filename: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  const handleExportPlan = (format: 'text' | 'json' | 'clipboard' | 'showdown') => {
    const planText = generatePlanText();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    if (format === 'clipboard') {
      navigator.clipboard.writeText(planText)
        .then(() => alert("EV plan copied to clipboard!"))
        .catch(err => {
          console.error("Failed to copy plan: ", err);
          alert("Failed to copy EV plan. See console for error.");
        });
    } else if (format === 'text') {
      downloadFile(`pokemon_ev_plan_${timestamp}.txt`, planText, 'text/plain;charset=utf-8');
    } else if (format === 'json') {
      const jsonData = {
        calculationResult: result,
        currentEVs,
        targetEVs,
        planTextSummary: planText,
        generatedAt: new Date().toISOString(),
      };
      downloadFile(`pokemon_ev_plan_${timestamp}.json`, JSON.stringify(jsonData, null, 2), 'application/json;charset=utf-8');
    } else if (format === 'showdown') {
      const showdownString = generateShowdownString();
      navigator.clipboard.writeText(showdownString)
        .then(() => alert("Showdown EV string copied to clipboard!\n\n" + showdownString))
        .catch(err => {
          console.error("Failed to copy Showdown string: ", err);
          alert("Failed to copy Showdown EV string. See console for error.");
        });
    }
    setIsExportMenuOpen(false); // Close menu after action
  };


  const totalAchievedEVs = useMemo(() => STAT_ORDER.reduce((sum, stat) => sum + (currentEVs[stat] + evsGainedPerStat[stat]), 0), [currentEVs, evsGainedPerStat]);
  const totalItemsUsedCount = useMemo(() => Object.values(itemsToUse).reduce((sum, quantity) => sum + quantity, 0), [itemsToUse]);
  const remainingEVsToCap = useMemo(() => Math.max(0, MAX_TOTAL_EVS - totalAchievedEVs), [totalAchievedEVs]);

  const totalItemsTooltip = useMemo(() => {
    if (Object.keys(itemsToUse).length === 0) return "No items used in plan.";
    const details = Object.entries(itemsToUse)
        .map(([itemId, quantity]) => {
            if (quantity === 0) return null;
            const item = ITEMS.find(i => i.id === itemId);
            return item ? `${quantity}x ${item.name}` : null;
        })
        .filter(Boolean)
        .join(', ');
    return details || "No items used in plan.";
  }, [itemsToUse]);

  const handleWarningClick = (warningText: string) => {
    const match = warningText.match(/Still need \d+ EVs for (HP|Attack|Defense|Sp\. Attack|Sp\. Defense|Speed)/i);
    if (match && match[1]) {
      const statName = match[1] as Stat;
      const statId = `stat-card-${statName.toLowerCase().replace(/[\s\.]/g, '-')}`;
      const cardRef = statCardRefs.current[statId];
      if (cardRef) {
        setActiveResultsView('statBreakdown'); // Switch to stat breakdown if not already active
        // Allow React to re-render before scrolling
        setTimeout(() => {
            cardRef.scrollIntoView();
            cardRef.expandItems();
        }, 0);
      }
    }
  };

  const gamePlanData = useMemo((): GamePlanCategory[] => {
    if (!result || !result.itemsToUse) return [];
    const plan: GamePlanCategory[] = [];
    const itemCategoriesOrder: Item['category'][] = ['Vitamin', 'Mochi', 'Feather'];

    itemCategoriesOrder.forEach(categoryName => {
        const categoryItemsProcessed: GamePlanItem[] = [];
        
        ITEMS.filter(itemSchema => itemSchema.category === categoryName)
             .forEach(itemSchema => {
                const totalQuantityInPlan = result.itemsToUse[itemSchema.id] || 0;

                if (totalQuantityInPlan > 0) {
                    let qtyFromInventory = 0;
                    let qtyToPurchase = 0; 

                    const purchaseDetail = result.itemUsageDetails.find(d => d.itemName === itemSchema.name && d.source === 'purchase');
                    const inventoryDetail = result.itemUsageDetails.find(d => d.itemName === itemSchema.name && d.source === 'inventory');

                    if (purchaseDetail) qtyToPurchase = purchaseDetail.quantity;
                    if (inventoryDetail) qtyFromInventory = inventoryDetail.quantity;
                    
                    if (itemSchema.category === 'Vitamin') {
                         qtyToPurchase = (result.vitaminsToPurchase && result.vitaminsToPurchase[itemSchema.id]) 
                                        ? result.vitaminsToPurchase[itemSchema.id] 
                                        : 0;
                        qtyFromInventory = totalQuantityInPlan - qtyToPurchase;
                    } else {
                        qtyFromInventory = totalQuantityInPlan; 
                        qtyToPurchase = 0;
                    }

                    qtyFromInventory = Math.max(0, qtyFromInventory);
                    qtyToPurchase = Math.max(0, qtyToPurchase);


                    if (qtyFromInventory > 0 || qtyToPurchase > 0) {
                         categoryItemsProcessed.push({
                            id: itemSchema.id,
                            name: itemSchema.name,
                            category: itemSchema.category,
                            totalQuantity: totalQuantityInPlan, 
                            quantityFromInventory: qtyFromInventory,
                            quantityToPurchase: qtyToPurchase, 
                            pokeApiSpriteName: itemSchema.pokeApiSpriteName,
                        });
                    }
                }
        });

        if (categoryItemsProcessed.length > 0) {
            plan.push({ categoryName, items: categoryItemsProcessed });
        }
    });
    return plan;
  }, [result]);


  return (
    <div className="mt-6 p-4 bg-slate-800 rounded-lg shadow-xl relative">
      <h2 className="text-2xl font-bold mb-4 text-pokeYellow text-center">Calculation Results</h2>
      
      <div className="sticky top-0 z-10 bg-slate-800 pt-2 pb-3 -mx-4 px-4 mb-4 shadow-lg rounded-b-lg">
        {overallStatusMessage && (
            <div className={`p-3 rounded-md mb-3 text-center font-semibold shadow ${overallBgColor} flex items-center justify-center`}>
            <span className="text-xl mr-2">{overallIcon}</span>
            {overallStatusMessage}
            </div>
        )}
        {warnings.length > 0 && (
            <div className="p-4 bg-yellow-500/20 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2 text-yellow-200 border-b border-yellow-200/50 pb-1">Warnings & Notes</h3>
            <ul className="list-disc list-inside pl-3 space-y-1 text-sm text-yellow-100">
                {warnings.map((warning, index) => {
                const isClickable = /Still need \d+ EVs for (HP|Attack|Defense|Sp\. Attack|Sp\. Defense|Speed)/i.test(warning);
                return (
                    <li key={index}>
                    {isClickable ? (
                        <button 
                        onClick={() => handleWarningClick(warning)} 
                        className="text-left hover:underline focus:underline focus:outline-none"
                        title="Click to jump to this stat and see item details"
                        >
                        {warning} <span className="text-xs opacity-70">(Click to see details)</span>
                        </button>
                    ) : (
                        warning
                    )}
                    </li>
                );
                })}
            </ul>
            </div>
        )}
      </div>

      <div className="mb-6 p-4 bg-slate-700/70 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-3 text-sky-300 border-b border-sky-300/50 pb-2">Global EV Summary</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div className="p-2 bg-slate-600/50 rounded">
                <p className="text-slate-300">Total EVs Achieved:</p>
                <p className="font-bold text-lg text-slate-100">{totalAchievedEVs} / {MAX_TOTAL_EVS}</p>
            </div>
            <div className="p-2 bg-slate-600/50 rounded">
                <p className="text-slate-300">EVs Remaining to Cap:</p>
                <p className="font-bold text-lg text-slate-100">{remainingEVsToCap}</p>
            </div>
            <div className="p-2 bg-slate-600/50 rounded" title={totalItemsTooltip}>
                <p className="text-slate-300">Total Items Used/Needed:</p>
                <p className="font-bold text-lg text-slate-100">{totalItemsUsedCount}</p>
            </div>
        </div>
      </div>


      {purchaseAttempted && (
        <div className="mb-6 p-4 bg-slate-700/70 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-3 text-pokeBlue border-b border-pokeBlue/50 pb-2">Shopping List</h3>
          
          {vitaminsToPurchase && Object.keys(vitaminsToPurchase).length > 0 && monetaryShortfall === undefined && (
            <>
              <p className="text-md text-green-300 mb-2">Vitamins to Purchase:</p>
              <div className="border border-slate-600 rounded-md p-3 bg-slate-800/30">
                <ul className="space-y-2 text-sm text-slate-200 mb-3">
                  {Object.entries(vitaminsToPurchase).map(([itemId, quantity]) => {
                    const item = ITEMS.find(i => i.id === itemId);
                    if (!item) return null;
                    const itemCost = quantity * VITAMIN_COST;
                    return (
                      <li key={itemId} className="flex justify-between items-center py-1 border-b border-slate-700 last:border-b-0">
                        <span className="flex items-center">
                          {getIconForItem(item.name)}
                          Need to buy <strong>{quantity} {item.name}</strong>
                        </span>
                        <span className="text-slate-300">{itemCost.toLocaleString()} LP/$</span>
                      </li>
                    );
                  })}
                </ul>
                <div className="pt-2 border-t border-slate-600">
                  <p className="text-md text-slate-100 flex justify-between">
                    <strong>Total Purchase Cost:</strong>
                    <strong className="text-pokeYellow">{(totalPurchaseCost ?? 0).toLocaleString()} LP/$</strong>
                  </p>
                  {fundsUsed && (
                    <p className="text-xs text-slate-400 text-right mt-0.5">
                      (Will use: {fundsUsed.lp.toLocaleString()} LP, {fundsUsed.pd.toLocaleString()} $)
                    </p>
                  )}
                </div>
              </div>
              {remainingLeaguePoints !== undefined && remainingPokeDollars !== undefined && (
                <p className="text-sm text-slate-300 mt-3">
                  Funds after purchase: <span className="font-semibold">{remainingLeaguePoints.toLocaleString()} LP</span>, <span className="font-semibold">{remainingPokeDollars.toLocaleString()} $</span>
                </p>
              )}
            </>
          )}

          {monetaryShortfall !== undefined && monetaryShortfall > 0 && itemShortfall && Object.keys(itemShortfall).length > 0 && (
            <>
              <p className="text-md text-red-300 mb-1">Cannot afford all required Vitamins!</p>
              <p className="text-sm text-red-300">Monetary Shortfall: Need <strong className="font-bold">{monetaryShortfall.toLocaleString()}</strong> more LP/$.</p>
              
              <p className="text-sm text-yellow-300 mt-3 mb-1">Vitamins you need but cannot afford:</p>
              <div className="border border-yellow-600/50 rounded-md p-3 bg-yellow-800/10">
                <ul className="space-y-2 text-sm text-yellow-200 mb-3">
                  {Object.entries(itemShortfall).map(([itemId, quantity]) => {
                    const item = ITEMS.find(i => i.id === itemId);
                    if (!item) return null;
                    const itemCost = quantity * VITAMIN_COST;
                    return (
                      <li key={itemId} className="flex justify-between items-center py-1 border-b border-yellow-700/50 last:border-b-0">
                        <span className="flex items-center">
                          {getIconForItem(item.name)}
                           <strong>{quantity} {item.name}</strong>
                        </span>
                        <span className="text-yellow-300">(Cost: {itemCost.toLocaleString()} LP/$)</span>
                      </li>
                    );
                  })}
                </ul>
                 <div className="pt-2 border-t border-yellow-600/50">
                    <p className="text-sm text-yellow-100 flex justify-between">
                        <strong>Total Cost of Unaffordable Items:</strong>
                        <strong className="text-red-300">{(totalPurchaseCost ?? 0).toLocaleString()} LP/$</strong>
                    </p>
                </div>
              </div>
            </>
          )}
          
          {(!vitaminsToPurchase || Object.keys(vitaminsToPurchase).length === 0) && monetaryShortfall === undefined && (!itemShortfall || Object.keys(itemShortfall).length === 0) && (
             <p className="text-sm text-slate-300">No vitamin purchases are necessary for this EV plan.</p>
          )}
        </div>
      )}
       
      <div className="mb-4">
        <div className="flex justify-center border-b border-slate-700 mb-4">
          <button 
            onClick={() => setActiveResultsView('statBreakdown')}
            className={`px-6 py-2.5 font-semibold text-sm rounded-t-lg transition-colors duration-150 focus:outline-none ${activeResultsView === 'statBreakdown' ? 'bg-slate-700 border-b-2 border-pokeYellow text-pokeYellow' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}
            aria-current={activeResultsView === 'statBreakdown'}
          >
            Stat Breakdown
          </button>
          <button 
            onClick={() => setActiveResultsView('gamePlan')}
            className={`px-6 py-2.5 font-semibold text-sm rounded-t-lg transition-colors duration-150 focus:outline-none ${activeResultsView === 'gamePlan' ? 'bg-slate-700 border-b-2 border-pokeYellow text-pokeYellow' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}
            aria-current={activeResultsView === 'gamePlan'}
          >
            General Game Plan
          </button>
        </div>

        {activeResultsView === 'statBreakdown' && (
          <>
            <h3 className="text-xl font-semibold mb-3 text-slate-100 text-center">EV Status per Stat</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            {STAT_ORDER.map(stat => {
              const statId = `stat-card-${stat.toLowerCase().replace(/[\s\.]/g, '-')}`;
              return (
                <StatResultCard
                  key={statId}
                  id={statId}
                  ref={(el: StatResultCardRef | null) => { statCardRefs.current[statId] = el; }}
                  stat={stat}
                  currentEV={currentEVs[stat]}
                  targetEV={targetEVs[stat]}
                  gainedEV={evsGainedPerStat[stat]}
                  neededEV={evsStillNeeded[stat]}
                  itemsUsed={itemUsageDetails.filter(item => item.stat === stat)}
                />
              );
            })}
            </div>
          </>
        )}

        {activeResultsView === 'gamePlan' && (
           <div className="mt-3">
            <h3 className="text-xl font-semibold mb-4 text-slate-100 text-center">General Game Plan</h3>
            {gamePlanData.length === 0 && <p className="text-slate-400 text-center italic py-4">No items are needed for this EV plan.</p>}
            {gamePlanData.map(categoryData => (
              <div key={categoryData.categoryName} className="mb-6 p-4 bg-slate-700/70 rounded-lg shadow-md">
                <h4 className="text-lg font-semibold mb-3 text-sky-300 border-b border-sky-400/30 pb-1.5">
                  {categoryData.categoryName === 'Vitamin' ? '🧪' : categoryData.categoryName === 'Mochi' ? '🍡' : '🪶'} {categoryData.categoryName}s to Use:
                </h4>
                {categoryData.items.length === 0 && <p className="text-sm text-slate-400 italic">No {categoryData.categoryName.toLowerCase()}s needed from this category.</p>}
                <ul className="space-y-2.5">
                  {categoryData.items.map(item => (
                    <li key={item.id} className="flex items-center p-2.5 bg-slate-600/50 rounded-md shadow hover:bg-slate-600 transition-colors">
                      <ItemIcon itemName={item.name} spriteName={item.pokeApiSpriteName} category={item.category} className="w-7 h-7 mr-3 flex-shrink-0" />
                      <div className="flex-grow">
                        <span className="text-slate-100 font-medium">{item.name}</span>
                      </div>
                      <div className="text-right ml-2 flex-shrink-0">
                         <span className="font-bold text-lg text-slate-50">{item.totalQuantity}</span>
                         {(item.quantityFromInventory > 0 || item.quantityToPurchase > 0) && (
                            <div className="text-xs">
                              {item.quantityFromInventory > 0 && <span className="text-slate-400 mr-1.5">Inv: {item.quantityFromInventory}</span>}
                              {item.quantityToPurchase > 0 && <span className="text-sky-300">Buy: {item.quantityToPurchase}</span>}
                            </div>
                         )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
      
       <div className="mt-8 flex justify-center" ref={exportMenuRef}>
         <div className="relative inline-block text-left">
            <button
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                className="w-full sm:w-auto bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-opacity-75 flex items-center justify-center"
                id="export-menu-button"
                aria-expanded={isExportMenuOpen}
                aria-haspopup="true"
            >
                Export Plan 
                <svg className={`ml-2 -mr-1 h-5 w-5 transform transition-transform duration-200 ${isExportMenuOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </button>
            {isExportMenuOpen && (
                <div 
                    className="origin-top-right absolute right-0 sm:right-auto sm:left-0 bottom-full mb-2 w-56 rounded-md shadow-lg bg-slate-700 ring-1 ring-black ring-opacity-5 focus:outline-none z-20"
                    role="menu" aria-orientation="vertical" aria-labelledby="export-menu-button" tabIndex={-1}
                >
                    <div className="py-1" role="none">
                        <button onClick={() => handleExportPlan('clipboard')} className="text-slate-100 block w-full text-left px-4 py-2 text-sm hover:bg-slate-600 transition-colors duration-100" role="menuitem" tabIndex={-1} id="export-menu-item-0">📋 Copy Full Plan</button>
                        <button onClick={() => handleExportPlan('showdown')} className="text-slate-100 block w-full text-left px-4 py-2 text-sm hover:bg-slate-600 transition-colors duration-100" role="menuitem" tabIndex={-1} id="export-menu-item-1">📋 Copy Showdown EVs</button>
                        <button onClick={() => handleExportPlan('text')} className="text-slate-100 block w-full text-left px-4 py-2 text-sm hover:bg-slate-600 transition-colors duration-100" role="menuitem" tabIndex={-1} id="export-menu-item-2">💾 Export as .txt</button>
                        <button onClick={() => handleExportPlan('json')} className="text-slate-100 block w-full text-left px-4 py-2 text-sm hover:bg-slate-600 transition-colors duration-100" role="menuitem" tabIndex={-1} id="export-menu-item-3">📦 Export as .json</button>
                    </div>
                </div>
            )}
        </div>
      </div>

    </div>
  );
};

export default ResultsDisplay;
