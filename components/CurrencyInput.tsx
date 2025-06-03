
import React, { useState, useEffect } from 'react';

interface CurrencyInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholderText?: string;
}

const CurrencyInput: React.FC<CurrencyInputProps> = ({ label, value, onChange, placeholderText = "0" }) => {
  const [displayValue, setDisplayValue] = useState<string>("");

  useEffect(() => {
    // Format with commas for display if value is a valid number string (without commas)
    if (value === "") {
      setDisplayValue("");
    } else {
      const numValue = parseInt(value.replace(/,/g, ''), 10);
      if (!isNaN(numValue)) {
        setDisplayValue(numValue.toLocaleString());
      } else {
        setDisplayValue(value); // Keep as is if not a number (e.g., during typing)
      }
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    // Allow numbers and commas for input
    const sanitizedInput = rawValue.replace(/[^0-9,]/g, ''); 
    
    // Update display immediately
    setDisplayValue(sanitizedInput);

    // For actual state, send value without commas
    const valueForState = sanitizedInput.replace(/,/g, '');
    onChange(valueForState);
  };

  const handleBlur = () => {
    // Re-format on blur to ensure commas are correctly placed if user typed them oddly
    const numValue = parseInt(value.replace(/,/g, ''), 10);
    if (!isNaN(numValue)) {
      setDisplayValue(numValue.toLocaleString());
    } else if (value === "") {
      setDisplayValue("");
    }
    // If it's not a number and not empty, it might be an invalid partial input,
    // displayValue is already set from handleChange.
  };

  return (
    <div>
      <label htmlFor={label.replace(/\s+/g, '-').toLowerCase()} className="block text-sm font-medium text-slate-300 mb-1">
        {label}
      </label>
      <input
        type="text"
        id={label.replace(/\s+/g, '-').toLowerCase()}
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={value === "" ? placeholderText : undefined} // Show placeholder only if underlying value is empty
        className="w-full p-2 bg-slate-800 border border-slate-600 rounded-md text-sm focus:ring-pokeBlue focus:border-pokeBlue placeholder-slate-500"
        aria-label={label}
        inputMode="numeric" // Helps mobile users get numeric keyboard
      />
    </div>
  );
};

export default CurrencyInput;
