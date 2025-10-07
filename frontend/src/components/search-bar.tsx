'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { Mic, Search, X, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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

  // Helper function to process ingredient list from speech
  const processIngredientList = (text: string): string => {
    if (!text) return '';
    
    // First, handle common patterns that indicate separation
    const processed = text
      // Replace common separators with commas
      .replace(/\s+(and|or|then|plus|with|add|include|also)\s+/gi, ', ')
      // Handle ampersands and other symbols
      .replace(/\s*[&,;.-]\s*/g, ', ')
      // Handle any remaining multiple spaces
      .trim();
    
    // Split into individual ingredients
    let ingredients = processed
      .split(',')
      .map(i => i.trim())
      .filter(ing => ing.length > 0 && !ing.match(/^\s*and\s*$/i));
    
    // Handle special cases like "and" at the end of an ingredient
    ingredients = ingredients.flatMap(ing => {
      // If an ingredient contains "and" in the middle, split it
      const parts = ing.split(/\s+and\s+/i);
      return parts.map(p => p.trim()).filter(p => p.length > 0);
    });
    
    // Capitalize first letter of each ingredient and join with commas
    const result = ingredients
      .map(ing => ing.charAt(0).toUpperCase() + ing.slice(1).toLowerCase())
      .join(', ');
    
    return result;
  };

  // Initialize speech recognition on component mount (client-side only)
  useEffect(() => {
    // Ensure this only runs on the client
    if (typeof window === 'undefined') {
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
      recognition.continuous = true;  // Keep listening until explicitly stopped
      recognition.interimResults = false;  // Only get final results to avoid duplicates
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;  // Only get the top alternative
      recognition.pause = false;  // Don't pause after each result
      recognition.noise = 1.0;    // Be more lenient with speech detection
      recognition.maxPause = 10000; // 10 seconds of silence before timeout

      // Set up event handlers
      // Track if we've received any speech input
      let hasReceivedSpeech = false;
      let silenceTimer: NodeJS.Timeout;
      
      recognition.onresult = (event: any) => {
        const result = event.results[event.resultIndex];
        
        // Only process final results, not interim ones
        if (!result.isFinal) return;
        
        const transcript = result?.[0]?.transcript.trim() || '';
        console.log('Final speech recognition result:', { transcript });
        
        if (transcript) {
          hasReceivedSpeech = true;
          
          // Reset the silence timer
          if (silenceTimer) clearTimeout(silenceTimer);
          
          // Process the transcript to add commas between ingredients
          const processedTranscript = processIngredientList(transcript);
          console.log('Processed transcript:', processedTranscript);
          
          setIngredients(prev => {
            // Only add if this is a new ingredient and not a duplicate
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
        
        // Set a timer to detect long pauses
        silenceTimer = setTimeout(() => {
          if (hasReceivedSpeech) {
            console.log('Long pause detected, but keeping microphone active');
            hasReceivedSpeech = false;
          }
        }, 2000); // 2 seconds of silence before considering it a pause
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
    if (!recognitionRef.current) {
      console.error('Speech recognition not initialized');
      return;
    }

    console.log('Toggle listening called', {
      isCurrentlyListening: isListening,
      time: new Date().toISOString()
    });
    
    if (isListening) {
      // Stop listening
      console.log('Stopping speech recognition...');
      try {
        // Stop any ongoing recognition
        if (recognitionRef.current) {
          recognitionRef.current.onend = null; // Prevent onend from triggering our state change
          recognitionRef.current.stop();
          console.log('Stop command sent to speech recognition');
        }
        setIsListening(false);
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
        setIsListening(false);
      }
    } else {
      // Start listening
      console.log('Starting speech recognition...');
      
      try {
        // Create a new recognition instance to ensure clean state
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const newRecognition = new SpeechRecognition();
        
        // Configure the new instance
        newRecognition.continuous = true;
        newRecognition.interimResults = false;
        newRecognition.lang = 'en-US';
        newRecognition.maxAlternatives = 1;
        
        // Set up event handlers for the new instance
        newRecognition.onresult = recognitionRef.current.onresult;
        newRecognition.onerror = recognitionRef.current.onerror;
        
        // Store the new instance
        recognitionRef.current = newRecognition;
        
        console.log('Starting recognition with new instance');
        
        // Start listening with the new instance
        newRecognition.start();
        console.log('Start command sent to speech recognition');
        setIsListening(true);
        
        // Handle unexpected stops
        newRecognition.onend = () => {
          console.log('Speech recognition ended unexpectedly');
          if (isListening) {
            console.log('Restarting speech recognition...');
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
            disabled={isLoading}
            className="pr-10 py-6 text-lg border-2 border-amber-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 rounded-full bg-white/80 backdrop-blur-sm h-14 relative z-0"
            suppressHydrationWarning
          />
          <div className="absolute right-2 flex space-x-1 z-10">
            {ingredients && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIngredients('');
                }}
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
              className={`rounded-full z-20 ${isListening ? 'bg-red-100 text-red-500' : 'text-amber-500 hover:bg-amber-100'} ${!isSpeechSupported ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              onClick={(e) => {
                e.stopPropagation();
                toggleListening();
              }}
              disabled={isLoading || !isSpeechSupported}
              title={!isSpeechSupported ? 'Speech recognition not supported in this browser. Try Chrome or Edge.' : 'Use voice input'}
              style={{ pointerEvents: (isLoading || !isSpeechSupported) ? 'none' : 'auto' }}
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
