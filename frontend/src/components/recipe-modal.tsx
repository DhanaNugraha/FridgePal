'use client';

import { X, Clock, CheckCircle, AlertCircle, ChefHat as ChefIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Recipe } from '@/lib/api';

interface RecipeModalProps {
  recipe: (Recipe & {
    // Add any additional frontend-only properties here
    image?: string;
    prepTime?: string;
  }) | null;
  onClose: () => void;
}

export function RecipeModal({ recipe, onClose }: RecipeModalProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (recipe) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [recipe, handleKeyDown]);

  if (!recipe) return null;

  // Format chef name from "Chef 1 (Marco)" to "Chef 1, Marco"
  const chefName = recipe.chef
    .replace(' (', ', ')
    .replace(')', '');

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="flex min-h-screen items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 z-10 rounded-full bg-white/80 p-2 text-amber-800 hover:bg-amber-100 transition-colors shadow-md"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Recipe Image */}
            <div className="relative h-64 md:h-80 bg-amber-100">
              {recipe.image ? (
                <Image
                  src={recipe.image}
                  alt={recipe.title}
                  className="w-full h-full object-cover"
                  width={800}
                  height={400}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-amber-800">
                  <ChefIcon className="w-16 h-16 opacity-20" />
                </div>
              )}
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              
              {/* Recipe Title */}
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h2 className="text-2xl md:text-3xl font-bold mb-2 drop-shadow-lg">
                  {recipe.title}
                </h2>
                
                <div className="flex flex-wrap items-center gap-3 text-sm md:text-base">
                  {recipe.prepTime && (
                    <div className="flex items-center bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{recipe.prepTime}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                    <ChefIcon className="h-4 w-4 mr-1" />
                    <span>{chefName}</span>
                  </div>
                  
                  {recipe.cuisine && (
                    <div className="bg-amber-600 text-white px-3 py-1 rounded-full">
                      {recipe.cuisine}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recipe Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Ingredients */}
                <div>
                  <h3 className="text-xl font-semibold text-amber-900 mb-4 pb-2 border-b border-amber-100">
                    Ingredients
                  </h3>
                  <ul className="space-y-2">
                    {recipe.ingredients.map((ingredient, index) => {
                      // Clean up the ingredient string
                      const cleanIngredient = ingredient
                        .replace(/^\["/, '')
                        .replace(/"\]$/, '')
                        .replace(/","/g, '\n')
                        .replace(/"/g, '')
                        .trim();

                      return (
                        <li key={index} className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
                          <span className="text-amber-900 whitespace-pre-line">{cleanIngredient}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* Instructions */}
                <div>
                  <h3 className="text-xl font-semibold text-amber-900 mb-4 pb-2 border-b border-amber-100">
                    Instructions
                  </h3>
                  <ol className="space-y-4">
                    {(() => {
                      // Flatten all instructions first
                      const allSteps: string[] = [];
                      
                      recipe.instructions.forEach(step => {
                        try {
                        
                          // Check if the step is a JSON string
                            const trimmedStep = step.trim();
                          if (trimmedStep.startsWith('[') && trimmedStep.endsWith(']')) {
                            const parsed = JSON.parse(trimmedStep);
                            if (Array.isArray(parsed)) {
                              allSteps.push(...parsed);
                              return;
                            }
                          }
                          
                          // If not JSON, try to split by common delimiters
                          // First, clean up the entire string by removing any JSON array markers
                          let cleanStep = step.replace(/^\s*\["|\]\s*$/g, '');
                          
                          // Then split and clean each part
                          const parts = cleanStep
                            .split(/(?<=\d)\s*,\s*"?/)
                            .map(s => {
                              // Handle Unicode escape sequences like \u00b0 (degree symbol)
                              let cleaned = s.replace(/^[\s,"]+|[\s,"]+$/g, '').trim();
                              // Convert Unicode escape sequences to actual characters
                              cleaned = cleaned.replace(/\\u([\dA-Fa-f]{4})/g, (_, grp) => 
                                String.fromCharCode(parseInt(grp, 16))
                              );
                              return cleaned;
                            })
                            .filter(s => s && !/^\d+$/.test(s));  // Filter out empty strings and standalone numbers
                          
                          allSteps.push(...parts);
                        } catch (e) {
                          console.error('Error parsing step:', step, e);
                          allSteps.push(step);
                        }
                      });
                      
                      // Filter out any empty steps and render
                      return allSteps
                        .filter(step => step.trim().length > 0)
                        .map((step, index) => (
                          <li key={index} className="flex">
                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-medium mr-3 mt-0.5">
                              {index + 1}
                            </div>
                            <p className="text-amber-900">{step}</p>
                          </li>
                        ));
                    })()}
                  </ol>
                </div>
              </div>

              {/* Additional recipe content */}
              <div className="mt-8 p-4 bg-amber-50 rounded-lg border border-amber-100">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-amber-900">Chef's Tip</h4>
                    <p className="text-amber-800 text-sm mt-1">
                      For best results, use fresh ingredients and adjust seasoning to taste. 
                      Don't be afraid to make it your own!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-amber-100 p-4 bg-white">
              <div className="flex justify-end">
                <Button 
                  onClick={onClose}
                  variant="outline"
                  className="border-amber-300 text-amber-700 hover:bg-amber-50"
                >
                  Close
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
