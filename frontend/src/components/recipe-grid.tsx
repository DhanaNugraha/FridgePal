'use client';

import { RecipeCard } from './recipe-card';
import { RecipeModal } from './recipe-modal';
import { Recipe } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { useState } from 'react';

type RecipeWithExtras = Recipe & {
  image?: string;
  prepTime?: string;
};

interface RecipeGridProps {
  recipes: RecipeWithExtras[] | undefined;
  isLoading: boolean;
  isError: boolean;
  searchQuery: string;
}

export function RecipeGrid({ recipes, isLoading, isError, searchQuery }: RecipeGridProps) {
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeWithExtras | null>(null);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12">
        <p className="text-amber-700">Failed to load recipes. Please try again later.</p>
        <Button 
          onClick={() => window.location.reload()}
          className="mt-4 bg-amber-600 hover:bg-amber-700"
        >
          Retry
        </Button>
      </div>
    );
  }

  if (!searchQuery) {
    return (
      <div className="text-center py-12">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 inline-block">
          <h3 className="text-lg font-medium text-amber-800 mb-2">No ingredients selected</h3>
          <p className="text-amber-700">Enter some ingredients to discover delicious recipes!</p>
        </div>
      </div>
    );
  }

  if (!recipes?.length) {
    return (
      <div className="text-center py-12">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 inline-block">
          <h3 className="text-lg font-medium text-amber-800 mb-2">No recipes found</h3>
          <p className="text-amber-700">Try different ingredients or check back later for more recipes.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recipes.map((recipe) => (
          <RecipeCard 
            key={recipe.id} 
            recipe={recipe} 
            onViewRecipe={() => setSelectedRecipe(recipe)} 
          />
        ))}
      </div>

      {selectedRecipe && (
        <RecipeModal 
          recipe={selectedRecipe} 
          onClose={() => setSelectedRecipe(null)} 
        />
      )}
    </>
  );
}