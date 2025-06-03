
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Stat, StatsTable, CalculationResult, Item } from './types';
import { STAT_ORDER, ITEMS, MAX_TOTAL_EVS } from './constants'; // Changed DEFAULT_ITEMS to ITEMS, Added MAX_TOTAL_EVS
import StatInput from './components/StatInput';
import CollapsibleSection from './components/CollapsibleSection';
import ResultsDisplay from './components/ResultsDisplay';
import TotalEVBar from './components/TotalEVBar';
import ImageOCRModal from './components/ImageOCRModal';
import CurrencyInput from './components/CurrencyInput';
import InventoryItemInput from './components/InventoryItemInput';

import { useEVs } from './hooks/useEVs';
import { useInventory } from './hooks/useInventory';
import { useCurrency } from './hooks/useCurrency';
import { useOCR } from './hooks/useOCR';
import { useVoiceInput } from './hooks/useVoiceInput';
import { useCalculation, CalculationParams } from './hooks/useCalculation'; // Import CalculationParams

declare var Tesseract: any;

// For Speech Recognition API and MediaDevices augmentation
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}


const App: React.FC = () => {
  // --- State for Inter-Hook Communication or Global Messages ---
  const [globalParseMessage, setGlobalParseMessage] = useState<string | null>(null);
  const [globalQuickUpdateMessages, setGlobalQuickUpdateMessages] = useState<Record<Item['category'], string | null>>({
    Vitamin: null, Mochi: null, Feather: null,
  });
  const [globalOcrMessage, setGlobalOcrMessage] = useState<string | null>(
    "OCR engine not initialized. Click 'Scan Inventory (OCR)' to start."
  );
  const [globalVoiceInputMessage, setGlobalVoiceInputMessage] = useState<string | null>(null);
  
  // --- Calculation Hook ---
  const {
    calculationResult,
    setCalculationResult,
    isCalculating,
    subtractItemsAfterCalc,
    setSubtractItemsAfterCalc,
    handleCalculateButtonClick: triggerCalculation, // Renamed to avoid conflict with App's handler
  } = useCalculation();

  // --- EV Management Hook ---
  const {
    targetEVs,
    currentEVs,
    evInputString,
    setEvInputString,
    parseMessage: evParseMessage, 
    setParseMessage: setEvParseMessage,
    handleTargetEVChange,
    handleCurrentEVChange,
    handleParseAndApplyEVs,
    totalTargetEVs,
    isTotalEVsMaxed,
  } = useEVs(setCalculationResult, setGlobalParseMessage);

  // --- Inventory Management Hook ---
  const {
    inventory,
    setInventory, 
    itemSortOrders,
    quickUpdateInputs,
    setQuickUpdateInputs, 
    quickUpdateMessages: invQuickUpdateMessages, 
    setQuickUpdateMessages: setInvQuickUpdateMessages,
    handleInventoryChange,
    handleReorderCategoryItems,
    handleApplyQuickUpdate,
    handleResetCategory,
    inventorySummary,
    handleQuickUpdateInputChange
  } = useInventory(setCalculationResult, setGlobalQuickUpdateMessages);

  // --- Currency Management Hook ---
  const {
    leaguePointsInput,
    setLeaguePointsInput, 
    pokeDollarsInput,
    setPokeDollarsInput, 
    currencyPriority,
    setCurrencyPriority,
    handleCurrencyChange,
  } = useCurrency(setCalculationResult);


  // --- OCR Hook ---
  const {
    ocrModalOpen,
    ocrLoading,
    ocrMessage: ocrHookMessage, 
    setOcrMessage: setOcrHookMessage,
    ocrPreviewImage,
    isTesseractReady,
    isTesseractInitializing,
    tesseractInitError,
    initializeTesseract,
    handleGlobalOCRTrigger,
    handleCloseOCRModal,
    handleImageForOCR,
  } = useOCR(
      setInventory, 
      inventory, 
      setCalculationResult, 
      setGlobalOcrMessage, 
      setGlobalParseMessage, setGlobalQuickUpdateMessages, setGlobalVoiceInputMessage
  );
  
  useEffect(() => { 
    setGlobalOcrMessage(ocrHookMessage);
  }, [ocrHookMessage, setGlobalOcrMessage]);


  // --- Voice Input Hook ---
  const {
    voiceInputActiveCategory,
    voiceInputActiveItemIndex,
    voiceInputMessage: voiceHookMessage, 
    setVoiceInputMessage: setVoiceHookMessage,
    isListening,
    handleToggleVoiceInput,
    playBeep,
  } = useVoiceInput(
      inventory, 
      itemSortOrders, 
      handleInventoryChange, 
      setGlobalVoiceInputMessage, 
      setCalculationResult, setGlobalParseMessage, setGlobalQuickUpdateMessages, setGlobalOcrMessage
  );

  useEffect(() => { 
    setGlobalVoiceInputMessage(voiceHookMessage);
  }, [voiceHookMessage, setGlobalVoiceInputMessage]);

  useEffect(() => { 
    setGlobalParseMessage(evParseMessage);
  }, [evParseMessage, setGlobalParseMessage]);

  useEffect(() => { 
    setGlobalQuickUpdateMessages(invQuickUpdateMessages);
  }, [invQuickUpdateMessages, setGlobalQuickUpdateMessages]);


  // --- Effect for global initializations (Tesseract, SpeechRecognition) ---
  useEffect(() => {
    initializeTesseract(); 
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const handleAppCalculateButtonClick = useCallback(() => {
    const params: CalculationParams = {
        targetEVs, currentEVs, inventory, leaguePointsInput, pokeDollarsInput, currencyPriority, itemSortOrders,
        setInventory, setLeaguePointsInput, setPokeDollarsInput,
        setGlobalParseMessage, setGlobalQuickUpdateMessages, setGlobalOcrMessage, setGlobalVoiceInputMessage
    };
    triggerCalculation(params);
  }, [
    targetEVs, currentEVs, inventory, leaguePointsInput, pokeDollarsInput, currencyPriority, itemSortOrders,
    setInventory, setLeaguePointsInput, setPokeDollarsInput,
    setGlobalParseMessage, setGlobalQuickUpdateMessages, setGlobalOcrMessage, setGlobalVoiceInputMessage,
    triggerCalculation
  ]);


  const itemCategories = useMemo(() => {
    const categories: Record<Item['category'], Item[]> = {
      Vitamin: ITEMS.filter(item => item.category === 'Vitamin'),
      Mochi: ITEMS.filter(item => item.category === 'Mochi'),
      Feather: ITEMS.filter(item => item.category === 'Feather'),
    };
    const orderedCategoryNames: Item['category'][] = ['Vitamin', 'Mochi', 'Feather'];
    const orderedCategories: { name: string, items: Item[], categoryKey: Item['category'] }[] = [];

    orderedCategoryNames.forEach(catKey => {
      if (categories[catKey] && categories[catKey].length > 0) {
        orderedCategories.push({
          name: catKey + 's',
          items: categories[catKey],
          categoryKey: catKey
        });
      }
    });
    return orderedCategories;
  }, []);

  const getDisplayedParseMessage = () => {
    if (globalParseMessage) return globalParseMessage;
    return null;
  }

  const displayedParseMessage = getDisplayedParseMessage();


  return (
    <div className="min-h-screen container mx-auto p-4 flex flex-col items-center">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold text-pokeYellow tracking-tight">Pokémon EV Calculator</h1>
        <p className="text-slate-400 mt-1">Optimize your Pokémon's Effort Values with your available items and funds!</p>
      </header>

      <div className="w-full max-w-4xl space-y-6">
        <section className="p-6 bg-slate-800 rounded-xl shadow-2xl">
          <h2 className="text-2xl font-semibold mb-2 text-slate-100">EV Configuration</h2>
          <p className="text-sm text-slate-400 mb-4">Set your Pokémon's current EVs and target EVs, or parse an EV string / Showdown import.</p>
          
          <div className="my-4 p-4 bg-slate-700/50 rounded-lg shadow">
            <label htmlFor="ev-string-parser" className="block text-sm font-medium text-slate-300 mb-1">Parse EV String or Showdown Import</label>
            <div className="flex space-x-2">
              <textarea
                id="ev-string-parser"
                value={evInputString}
                onChange={(e) => { setEvInputString(e.target.value); if (globalParseMessage) setGlobalParseMessage(null); setCalculationResult(null); }}
                placeholder="Enter EV string (e.g., EVs: 252 Atk / 4 Def / 252 Spe) or paste a full Showdown import..."
                className="flex-grow p-2 bg-slate-800 border border-slate-600 rounded-md text-sm focus:ring-pokeBlue focus:border-pokeBlue min-h-[60px] resize-y"
                aria-label="Parse EV string or Showdown import"
                rows={3}
              />
              <button
                onClick={handleParseAndApplyEVs}
                className="bg-pokeYellow hover:bg-yellow-600 text-slate-900 font-semibold py-2 px-4 rounded-lg shadow-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-75 self-start"
              >
                Parse & Apply
              </button>
            </div>
            {displayedParseMessage && (
              <p 
                id="parse-message-display"
                className={`text-xs mt-2 p-2 rounded-md flex items-start ${displayedParseMessage.includes("❌") || displayedParseMessage.includes("Could not") || displayedParseMessage.includes("empty") ? 'bg-red-500/20 text-red-300' : (displayedParseMessage.includes("✅") || displayedParseMessage.includes("💰") ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300')}`}
                role="alert"
              >
                <span className="mr-1.5 text-base flex-shrink-0 pt-px">
                    {displayedParseMessage.includes("❌") ? '❌' : (displayedParseMessage.includes("✅") ? '✅' : (displayedParseMessage.includes("💰") ? '💰' : '⚠️'))}
                </span>
                <span className="flex-grow break-words">{displayedParseMessage.substring(displayedParseMessage.indexOf(" ") + 1)}</span>
              </p>
            )}
          </div>

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

        <section className="p-6 bg-slate-800 rounded-xl shadow-2xl">
          <h2 className="text-2xl font-semibold mb-4 text-slate-100">Player Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CurrencyInput
              label="League Points (LP)"
              value={leaguePointsInput}
              onChange={handleCurrencyChange(setLeaguePointsInput)}
              placeholderText="0"
            />
            <CurrencyInput
              label="Poké Dollars ($)"
              value={pokeDollarsInput}
              onChange={handleCurrencyChange(setPokeDollarsInput)}
              placeholderText="0"
            />
          </div>
          <div className="mt-4 pt-4 border-t border-slate-700">
            <label className="block text-sm font-medium text-slate-300 mb-2">Prioritize Currency for Purchases:</label>
            <div className="flex items-center space-x-1 bg-slate-700 p-1 rounded-lg shadow-sm w-max">
              <button
                onClick={() => {setCurrencyPriority('lp'); setCalculationResult(null);}}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors duration-150 ${currencyPriority === 'lp' ? 'bg-pokeBlue text-white shadow-md' : 'bg-transparent text-slate-300 hover:bg-slate-600'}`}
                aria-pressed={currencyPriority === 'lp'}
              >
                LP First
              </button>
              <button
                onClick={() => {setCurrencyPriority('pd'); setCalculationResult(null);}}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors duration-150 ${currencyPriority === 'pd' ? 'bg-pokeGreen text-white shadow-md' : 'bg-transparent text-slate-300 hover:bg-slate-600'}`}
                aria-pressed={currencyPriority === 'pd'}
              >
                PokéDollars First
              </button>
            </div>
          </div>
        </section>

        <section>
           <div className="flex justify-between items-center mb-4">
             <h2 className="text-2xl font-semibold text-slate-100">Inventory</h2>
             <button
                onClick={handleGlobalOCRTrigger}
                disabled={isTesseractInitializing || ocrLoading}
                className="bg-pokeBlue hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60 disabled:cursor-not-allowed"
                title={tesseractInitError ? `OCR Error: ${tesseractInitError}` : (isTesseractInitializing ? "OCR engine is initializing..." : (isTesseractReady ? "Scan entire inventory from screen" : "Initialize OCR and scan inventory"))}
              >
                {isTesseractInitializing ? "Initializing OCR..." : (isTesseractReady ? "Scan Inventory (OCR)" : "Start OCR & Scan")}
              </button>
           </div>
           {globalOcrMessage && !ocrModalOpen && ( 
             <div className={`mb-4 p-3 rounded-md text-sm text-center ${globalOcrMessage.includes("failed") || globalOcrMessage.includes("Warnings:") || globalOcrMessage.includes("not ready") || globalOcrMessage.includes("No items") || globalOcrMessage.includes("not loaded") || globalOcrMessage.includes("Error:") || globalOcrMessage.includes("denied") ? 'bg-red-500/30 text-red-300' : (globalOcrMessage.includes("ready") || globalOcrMessage.includes("complete") || globalOcrMessage.includes("updated.") ? 'bg-green-500/30 text-green-300' : 'bg-slate-700/30 text-slate-300')}`}>
               {globalOcrMessage}
             </div>
           )}
            {globalVoiceInputMessage && (
             <div className={`mb-4 p-3 rounded-md text-sm text-center ${globalVoiceInputMessage.toLowerCase().includes("error") || globalVoiceInputMessage.toLowerCase().includes("fail") || globalVoiceInputMessage.toLowerCase().includes("denied") || globalVoiceInputMessage.toLowerCase().includes("could not understand") ? 'bg-red-500/30 text-red-300' : (globalVoiceInputMessage.toLowerCase().includes("listening") || globalVoiceInputMessage.toLowerCase().includes("heard") ? 'bg-blue-500/30 text-blue-300' : 'bg-slate-700/30 text-slate-300')}`}>
               {globalVoiceInputMessage}
             </div>
            )}
          {itemCategories.map(categoryData => {
            const { name: sectionTitle, items: itemsInSection, categoryKey: actualCategory } = categoryData;
            if (!actualCategory) return null;
            
            const orderedItemIdsForThisCategory = itemSortOrders[actualCategory] || itemsInSection.map(i => i.id);
            const currentlyOrderedItems = orderedItemIdsForThisCategory.map(id => ITEMS.find(item => item.id === id)).filter(Boolean) as Item[];

            const examplePlaceholder = currentlyOrderedItems.map(item => item.name.startsWith("H") ? "10" : (item.name.startsWith("P") || item.name.startsWith("M") ? "5" : "0")).slice(0,6).join(" ");
            const voiceInputTooltip = isListening && voiceInputActiveCategory === actualCategory 
                ? `Stop voice input for ${sectionTitle}` 
                : `Start Voice Input for ${sectionTitle}: Click, then say the quantity for each highlighted item (e.g., '5' or 'five'). Say 'stop' or 'cancel' to end. Starts at first empty item based on current order.`;
            
            const currentQuickUpdateMessage = globalQuickUpdateMessages[actualCategory];

            return (
              <div key={sectionTitle} className="mb-4">
                <div className="p-3 bg-slate-700/50 rounded-t-lg shadow-sm">
                  <label htmlFor={`quick-update-${actualCategory}`} className="block text-sm font-medium text-slate-300 mb-1">
                    Quick update for {sectionTitle} (e.g., "{examplePlaceholder}") <span className="text-xs text-slate-400">(Respects current item order)</span>
                  </label>
                  <div className="flex space-x-2 items-center">
                    <input
                      type="text"
                      id={`quick-update-${actualCategory}`}
                      value={quickUpdateInputs[actualCategory] || ''}
                      onChange={(e) => handleQuickUpdateInputChange(actualCategory, e.target.value)}
                      placeholder="Enter quantities (space/comma/text)"
                      className="flex-grow p-2 bg-slate-800 border border-slate-600 rounded-md text-sm focus:ring-pokeBlue focus:border-pokeBlue"
                      aria-label={`Quick update quantities for ${sectionTitle}`}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleApplyQuickUpdate(actualCategory, sectionTitle); }}
                    />
                    <button
                      onClick={() => handleApplyQuickUpdate(actualCategory, sectionTitle)}
                      className="bg-pokeBlue hover:bg-blue-700 text-white font-semibold py-2 px-3 rounded-md shadow-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      aria-label={`Apply quick update for ${sectionTitle}`}
                    >
                      Apply
                    </button>
                     <button
                        onClick={() => handleToggleVoiceInput(actualCategory, playBeep)}
                        className={`p-2 rounded-md shadow-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-opacity-75 ${isListening && voiceInputActiveCategory === actualCategory ? 'bg-red-500 hover:bg-red-600 focus:ring-red-400' : 'bg-green-500 hover:bg-green-600 focus:ring-green-400'}`}
                        aria-label={voiceInputTooltip}
                        title={voiceInputTooltip}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm5 2a1 1 0 10-2 0v1h2V6zM4 9a1 1 0 011-1h1a1 1 0 010 2H5a1 1 0 01-1-1zm11 0a1 1 0 00-1-1h-1a1 1 0 100 2h1a1 1 0 001-1zM7 13.83A3.001 3.001 0 014 11V9a1 1 0 112 0v2a1 1 0 102 0V9a1 1 0 112 0v2a1 1 0 102 0V9a1 1 0 112 0v2a3.001 3.001 0 01-3 2.83V15a1 1 0 11-2 0v-1.17z" clipRule="evenodd" />
                        </svg>
                      </button>
                  </div>
                  {currentQuickUpdateMessage && (
                    <p 
                        className={`text-xs mt-2 p-1.5 rounded-md flex items-center ${
                            currentQuickUpdateMessage.includes("✅") ? 'bg-green-500/20 text-green-300' : 
                            (currentQuickUpdateMessage.includes("⚠️") || currentQuickUpdateMessage.includes("ℹ️") || currentQuickUpdateMessage.includes("reset") ? 'bg-yellow-500/20 text-yellow-300' : 
                            'bg-red-500/20 text-red-300')}`} 
                        role="alert"
                        >
                        <span className="mr-1.5 text-base">
                            {currentQuickUpdateMessage.includes("✅") ? '✅' : 
                            (currentQuickUpdateMessage.includes("⚠️") ? '⚠️' : 
                            (currentQuickUpdateMessage.includes("ℹ️") ? 'ℹ️' : '❌'))}
                        </span>
                         {currentQuickUpdateMessage.substring(currentQuickUpdateMessage.indexOf(" ") + 1)}
                    </p>
                  )}
                </div>
                <CollapsibleSection 
                  title={`${sectionTitle} (${actualCategory === 'Vitamin' ? '🧪' : actualCategory === 'Feather' ? '🪶' : '🍡'})`} 
                  defaultOpen={actualCategory === 'Vitamin'}
                  category={actualCategory} 
                  onResetCategory={handleResetCategory}
                  itemIds={orderedItemIdsForThisCategory}
                  onReorderItems={(newOrder) => handleReorderCategoryItems(actualCategory, newOrder)}
                >
                  {orderedItemIdsForThisCategory.map((itemId, index) => {
                    const item = ITEMS.find(i => i.id === itemId);
                    if (!item) return null;
                    return (
                      <InventoryItemInput
                        key={item.id}
                        item={item}
                        quantity={inventory[item.id] || 0}
                        onQuantityChange={handleInventoryChange}
                        activeForVoiceInput={isListening && voiceInputActiveCategory === actualCategory && voiceInputActiveItemIndex === index}
                        draggableId={item.id}
                        index={index}
                      />
                    );
                  })}
                </CollapsibleSection>
              </div>
            );
          })}
        </section>

        {inventorySummary.total > 0 && (
          <div className="my-4 p-3 bg-slate-700/60 rounded-lg shadow text-sm text-center text-slate-300">
            <span className="font-semibold">Current Inventory Totals:</span>
            <span className="mx-1 sm:mx-2">🧪 Vitamins: <span className="font-bold text-slate-100">{inventorySummary.Vitamin}</span></span>|
            <span className="mx-1 sm:mx-2">🍡 Mochi: <span className="font-bold text-slate-100">{inventorySummary.Mochi}</span></span>|
            <span className="mx-1 sm:mx-2">🪶 Feathers: <span className="font-bold text-slate-100">{inventorySummary.Feather}</span></span>
          </div>
        )}

        <div className="flex items-center justify-center my-4 space-x-3">
            <input
                type="checkbox"
                id="subtract-items-toggle"
                checked={subtractItemsAfterCalc}
                onChange={(e) => setSubtractItemsAfterCalc(e.target.checked)}
                className="w-5 h-5 text-pokeBlue bg-slate-700 border-slate-500 rounded focus:ring-pokeBlue focus:ring-offset-slate-800"
                aria-labelledby="subtract-items-label"
            />
            <label htmlFor="subtract-items-toggle" id="subtract-items-label" className="text-sm font-medium text-slate-300 cursor-pointer">
                Subtract used items from inventory and funds after calculation
            </label>
        </div>

        <button
          onClick={handleAppCalculateButtonClick} // Changed to App's handler
          disabled={isCalculating}
          className="w-full py-3 px-6 bg-pokeRed hover:bg-red-700 text-white font-semibold rounded-lg shadow-md transition-colors duration-150 text-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75 disabled:opacity-60 disabled:cursor-not-allowed"
          aria-live="polite" 
        >
          {isCalculating ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Calculating...
            </span>
          ) : (
            'Calculate Optimal Item Usage & Purchases'
          )}
        </button>

        {calculationResult && <ResultsDisplay result={calculationResult} currentEVs={currentEVs} targetEVs={targetEVs} />}
      </div>

      {ocrModalOpen && (
        <ImageOCRModal
          isOpen={ocrModalOpen}
          onClose={handleCloseOCRModal}
          onImageSubmit={(file) => handleImageForOCR(file, inventory)} 
          isLoading={ocrLoading}
          message={globalOcrMessage} 
          isTesseractReady={isTesseractReady}
          previewImage={ocrPreviewImage}
        />
      )}

       <footer className="text-center mt-12 py-4 text-sm text-slate-500">
        Pokémon EV Calculator. Pokémon and Pokémon character names are trademarks of Nintendo. Inventory data is stored locally in your browser.
      </footer>
    </div>
  );
};

