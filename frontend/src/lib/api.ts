import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1/recipes';

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

export const api = {
  // Check if the API is healthy
  async healthCheck() {
    try {
      const response = await axios.get(`${API_BASE_URL}/health`);
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  },

  // Get recipe recommendations
  async getRecipes(params: SearchParams): Promise<RecipeResponse> {
    try {
      const response = await axios.post(API_BASE_URL, {
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
