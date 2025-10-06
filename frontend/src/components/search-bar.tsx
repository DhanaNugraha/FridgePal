'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { Mic, Search, X, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQueryClient } from '@tanstack/react-query';
import { useRecipes } from '@/hooks/useRecipes';

// Type definitions for Web Speech API
type SpeechRecognition = any;
type SpeechRecognitionEvent = {
  results: {
    [key: number]: {
      [key: number]: {
        transcript: string;
      };
      isFinal: boolean;
    };
    length: number;
    item: (index: number) => any;
  };
  resultIndex: number;
};

type SpeechRecognitionErrorEvent = {
  error: string;
  message: string;
};

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
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [ingredientList, setIngredientList] = useState<string[]>([]);
  const [variety, setVariety] = useState(defaultVariety);
  const [perChef, setPerChef] = useState(defaultPerChef);
  const [showSettings, setShowSettings] = useState(false);

  // Initialize speech recognition on component mount
  useEffect(() => {
    if (typeof window === 'undefined') {
      console.warn('Window is not available. Running in SSR mode.');
      return;
    }

    // Check if browser supports speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech recognition is not supported in this browser');
      setIsSpeechSupported(false);
      return;
    }

    try {
      console.log('Initializing speech recognition...');
      const recognition = new SpeechRecognition();
      
      // Configure recognition
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      // Set up event handlers
      recognition.onresult = (event: any) => {
        const result = event.results[event.resultIndex];
        const transcript = result?.[0]?.transcript.trim() || '';
        console.log('Speech recognition result:', { transcript, isFinal: result.isFinal });
        
        if (transcript) {
          setIngredients(prev => prev ? `${prev}, ${transcript}` : transcript);
        }
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', {
          error: event.error,
          message: event.message,
          time: new Date().toISOString()
        });
        setIsListening(false);
      };

      recognition.onstart = () => {
        console.log('Speech recognition started');
        setIsListening(true);
      };

      recognition.onend = () => {
        console.log('Speech recognition ended');
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      console.log('Speech recognition initialized successfully');
    } catch (error) {
      console.error('Failed to initialize speech recognition:', error);
    }

    // Cleanup function
    return () => {
      if (recognitionRef.current) {
        try {
          console.log('Cleaning up speech recognition');
          recognitionRef.current.abort();
        } catch (error) {
          console.error('Error during cleanup:', error);
        }
      }
    };
  }, []);

  const toggleListening = () => {
    console.log('Toggle listening called', {
      isCurrentlyListening: isListening,
      isRecognitionAvailable: !!recognitionRef.current,
      time: new Date().toISOString()
    });
    
    if (isListening) {
      // Stop listening
      console.log('Stopping speech recognition...');
      try {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
          console.log('Stop command sent to speech recognition');
        } else {
          console.warn('Cannot stop: recognition not initialized');
        }
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
      } finally {
        setIsListening(false);
      }
    } else {
      // Start listening
      console.log('Attempting to start speech recognition...');
      
      if (!recognitionRef.current) {
        console.error('Cannot start: speech recognition not initialized');
        return;
      }
      
      try {
        console.log('Starting recognition with config:', {
          continuous: recognitionRef.current.continuous,
          lang: recognitionRef.current.lang,
          interimResults: recognitionRef.current.interimResults
        });
        
        // Clear any previous results
        setIngredients(prev => prev);
        
        // Start listening
        recognitionRef.current.start();
        console.log('Start command sent to speech recognition');
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
      {!isSpeechSupported && (
        <div className="mb-2 text-sm text-amber-700 bg-amber-50 p-2 rounded-md flex items-center">
          <span className="mr-2">🔊</span>
          <span>Your browser doesn't support speech recognition. Try Chrome or Edge for voice input.</span>
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
              className={`rounded-full ${isListening ? 'bg-red-100 text-red-500' : 'text-amber-500 hover:bg-amber-100'} ${!isSpeechSupported ? 'opacity-50 cursor-not-allowed' : ''}`}
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
          </div>
        )}
      </form>

      {ingredientList.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {ingredientList.map((ingredient, index) => (
            <div key={index} className="flex items-center bg-amber-200 text-amber-900 px-3 py-1 rounded-full text-sm font-medium">
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
          {ingredientList.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setIngredientList([]);
                onSearch([], { variety, perChef });
              }}
              className="text-sm text-amber-600 hover:text-amber-800 font-medium ml-2"
              disabled={isLoading}
            >
              Clear All
            </button>
          )}
        </div>
      )}
      
      <div className="mt-3 text-sm text-amber-700">
        <p>Try: "chicken, rice, and vegetables" or "pasta, tomato sauce, cheese"</p>
      </div>
    </div>
  );
}
