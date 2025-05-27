import { Stat, Item, StatsTable, Inventory } from './types';

export const STAT_ORDER: Stat[] = [
  Stat.HP,
  Stat.Attack,
  Stat.Defense,
  Stat.SpAttack,
  Stat.SpDefense,
  Stat.Speed,
];

export const MAX_EV_PER_STAT = 252;
export const MAX_TOTAL_EVS = 510;
export const VITAMIN_COST = 10000;

// Updated Vitamin Order: HP Up, Protein, Iron, Carbos, Calcium, Zinc
export const ITEMS: Item[] = [
  // Vitamins
  { id: 'hp-up', name: 'HP Up', category: 'Vitamin', affectedStat: Stat.HP, evGain: 10, pokeApiSpriteName: 'hp-up' },
  { id: 'protein', name: 'Protein', category: 'Vitamin', affectedStat: Stat.Attack, evGain: 10, pokeApiSpriteName: 'protein' },
  { id: 'iron', name: 'Iron', category: 'Vitamin', affectedStat: Stat.Defense, evGain: 10, pokeApiSpriteName: 'iron' },
  { id: 'carbos', name: 'Carbos', category: 'Vitamin', affectedStat: Stat.Speed, evGain: 10, pokeApiSpriteName: 'carbos' },
  { id: 'calcium', name: 'Calcium', category: 'Vitamin', affectedStat: Stat.SpAttack, evGain: 10, pokeApiSpriteName: 'calcium' },
  { id: 'zinc', name: 'Zinc', category: 'Vitamin', affectedStat: Stat.SpDefense, evGain: 10, pokeApiSpriteName: 'zinc' },

  // Mochi (Using names as pokeApiSpriteName for fallback as official sprites might not be in PokeAPI's items list)
  // Order within Mochi can follow STAT_ORDER or remain as is, user didn't specify. Keeping original for now.
  { id: 'health-mochi', name: 'Health Mochi', category: 'Mochi', affectedStat: Stat.HP, evGain: 10, pokeApiSpriteName: 'health-mochi' },
  { id: 'muscle-mochi', name: 'Muscle Mochi', category: 'Mochi', affectedStat: Stat.Attack, evGain: 10, pokeApiSpriteName: 'muscle-mochi' },
  { id: 'resist-mochi', name: 'Resist Mochi', category: 'Mochi', affectedStat: Stat.Defense, evGain: 10, pokeApiSpriteName: 'resist-mochi' },
  { id: 'genius-mochi', name: 'Genius Mochi', category: 'Mochi', affectedStat: Stat.SpAttack, evGain: 10, pokeApiSpriteName: 'genius-mochi' },
  { id: 'clever-mochi', name: 'Clever Mochi', category: 'Mochi', affectedStat: Stat.SpDefense, evGain: 10, pokeApiSpriteName: 'clever-mochi' },
  { id: 'swift-mochi', name: 'Swift Mochi', category: 'Mochi', affectedStat: Stat.Speed, evGain: 10, pokeApiSpriteName: 'swift-mochi' },
  
  // Feathers (PokeAPI uses 'wing' for feathers)
  // Order within Feathers can follow STAT_ORDER or remain as is. Keeping original for now.
  { id: 'health-feather', name: 'Health Feather', category: 'Feather', affectedStat: Stat.HP, evGain: 1, pokeApiSpriteName: 'health-wing' },
  { id: 'muscle-feather', name: 'Muscle Feather', category: 'Feather', affectedStat: Stat.Attack, evGain: 1, pokeApiSpriteName: 'muscle-wing' },
  { id: 'resist-feather', name: 'Resist Feather', category: 'Feather', affectedStat: Stat.Defense, evGain: 1, pokeApiSpriteName: 'resist-wing' },
  { id: 'genius-feather', name: 'Genius Feather', category: 'Feather', affectedStat: Stat.SpAttack, evGain: 1, pokeApiSpriteName: 'genius-wing' },
  { id: 'clever-feather', name: 'Clever Feather', category: 'Feather', affectedStat: Stat.SpDefense, evGain: 1, pokeApiSpriteName: 'clever-wing' },
  { id: 'swift-feather', name: 'Swift Feather', category: 'Feather', affectedStat: Stat.Speed, evGain: 1, pokeApiSpriteName: 'swift-wing' },
];

export const INITIAL_TARGET_EVS: StatsTable = STAT_ORDER.reduce((acc, stat) => {
  acc[stat] = 0;
  return acc;
}, {
  // Example competitive spread from original prompt (adjust as needed or keep all zero)
  // [Stat.HP]: 0,
  // [Stat.Attack]: 252,
  // [Stat.Defense]: 0,
  // [Stat.SpAttack]: 0,
  // [Stat.SpDefense]: 6,
  // [Stat.Speed]: 252,
} as StatsTable);


export const INITIAL_CURRENT_EVS: StatsTable = STAT_ORDER.reduce((acc, stat) => {
  acc[stat] = 0;
  return acc;
}, {} as StatsTable);

export const INITIAL_INVENTORY: Inventory = ITEMS.reduce((acc, item) => {
  acc[item.id] = 0; // Default all items to 0
  return acc;
}, {} as Inventory);

export const INITIAL_POKE_DOLLARS = 0;
export const INITIAL_LEAGUE_POINTS = 0;

export const STAT_COLORS: Record<Stat, string> = {
  [Stat.HP]: 'bg-red-500',
  [Stat.Attack]: 'bg-orange-500', // pokeYellow is F59E0B, orange is closer for attack
  [Stat.Defense]: 'bg-yellow-400', // Adjusted for slight differentiation
  [Stat.SpAttack]: 'bg-blue-500', // pokeBlue
  [Stat.SpDefense]: 'bg-green-500', // pokeGreen
  [Stat.Speed]: 'bg-pink-500',
};
export const STAT_TEXT_COLORS: Record<Stat, string> = {
  [Stat.HP]: 'text-red-300',
  [Stat.Attack]: 'text-orange-300',
  [Stat.Defense]: 'text-yellow-300',
  [Stat.SpAttack]: 'text-blue-300',
  [Stat.SpDefense]: 'text-green-300',
  [Stat.Speed]: 'text-pink-300',
};

// Helper to get a specific item by ID
export const getItemById = (itemId: string): Item | undefined => ITEMS.find(item => item.id === itemId);
