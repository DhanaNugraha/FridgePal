'use client';

import { useState } from 'react';
import { SearchBar } from '@/components/search-bar';
import { RecipeGrid } from '@/components/recipe-grid';
import { useRecipes } from '@/hooks/useRecipes';

export default function Home() {
  const [searchParams, setSearchParams] = useState<{ 
    ingredients: string[];
    variety?: number;
    perChef?: number;
  }>({ 
    ingredients: [],
    variety: 5,  // Default variety from search-bar
    perChef: 2   // Default recipes per chef from search-bar
  });

  const { data: recipes, isLoading, error } = useRecipes({
    ingredients: searchParams.ingredients,
    max_results: searchParams.perChef || 2,
    variety: searchParams.variety ? searchParams.variety / 10 : 0.5 // Convert 1-10 scale to 0.1-1.0
  });

  const handleSearch = (ingredients: string[], options?: { variety?: number; perChef?: number }) => {
    setSearchParams(prev => ({
      ...prev,
      ingredients,
      variety: options?.variety !== undefined ? options.variety : prev.variety,
      perChef: options?.perChef !== undefined ? options.perChef : prev.perChef
    }));
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h1 className="text-5xl font-heading font-bold text-amber-900 mb-4">
            FridgePal
          </h1>
          <p className="text-xl text-amber-800 mb-8">
            Discover delicious recipes based on what&apos;s in your fridge
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
