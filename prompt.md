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
     { "ingredients": ["tomato", "chicken", "onion"] }
2. Dataset:
   - Start from a Kaggle dataset like:
     "wilmerarltstrmberg/recipe-dataset-over-2m"
   - If the dataset is too large, preprocess once and save smaller subsets 
     (e.g., 5 chunks of 50k recipes each).
   - Each subset corresponds to one "Chef".
3. Models:
   - For each subset, train a TF-IDF + cosine similarity model on the ingredients.
   - At query time, send the user’s ingredients to all chefs.
   - Each chef returns its top N results.
   - Merge results from all chefs and sort by similarity score.
   - Add a "chef" field in the response to indicate which chef suggested the recipe.
4. Response format:
   Return JSON in this format:
   {
     "recipes": [
       {
         "chef": "Chef 2",
         "title": "Tomato Chicken Curry",
         "match_score": 0.85,
         "required_ingredients": ["chicken", "tomato", "onion", "garlic", "spices"],
         "missing_ingredients": ["garlic", "spices"],
         "instructions": [
           "Chop onion, garlic, and tomato.",
           "Sauté onion and garlic in oil.",
           "Add chicken and cook until brown.",
           "Add tomato and spices, simmer until cooked."
         ]
       }
     ]
   }

---

🔹 Features
- Speech-to-text for ingredient input.
- Multi-chef ensemble recommendation system (each chef = one slice of dataset).
- Step-by-step instructions in a clean, animated UI.
- Branding: **FridgePal** (your friendly fridge buddy).
- Responsive, mobile-friendly design.
- Deployment ready (Next.js frontend on Vercel, FastAPI backend on Render/Railway).

---

🚀 Deliverables
- Next.js frontend (pages, components, animations).
- FastAPI backend with multiple TF-IDF models (chefs).
- API integration between frontend and backend.
- Branding/theme consistent with "FridgePal" (friendly, modern, accessible).
