
import { useState, useCallback, useEffect, useRef } from 'react';
import { Item, Inventory } from '../types';
import { ITEMS } from '../constants'; // Changed DEFAULT_ITEMS to ITEMS
import { textToNumberMap } from '../utils/helpers';

type HandleInventoryChangeType = (itemId: string, quantity: number) => void;
type SetGlobalMessageType = React.Dispatch<React.SetStateAction<string | null>>;
type SetCalculationResultType = React.Dispatch<React.SetStateAction<any | null>>;


export const useVoiceInput = (
    currentInventory: Inventory,
    itemSortOrders: Record<Item['category'], string[]>,
    handleInventoryChange: HandleInventoryChangeType,
    setAppVoiceInputMessage: SetGlobalMessageType,
    // Pass other global message setters so voice input can clear them
    setCalculationResult: SetCalculationResultType,
    setAppParseMessage: SetGlobalMessageType,
    setAppQuickUpdateMessages: React.Dispatch<React.SetStateAction<Record<string, string | null>>>,
    setAppOcrMessage: SetGlobalMessageType
) => {
  const [voiceInputActiveCategory, setVoiceInputActiveCategory] = useState<Item['category'] | null>(null);
  const [voiceInputActiveItemIndex, setVoiceInputActiveItemIndex] = useState<number>(-1);
  const [voiceInputMessage, setVoiceInputMessage] = useState<string | null>(null);
  const [isListening, setIsListening] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => { // Effect to update App.tsx's global voice message
    setAppVoiceInputMessage(voiceInputMessage);
  }, [voiceInputMessage, setAppVoiceInputMessage]);

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      recognitionRef.current = new SpeechRecognitionAPI();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
    } else {
      setVoiceInputMessage("Speech recognition not supported by this browser.");
    }
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn("Web Audio API is not supported."); audioContextRef.current = null;
    }
    return () => {
      recognitionRef.current?.abort();
      audioContextRef.current?.close();
    };
  }, []);

  const playBeep = useCallback(() => {
    if (!audioContextRef.current) return;
    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();
    oscillator.type = 'sine'; 
    oscillator.frequency.setValueAtTime(880, audioContextRef.current.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);
    oscillator.connect(gainNode); gainNode.connect(audioContextRef.current.destination);
    oscillator.start();
    setTimeout(() => oscillator.stop(), 100);
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) recognitionRef.current.stop();
    setIsListening(false); setVoiceInputActiveCategory(null); setVoiceInputActiveItemIndex(-1);
  }, [isListening]);

  const processVoiceCommand = useCallback((category: Item['category'], itemsInCategory: Item[], transcript: string) => {
    if (transcript === "stop" || transcript === "cancel" || transcript === "end") {
      setVoiceInputMessage("Voice input stopped by user."); stopListening(); return;
    }
    let spokenNumber = parseInt(transcript, 10);
    if (isNaN(spokenNumber)) spokenNumber = textToNumberMap[transcript.toLowerCase()];

    if (spokenNumber !== undefined && !isNaN(spokenNumber) && spokenNumber >= 0) {
      const currentItem = itemsInCategory[voiceInputActiveItemIndex];
      if (currentItem) {
        handleInventoryChange(currentItem.id, spokenNumber);
        setVoiceInputMessage(`Heard: "${transcript}" -> Set ${currentItem.name} to ${spokenNumber}.`);
        playBeep();
        if (voiceInputActiveItemIndex + 1 < itemsInCategory.length) {
          setVoiceInputActiveItemIndex(prev => prev + 1);
        } else {
          setVoiceInputMessage("Voice input complete for category."); stopListening();
        }
      }
    } else {
      setVoiceInputMessage(`Could not understand "${transcript}" as a number. Try again for ${itemsInCategory[voiceInputActiveItemIndex]?.name || 'current item'}.`);
    }
  }, [voiceInputActiveItemIndex, handleInventoryChange, stopListening, playBeep]);

  const handleToggleVoiceInput = useCallback((category: Item['category'], beepFn: () => void) => {
    if (!recognitionRef.current) {
      setVoiceInputMessage("Speech recognition not available."); return;
    }
    if (isListening && voiceInputActiveCategory === category) {
      stopListening(); setVoiceInputMessage("Voice input stopped."); return;
    }
    if (isListening) stopListening();

    // Clear other global messages
    setCalculationResult(null); setAppParseMessage(null); 
    setAppQuickUpdateMessages({Vitamin: null, Mochi: null, Feather: null}); setAppOcrMessage(null);

    const orderedItemIdsForCategory = itemSortOrders[category] || [];
    const itemsInCategory = orderedItemIdsForCategory.map(id => ITEMS.find(item => item.id ===id)).filter(Boolean) as Item[];
    if (itemsInCategory.length === 0) {
      setVoiceInputMessage("No items in this category for voice input."); return;
    }
    let startIndex = 0;
    for (let i = 0; i < itemsInCategory.length; i++) {
        if ((currentInventory[itemsInCategory[i].id] || 0) === 0) { startIndex = i; break; }
    }
    setVoiceInputActiveCategory(category); setVoiceInputActiveItemIndex(startIndex); setIsListening(true);
    
    recognitionRef.current.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
      if(isListening && voiceInputActiveCategory === category) processVoiceCommand(category, itemsInCategory, transcript);
    };
    recognitionRef.current.onerror = (event: any) => {
      if (event.error === 'no-speech' || event.error === 'audio-capture') {
        setVoiceInputMessage(`No speech detected or microphone issue for ${itemsInCategory[voiceInputActiveItemIndex]?.name || 'item'}. Try again.`);
      } else if (event.error === 'not-allowed') {
        setVoiceInputMessage("Microphone access denied.");
      } else {
        setVoiceInputMessage(`Speech recognition error: ${event.error}`);
      }
      if (event.error === 'not-allowed' || event.error === 'aborted') stopListening();
    };
    recognitionRef.current.onend = () => {
        if (isListening && voiceInputActiveCategory === category && voiceInputActiveItemIndex < itemsInCategory.length && voiceInputActiveItemIndex !== -1) {
             if (recognitionRef.current && !recognitionRef.current.isRecognizing) { 
                try { recognitionRef.current.start(); } catch (e) { /* ignore */ }
             }
        } else if (voiceInputActiveItemIndex === -1 || voiceInputActiveItemIndex >= itemsInCategory.length) {
            if (isListening) stopListening();
        }
    };
    try {
      recognitionRef.current.start();
      setVoiceInputMessage(`Listening for ${itemsInCategory[startIndex]?.name || "first item"}... Say quantity.`);
    } catch (e) {
      setVoiceInputMessage("Failed to start voice input."); setIsListening(false);
      setVoiceInputActiveCategory(null); setVoiceInputActiveItemIndex(-1);
    }
  }, [isListening, voiceInputActiveCategory, processVoiceCommand, stopListening, itemSortOrders, currentInventory, setCalculationResult, setAppParseMessage, setAppQuickUpdateMessages, setAppOcrMessage]);

  useEffect(() => {
    if (isListening && voiceInputActiveCategory && voiceInputActiveItemIndex >= 0) {
        const orderedItemIdsForCategory = itemSortOrders[voiceInputActiveCategory] || [];
        const itemsForCat = orderedItemIdsForCategory.map(id => ITEMS.find(item => item.id ===id)).filter(Boolean) as Item[];
        if (itemsForCat[voiceInputActiveItemIndex]) {
            setVoiceInputMessage(`Listening for ${itemsForCat[voiceInputActiveItemIndex].name}... Say quantity.`);
            if (recognitionRef.current && !recognitionRef.current.isRecognizing && isListening) { 
                 try { recognitionRef.current.start(); } catch(e) { /* ignore */ }
            }
        }
    }
  }, [voiceInputActiveItemIndex, voiceInputActiveCategory, isListening, itemSortOrders]);

  return {
    voiceInputActiveCategory,
    voiceInputActiveItemIndex,
    voiceInputMessage, // Local message
    setVoiceInputMessage, // Local message setter
    isListening,
    handleToggleVoiceInput,
    playBeep, // Expose beep if App.tsx needs it directly
  };
};
