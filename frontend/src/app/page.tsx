"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mic, Search, Loader2, ChefHat, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useRecipeSearch } from "@/hooks/useRecipeSearch";
import { RecipeCard } from "@/components/recipes/RecipeCard";

type Recipe = {
  id: number;
  title: string;
  similarity_score: number;
  ingredients: string[];
  instructions: string[];
  chef: string;
  cuisine: string | null;
};

export default function Home() {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const { toast } = useToast();
  const searchMutation = useRecipeSearch();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      addIngredient();
    }
  };

  const addIngredient = () => {
    if (inputValue.trim() && !ingredients.includes(inputValue.trim())) {
      setIngredients([...ingredients, inputValue.trim()]);
      setInputValue("");
    }
  };

  const removeIngredient = (ingredientToRemove: string) => {
    setIngredients(ingredients.filter(ing => ing !== ingredientToRemove));
  };

  const handleSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: any) => {
        const speechResult = event.results[0][0].transcript;
        setInputValue(speechResult);
      };

      recognition.onerror = (event: any) => {
        toast({
          title: "Error",
          description: "Could not process speech. Please try again.",
          variant: "destructive",
        });
      };

      recognition.start();
    } else {
      toast({
        title: "Not Supported",
        description: "Speech recognition is not supported in your browser.",
        variant: "destructive",
      });
    }
  };

  const handleSearch = async () => {
    if (ingredients.length === 0) {
      toast({
        title: "No Ingredients",
        description: "Please add at least one ingredient to search for recipes.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSearching(true);
      await searchMutation.mutateAsync(
        { ingredients, max_results: 6, variety: 0.7 },
        {
          onSuccess: () => {
            setShowResults(true);
            // Scroll to results
            setTimeout(() => {
              document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
            }, 100);
          },
        }
      );
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch recipes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-foreground bg-clip-text text-transparent">
            What's in your fridge today?
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover delicious recipes you can make with the ingredients you already have at home.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-card rounded-xl shadow-lg p-6 mb-8"
        >
          <div className="flex flex-col space-y-4">
            <div className="flex gap-2">
              <div className="relative w-full">
                <Input
                  type="text"
                  placeholder="Add ingredients (e.g., chicken, tomatoes, pasta)..."
                  value={inputValue}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pr-12 w-full"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleSpeechRecognition}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                >
                  <Mic className="h-4 w-4" />
                </Button>
              </div>
              <Button 
                onClick={handleSearch} 
                disabled={isSearching} 
                className="gap-2 w-full md:w-auto"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    Find Recipes
                  </>
                )}
              </Button>
            </div>

            {ingredients.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {ingredients.map((ingredient) => (
                  <div
                    key={ingredient}
                    className="inline-flex items-center bg-primary/10 text-primary rounded-full px-3 py-1 text-sm"
                  >
                    {ingredient}
                    <button
                      onClick={() => removeIngredient(ingredient)}
                      className="ml-2 hover:text-destructive transition-colors"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {showResults && (
          <motion.section
            id="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full"
          >
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold mb-2">Recipe Suggestions</h2>
              <p className="text-muted-foreground">
                Based on your ingredients: {ingredients.join(", ")}
              </p>
            </div>

            {searchMutation.isPending ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : searchMutation.data && searchMutation.data.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchMutation.data.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    onViewRecipe={() => setSelectedRecipe(recipe)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No recipes found. Try adding more ingredients or adjusting your search.
                </p>
              </div>
            )}
          </motion.section>
        )}
      </main>

      {selectedRecipe && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-background rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold">{selectedRecipe.title}</h2>
                <button
                  onClick={() => setSelectedRecipe(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Ingredients</h3>
                  <ul className="space-y-2">
                    {selectedRecipe.ingredients.map((ingredient, i) => (
                      <li key={i} className="flex items-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary mr-2" />
                        {ingredient}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Instructions</h3>
                  <ol className="space-y-3">
                    {selectedRecipe.instructions.map((step, i) => (
                      <li key={i} className="flex">
                        <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-medium text-sm mr-3">
                          {i + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-border">
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <ChefHat className="h-4 w-4 mr-1" />
                    <span>{selectedRecipe.chef}</span>
                  </div>
                  {selectedRecipe.cuisine && (
                    <div className="flex items-center">
                      <Utensils className="h-4 w-4 mr-1" />
                      <span>{selectedRecipe.cuisine}</span>
                    </div>
                  )}
                  <div className="ml-auto">
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                      {Math.round(selectedRecipe.similarity_score * 100)}% Match
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
