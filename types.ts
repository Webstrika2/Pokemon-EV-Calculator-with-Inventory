
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

export interface UsedItems {
  [itemId: string]: number; // Can include items from inventory and items to be purchased
}

export interface CalculationResult {
  itemsToUse: UsedItems;
  itemUsageDetails: Array<{ 
    stat: Stat; 
    itemName: string; 
    quantity: number; 
    evsGained: number;
    source: 'inventory' | 'purchase'; // To distinguish item source
  }>;
  remainingInventory: Inventory; // Inventory *after* using existing items, before purchase
  evsGainedPerStat: StatsTable;
  evsStillNeeded: StatsTable;
  warnings: string[];
  overallStatusMessage: string;

  // Currency and Purchase related fields
  vitaminsToPurchase?: Record<string, number>; // itemId: quantity
  totalPurchaseCost?: number;
  fundsUsed?: { lp: number; pd: number };
  remainingLeaguePoints?: number;
  remainingPokeDollars?: number;
  monetaryShortfall?: number;
  itemShortfall?: Record<string, number>; // itemId: quantity (vitamins you couldn't afford)
  purchaseAttempted?: boolean; // True if a purchase was considered
}

export const VITAMIN_COST = 10000;