export default App;

// Monkey patch SpeechRecognition (This can be moved to useVoiceInput.ts if preferred)
const SpeechRecognitionConstructor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

if (SpeechRecognitionConstructor) {
  if (SpeechRecognitionConstructor.prototype.isRecognizing === undefined) {
    SpeechRecognitionConstructor.prototype.isRecognizing = false;
    
    const originalStart = SpeechRecognitionConstructor.prototype.start;
    SpeechRecognitionConstructor.prototype.start = function(...args: any[]) {
      if (this && typeof originalStart === 'function') {
        originalStart.apply(this, args);
      }
      if (typeof this === 'object' && this !== null) {
          (this as any).isRecognizing = true;
      }
    };

    const originalStop = SpeechRecognitionConstructor.prototype.stop;
    SpeechRecognitionConstructor.prototype.stop = function(...args: any[]) {
      if (this && typeof originalStop === 'function') {
        originalStop.apply(this, args);
      }
      if (typeof this === 'object' && this !== null) {
          (this as any).isRecognizing = false;
      }
    };

    const originalAbort = SpeechRecognitionConstructor.prototype.abort;
    SpeechRecognitionConstructor.prototype.abort = function(...args: any[]) {
      if (this && typeof originalAbort === 'function') {
        originalAbort.apply(this, args);
      }
      if (typeof this === 'object' && this !== null) {
          (this as any).isRecognizing = false;
      }
    };
  }
}
