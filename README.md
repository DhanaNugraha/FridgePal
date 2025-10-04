# FridgePal 🍽️

[![Python](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.68.0-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14.0.0-000000.svg?logo=next.js)](https://nextjs.org/)

FridgePal is a smart recipe recommendation system that helps you discover delicious recipes based on the ingredients you already have at home. With a unique multi-chef approach, FridgePal provides diverse and personalized recipe suggestions.

## ✨ Features

- **Multi-Chef Recommendation System**: Get diverse recipe suggestions from different culinary experts
- **Ingredient-Based Search**: Find recipes based on what's in your fridge
- **Modern Web Interface**: Built with Next.js 14, Tailwind CSS, and Framer Motion
- **RESTful API**: Powered by FastAPI with automatic OpenAPI documentation
- **Speech-to-Text**: Voice input for hands-free ingredient entry
- **Responsive Design**: Works on desktop and mobile devices

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- Node.js 16+
- pip (Python package manager)
- npm or yarn

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/FridgePal.git
   cd FridgePal/backend
   ```

2. **Set up a virtual environment**
   ```bash
   python -m venv .venv
   # On Windows:
   .\.venv\Scripts\activate
   # On macOS/Linux:
   # source .venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Run the backend server**
   ```bash
   uvicorn app.main:app --reload
   ```
   The API will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to the frontend directory**
   ```bash
   cd ../frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   # yarn install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   # or
   # yarn dev
   ```
   The app will be available at `http://localhost:3000`

## 🏗️ Backend Architecture

### Parallel Multi-Chef Processing

The backend employs an efficient parallel processing system to handle multiple culinary experts (chefs) simultaneously:

- **Concurrent Execution**: Utilizes Python's `ThreadPoolExecutor` to process multiple chefs in parallel
- **Load Distribution**: Evenly distributes the workload across available CPU cores
- **Non-blocking I/O**: Asynchronous handling of recommendations to maximize throughput
- **Fault Isolation**: Each chef operates independently, ensuring one chef's failure doesn't affect others

### Memory Management

Optimized memory usage through several key strategies:

- **Selective Model Loading**: Loads only necessary components into memory
- **Cache Management**:
  - Implements intelligent cache clearing between requests
  - Resets TF-IDF matrices after processing
  - Cleans up temporary objects
- **Garbage Collection**:
  - Strategic `gc.collect()` calls to reclaim memory
  - Monitors memory usage with detailed logging
  - Maintains stable memory footprint 
- **Efficient Data Structures**: Uses memory-efficient data structures for recipe storage and processing

## 🍳 Training Your Own Chefs

### Data Setup

Before training, you'll need to set up the recipe data:

1. **Create a data directory**
   ```bash
   # From the backend directory
   mkdir -p app/data/raw
   ```

2. **Download the recipe dataset**
   - Visit [Recipe Dataset on Kaggle](https://www.kaggle.com/datasets/wilmerarltstrmberg/recipe-dataset-over-2m)
   - Download the dataset (requires Kaggle account)
   - Place the downloaded CSV file in the `data/raw` directory

   Or use the Kaggle API if you have it set up:
   ```bash
   # Install kaggle if needed
   pip install kaggle
   
   # Set up Kaggle API (if not already done)
   mkdir -p ~/.kaggle
   # Place your kaggle.json file here
   
   # Download the dataset
   kaggle datasets download -d wilmerarltstrmberg/recipe-dataset-over-2m -p data/raw/
   unzip data/raw/recipe-dataset-over-2m.zip -d data/raw/
   ```

### Training the Chefs

Once the data is in place, you can train the multi-chef recommendation system:

```bash
# From the backend directory
python -m app.models.Training.train_chefs

# To test the chefs
python -m app.models.Training.test_chefs
```

## 📚 API Documentation

Once the backend is running, you can access:

- **Interactive API Docs**: `http://localhost:8000/docs`
- **Alternative Docs**: `http://localhost:8000/redoc`

## 📚 API Endpoints

### `POST /api/v1/recipes`
Get recipe recommendations based on ingredients.

**Request Body:**
```json
{
  "ingredients": ["chicken", "tomato", "onion"],
  "max_results": 5,
  "variety": 0.7,
}
```

**Parameters:**
- `ingredients` (required): List of ingredient names
- `max_results` (optional, default=5): Maximum number of recipes to return
- `variety` (optional, default=0.7): Diversity score (0.0 to 1.0)

**Example Request:**
```bash
curl -X POST "http://localhost:8000/api/v1/recipes" \
  -H "Content-Type: application/json" \
  -d '{"ingredients": ["chicken", "tomato", "onion"], "max_results": 5, "variety": 0.7}'
```

**Response:**
```json
{
  "recipes": [
    {
      "id": 12345,
      "title": "Chicken Tomato Stew",
      "ingredients": ["chicken breast", "tomatoes", "onion", "garlic", "olive oil"],
      "instructions": ["1. Heat oil in a pot..."],
      "cooking_time": 45,
      "cuisine_type": "Mediterranean",
      "similarity_score": 0.92,
      "chef": "chef_italian_1"
    }
  ]
}
```


## 🏗️ Project Structure

```
FridgePal/
├── backend/                          # FastAPI backend
│   ├── app/
│   │   ├── api/                     # API routes
│   │   │   └── api_v1/              # API version 1
│   │   │       ├── __init__.py      # API router initialization
│   │   │       └── recipes.py       # Recipe endpoints
│   │   │
│   │   ├── core/                    # Core configurations
│   │   │   └── config.py            # Application configuration
│   │   │
│   │   ├── models/                  # Data models and ML components
│   │   │   ├── Training/            # Model training code
│   │   │   └── chef_models.py       # Chef model implementations
│   │   │
│   │   ├── services/                # Business logic
│   │   │   └── recipe_service.py    # Recipe recommendation logic
│   │   │
│   │   ├── utils/                   # Utility functions
│   │   │   ├── __init__.py          # Package initialization
│   │   │   ├── exception_handlers.py # Custom exception handling
│   │   │   └── responses.py         # Standardized API responses
│   │   │
│   │   └── main.py                  # FastAPI application entry point
│   │
│   ├── tests/                      # Test files
│   ├── .env.example                # Environment variables template
│   └── requirements.txt            # Python dependencies
│
└── README.md                       # This file
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Recipe dataset provided by [Kaggle](https://www.kaggle.com/datasets/wilmerarltstrmberg/recipe-dataset-over-2m)
- Icons by [Font Awesome](https://fontawesome.com/)

---

Built with ❤️ by [Your Name] | [GitHub](https://github.com/yourusername)
