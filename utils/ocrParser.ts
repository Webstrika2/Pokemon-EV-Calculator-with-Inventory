
import { ITEMS } from '../constants'; // Changed DEFAULT_ITEMS to ITEMS
import { Inventory } from '../types';

export const parseUniversalOCRDataAndUpdateInventory = (
  text: string,
  currentInventory: Inventory,
  setInventory: React.Dispatch<React.SetStateAction<Inventory>>,
  setCalculationResult: React.Dispatch<React.SetStateAction<any | null>> // Type appropriately
): string => {
  const lines = text.split('\n').map(line => line.trim().toLowerCase());
  const updatedQuantities: Record<string, number> = {};
  const localWarnings: string[] = [];
  const processedItemNames: Set<string> = new Set();

  for (const item of ITEMS) {
    const itemNameLower = item.name.toLowerCase();
    for (const line of lines) {
      if (line.includes(itemNameLower) && !processedItemNames.has(item.name)) {
        const simplifiedLine = line.replace(itemNameLower, "ITEM_PLACEHOLDER");
        const qtyMatch = simplifiedLine.match(/(?:x\s*|\b)(\d+)\b/) || line.match(new RegExp(`(?:\\b${itemNameLower}\\s*(?:x\\s*)?(\\d+)|(\\d+)\\s*(?:x\\s*)?${itemNameLower})`));
        
        let quantity: number | null = null;
        if (qtyMatch) {
          for (let i = 1; i < qtyMatch.length; i++) {
            if (qtyMatch[i] !== undefined) {
              quantity = parseInt(qtyMatch[i], 10);
              break;
            }
          }
        }

        if (quantity !== null && !isNaN(quantity) && quantity >= 0) {
          updatedQuantities[item.id] = quantity;
          processedItemNames.add(item.name);
        } else if (quantity === null) {
          localWarnings.push(`Found "${item.name}" but couldn't parse quantity on line: "${line.substring(0, 60)}${line.length > 60 ? '...' : ''}".`);
        }
        break; 
      }
    }
  }

  if (Object.keys(updatedQuantities).length > 0) {
    setInventory(prevInventory => {
      const newInventory = { ...prevInventory };
      for (const itemId in updatedQuantities) {
        newInventory[itemId] = Math.max(0, updatedQuantities[itemId]);
      }
      return newInventory;
    });
    setCalculationResult(null);
  }

  let summaryMessage = `Universal OCR processing complete. `;
  if (Object.keys(updatedQuantities).length > 0) {
    summaryMessage += `${Object.keys(updatedQuantities).length} item type(s) updated in inventory. `;
  } else {
    summaryMessage += "No items were identified or updated from the screen capture. ";
  }
  if (localWarnings.length > 0) {
    summaryMessage += `Warnings: ${localWarnings.join('; ')}`;
  }
  return summaryMessage;
};
