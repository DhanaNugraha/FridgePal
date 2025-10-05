export interface Recipe {
  id: number;
  title: string;
  similarity_score: number;
  ingredients: string[];
  instructions: string[];
  chef: string;
  cuisine: string | null;
}

export interface RecipeSearchParams {
  ingredients: string[];
  max_results?: number;
  variety?: number;
}
