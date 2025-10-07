'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { Mic, Search, X, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

declare global {
  interface Window {
    SpeechRecognition: typeof globalThis.SpeechRecognition;
    webkitSpeechRecognition: typeof globalThis.SpeechRecognition;
  }
}

interface CustomSpeechRecognition extends globalThis.SpeechRecognition {
  noise?: number;
  maxPause?: number;
  pause?: boolean;
}

interface SearchBarProps {
  onSearch: (ingredients: string[], options?: { variety?: number; perChef?: number }) => void;
  isLoading?: boolean;
  defaultVariety?: number;
  defaultPerChef?: number;
}

export function SearchBar({ 
  onSearch, 
  isLoading = false, 
  defaultVariety = 5, 
  defaultPerChef = 5 
}: SearchBarProps) {
  const [ingredients, setIngredients] = useState<string>('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);
  const recognitionRef = useRef<CustomSpeechRecognition | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [ingredientList, setIngredientList] = useState<string[]>([]);
  const [variety, setVariety] = useState(defaultVariety);
  const [perChef, setPerChef] = useState(defaultPerChef);
  const [showSettings, setShowSettings] = useState(false);

  const processIngredientList = (text: string): string => {
    if (!text) return '';
    
    const processed = text
      .replace(/\s+(and|or|then|plus|with|add|include|also)\s+/gi, ', ')
      .replace(/\s*[&,;.-]\s*/g, ', ')
      .trim();
    
    let ingredients = processed
      .split(',')
      .map(i => i.trim())
      .filter(ing => ing.length > 0 && !ing.match(/^\s*and\s*$/i));
    
    ingredients = ingredients.flatMap(ing => {
      const parts = ing.split(/\s+and\s+/i);
      return parts.map(p => p.trim()).filter(p => p.length > 0);
    });
    
    return ingredients
      .map(ing => ing.charAt(0).toUpperCase() + ing.slice(1).toLowerCase())
      .join(', ');
  };

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSpeechSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition() as CustomSpeechRecognition;
      
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;
      
      if ('pause' in recognition) recognition.pause = false;
      if ('noise' in recognition) recognition.noise = 1.0;
      if ('maxPause' in recognition) recognition.maxPause = 10000;

      let hasReceivedSpeech = false;
      let silenceTimer: NodeJS.Timeout;
      
      recognition.onresult = (event: globalThis.SpeechRecognitionEvent) => {
        const result = event.results[event.resultIndex];
        if (!result.isFinal) return;
        
        const transcript = result?.[0]?.transcript.trim() || '';
        if (transcript) {
          hasReceivedSpeech = true;
          if (silenceTimer) clearTimeout(silenceTimer);
          
          const processedTranscript = processIngredientList(transcript);
          setIngredients(prev => {
            const currentIngredients = prev ? prev.split(',').map(i => i.trim().toLowerCase()) : [];
            const newIngredients = processedTranscript
              .split(',')
              .map(i => i.trim())
              .filter(ing => {
                const normalized = ing.toLowerCase();
                return !currentIngredients.includes(normalized);
              });
              
            if (newIngredients.length === 0) return prev;
            
            const separator = prev && !prev.endsWith(',') ? ', ' : '';
            return prev ? `${prev}${separator}${newIngredients.join(', ')}` : newIngredients.join(', ');
          });
        }
        
        silenceTimer = setTimeout(() => {
          if (hasReceivedSpeech) {
            hasReceivedSpeech = false;
          }
        }, 2000);
      };

      recognition.onerror = (event: globalThis.SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;

      return () => {
        if (recognitionRef.current) {
          try {
            recognitionRef.current.abort();
          } catch (error) {
            console.error('Error during cleanup:', error);
          }
        }
      };
    } catch (error) {
      console.error('Failed to initialize speech recognition:', error);
      setIsSpeechSupported(false);
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
        setIsListening(false);
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
        setIsListening(false);
      }
    } else {
      try {
        const SpeechRecognition = 
          (window as any).SpeechRecognition || 
          (window as any).webkitSpeechRecognition;
        
        const newRecognition = new SpeechRecognition() as CustomSpeechRecognition;
        
        newRecognition.continuous = true;
        newRecognition.interimResults = false;
        newRecognition.lang = 'en-US';
        newRecognition.maxAlternatives = 1;
        
        newRecognition.onresult = recognitionRef.current.onresult;
        newRecognition.onerror = recognitionRef.current.onerror;
        
        recognitionRef.current = newRecognition;
        newRecognition.start();
        setIsListening(true);
        
        newRecognition.onend = () => {
          if (isListening) {
            try {
              newRecognition.start();
            } catch (error) {
              console.error('Failed to restart speech recognition:', error);
              setIsListening(false);
            }
          }
        };
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
        setIsListening(false);
      }
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const newIngredients = ingredients.trim();
    if (!newIngredients && ingredientList.length === 0) return;

    if (newIngredients) {
      const ingredientsArray = newIngredients
        .split(',')
        .map(ing => ing.trim())
        .filter(ing => ing.length > 0);
      
      if (ingredientsArray.length > 0) {
        const updatedList = [...ingredientList, ...ingredientsArray];
        setIngredientList(updatedList);
        onSearch(updatedList, { variety, perChef });
        setIngredients('');
        return;
      }
    }
    
    if (ingredientList.length > 0) {
      onSearch(ingredientList, { variety, perChef });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const removeIngredient = (index: number) => {
    const newList = [...ingredientList];
    newList.splice(index, 1);
    setIngredientList(newList);
    onSearch(newList.length > 0 ? newList : [], { variety, perChef });
  };

  return (
    <div className="w-full">
      {!isSpeechSupported && (
        <div className="mb-2 text-sm text-amber-700 bg-amber-50 p-2 rounded-md flex items-center">
          <span className="mr-2">🔊</span>
          <span>Your browser doesn&apos;t support speech recognition. Try Chrome or Edge.</span>
        </div>
      )}
      <form onSubmit={handleSubmit} className="relative w-full mb-4">
        <div className="relative flex items-center">
          <Search className="absolute left-3 h-5 w-5 text-amber-500" />
          <Input
            ref={inputRef}
            type="text"
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What's in your fridge? (e.g., chicken, tomatoes, pasta...)"
            disabled={isLoading}
            className="pr-10 py-6 text-lg border-2 border-amber-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 rounded-full bg-white/80 backdrop-blur-sm h-14 relative z-0"
          />
          <div className="absolute right-2 flex space-x-1 z-10">
            {ingredients && (
              <button
                type="button"
                onClick={() => setIngredients('')}
                className="p-1.5 rounded-full text-amber-500 hover:bg-amber-100 transition-colors z-20"
                disabled={isLoading}
              >
                <X className="h-5 w-5" />
              </button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={`rounded-full z-20 ${
                isListening ? 'bg-red-100 text-red-500' : 'text-amber-500 hover:bg-amber-100'
              } ${!isSpeechSupported ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              onClick={toggleListening}
              disabled={isLoading || !isSpeechSupported}
              title={!isSpeechSupported ? 'Speech recognition not supported in this browser. Try Chrome or Edge.' : 'Use voice input'}
            >
              <Mic className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <Button 
          type="submit" 
          className="mt-4 w-full py-6 text-lg font-medium bg-amber-500 hover:bg-amber-600 text-white rounded-full transition-colors"
          disabled={isLoading || !ingredients.trim()}
        >
          {isLoading ? 'Searching...' : 'Find Recipes'}
        </Button>
        <div className="flex justify-end mt-2">
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-1 text-sm text-amber-600 hover:text-amber-800 transition-colors"
          >
            <Settings className="h-4 w-4" />
            {showSettings ? 'Hide' : 'Show'} Settings
          </button>
        </div>

        {showSettings && (
          <div className="mt-2 space-y-4 p-4 bg-amber-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recipe Variety: {variety}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={variety}
                onChange={(e) => setVariety(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recipes per Chef: {perChef}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={perChef}
                onChange={(e) => setPerChef(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        )}
      </form>
      
      {ingredientList.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {ingredientList.map((ingredient, index) => (
            <div
              key={index}
              className="flex items-center bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm"
            >
              {ingredient}
              <button
                type="button"
                onClick={() => removeIngredient(index)}
                className="ml-2 text-amber-500 hover:text-amber-700"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}