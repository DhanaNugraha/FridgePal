# FridgePal API Documentation

## Base URL
`/api/v1`

## Authentication
This API does not require authentication.

## Endpoints

### 1. Health Check
Check the health status of the FridgePal service.

```http
GET /health
```

#### Response
```json
{
  "status": "healthy",
  "chefs_loaded": 3,
  "chef_names": ["Chef 1 (Marco)", "Chef 2 (Sofia)", "Chef 3 (Raj)"],
  "service": "FridgePal Recipes"
}
```

### 2. Get Recipe Recommendations
Get personalized recipe recommendations based on available ingredients.

```http
POST /recipes
```

#### Request Body
```json
{
  "ingredients": ["chicken breast", "garlic", "olive oil", "salt", "black pepper"],
  "max_results": 5,
  "variety": 0.7
}
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| ingredients | string[] | Yes | - | List of available ingredients to search recipes with |
| max_results | integer | No | 5 | Maximum number of recipe recommendations to return (1-20) |
| variety | number | No | 0.7 | Controls the balance between ingredient overlap (0.0) and semantic similarity (1.0) |

#### Response
```json
{
  "recipes": [
    {
      "id": 3806,
      "title": "Low-Fat Potato Bites",
      "similarity_score": 0.4898641894838388,
      "ingredients": [
        "4 to 5 medium potatoes",
        "2 tbsp. olive oil",
        "garlic salt"
      ],
      "instructions": [
        "Preheat oven to 350°",
        "Cut potatoes in half, then quarters and dice",
        "Put in baking pan",
        "Pour oil over potatoes using hands to make sure each potato has oil on it",
        "Sprinkle with garlic salt",
        "Put in oven and bake for 30 minutes, stirring occasionally"
      ],
      "chef": "Chef 1 (Marco)",
      "cuisine": null
    }
  ]
}
```

#### Response Fields
| Field | Type | Description |
|-------|------|-------------|
| recipes | Recipe[] | List of recommended recipes |
| recipes[].id | integer | Unique identifier for the recipe |
| recipes[].title | string | Title of the recipe |
| recipes[].similarity_score | number | Combined similarity score (0-1) |
| recipes[].ingredients | string[] | List of ingredients required |
| recipes[].instructions | string[] | Step-by-step cooking instructions |
| recipes[].chef | string | Name of the chef who recommended the recipe |
| recipes[].cuisine | string | Type of cuisine (optional) |

### Error Responses

#### 400 Bad Request
```json
{
  "detail": "At least one ingredient is required"
}
```

#### 422 Unprocessable Entity
Returned when the request body is invalid.

#### 500 Internal Server Error
```json
{
  "detail": "An unexpected error occurred while processing your request"
}
```

## Versioning
This is version 1 of the API. The API follows semantic versioning (e.g., v1, v2, etc.).


