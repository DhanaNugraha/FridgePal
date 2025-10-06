'use client';

import { motion } from 'framer-motion';
import { Clock, ChefHat, Info } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

import { Recipe } from '@/lib/api';

type RecipeCardProps = {
  recipe: Recipe & {
    // Add any additional frontend-only properties here
    image?: string;
    prepTime?: string;
  };
  onViewRecipe?: () => void;
};

export function RecipeCard({ recipe, onViewRecipe }: RecipeCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Calculate a color based on the similarity score with 0.1 increments
  const getScoreColor = (score: number) => {
    if (score > 0.9) return 'bg-green-100 text-green-900';
    if (score > 0.8) return 'bg-green-100 text-green-700';
    if (score > 0.7) return 'bg-green-50 text-green-600';
    if (score > 0.6) return 'bg-yellow-100 text-yellow-800';
    if (score > 0.5) return 'bg-yellow-100 text-yellow-600';
    if (score > 0.4) return 'bg-yellow-100 text-yellow-400';
    if (score > 0.3) return 'bg-amber-100 text-amber-700';
    if (score > 0.2) return 'bg-amber-100 text-amber-600';
    if (score > 0.1) return 'bg-amber-100 text-amber-500';
    return 'bg-red-50 text-red-400';
  };

  // Format chef name from "Chef 1 (Marco)" to "Chef 1, Marco"
  const chefName = recipe.chef
    .replace(' (', ', ')
    .replace(')', '');
    
  // Get a unique color for each chef
  const getChefColor = (chefName: string) => {
    // Extract chef number from the name (e.g., "Chef 1" -> 1)
    const chefNumber = parseInt(chefName.split(' ')[1]) || 1;
    
    // Assign a color based on chef number (1-5)
    switch(chefNumber % 5) {
      case 1: return 'bg-blue-500';  // Blue
      case 2: return 'bg-purple-500'; // Purple
      case 3: return 'bg-pink-500';  // Pink
      case 4: return 'bg-emerald-500'; // Emerald
      default: return 'bg-amber-500'; // Amber (fallback)
    }
  };

  const handleCardClick = () => {
    console.log('Card clicked, onViewRecipe:', onViewRecipe);
    onViewRecipe?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        scale: isHovered ? 1.02 : 1,
        boxShadow: isHovered 
          ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' 
          : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      }}
      transition={{ 
        duration: 0.2,
        ease: 'easeInOut',
        scale: { type: 'spring', stiffness: 400, damping: 10 }
      }}
      className="bg-white rounded-xl overflow-hidden flex flex-col min-h-[24rem] cursor-pointer p-5 border border-amber-50 hover:border-amber-100"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
    >
      {/* Score and Chef Badge */}
      <div className="flex justify-between items-start mb-4">
        <div className="bg-amber-100/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-amber-900 flex items-center">
          <span className={`w-2 h-2 rounded-full ${getChefColor(chefName)} mr-2`}></span>
          {chefName}
        </div>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(recipe.similarity_score)}`}>
          {Math.round(recipe.similarity_score * 100)}% Match
        </span>
      </div>
      
      {/* Recipe Content */}
      <div className="flex flex-col h-full">
        <h3 className="text-xl font-semibold text-amber-900 leading-tight mb-2 break-words">
          {recipe.title}
        </h3>
        
        <div className="flex items-center text-sm text-amber-700 mb-4">
          {recipe.prepTime && (
            <div className="flex items-center mr-4">
              <Clock className="w-4 h-4 mr-1" />
              <span>{recipe.prepTime}</span>
            </div>
          )}
          {recipe.cuisine && (
            <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-xs">
              {recipe.cuisine}
            </span>
          )}
        </div>
        
        <div className="flex flex-col h-full">
          <div className="mb-4 flex-1">
          <h4 className="text-sm font-medium text-amber-800 mb-2">
            Ingredients ({recipe.ingredients.length}):
          </h4>
          <ul className="text-sm text-amber-700 space-y-1 pr-2">
            {recipe.ingredients.map((ingredient, i) => {
              // Clean up the ingredient string
              const cleanIngredient = typeof ingredient === 'string' 
                ? ingredient
                    .replace(/^\["/, '')
                    .replace(/"]$/, '')
                    .replace(/","/g, ', ')
                    .replace(/"/g, '')
                    .trim()
                : '';
              return (
                <li key={i} className="flex items-start">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-300 mt-2 mr-2 flex-shrink-0"></span>
                  <span className="leading-tight">{cleanIngredient}</span>
                </li>
              );
            })}
          </ul>
        </div>
          
          {onViewRecipe && (
            <Button 
              variant="outline" 
              className="mt-4 w-full border-amber-500 text-amber-700 hover:bg-amber-50 hover:text-amber-800 flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation(); // Prevent card's onClick from firing
                onViewRecipe?.();
              }}
            >
              <Info className="w-4 h-4 mr-2" />
              View Recipe
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
