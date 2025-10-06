'use client';

import { motion } from 'framer-motion';
import { Clock, ChefHat, Info } from 'lucide-react';
import Image from 'next/image';
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
  
  // Calculate a color based on the similarity score
  const getScoreColor = (score: number) => {
    if (score > 0.8) return 'bg-green-100 text-green-800';
    if (score > 0.6) return 'bg-amber-100 text-amber-800';
    return 'bg-amber-50 text-amber-800';
  };

  // Extract chef name (remove anything in parentheses)
  const chefName = recipe.chef.split('(')[0].trim();

  const handleCardClick = () => {
    console.log('Card clicked, onViewRecipe:', onViewRecipe);
    onViewRecipe?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col h-full cursor-pointer"
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
      {/* Recipe Image */}
      <div className="relative h-48 bg-amber-100 overflow-hidden">
        {recipe.image ? (
          <Image
            src={recipe.image}
            alt={recipe.title}
            fill
            className="object-cover transition-transform duration-500 ease-in-out"
            style={{
              transform: isHovered ? 'scale(1.05)' : 'scale(1)',
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-amber-800">
            <ChefHat className="w-16 h-16 opacity-20" />
          </div>
        )}
        
        {/* Score Badge */}
        <div className="absolute top-3 right-3">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(recipe.similarity_score)}`}>
            {Math.round(recipe.similarity_score * 100)}% Match
          </span>
        </div>
        
        {/* Chef Badge */}
        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-amber-900 flex items-center">
          <span className="w-2 h-2 rounded-full bg-amber-500 mr-2"></span>
          {chefName}
        </div>
      </div>
      
      {/* Recipe Content */}
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-xl font-semibold text-amber-900 mb-2 line-clamp-2">
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
        
        <div className="mt-auto">
          <div className="mb-4">
            <h4 className="text-sm font-medium text-amber-800 mb-1">
              Key Ingredients:
            </h4>
            <p className="text-sm text-amber-700 line-clamp-2">
              {recipe.ingredients.length > 4 && '...'}
            </p>
          </div>
          
          {onViewRecipe && (
            <Button 
              variant="outline" 
              className="mt-4 w-full border-amber-500 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
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
