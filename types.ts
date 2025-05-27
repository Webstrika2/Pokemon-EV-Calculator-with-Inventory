export enum Stat {
  HP = "HP",
  Attack = "Attack",
  Defense = "Defense",
  SpAttack = "Sp. Attack",
  SpDefense = "Sp. Defense",
  Speed = "Speed",
}

export type StatsTable = Record<Stat, number>;

export interface Item {
  id: string;
  name: string;
  category: 'Vitamin' | 'Mochi' | 'Feather';
  affectedStat: Stat;
  evGain: number;
  pokeApiSpriteName: string; 
}

export interface Inventory {
  [itemId: string]: number;
}

// Details for items used from inventory
export interface UsedOwnedItemDetail {
  itemId: string;
  itemName: string;
  quantity: number;
  evsGained: number;
}

// Details for items suggested for purchase
export interface SuggestedPurchaseDetail {
  itemId: string;
  itemName: string;
  costPerItem: number;

  quantitySuggested: number; // Original ideal quantity for this stat
  totalCostSuggested: number; // Cost for quantitySuggested
  evsGainedIfFullyPurchased: number; // EVs if quantitySuggested is bought

  quantityAffordable: number; // How many could actually be bought for this specific line item
  costPaid: number; // Actual cost for quantityAffordable
  evsGainedFromThisPurchase: number; // EVs from quantityAffordable
  
  isPartialPurchase: boolean; // True if quantityAffordable < quantitySuggested and quantityAffordable > 0
  quantityStillNeeded: number; // If partial or unaffordable: quantitySuggested - quantityAffordable
  costForStillNeeded: number; // If partial or unaffordable: cost for quantityStillNeeded
}

// Comprehensive breakdown for each stat in the results
export interface StatCalculationDetail {
  targetEV: number;
  currentEV: number;
  initialNeed: number; // targetEV - currentEV
  
  evsGainedFromOwned: number;
  usedOwnedItems: UsedOwnedItemDetail[];
  
  evsGainedFromAffordablePurchases: number; // EVs gained from purchases that are affordable (sum of evsGainedFromThisPurchase)
  suggestedPurchases: SuggestedPurchaseDetail[]; // All suggestions, with details on what was affordable

  finalEVs: number; // currentEV + gainedFromOwned + gainedFromAffordablePurchases
  evsStillNeeded: number; // targetEV - finalEVs
}

export interface CalculationResult {
  statDetails: Record<Stat, StatCalculationDetail>;
  
  totalPurchaseCostAllSuggestions: number; // Cost if all suggestions were purchased (sum of totalCostSuggested)
  totalCostAffordablePurchases: number; // Cost of only the affordable purchases (sum of costPaid)
  totalAdditionalCurrencyNeededToMeetAllGoals: number; // Sum of all costForStillNeeded
  
  canAffordAllSuggestedPurchases: boolean; // True if totalAdditionalCurrencyNeededToMeetAllGoals is 0
  
  pokeDollarsAfterAffordablePurchases: number;
  leaguePointsAfterAffordablePurchases: number;
  
  warnings: string[];
  overallStatusMessage: string;

  targetEVs: StatsTable;
  currentEVs: StatsTable;
}