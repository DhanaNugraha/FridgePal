import { useQuery, UseQueryResult, UseQueryOptions } from '@tanstack/react-query';
import { useEffect } from 'react';
import { api, Recipe, RecipeResponse, SearchParams } from '@/lib/api';

// Helper function to log cache status
const logCacheStatus = (status: 'HIT' | 'MISS', searchTerm: string): void => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Cache ${status} for: ${searchTerm || 'no-ingredients'}`);
};

// Custom hook with proper TypeScript types
export const useRecipes = (params: SearchParams): UseQueryResult<Recipe[], Error> => {
  const searchTerm = params.ingredients.join(', ');
  
  // Define query options with proper types
  const queryOptions: UseQueryOptions<RecipeResponse, Error, Recipe[]> = {
    queryKey: ['recipes', params],
    queryFn: async () => {
      logCacheStatus('MISS', searchTerm);
      const response = await api.getRecipes(params);
      return response;
    },
    enabled: params.ingredients.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes (renamed from cacheTime in newer versions)
    refetchOnWindowFocus: true,
    select: (data: RecipeResponse) => data.recipes,
  };

  // Use the query
  const result = useQuery<RecipeResponse, Error, Recipe[]>(queryOptions);

  // Handle side effects with useEffect
  useEffect(() => {
    // Only run when we have data or an error
    if (result.isFetched) {
      if (result.data) {
        console.groupCollapsed(`Recipe Search Results (${searchTerm})`);
        console.log('Search Parameters:', params);
        console.log('Number of recipes:', result.data.length);
        console.log('First recipe:', result.data[0]?.title || 'No recipes found');
        console.groupEnd();
      }
      
      // Check for cache hits
      const cacheKey = `rq:query:${JSON.stringify(['recipes', params])}`;
      const cachedData = localStorage.getItem(cacheKey);
      
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          if (parsed.state?.dataUpdatedAt && 
              Date.now() - parsed.state.dataUpdatedAt < 5 * 60 * 1000) {
            logCacheStatus('HIT', searchTerm);
          }
        } catch (e) {
          console.error('Error parsing cache data:', e);
        }
      }
    }
  }, [result.isFetched, result.data, searchTerm, params]);

  return result;
};
