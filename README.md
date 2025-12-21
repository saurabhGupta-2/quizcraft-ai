# QuizCraft AI 🎓

An intelligent, AI-powered educational platform that transforms learning materials into personalized quizzes, flashcards, and study materials. Built with cutting-edge AI technology to provide adaptive learning experiences tailored to each student's needs.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16.1.0-black)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python-009688)](https://fastapi.tiangolo.com/)

## ✨ Features

### 🤖 AI-Powered Content Generation
- **Smart Quiz Generation**: Create customized quizzes from any content using advanced AI models (Google Gemini/Groq)
- **Flashcard Creation**: Automatically generate flashcards from study materials
- **Study Notes**: AI-generated comprehensive study notes in markdown format
- **Multiple Question Types**: Support for multiple choice, true/false, short answer, fill-in-the-blanks, and matching questions
- **Bloom's Taxonomy Integration**: Questions categorized by cognitive levels (Remember, Understand, Apply, Analyze, Evaluate, Create)

### 🎯 Adaptive Learning
- **Difficulty Adaptation**: Questions adapt to student performance using an adaptive learning engine
- **Weak Area Identification**: Automatically identifies areas where students need improvement
- **Performance-Based Recommendations**: Suggests optimal difficulty levels based on quiz history
- **Progress Tracking**: Comprehensive analytics on quiz attempts and learning progress

### 🧠 Spaced Repetition System
- **SM-2 Algorithm**: Implements the proven SuperMemo 2 algorithm for optimal memory retention
- **Confidence-Based Reviews**: Flashcards scheduled based on student confidence levels
- **Personalized Review Schedules**: Each flashcard has its own optimal review time

### 💬 AI Personal Tutor
- **Personalized Tutoring**: AI tutor with memory of past interactions using Mem0
- **Context-Aware Responses**: Remembers student's strengths, weaknesses, and learning preferences
- **Emotional Support**: Addresses anxiety and confidence concerns with empathy
- **Learning Profile**: Comprehensive profile tracking academic strengths, weaknesses, and emotional insights

### 📚 RAG-Powered Chat
- **Document Chat**: Chat with your uploaded documents using Retrieval-Augmented Generation (RAG)
- **Semantic Search**: Find relevant information from your study materials using advanced embeddings
- **Context-Aware Answers**: Get accurate answers based on your uploaded content
- **Vector Database**: ChromaDB integration for efficient document retrieval

### 📁 Content Management
- **File Upload Support**: Upload PDFs, DOCX, and TXT files
- **Folder Organization**: Organize lessons in hierarchical folders
- **Text Extraction**: Automatic text extraction from various document formats
- **Lesson Management**: Create, update, and delete lessons with ease

### 🔐 Authentication & Security
- **Supabase Auth**: Secure authentication with Supabase
- **Row-Level Security**: Database security with RLS policies
- **User Roles**: Support for learner and educator roles
- **Onboarding Flow**: Personalized onboarding based on user interests and grade level

## 🛠 Tech Stack

