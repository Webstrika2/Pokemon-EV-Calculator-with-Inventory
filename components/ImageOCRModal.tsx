
import React, { useState, useCallback, useRef, useEffect } from 'react';
// import { Item } from '../types'; // Item type no longer needed here

interface ImageOCRModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImageSubmit: (file: File) => void;
  // category: Item['category']; // Removed
  isLoading: boolean;
  message: string | null;
  isTesseractReady: boolean;
  previewImage: File | null; // To display the screen capture
}

const ImageOCRModal: React.FC<ImageOCRModalProps> = ({ 
  isOpen, 
  onClose, 
  onImageSubmit, 
  isLoading, 
  message, 
  isTesseractReady,
  previewImage: initialPreviewImage 
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pasteError, setPasteError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialPreviewImage) {
        setSelectedFile(initialPreviewImage);
        setPreviewUrl(URL.createObjectURL(initialPreviewImage));
      } else {
        setSelectedFile(null);
        setPreviewUrl(null);
      }
      setPasteError(null);
    } else {
      // Clean up preview URL when modal is closed and was showing one
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialPreviewImage]);


  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      if (!isOpen || isLoading) return; // Don't allow paste if modal not open or processing
      setPasteError(null);
      const items = event.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile();
            if (file) {
              if (previewUrl) URL.revokeObjectURL(previewUrl); // Clean up old if exists
              setSelectedFile(file);
              setPreviewUrl(URL.createObjectURL(file));
              event.preventDefault();
              return;
            }
          }
        }
        setPasteError("No image found in clipboard. Please copy an image first.");
      } else {
        setPasteError("Clipboard API not fully supported or no data found.");
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
      // Ensure object URL is revoked on unmount if modal was closed while showing preview
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [isOpen, isLoading, previewUrl]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPasteError(null);
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (previewUrl) URL.revokeObjectURL(previewUrl); // Clean up old if exists
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = () => {
    if (selectedFile && isTesseractReady) {
      onImageSubmit(selectedFile);
    } else if (!isTesseractReady) {
      // Message prop should already reflect that OCR is not ready
    }
     else {
      setPasteError("Please select, paste, or capture an image first.");
    }
  };

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setPasteError(null);
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      const file = event.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        if (previewUrl) URL.revokeObjectURL(previewUrl); // Clean up old if exists
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
      } else {
        setPasteError("Invalid file type. Please drop an image.");
      }
    }
  }, [previewUrl]);

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  if (!isOpen) {
    return null;
  }

  const startOcrButtonDisabled = isLoading || !selectedFile || !isTesseractReady;

  return (
    <div 
      className="fixed inset-0 bg-slate-900 bg-opacity-75 flex items-center justify-center p-4 z-50 transition-opacity duration-300"
      aria-modal="true"
      role="dialog"
      aria-labelledby="ocr-modal-title"
    >
      <div className="bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-lg transform transition-all duration-300 scale-100 opacity-100">
        <div className="flex justify-between items-center mb-4">
          <h2 id="ocr-modal-title" className="text-xl font-semibold text-pokeYellow">Scan Inventory from Image</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-2xl" aria-label="Close OCR modal">&times;</button>
        </div>

        <div 
          className="mb-4 p-4 border-2 border-dashed border-slate-600 rounded-md text-center cursor-pointer hover:border-pokeBlue transition-colors min-h-[150px] flex flex-col justify-center items-center"
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragOver}
          role="button"
          tabIndex={0}
          aria-label="Image drop zone or click to upload"
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            ref={fileInputRef}
            aria-hidden="true"
          />
          {previewUrl ? (
            <img src={previewUrl} alt="Preview" className="max-h-60 mx-auto mb-2 rounded object-contain" />
          ) : (
            <p className="text-slate-400">Drag & drop an image, click to select, or paste (Ctrl+V).</p>
          )}
          {(selectedFile && previewUrl) && <p className="text-xs text-slate-500 mt-1">File: {selectedFile.name}</p> }
          {(!selectedFile && !previewUrl) && <p className="text-sm text-slate-500 mt-1">This can be a screenshot of your game's inventory.</p>}
        </div>

        {pasteError && <p className="text-xs text-red-400 mb-2 text-center">{pasteError}</p>}

        {message && (
          <div className={`my-3 p-2.5 rounded-md text-sm text-center ${message.includes("failed") || message.includes("Warnings:") || message.includes("not ready") || message.includes("No items") || message.includes("Error:") || message.includes("not loaded") || message.includes("denied") ? 'bg-red-500/20 text-red-300' : (message.includes("complete") || message.includes("updated") || message.includes("ready") ? 'bg-green-500/20 text-green-300' : 'bg-slate-700 text-slate-300')}`}>
            {message}
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center my-3">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pokeBlue"></div>
            <p className="ml-3 text-slate-300">Processing image...</p>
          </div>
        )}

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-slate-100 rounded-md shadow-sm transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-pokeBlue hover:bg-blue-700 text-white font-semibold rounded-md shadow-sm transition-colors disabled:opacity-50"
            disabled={startOcrButtonDisabled}
            title={!isTesseractReady ? "OCR engine not ready. Please wait or refresh." : (!selectedFile ? "Please provide an image first." : "Start OCR processing")}
          >
            {isLoading ? 'Processing...' : 'Start OCR'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageOCRModal;
