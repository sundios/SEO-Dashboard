import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

export interface Model {
  id: string;
  name: string;
  object: string;
  owned_by: string;
}

interface ModelSelectorProps {
  options: Model[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select a model",
  disabled = false,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedModel = options.find(option => option.id === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.model-selector-container')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (model: Model) => {
    onChange(model.id);
    setIsOpen(false);
  };

  return (
    <div className={`model-selector-container relative ${className}`}>
      {/* Dropdown Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-4 py-2 text-left rounded-md border
          ${disabled 
            ? 'bg-muted/50 cursor-not-allowed opacity-70' 
            : 'bg-background hover:bg-accent/50 cursor-pointer'
          }
          flex items-center justify-between transition-colors
          border-input
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate">
          {selectedModel?.name || selectedModel?.id || placeholder}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 opacity-70" />
        </motion.span>
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={`
              absolute z-50 w-full mt-1 rounded-md border
              bg-popover text-popover-foreground shadow-lg
              max-h-60 overflow-auto
              border-border
            `}
            role="listbox"
          >
            {options.length === 0 ? (
              <div className="px-4 py-2 text-sm text-muted-foreground">
                No models available
              </div>
            ) : (
              options.map((model) => (
                <motion.div
                  key={model.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <button
                    type="button"
                    onClick={() => handleSelect(model)}
                    className={`
                      w-full px-4 py-2 text-left text-sm
                      hover:bg-accent hover:text-accent-foreground
                      flex items-center justify-between
                      ${value === model.id ? 'bg-accent/50' : ''}
                    `}
                    role="option"
                    aria-selected={value === model.id}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {model.name || model.id}
                      </div>
                      {model.owned_by && (
                        <div className="text-xs text-muted-foreground truncate">
                          {model.owned_by}
                        </div>
                      )}
                    </div>
                    {value === model.id && (
                      <Check className="w-4 h-4 ml-2 flex-shrink-0" />
                    )}
                  </button>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ModelSelector;