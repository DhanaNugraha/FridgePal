'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQueryClient } from '@tanstack/react-query';

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

export function SearchBar() {
  const [ingredients, setIngredients] = useState<string>('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const queryClient = useQueryClient();

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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!ingredients.trim()) return;
    
    // Invalidate any previous queries and trigger a new one
    queryClient.invalidateQueries({ queryKey: ['recipes'] });
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-5 w-5 text-amber-500" />
        <Input
          type="text"
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
          placeholder="What's in your fridge? (e.g., chicken, tomatoes, pasta...)"
          className="pl-10 pr-12 py-6 text-lg border-2 border-amber-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 rounded-full bg-white/80 backdrop-blur-sm"
        />
        <div className="absolute right-2 flex space-x-1">
          {ingredients && (
            <button
              type="button"
              onClick={() => setIngredients('')}
              className="p-1.5 rounded-full text-amber-500 hover:bg-amber-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
          <button
            type="button"
            onClick={toggleListening}
            className={`p-1.5 rounded-full transition-colors ${
              isListening 
                ? 'bg-red-100 text-red-500 animate-pulse' 
                : 'text-amber-600 hover:bg-amber-100'
            }`}
            title={isListening ? 'Stop listening' : 'Use voice input'}
          >
            <Mic className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div className="mt-4">
        <Button 
          type="submit" 
          className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 px-6 rounded-full transition-all transform hover:scale-105 shadow-md hover:shadow-amber-200"
        >
          Find Recipes
        </Button>
      </div>
      <div className="mt-3 text-sm text-amber-700">
        <p>Try: "chicken, rice, and vegetables" or "pasta, tomato sauce, cheese"</p>
      </div>
    </form>
  );
}
