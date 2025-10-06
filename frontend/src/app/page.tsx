import { Suspense } from 'react';
import { SearchBar } from '@/components/search-bar';
import { RecipeGrid } from '@/components/recipe-grid';
import { RecipeModal } from '@/components/recipe-modal';

export default function Home() {
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
            <SearchBar />
          </div>
        </div>

        <Suspense fallback={
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
          </div>
        }>
          <RecipeGrid />
        </Suspense>
      </div>
      
      {false && <RecipeModal recipe={null} onClose={() => {}} />}
    </main>
  );
}
