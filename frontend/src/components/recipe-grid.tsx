'use client';

import { useQuery } from '@tanstack/react-query';
import { RecipeCard } from './recipe-card';
import { useState } from 'react';
import { RecipeModal } from '@/components/recipe-modal';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';

interface Recipe {
  id: string;
  title: string;
  similarity_score: number;
  ingredients: string[];
  instructions: string[];
  chef: string;
  cuisine?: string;
  prepTime?: string;
  image?: string;
}

export function RecipeGrid() {
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
  const [ingredients, setIngredients] = useState<string>('');
  
  // Mock data for demonstration - replace with actual API call
  const { data: recipes, isLoading, isError } = useQuery<Recipe[]>({
    queryKey: ['recipes', ingredients],
    queryFn: async () => {
      if (!ingredients) return [];
      
      // In a real app, you would fetch from your API:
      // const response = await fetch(`/api/v1/recipes?ingredients=${encodeURIComponent(ingredients)}`);
      // return response.json();
      
      // Mock data for now
      return [
        {
          id: '1',
          title: 'Creamy Garlic Pasta with Chicken',
          similarity_score: 0.92,
          ingredients: ['pasta', 'chicken breast', 'garlic', 'heavy cream', 'parmesan cheese', 'olive oil', 'salt', 'pepper'],
          instructions: [
            'Cook pasta according to package instructions.',
            'Season chicken with salt and pepper, then cook in olive oil until golden brown.',
            'Add minced garlic and cook until fragrant, about 1 minute.',
            'Pour in heavy cream and bring to a simmer.',
            'Stir in parmesan cheese until melted and sauce thickens.',
            'Toss cooked pasta with the sauce and serve hot.'
          ],
          chef: 'Chef 1 (Italian)',
          cuisine: 'Italian',
          prepTime: '30 mins',
          image: 'https://images.unsplash.com/photo-1645112411348-404c894e575d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },
        {
          id: '2',
          title: 'Vegetable Stir Fry with Tofu',
          similarity_score: 0.85,
          ingredients: ['tofu', 'bell peppers', 'broccoli', 'carrots', 'soy sauce', 'ginger', 'garlic', 'sesame oil'],
          instructions: [
            'Press and cube tofu, then pan-fry until golden.',
            'In a wok, heat oil and sauté minced garlic and ginger.',
            'Add sliced vegetables and stir-fry until crisp-tender.',
            'Add tofu back to the wok with soy sauce and toss to combine.',
            'Serve hot over rice.'
          ],
          chef: 'Chef 2 (Asian)',
          cuisine: 'Asian',
          prepTime: '25 mins',
          image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },
        {
          id: '3',
          title: 'Classic Caesar Salad',
          similarity_score: 0.78,
          ingredients: ['romaine lettuce', 'croutons', 'parmesan cheese', 'lemon juice', 'olive oil', 'garlic', 'anchovy paste', 'egg yolk', 'worcestershire sauce'],
          instructions: [
            'Wash and chop romaine lettuce.',
            'Make dressing by blending egg yolk, lemon juice, garlic, anchovy paste, and worcestershire sauce.',
            'Slowly drizzle in olive oil while blending to emulsify.',
            'Toss lettuce with dressing, croutons, and shaved parmesan.',
            'Serve immediately.'
          ],
          chef: 'Chef 3 (French)',
          cuisine: 'French',
          prepTime: '15 mins',
          image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        }
      ];
    },
    enabled: !!ingredients
  });

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

  if (!ingredients) {
    return (
      <div className="text-center py-12">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 inline-block">
          <h3 className="text-lg font-medium text-amber-800 mb-2">No ingredients selected</h3>
          <p className="text-amber-700">Enter some ingredients to discover delicious recipes!</p>
        </div>
      </div>
    );
  }

  if (recipes?.length === 0) {
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
        {recipes?.map((recipe) => (
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
