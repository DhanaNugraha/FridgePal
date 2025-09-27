You are building a full-stack web application called **FridgePal**.

✨ Project Goal:
FridgePal helps users decide what to cook based on the ingredients they already have. 
The user can either type or speak their available ingredients, and FridgePal recommends 
recipes from a large dataset with step-by-step cooking instructions.

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
   - Display recipes in animated cards (Framer Motion).
   - Each card shows:
     • Recipe title
     • Match score (%)
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
   - Display backend response in JSON format.

---

🔹 Backend (Python FastAPI + scikit-learn + KaggleHub)
Requirements:
1. Endpoint:
   - POST `/api/recipes`
   - Accepts JSON body:
     { "ingredients": ["tomato", "chicken", "onion"] }
2. Dataset:
   - Use KaggleHub to load dataset:
     "wilmerarltstrmberg/recipe-dataset-over-2m"
   - Load CSV with columns: `title`, `ingredients`, `instructions`.
3. Matching Algorithm:
   - Use scikit-learn’s `TfidfVectorizer` to vectorize ingredients.
   - Use cosine similarity to rank recipes by overlap with user’s input.
   - Return top 5 matches.
4. Response format:
   Return JSON in this format:
   {
     "recipes": [
       {
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
- Speech-to-text for easy ingredient input.
- Ingredient-based recipe recommendations.
- Step-by-step instructions in a clean UI.
- Fun, modern branding: **FridgePal** (your friendly fridge buddy).
- Responsive and mobile-friendly design.
- Deployment ready (Next.js frontend can be hosted on Vercel, backend on Render/Railway).

---

🚀 Deliverables
- Next.js frontend (pages, components, animations).
- FastAPI backend with KaggleHub + scikit-learn.
- API integration between frontend and backend.
- Branding/theme consistent with “FridgePal” (friendly, modern, accessible).
