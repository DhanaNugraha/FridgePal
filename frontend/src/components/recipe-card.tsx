'use client';

import { motion } from 'framer-motion';
import { Clock, ChefHat, Info } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

type RecipeCardProps = {
  recipe: {
    id: string;
    title: string;
    similarity_score: number;
    ingredients: string[];
    instructions: string[];
    chef: string;
    cuisine?: string;
    image?: string;
    prepTime?: string;
  };
  onViewRecipe: () => void;
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
              {recipe.ingredients.slice(0, 4).join(', ')}
              {recipe.ingredients.length > 4 && '...'}
            </p>
          </div>
          
          <Button 
            onClick={onViewRecipe}
            variant="outline"
            className="w-full border-amber-300 text-amber-700 hover:bg-amber-50 hover:border-amber-400 flex items-center justify-center gap-2"
          >
            <Info className="w-4 h-4" />
            View Recipe
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
