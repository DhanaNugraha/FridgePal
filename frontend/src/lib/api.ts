import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_V1_URL = `${API_BASE_URL}/api/v1/recipes`;

// Create axios instance with base config
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 seconds default timeout
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  }
});

export interface Recipe {
  id: number;
  title: string;
  similarity_score: number;
  ingredients: string[];
  instructions: string[];
  chef: string;
  cuisine: string | null;
}

export interface RecipeResponse {
  recipes: Recipe[];
}

export interface SearchParams {
  ingredients: string[];
  max_results?: number;
  variety?: number;
}

// Keep track of the health check interval and current interval duration
let healthCheckInterval: NodeJS.Timeout | null = null;
let currentInterval: number = 5000; // Default to 5 seconds

// Health check function with increased timeout
export const checkHealth = async (): Promise<{ status: string; timestamp: string; service: string }> => {
  console.log('Checking health at:', new Date().toISOString());
  try {
    const url = '/api/v1/recipes/health';
    console.log('Making health check request to:', url);
    const response = await apiClient.get(url, {
      timeout: 5000, // Shorter timeout for health check
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    return response.data;
  } catch (error) {
    // Don't throw error, just return a status indicating the backend might be sleeping
    console.error('Health check failed:', error);
    return {
      status: 'unavailable',
      timestamp: new Date().toISOString(),
      service: 'fridgepal-api'
    };
  }
};

// Start health checks
export const startHealthChecks = (onStatusChange?: (status: string) => void) => {
  // Clear any existing interval
  if (healthCheckInterval) {
    console.log('Clearing existing health check interval');
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
  }

  // Initial check
  checkHealth().then(health => {
    console.log('Initial health check result:', health.status);
    onStatusChange?.(health.status);
  });

  // Set up periodic checking
  const checkAndUpdateStatus = async () => {
    console.log('Running periodic health check...');
    const health = await checkHealth();
    const isBackendReady = health.status === 'ok' || health.status === 'healthy';
    console.log('Periodic health check result:', { status: health.status, isBackendReady });
    onStatusChange?.(health.status);
    
    // Determine the appropriate interval based on backend status
    const newInterval = isBackendReady ? 14 * 60 * 1000 : 5000; // 14 minutes or 5 seconds
    
    // Only update the interval if it's different from the current one
    if (newInterval !== currentInterval) {
      console.log(`Backend ${isBackendReady ? 'ready' : 'not ready'}, updating check interval to ${newInterval/1000}s`);
      if (healthCheckInterval) {
        clearInterval(healthCheckInterval);
      }
      currentInterval = newInterval;
      healthCheckInterval = setInterval(checkAndUpdateStatus, newInterval);
    }
  };
  
  // Initial check and setup
  console.log('Starting health checks with initial interval (5s)');
  checkAndUpdateStatus(); // Run immediately first
  healthCheckInterval = setInterval(checkAndUpdateStatus, 5000); // Then every 5 seconds

  // Return cleanup function
  return () => {
    console.log('Cleaning up health checks');
    if (healthCheckInterval) {
      clearInterval(healthCheckInterval);
      healthCheckInterval = null;
    }
  };
};

export const api = {
  // Check if the API is healthy - legacy method, prefer using checkHealth() and startHealthChecks()
  async healthCheck() {
    const health = await checkHealth();
    if (health.status !== 'ok') {
      throw new Error('API is not healthy');
    }
    return health;
  },

  // Get recipe recommendations
  async getRecipes(params: SearchParams): Promise<RecipeResponse> {
    try {
      const response = await apiClient.post(API_V1_URL, {
        ingredients: params.ingredients,
        max_results: params.max_results || 5,
        variety: params.variety || 0.7,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch recipes:', error);
      throw error;
    }
  }
};
