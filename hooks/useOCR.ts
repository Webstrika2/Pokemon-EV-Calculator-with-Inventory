
import { useState, useCallback, useEffect } from 'react';
import { Inventory } from '../types';
import { parseUniversalOCRDataAndUpdateInventory } from '../utils/ocrParser'; // Import from new location

declare var Tesseract: any;
type SetInventoryType = React.Dispatch<React.SetStateAction<Inventory>>;
type SetCalculationResultType = React.Dispatch<React.SetStateAction<any | null>>;
type SetGlobalMessageType = React.Dispatch<React.SetStateAction<string | null>>;

export const useOCR = (
    setInventory: SetInventoryType,
    currentInventory: Inventory, // Added currentInventory to parameters
    setCalculationResult: SetCalculationResultType,
    setAppOcrMessage: SetGlobalMessageType, // To set global OCR message in App.tsx
    // Pass other global message setters so OCR can clear them
    setAppParseMessage: SetGlobalMessageType,
    setAppQuickUpdateMessages: React.Dispatch<React.SetStateAction<Record<string, string | null>>>,
    setAppVoiceInputMessage: SetGlobalMessageType
) => {
  const [ocrModalOpen, setOcrModalOpen] = useState<boolean>(false);
  const [ocrLoading, setOcrLoading] = useState<boolean>(false);
  const [ocrMessage, setOcrMessage] = useState<string | null>(
    "OCR engine not initialized. Click 'Scan Inventory (OCR)' to start."
  );
  const [ocrPreviewImage, setOcrPreviewImage] = useState<File | null>(null);
  
  const [tesseractWorker, setTesseractWorker] = useState<any>(null);
  const [tesseractReady, setTesseractReady] = useState<boolean>(false);
  const [tesseractInitError, setTesseractInitError] = useState<string | null>(null);
  const [isTesseractInitializing, setIsTesseractInitializing] = useState<boolean>(false);

  useEffect(() => { // Effect to update App.tsx's global OCR message
    setAppOcrMessage(ocrMessage);
  }, [ocrMessage, setAppOcrMessage]);

  useEffect(() => {
    return () => { // Cleanup Tesseract worker on unmount
      tesseractWorker?.terminate();
    };
  }, [tesseractWorker]);

  const initializeTesseract = useCallback(async () => {
    if (tesseractReady || isTesseractInitializing) return true;

    setIsTesseractInitializing(true);
    setTesseractInitError(null);
    setOcrMessage("Initializing OCR engine (this may take a moment on first use)...");

    if (typeof Tesseract === 'undefined') {
      const errMsg = "OCR library (Tesseract.js) not loaded. Please check internet or refresh.";
      setTesseractInitError(errMsg); setOcrMessage(errMsg); setIsTesseractInitializing(false);
      return false;
    }

    try {
      const worker = await Tesseract.createWorker('eng', 1, {
        logger: (m: any) => {
          if (m.status && (m.status.startsWith('loading') || m.status.startsWith('initializing'))) {
            setOcrMessage(`OCR engine: ${m.status}... (${Math.round(m.progress * 100)}%)`);
          }
        },
      });
      setTesseractWorker(worker); setTesseractReady(true);
      setOcrMessage("OCR engine ready."); setIsTesseractInitializing(false);
      return true;
    } catch (error) {
      const errMsg = `Failed to initialize Tesseract: ${error instanceof Error ? error.message : String(error)}`;
      console.error(errMsg, error);
      setTesseractInitError(errMsg); setOcrMessage(`OCR engine initialization failed. Error: ${error instanceof Error ? error.message : String(error)}`);
      setTesseractReady(false); setIsTesseractInitializing(false);
      return false;
    }
  }, [tesseractReady, isTesseractInitializing]);

  const handleGlobalOCRTrigger = useCallback(async () => {
    setAppParseMessage(null); 
    setAppQuickUpdateMessages({Vitamin: null, Mochi: null, Feather: null}); 
    setAppVoiceInputMessage(null);

    const isReady = await initializeTesseract();
    if (!isReady) return;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      setOcrMessage("Screen sharing (getDisplayMedia) is not supported by your browser.");
      return;
    }

    setOcrMessage("Requesting screen share permission...");
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: { cursor: "always" } as MediaTrackConstraints, audio: false });
      setOcrMessage("Screen captured. Processing...");
      const videoTrack = stream.getVideoTracks()[0];
      const imageCapture = new (window as any).ImageCapture(videoTrack);

      setTimeout(async () => {
        try {
          const blob = await imageCapture.grabFrame();
          videoTrack.stop();
          setOcrPreviewImage(new File([blob], "screen_capture.png", { type: "image/png" }));
          setOcrModalOpen(true); 
          setOcrMessage("Preview screen capture. Click 'Start OCR' to process.");
        } catch (captureError) {
          console.error("Error capturing frame:", captureError);
          setOcrMessage(`Error capturing frame: ${captureError instanceof Error ? captureError.message : String(captureError)}`);
          videoTrack.stop();
        }
      }, 200);
    } catch (err) {
      console.error("Error with getDisplayMedia:", err);
      if (err instanceof Error && err.name === "NotAllowedError") {
        setOcrMessage("Screen share permission denied. OCR cannot proceed.");
      } else {
        setOcrMessage(`Error starting screen share: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }, [initializeTesseract, setAppParseMessage, setAppQuickUpdateMessages, setAppVoiceInputMessage]);

  const handleCloseOCRModal = useCallback(() => {
    setOcrModalOpen(false); setOcrLoading(false); setOcrPreviewImage(null);
    if (ocrMessage && (ocrMessage.includes("Preview screen capture") || ocrMessage.includes("Processing image") || ocrMessage.includes("complete") || ocrMessage.includes("updated."))) {
        if(tesseractReady && !tesseractInitError) setOcrMessage("OCR engine ready.");
        else if (tesseractInitError) setOcrMessage(tesseractInitError);
        else setOcrMessage("OCR engine not initialized. Click 'Scan Inventory (OCR)' to start.");
    }
  }, [ocrMessage, tesseractReady, tesseractInitError]);

  const handleImageForOCR = useCallback(async (imageFile: File, inventoryToUse: Inventory) => { // Renamed currentInventory param for clarity
    if (!tesseractReady || !tesseractWorker) { // Corrected: isTesseractReady to tesseractReady
      setOcrMessage(tesseractInitError || "OCR worker not ready."); setOcrLoading(false); return;
    }
    if (!imageFile) {
      setOcrMessage("No image file provided for OCR."); setOcrLoading(false); return;
    }

    setOcrLoading(true); setOcrMessage("Starting OCR process on captured image...");
    setAppQuickUpdateMessages({Vitamin: null, Mochi: null, Feather: null}); setAppVoiceInputMessage(null);

    try {
      const { data: { text } } = await tesseractWorker.recognize(imageFile);
      setOcrMessage("OCR complete. Parsing results for all item types...");
      const summary = parseUniversalOCRDataAndUpdateInventory(text, inventoryToUse, setInventory, setCalculationResult);
      setOcrMessage(summary);
    } catch (error) {
      console.error("OCR Error:", error);
      setOcrMessage(`OCR process failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setOcrLoading(false); setOcrModalOpen(false); setOcrPreviewImage(null);
    }
  }, [tesseractWorker, tesseractReady, tesseractInitError, setInventory, setCalculationResult, setAppQuickUpdateMessages, setAppVoiceInputMessage]);

  return {
    ocrModalOpen,
    ocrLoading,
    ocrMessage, // This hook's local OCR message
    setOcrMessage, // Setter for this hook's local OCR message
    ocrPreviewImage,
    isTesseractReady: tesseractReady, // Export corrected name
    isTesseractInitializing,
    tesseractInitError,
    initializeTesseract,
    handleGlobalOCRTrigger,
    handleCloseOCRModal,
    handleImageForOCR, 
  };
};
