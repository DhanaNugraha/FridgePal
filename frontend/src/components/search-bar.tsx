'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { Mic, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQueryClient } from '@tanstack/react-query';
import { useRecipes } from '@/hooks/useRecipes';

// Extend Window interface to include webkitSpeechRecognition
declare global {
  interface Window {
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  new (): SpeechRecognition;
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: (event: any) => void;
  onerror: (event: any) => void;
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
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [ingredientList, setIngredientList] = useState<string[]>([]);
  const [variety, setVariety] = useState(defaultVariety);
  const [perChef, setPerChef] = useState(defaultPerChef);

  useEffect(() => {
    // Initialize speech recognition
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition as unknown as { new (): SpeechRecognition };
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const results = event.results as SpeechRecognitionResultList;
        const transcript = Array.from(results)
          .map((result) => result[0])
          .map((result) => result.transcript)
          .join('');
        
        setIngredients(prev => prev ? `${prev}, ${transcript}` : transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const newIngredients = ingredients.trim();
    if (!newIngredients && ingredientList.length === 0) return;

    // If there's new input, add it to the list
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
    
    // If no new ingredients but we have existing ones, just refresh with current settings
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
    if (newList.length > 0) {
      onSearch(newList, { variety, perChef });
    } else {
      onSearch([], { variety, perChef });
    }
  };

  return (
    <div className="w-full">
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
            className="pl-10 pr-12 py-6 text-lg border-2 border-amber-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 rounded-full bg-white/80 backdrop-blur-sm"
            disabled={isLoading}
          />
          <div className="absolute right-2 flex space-x-1">
            {ingredients && (
              <button
                type="button"
                onClick={() => setIngredients('')}
                className="p-1.5 rounded-full text-amber-500 hover:bg-amber-100 transition-colors"
                disabled={isLoading}
              >
                <X className="h-5 w-5" />
              </button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={`rounded-full ${isListening ? 'bg-red-100 text-red-500' : 'text-amber-500 hover:bg-amber-100'}`}
              onClick={toggleListening}
              disabled={isLoading}
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
        <div className="mt-4 space-y-4 p-4 bg-amber-50 rounded-lg">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="variety" className="text-sm font-medium text-amber-800">
                Recipe Variety: {variety}
              </label>
            </div>
            <div className="px-2">
              <input
                type="range"
                id="variety"
                min="1"
                max="10"
                value={variety}
                onChange={(e) => setVariety(parseInt(e.target.value))}
                className="w-full h-2 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-xs text-amber-600 mt-1">
                <span>strict</span>
                <span>Loose</span>
              </div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="perChef" className="text-sm font-medium text-amber-800">
                Recipes per Chef: {perChef}
              </label>
            </div>
            <div className="px-2">
              <input
                type="range"
                id="perChef"
                min="1"
                max="10"
                value={perChef}
                onChange={(e) => setPerChef(parseInt(e.target.value))}
                className="w-full h-2 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-xs text-amber-600 mt-1">
                <span>1</span>
                <span>10</span>
              </div>
            </div>
          </div>
        </div>
      </form>

      {ingredientList.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {ingredientList.map((ingredient, index) => (
            <div 
              key={index}
              className="flex items-center bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium"
            >
              {ingredient}
              <button 
                type="button" 
                onClick={() => removeIngredient(index)}
                className="ml-2 text-amber-500 hover:text-amber-700 focus:outline-none"
                disabled={isLoading}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-3 text-sm text-amber-700">
        <p>Try: "chicken, rice, and vegetables" or "pasta, tomato sauce, cheese"</p>
      </div>
    </div>
  );
}