### Frontend
- **Framework**: [Next.js 16](https://nextjs.org/) with React 19 and App Router
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/) primitives
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **HTTP Client**: [Axios](https://axios-http.com/)
- **Markdown**: React Markdown with GFM support
- **PDF Processing**: PDF.js and react-pdf
- **Icons**: [Lucide React](https://lucide.dev/)
- **Notifications**: React Hot Toast

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.9+)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI Models**:
  - OpenRouter - MistralAI 
  - Google Gemini 2.5 Flash
  - Groq LLM
  - Google GenAI
- **LLM Framework**: [LangChain](https://www.langchain.com/)
- **Memory**: [Mem0](https://mem0.ai/) for personalized tutoring
- **Embeddings**: Sentence Transformers (all-MiniLM-L6-v2)
- **Vector Store**: [ChromaDB](https://www.trychroma.com/)
- **ML Libraries**: 
  - PyTorch (CPU)
  - scikit-learn
  - pandas
  - numpy
- **Document Processing**: 
  - PyPDF2/pypdf
  - python-docx
  - mammoth
- **Logging**: [Loguru](https://github.com/Delgan/loguru)

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm/yarn/pnpm
- **Python** 3.9 or higher
- **Supabase Account** ([Sign up here](https://supabase.com))
- **API Keys**:
  - OpenAI API key or Google Gemini API key
  - Mem0 API key (for AI tutor)
  - Groq API key (optional)

### Installation

#### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/quizcraft-ai.git
cd quizcraft-ai
```

#### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# On Windows
venv\Scripts\activate

# On Unix/MacOS
source venv/bin/activate

# Install dependencies
pip install -r requirements/dev.txt

# Create .env file
cp .env.example .env
```

**Configure Backend Environment Variables** (`backend/.env`):
```env
# App Configuration
APP_NAME=QuizCraft AI
APP_VERSION=1.0.0
DEBUG=true

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

# AI Services
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
MEM0_API_KEY=your_mem0_api_key

# LLM Configuration
LLM_PROVIDER=google  # or groq
MODEL_NAME=gemini-2.5-flash
TEMPERATURE=0.7
MAX_TOKENS=2048

# Embedding Model
EMBEDDING_MODEL=all-MiniLM-L6-v2

# CORS
BACKEND_CORS_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000"]
```

**Setup Supabase Database**:
```bash
# Run the schema SQL in your Supabase SQL editor
# File: backend/supabase_schema.sql
```

#### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Create .env.local file
cp .env.example .env.local
```

**Configure Frontend Environment Variables** (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Running Locally

#### Start Backend Server
```bash
cd backend
python -m app.main
```
The backend will run on `http://localhost:8000`

#### Start Frontend Development Server
```bash
cd frontend
npm run dev
```
The frontend will run on `http://localhost:3000`

Visit `http://localhost:3000` in your browser to access QuizCraft AI!

## 📖 API Documentation

Once the backend is running, you can access:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Main API Endpoints

#### Authentication (`/api/v1/auth`)
- `POST /signup` - User registration
- `POST /login` - User login
- `POST /logout` - User logout

#### Users (`/api/v1/users`)
- `GET /me` - Get current user
- `PUT /me` - Update user profile
- `POST /onboard` - Complete onboarding

#### Lessons (`/api/v1/lessons`)
- `GET /` - List all lessons
- `POST /` - Create new lesson
- `GET /{lesson_id}` - Get lesson details
- `PUT /{lesson_id}` - Update lesson
- `DELETE /{lesson_id}` - Delete lesson

#### Generation (`/api/v1/generate`)
- `POST /questions` - Generate questions
- `POST /flashcards` - Generate flashcards
- `POST /notes` - Generate study notes

#### Quizzes (`/api/v1/quizzes`)
- `POST /start` - Start quiz attempt
- `POST /submit` - Submit quiz answers
- `GET /attempts/{lesson_id}` - Get quiz attempts

#### Flashcards (`/api/v1/flashcards`)
- `GET /{lesson_id}` - Get flashcards for lesson
- `POST /review` - Submit flashcard review

#### Chat (`/api/v1/chat`)
- `POST /` - Chat with documents (RAG)

#### Tutor (`/api/v1/tutor`)
- `POST /chat` - Chat with AI tutor
- `GET /profile` - Get learning profile

#### Upload (`/api/v1/upload`)
- `POST /file` - Upload document

## 🏗 Project Structure

```
quizcraft-ai/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API routes
│   │   │   └── v1/
│   │   │       ├── routes/ # Route handlers
│   │   │       │   ├── auth.py
│   │   │       │   ├── users.py
│   │   │       │   ├── lessons.py
│   │   │       │   ├── generation.py
│   │   │       │   ├── quizzes.py
│   │   │       │   ├── flashcards.py
│   │   │       │   ├── folders.py
│   │   │       │   ├── chat.py
│   │   │       │   ├── tutor.py
│   │   │       │   └── upload.py
│   │   │       └── dependencies.py
│   │   ├── core/           # Core configuration
│   │   │   ├── config.py
│   │   │   ├── logging.py
│   │   │   └── exceptions.py
│   │   ├── database/       # Database setup
│   │   ├── models/         # Database models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── repositories/   # Data access layer
│   │   ├── services/       # Business logic
│   │   │   ├── llm/       # LLM services
│   │   │   ├── rag/       # RAG services
│   │   │   ├── personalization/ # Adaptive learning
│   │   │   ├── auth/      # Authentication
│   │   │   ├── content/   # Content processing
│   │   │   └── personal_tutor.py
│   │   ├── utils/         # Utility functions
│   │   └── main.py        # Application entry point
│   ├── requirements/      # Python dependencies
│   │   ├── base.txt
│   │   └── dev.txt
│   ├── Dockerfile
│   ├── supabase_schema.sql
│   └── pytest.ini
│
├── frontend/              # Next.js frontend
│   ├── src/
│   │   ├── app/          # App router pages
│   │   │   ├── (auth)/  # Auth pages
│   │   │   │   ├── login/
│   │   │   │   ├── signup/
│   │   │   │   └── onboarding/
│   │   │   ├── (dashboard)/ # Dashboard pages
│   │   │   │   ├── dashboard/
│   │   │   │   ├── lessons/
│   │   │   │   ├── lesson/
│   │   │   │   ├── generate/
│   │   │   │   ├── chat-to-pdf/
│   │   │   │   ├── tutor/
│   │   │   │   ├── settings/
│   │   │   │   └── search/
│   │   │   ├── layout.jsx
│   │   │   ├── page.jsx  # Landing page
│   │   │   └── globals.css
│   │   ├── components/   # Reusable components
│   │   │   └── ui/      # UI components
│   │   ├── lib/         # Utility functions
│   │   │   ├── supabase.js
│   │   │   └── api.js
│   │   ├── hooks/       # Custom React hooks
│   │   ├── store/       # Zustand stores
│   │   └── types/       # TypeScript types
│   ├── public/          # Static assets
│   ├── package.json
│   ├── next.config.mjs
│   ├── tailwind.config.js
│   └── Dockerfile
│
├── supabase/            # Supabase configuration
├── infrastructure/      # Infrastructure configs
├── DEPLOY.md           # Deployment guide
├── RAILWAY_DEPLOY.md   # Railway deployment
├── GITHUB_SETUP.md     # GitHub setup
└── README.md           # This file
```

## 🎓 Usage Guide

### 1. Sign Up and Onboarding
1. Create an account with your email
2. Complete the onboarding process:
   - Select your role (Learner or Educator)
   - Choose your interests
   - Set your grade level
   - Select subjects

### 2. Upload Study Materials
1. Navigate to "Generate" page
2. Upload PDF, DOCX, or TXT files
3. Or paste text directly
4. Click "Generate Lesson"

### 3. Generate Learning Materials
- **Quizzes**: Customize difficulty, question types, and number of questions
- **Flashcards**: Automatically generated from content
- **Study Notes**: AI-generated comprehensive notes

### 4. Take Quizzes
1. Select a lesson from your dashboard
2. Click "Start Quiz"
3. Answer questions
4. View results with explanations

### 5. Study with Flashcards
1. Open a lesson
2. Navigate to Flashcards tab
3. Review flashcards with spaced repetition
4. Rate your confidence level (0-5)

### 6. Chat with Documents
1. Go to "Chat to PDF" page
2. Upload a document
3. Ask questions about the content
4. Get AI-powered answers based on your documents

### 7. Personal AI Tutor
1. Navigate to "Tutor" page
2. Ask questions or explain concepts
3. The tutor remembers your learning history
4. Get personalized help tailored to your needs

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest
pytest --cov=app tests/  # With coverage
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 🚢 Deployment

### Live Demo

Experience QuizCraft AI in action:

- **Backend API**: [https://quizcraft-ai-production.up.railway.app](https://quizcraft-ai-production.up.railway.app/)
- **Frontend App**: [https://quizcraft-ai-frontend-production.up.railway.app](https://quizcraft-ai-frontend-production.up.railway.app/)

### 📹 Presentation Video

Watch our complete project walkthrough and demo:
- [View Presentation on Google Drive](https://drive.google.com/drive/folders/1k0w04_5ctaTFTXer7D9_Ie8dTbIAP6Mv?usp=sharing)

### Deploy Your Own Instance

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [FastAPI](https://fastapi.tiangolo.com/) - Python web framework
- [Supabase](https://supabase.com/) - Backend as a Service
- [Google Gemini](https://ai.google.dev/) - AI model
- [Groq](https://groq.com/) - Fast AI inference
- [Mem0](https://mem0.ai/) - AI memory layer
- [LangChain](https://www.langchain.com/) - LLM framework
- [ChromaDB](https://www.trychroma.com/) - Vector database
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Radix UI](https://www.radix-ui.com/) - UI components

## 📧 Contact & Support

For questions, issues, or suggestions:
- Open an issue on GitHub
- Email: saurabhguptavishal@gmail.com
