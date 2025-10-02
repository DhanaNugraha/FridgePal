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

### Example API Request

```bash
curl -X POST "http://localhost:8000/api/v1/recipes" \
  -H "Content-Type: application/json" \
  -d "{\"ingredients\": [\"chicken\", \"tomato\", \"onion\"], \"max_results\": 5, \"variety\": 0.7}"
```

## 🏗️ Project Structure

```
FridgePal/
├── backend/                  # FastAPI backend
│   ├── app/                 
│   │   ├── api/             # API routes
│   │   ├── core/            # Core configurations
│   │   ├── models/          # Data models and training code
│   │   ├── services/        # Business logic
│   │   └── main.py          # Application entry point
│   ├── data/                # Recipe datasets
│   └── requirements.txt     # Python dependencies
├── frontend/                # Next.js frontend
│   ├── public/              # Static files
│   ├── src/                 # Source code
│   └── package.json         # Frontend dependencies
└── README.md                # This file
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
