
import { useState, useCallback, useMemo, useEffect } from 'react';
import { Inventory, Item } from '../types';
import { ITEMS, INITIAL_INVENTORY } from '../constants'; // Changed DEFAULT_ITEMS to ITEMS
import { textToNumberMap } from '../utils/helpers'; // Import from new location

type SetCalculationResultType = React.Dispatch<React.SetStateAction<any | null>>;
type SetQuickUpdateMessagesType = React.Dispatch<React.SetStateAction<Record<Item['category'], string | null>>>;

const initialQuickInputs: Record<Item['category'], string> = {
  'Vitamin': '', 'Mochi': '', 'Feather': '',
};

const initialQuickUpdateMessages: Record<Item['category'], string | null> = {
  'Vitamin': null, 'Mochi': null, 'Feather': null,
};

export const useInventory = (
    setCalculationResult: SetCalculationResultType,
    setAppQuickUpdateMessages: SetQuickUpdateMessagesType
) => {
  const [inventory, setInventory] = useState<Inventory>(() => {
    try {
      const savedInventory = localStorage.getItem('pokemonEVInventory_v1');
      if (savedInventory) {
        const parsed = JSON.parse(savedInventory);
        if (typeof parsed === 'object' && parsed !== null) {
          let validatedInventory = { ...INITIAL_INVENTORY };
          for (const key in parsed) {
            if (Object.prototype.hasOwnProperty.call(parsed, key) && INITIAL_INVENTORY.hasOwnProperty(key)) {
              const quantity = Number(parsed[key]);
              validatedInventory[key] = isNaN(quantity) || quantity < 0 ? 0 : quantity;
            }
          }
          ITEMS.forEach(item => {
            if (!validatedInventory.hasOwnProperty(item.id)) {
              validatedInventory[item.id] = 0;
            }
          });
          return validatedInventory;
        }
      }
    } catch (error) {
      console.error("Failed to load inventory from localStorage:", error);
    }
    return INITIAL_INVENTORY;
  });

  const [itemSortOrders, setItemSortOrders] = useState<Record<Item['category'], string[]>>(() => {
    const defaultOrders: Record<Item['category'], string[]> = { Vitamin: [], Mochi: [], Feather: [] };
    ITEMS.forEach(item => {
      if (defaultOrders[item.category]) defaultOrders[item.category].push(item.id);
    });
    try {
      const savedOrders = localStorage.getItem('pokemonEVInventory_ItemOrders_v1');
      if (savedOrders) {
        const parsedOrders = JSON.parse(savedOrders);
        (Object.keys(defaultOrders) as Item['category'][]).forEach(cat => {
          if (parsedOrders[cat] && Array.isArray(parsedOrders[cat]) &&
              parsedOrders[cat].length === defaultOrders[cat].length &&
              parsedOrders[cat].every((id: string) => defaultOrders[cat].includes(id)) &&
              new Set(parsedOrders[cat]).size === defaultOrders[cat].length) {
            defaultOrders[cat] = parsedOrders[cat];
          } else {
             console.warn(`Invalid or missing item order for ${cat} in localStorage. Using default.`);
          }
        });
      }
    } catch (error) { console.error("Failed to load item orders from localStorage:", error); }
    return defaultOrders;
  });

  const [quickUpdateInputs, setQuickUpdateInputs] = useState<Record<Item['category'], string>>(initialQuickInputs);
  const [quickUpdateMessages, setQuickUpdateMessages] = useState<Record<Item['category'], string | null>>(initialQuickUpdateMessages);


  useEffect(() => {
    try { localStorage.setItem('pokemonEVInventory_v1', JSON.stringify(inventory)); } 
    catch (error) { console.error("Failed to save inventory to localStorage:", error); }
  }, [inventory]);

  useEffect(() => {
    try { localStorage.setItem('pokemonEVInventory_ItemOrders_v1', JSON.stringify(itemSortOrders)); } 
    catch (error) { console.error("Failed to save item orders to localStorage:", error); }
  }, [itemSortOrders]);

  const handleInventoryChange = useCallback((itemId: string, quantity: number) => {
    setInventory(prev => ({ ...prev, [itemId]: Math.max(0, quantity) }));
    const item = ITEMS.find(i => i.id === itemId);
    if (item) {
      setQuickUpdateMessages(prev => ({...prev, [item.category]: null}));
      setAppQuickUpdateMessages(prev => ({...prev, [item.category]: null}));
    }
    setCalculationResult(null);
  }, [setCalculationResult, setAppQuickUpdateMessages]);

  const handleReorderCategoryItems = useCallback((category: Item['category'], newOrderedItemIds: string[]) => {
    setItemSortOrders(prevOrders => ({ ...prevOrders, [category]: newOrderedItemIds }));
    setCalculationResult(null);
  }, [setCalculationResult]);

  const handleQuickUpdateInputChange = useCallback((category: Item['category'], value: string) => {
    setQuickUpdateInputs(prev => ({ ...prev, [category]: value }));
    setQuickUpdateMessages(prev => ({ ...prev, [category]: null })); 
    setAppQuickUpdateMessages(prev => ({ ...prev, [category]: null }));
    setCalculationResult(null);
  }, [setCalculationResult, setAppQuickUpdateMessages]);

  const handleApplyQuickUpdate = useCallback((categoryKey: Item['category'], sectionTitle: string) => {
    const orderedItemIdsInCategory = itemSortOrders[categoryKey] || [];
    const itemsForCategory = orderedItemIdsInCategory.map(id => ITEMS.find(item => item.id === id)).filter(Boolean) as Item[];
    let inputValue = quickUpdateInputs[categoryKey]?.trim() || '';
    if (inputValue.endsWith('.')) inputValue = inputValue.slice(0, -1).trim();

    if (inputValue === "") {
      const msg = "Input is empty.";
      setQuickUpdateMessages(prev => ({ ...prev, [categoryKey]: msg }));
      setAppQuickUpdateMessages(prev => ({ ...prev, [categoryKey]: msg }));
      return;
    }
    
    const quantitiesStr = inputValue.split(/[\s,]+/).map(q => q.trim().toLowerCase()).filter(q => q !== "");
    const oldInventoryForCategory = itemsForCategory.reduce((acc, item) => {
        acc[item.id] = inventory[item.id] || 0; return acc;
    }, {} as Inventory);
    
    let newInventory = { ...inventory };
    let updatedCount = 0;
    let skippedCount = 0;

    quantitiesStr.forEach((qStr, index) => {
      if (index < itemsForCategory.length) {
        let num = parseInt(qStr, 10);
        if (isNaN(num)) num = textToNumberMap[qStr];
        if (num !== undefined && !isNaN(num) && num >= 0) {
          newInventory[itemsForCategory[index].id] = num;
          if ((oldInventoryForCategory[itemsForCategory[index].id] !== num) || oldInventoryForCategory[itemsForCategory[index].id] === undefined && num !== undefined) {
            updatedCount++;
          }
        } else {
          skippedCount++;
        }
      }
    });
    
    let message = "";
    if (updatedCount > 0) {
      setInventory(newInventory);
      setQuickUpdateInputs(prev => ({ ...prev, [categoryKey]: '' })); 
      setCalculationResult(null);
      const updatedItemsList = itemsForCategory
        .filter(item => newInventory[item.id] !== oldInventoryForCategory[item.id] && newInventory[item.id] !== undefined)
        .map(item => `${item.name}: ${newInventory[item.id]}`)
        .join(', ');
      message = `✅ ${updatedCount} item(s) in ${sectionTitle} updated: [${updatedItemsList}]. `;
    } else if (quantitiesStr.length > 0 && skippedCount === quantitiesStr.length) {
        message = `⚠️ No valid quantities found. All ${skippedCount} entr${skippedCount === 1 ? 'y was' : 'ies were'} invalid for ${sectionTitle}.`;
    } else if (quantitiesStr.length === 0 && inputValue !== "") {
        message = `⚠️ No quantities found or parsed in input for ${sectionTitle}.`;
    } else if (updatedCount === 0 && skippedCount === 0 && inputValue !== ""){ 
        message = `ℹ️ No changes applied to ${sectionTitle} inventory (values may be the same as current).`;
    }

    if (skippedCount > 0 && updatedCount > 0) message += `${skippedCount} other entr${skippedCount === 1 ? 'y was' : 'ies were'} skipped. `;
    
    const finalMsg = message.trim() || null;
    setQuickUpdateMessages(prev => ({ ...prev, [categoryKey]: finalMsg }));
    setAppQuickUpdateMessages(prev => ({ ...prev, [categoryKey]: finalMsg }));

  }, [inventory, quickUpdateInputs, itemSortOrders, setCalculationResult, setAppQuickUpdateMessages]);

  const handleResetCategory = useCallback((categoryToReset: Item['category']) => {
    setInventory(prevInventory => {
      const newInventory = { ...prevInventory };
      ITEMS.filter(item => item.category === categoryToReset).forEach(item => {
        newInventory[item.id] = 0;
      });
      return newInventory;
    });
    const msg = `${categoryToReset} inventory has been reset.`;
    setQuickUpdateMessages(prev => ({ ...prev, [categoryToReset]: msg }));
    setAppQuickUpdateMessages(prev => ({ ...prev, [categoryToReset]: msg }));
    setCalculationResult(null);
  }, [setCalculationResult, setAppQuickUpdateMessages]);

  const inventorySummary = useMemo(() => {
    const summary: Record<Item['category'], number> & { total: number } = {
      Vitamin: 0, Mochi: 0, Feather: 0, total: 0,
    };
    ITEMS.forEach(item => {
      const count = inventory[item.id] || 0;
      if (count > 0) { 
        summary[item.category] = (summary[item.category] || 0) + count;
        summary.total += count;
      }
    });
    return summary;
  }, [inventory]);

  return {
    inventory,
    setInventory, // Expose for calculation hook
    itemSortOrders,
    quickUpdateInputs,
    setQuickUpdateInputs, // Expose for calculation hook or App.tsx
    quickUpdateMessages, // Local messages
    setQuickUpdateMessages, // Local messages setter
    handleInventoryChange,
    handleReorderCategoryItems,
    handleQuickUpdateInputChange,
    handleApplyQuickUpdate,
    handleResetCategory,
    inventorySummary,
  };
};
