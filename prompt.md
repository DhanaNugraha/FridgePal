You are building a full-stack web application called **FridgePal**.

✨ Project Goal:
FridgePal helps users decide what to cook based on the ingredients they already have. 
Users can type or speak their available ingredients, and FridgePal will recommend 
recipes from a large dataset with step-by-step instructions. To make results more 
diverse and fun, FridgePal uses a "multiple chefs" ensemble approach: each chef is 
a small AI model trained on a different portion of the dataset, and together they 
suggest recipes like a panel of experts.

---

🔹 Frontend (Next.js 14 + Tailwind + Framer Motion)
Requirements:
1. Framework: Next.js (App Router) with TypeScript, TailwindCSS, Framer Motion.
2. Homepage:
   - Title: "FridgePal – What’s in your fridge today?"
   - Input field for ingredients.
   - Speech-to-text button using the Web Speech API (mic icon).
   - Submit button to call backend API.
3. Results Page:
   - Display recipe suggestions in animated cards.
   - Each card shows:
     • Recipe title
     • Match score (%)
     • Chef identity (e.g., "Chef 1", "Chef Vegan", etc.)
     • Available and missing ingredients
   - Clicking a card opens a modal with:
     • Full list of ingredients
     • Step-by-step instructions
4. Animations:
   - Smooth hover animations on cards.
   - Fade-in + slide-up for modals.
   - Responsive grid for recipe results.
5. API Integration:
   - Send POST request to `/api/recipes` with:
     { "ingredients": ["tomato", "chicken", "onion"] }
   - Display backend JSON response.

---

🔹 Backend (Python FastAPI + scikit-learn + Pandas)
Requirements:
1. Endpoint:
   - POST `/api/recipes`
   - Accepts JSON body:
     ```json
     {
       "ingredients": ["tomato", "chicken", "onion"],
       "top_n": 10,
       "cosine_weight": 0.5
     }
     ```
   - Parameters:
     - `ingredients`: List of available ingredients (required)
     - `top_n`: Number of recipes to return per chef (default: 5)
     - `cosine_weight`: Weight for TF-IDF vs. ingredient overlap (0.0 to 1.0, default: 0.5)

2. Dataset:
   - Start from a Kaggle dataset like "wilmerarltstrmberg/recipe-dataset-over-2m"
   - Preprocess and split into smaller subsets (e.g., 5 chunks of 50k recipes each)
   - Each subset is managed by a specialized "Chef" with a unique culinary focus

3. Hybrid Scoring Model:
   - Each chef uses a two-part scoring system:
     1. **TF-IDF + Cosine Similarity**: Captures semantic relationships between ingredients
     2. **Ingredient Overlap**: Measures the percentage of recipe ingredients that match user's input
   - Final score is a weighted combination: 
     ```
     final_score = (cosine_weight * tfidf_score) + ((1 - cosine_weight) * overlap_score)
     ```
   - Default is 50/50 weighting, but can be adjusted via API parameter

4. Response Format:
   ```json
   {
     "recipes": [
       {
         "chef": "Chef 2 (Asian)",
         "title": "Tomato Chicken Curry",
         "score": 0.92,
         "score_components": {
           "tfidf": 0.85,
           "overlap": 0.99,
           "tfidf_weight": 0.5,
           "overlap_weight": 0.5
         },
         "available_ingredients": ["chicken", "tomato", "onion"],
         "missing_ingredients": ["garlic", "ginger", "curry powder"],
         "instructions": [
           "Sauté onions and garlic in oil until fragrant",
           "Add chicken and brown on all sides",
           "Stir in tomatoes and spices, simmer for 20 minutes"
         ]
       }
     ]
   }
   ```

---

🔹 Features
- **Hybrid Scoring System**: Combines TF-IDF semantic search with ingredient overlap for better recommendations
- **Multi-Chef Ensemble**: Multiple specialized models (chefs) provide diverse recipe suggestions
- **Transparent Scoring**: See how each recommendation was scored with detailed breakdown
- **Customizable Weights**: Adjust the balance between semantic matching and ingredient overlap
- **Speech-to-Text**: Voice input for hands-free ingredient entry
- **Responsive Design**: Works beautifully on all devices
- **Animated UI**: Smooth transitions and engaging interactions
- **Deployment Ready**: Containerized with Docker, ready for cloud deployment

---

🚀 Deliverables
1. **Frontend (Next.js 14)**
   - Modern, responsive UI with Framer Motion animations
   - Ingredient input with auto-suggest and voice input
   - Recipe cards with score breakdown visualization
   - Interactive modals for detailed recipe views

2. **Backend (FastAPI)**
   - RESTful API with hybrid scoring endpoint
   - Multiple chef models with specialized training
   - Efficient ingredient processing and matching
   - Comprehensive API documentation

3. **Deployment**
   - Docker configuration for containerization
   - CI/CD pipeline setup
   - Cloud deployment guides (Vercel + Render/Railway)

4. **Documentation**
   - API reference with examples
   - Architecture decision records
   - Setup and contribution guides
