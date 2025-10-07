'use client';

import { useState, useEffect, useCallback } from 'react';
import { SearchBar } from '@/components/search-bar';
import { RecipeGrid } from '@/components/recipe-grid';
import { useRecipes } from '@/hooks/useRecipes';
import { checkHealth, startHealthChecks } from '@/lib/api';
import { Toast } from '@/components/ui/toast';

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

  // State for toast notifications
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    show: boolean;
    id: number;
  } | null>(null);
  const [hasShownReady, setHasShownReady] = useState(false);
  const [isBackendReady, setIsBackendReady] = useState(false);

  // Show toast notification
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    console.log('Showing toast:', { message, type });
    const newToast = {
      message,
      type,
      show: true,
      id: Date.now(),
    };
    console.log('Setting toast state:', newToast);
    setToast(newToast);
  }, []);

  // Handle health status changes
  useEffect(() => {
    console.log('Setting up health check listener...');
    
    const handleHealthStatus = (status: string) => {
      console.log('Health status changed:', status);
      // Handle both 'ok' and 'healthy' statuses as valid
      const isReady = status === 'ok' || status === 'healthy';
      
      if (isReady) {
        // Only show success notification if we were previously in an error state
        if (!isBackendReady) {
          console.log('Backend became available, showing success toast');
          showToast('Backend connection established!', 'success');
        }
      } else {
        // Show error notification when backend is unavailable
        console.log('Backend is unavailable, showing error toast');
        showToast('Unable to connect to the recipe service. Some features may be limited.', 'error');
      }
      
      // Only update state if it's changed to prevent unnecessary re-renders
      if (isBackendReady !== isReady) {
        console.log('Updating isBackendReady from', isBackendReady, 'to', isReady);
        setIsBackendReady(isReady);
      }
    };

    // Initial health check
    console.log('Performing initial health check...');
    checkHealth()
      .then(health => {
        console.log('Initial health check completed:', health.status);
        handleHealthStatus(health.status);
      })
      .catch(error => {
        console.error('Initial health check failed:', error);
        handleHealthStatus('unavailable');
      });

    // Start periodic health checks
    console.log('Starting periodic health checks...');
    const cleanup = startHealthChecks(handleHealthStatus);

    // Cleanup on unmount
    return () => {
      console.log('Cleaning up health checks');
      cleanup();
    };
  }, [showToast]); // Removed isBackendReady and hasShownReady from dependencies

  const handleSearch = (ingredients: string[], options?: { variety?: number; perChef?: number }) => {
    setSearchParams(prev => ({
      ...prev,
      ingredients: ingredients,
      variety: options?.variety !== undefined ? options.variety : prev.variety,
      perChef: options?.perChef !== undefined ? options.perChef : prev.perChef
    }));
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100">

      {/* Toast Notifications */}
      {toast?.show && (
        <div className="toast-enter">
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onDismiss={() => setToast(null)}
            autoDismiss={toast.type !== 'error'}
          />
        </div>
      )}
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
