"use client"

import { useMutation } from "@tanstack/react-query"
import axios from "axios"
import { Recipe, RecipeSearchParams } from "@/types/recipe"

export const useRecipeSearch = () => {
  return useMutation<Recipe[], Error, RecipeSearchParams>({
    mutationFn: async ({ ingredients, max_results = 5, variety = 0.7 }) => {
      try {
        const response = await axios.post("/api/recipes", {
          ingredients,
          max_results,
          variety,
        })
        return response.data.recipes
      } catch (error) {
        throw error
      }
    },
  })
}
