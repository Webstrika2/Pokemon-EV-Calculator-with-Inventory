
import { Stat, StatsTable } from '../types';
import { MAX_EV_PER_STAT } from '../constants';

export const statShorthands: Record<string, Stat> = {
  'hp': Stat.HP,
  'atk': Stat.Attack, 'attack': Stat.Attack,
  'def': Stat.Defense, 'defense': Stat.Defense,
  'spa': Stat.SpAttack, 'sp.atk': Stat.SpAttack, 'sp atk': Stat.SpAttack, 'spattack': Stat.SpAttack, 'special attack': Stat.SpAttack, 'sp. attack': Stat.SpAttack,
  'spd': Stat.SpDefense, 'sp.def': Stat.SpDefense, 'sp def': Stat.SpDefense, 'spdefense': Stat.SpDefense, 'special defense': Stat.SpDefense, 'sp. defense': Stat.SpDefense,
  'spe': Stat.Speed, 'speed': Stat.Speed,
};

export interface EVParseResult {
  parsedEVs: Partial<StatsTable>;
  message?: string;
  rawFoundEVString?: string;
}

export const parseEVString = (fullInput: string): EVParseResult => {
  const lines = fullInput.split('\n');
  let firstEVsData: Partial<StatsTable> = {};
  let rawEVStringFound: string | undefined = undefined;
  let multipleEVLinesDetected = false;
  let evLineEncountered = false;

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.toLowerCase().startsWith('evs:')) {
      const evPart = trimmedLine.substring(4).trim();
      if (!evLineEncountered) {
        evLineEncountered = true;
        rawEVStringFound = `EVs: ${evPart}`;
        const parts = evPart.split(/[\/\,]+/);
        parts.forEach(part => {
          part = part.trim();
          const match = part.match(/(\d+)\s*([a-z\.\s]+)/i);
          if (match) {
            const value = parseInt(match[1], 10);
            const statNameKey = match[2].trim().toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ');
            const targetStat = statShorthands[statNameKey];
            if (targetStat && !isNaN(value)) {
              firstEVsData[targetStat] = Math.min(value, MAX_EV_PER_STAT);
            }
          }
        });
      } else {
        multipleEVLinesDetected = true;
      }
    }
  }

  let message: string | undefined;
  if (multipleEVLinesDetected && rawEVStringFound) {
    message = `Multiple EV lines detected. Using the first one found: '${rawEVStringFound}'.`;
  } else if (!evLineEncountered && fullInput.trim() !== "") {
    message = "No 'EVs:' line found in the input.";
  }

  return { parsedEVs: firstEVsData, message, rawFoundEVString: rawEVStringFound };
};
