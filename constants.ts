
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

export const ITEMS: Item[] = [
  // Vitamins
  { id: 'hp-up', name: 'HP Up', category: 'Vitamin', affectedStat: Stat.HP, evGain: 10, pokeApiSpriteName: 'hp-up' },
  { id: 'protein', name: 'Protein', category: 'Vitamin', affectedStat: Stat.Attack, evGain: 10, pokeApiSpriteName: 'protein' },
  { id: 'iron', name: 'Iron', category: 'Vitamin', affectedStat: Stat.Defense, evGain: 10, pokeApiSpriteName: 'iron' },
  { id: 'calcium', name: 'Calcium', category: 'Vitamin', affectedStat: Stat.SpAttack, evGain: 10, pokeApiSpriteName: 'calcium' },
  { id: 'zinc', name: 'Zinc', category: 'Vitamin', affectedStat: Stat.SpDefense, evGain: 10, pokeApiSpriteName: 'zinc' },
  { id: 'carbos', name: 'Carbos', category: 'Vitamin', affectedStat: Stat.Speed, evGain: 10, pokeApiSpriteName: 'carbos' },

  // Mochi (Using names as pokeApiSpriteName for fallback as official sprites might not be in PokeAPI's items list)
  { id: 'health-mochi', name: 'Health Mochi', category: 'Mochi', affectedStat: Stat.HP, evGain: 10, pokeApiSpriteName: 'health-mochi' },
  { id: 'muscle-mochi', name: 'Muscle Mochi', category: 'Mochi', affectedStat: Stat.Attack, evGain: 10, pokeApiSpriteName: 'muscle-mochi' },
  { id: 'resist-mochi', name: 'Resist Mochi', category: 'Mochi', affectedStat: Stat.Defense, evGain: 10, pokeApiSpriteName: 'resist-mochi' },
  { id: 'genius-mochi', name: 'Genius Mochi', category: 'Mochi', affectedStat: Stat.SpAttack, evGain: 10, pokeApiSpriteName: 'genius-mochi' },
  { id: 'clever-mochi', name: 'Clever Mochi', category: 'Mochi', affectedStat: Stat.SpDefense, evGain: 10, pokeApiSpriteName: 'clever-mochi' },
  { id: 'swift-mochi', name: 'Swift Mochi', category: 'Mochi', affectedStat: Stat.Speed, evGain: 10, pokeApiSpriteName: 'swift-mochi' },
  
  // Feathers (PokeAPI uses 'wing' for feathers)
  { id: 'health-feather', name: 'Health Feather', category: 'Feather', affectedStat: Stat.HP, evGain: 1, pokeApiSpriteName: 'health-wing' },
  { id: 'muscle-feather', name: 'Muscle Feather', category: 'Feather', affectedStat: Stat.Attack, evGain: 1, pokeApiSpriteName: 'muscle-wing' },
  { id: 'resist-feather', name: 'Resist Feather', category: 'Feather', affectedStat: Stat.Defense, evGain: 1, pokeApiSpriteName: 'resist-wing' },
  { id: 'genius-feather', name: 'Genius Feather', category: 'Feather', affectedStat: Stat.SpAttack, evGain: 1, pokeApiSpriteName: 'genius-wing' },
  { id: 'clever-feather', name: 'Clever Feather', category: 'Feather', affectedStat: Stat.SpDefense, evGain: 1, pokeApiSpriteName: 'clever-wing' },
  { id: 'swift-feather', name: 'Swift Feather', category: 'Feather', affectedStat: Stat.Speed, evGain: 1, pokeApiSpriteName: 'swift-wing' },
];

export const INITIAL_TARGET_EVS: StatsTable = {
  [Stat.HP]: 0,
  [Stat.Attack]: 252,
  [Stat.Defense]: 0,
  [Stat.SpAttack]: 0,
  [Stat.SpDefense]: 6,
  [Stat.Speed]: 252,
};

export const INITIAL_CURRENT_EVS: StatsTable = STAT_ORDER.reduce((acc, stat) => {
  acc[stat] = 0;
  return acc;
}, {} as StatsTable);

export const INITIAL_INVENTORY: Inventory = ITEMS.reduce((acc, item) => {
  acc[item.id] = 0; // Default all items to 0
  return acc;
}, {} as Inventory);

export const STAT_COLORS: Record<Stat, string> = {
  [Stat.HP]: 'bg-red-500',
  [Stat.Attack]: 'bg-orange-500',
  [Stat.Defense]: 'bg-yellow-500',
  [Stat.SpAttack]: 'bg-blue-500',
  [Stat.SpDefense]: 'bg-green-500',
  [Stat.Speed]: 'bg-pink-500',
};

export const STAT_ICONS: Record<Stat, string> = {
  [Stat.HP]: '💖',
  [Stat.Attack]: '⚔️',
  [Stat.Defense]: '🛡️',
  [Stat.SpAttack]: '🔮',
  [Stat.SpDefense]: '🧠',
  [Stat.Speed]: '💨',
};
