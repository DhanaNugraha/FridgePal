"use client"

import { motion } from "framer-motion"
import { ChefHat, Utensils } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Recipe } from "@/types/recipe"

interface RecipeCardProps {
  recipe: Recipe
  onViewRecipe: () => void
}

export function RecipeCard({ recipe, onViewRecipe }: RecipeCardProps) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-card rounded-xl shadow-md overflow-hidden border border-border/50 hover:shadow-lg transition-shadow"
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-semibold line-clamp-2">{recipe.title}</h3>
          <span className="bg-primary/10 text-primary text-sm font-medium px-3 py-1 rounded-full">
            {Math.round(recipe.similarity_score * 100)}% Match
          </span>
        </div>

        <div className="flex items-center text-sm text-muted-foreground mb-4 gap-4">
          <div className="flex items-center gap-1">
            <ChefHat className="h-4 w-4" />
            <span>{recipe.chef}</span>
          </div>
          {recipe.cuisine && (
            <div className="flex items-center gap-1">
              <Utensils className="h-4 w-4" />
              <span>{recipe.cuisine}</span>
            </div>
          )}
        </div>

        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Ingredients ({recipe.ingredients.length})</h4>
          <div className="flex flex-wrap gap-2">
            {recipe.ingredients.slice(0, 5).map((ingredient, i) => (
              <span key={i} className="text-xs bg-muted/50 rounded-full px-2 py-1">
                {ingredient}
              </span>
            ))}
            {recipe.ingredients.length > 5 && (
              <span className="text-xs text-muted-foreground">
                +{recipe.ingredients.length - 5} more
              </span>
            )}
          </div>
        </div>

        <Button onClick={onViewRecipe} className="w-full" variant="outline">
          View Recipe
        </Button>
      </div>
    </motion.div>
  )
}
