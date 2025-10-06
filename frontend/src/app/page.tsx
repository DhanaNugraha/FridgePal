'use client';

import { useState } from 'react';
import { SearchBar } from '@/components/search-bar';
import { RecipeGrid } from '@/components/recipe-grid';
import { useRecipes } from '@/hooks/useRecipes';
import { Recipe } from '@/lib/api';

export default function Home() {
  const [searchParams, setSearchParams] = useState<{ ingredients: string[] }>({ ingredients: [] });
  const { data: recipes, isLoading, error } = useRecipes({
    ingredients: searchParams.ingredients,
    max_results: 10,
    variety: 0.7
  });

  const handleSearch = (ingredients: string[]) => {
    setSearchParams({ ingredients });
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h1 className="text-5xl font-heading font-bold text-amber-900 mb-4">
            FridgePal
          </h1>
          <p className="text-xl text-amber-800 mb-8">
            Discover delicious recipes based on what's in your fridge
          </p>
          
          <div className="max-w-2xl mx-auto">
            <SearchBar 
              onSearch={handleSearch} 
              isLoading={isLoading} 
            />
          </div>
        </div>

        {isLoading && searchParams.ingredients.length > 0 && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <p className="text-red-500">Error loading recipes. Please try again.</p>
          </div>
        )}

        <RecipeGrid 
          recipes={recipes}
          isLoading={isLoading}
          isError={!!error}
          searchQuery={searchParams.ingredients.join(', ')}
        />
      </div>
    </main>
  );
}
