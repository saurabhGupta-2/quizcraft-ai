# Deployment Guide for QuizCraft AI

This guide covers how to deploy the QuizCraft AI application (Frontend + Backend) locally using Docker and to cloud platforms like Vercel and Render.

## Prerequisites

- [Docker](https://www.docker.com/products/docker-desktop/) installed
- [Git](https://git-scm.com/) installed
- Accounts for:
  - [Supabase](https://supabase.com/) (Database & Auth)
  - [Vercel](https://vercel.com/) (Frontend Hosting)
  - [Render](https://render.com/) or [Railway](https://railway.app/) (Backend Hosting)
  - LLM Provider (OpenRouter, Groq, or Google Gemini)

---

## 1. Environment Setup

Create a `.env` file in the project root directory. You can copy the template from `backend/env.example` and add frontend variables.

```bash
cp backend/env.example .env
```

Edit `.env` and fill in your keys:

```ini
# --- Backend Config ---
SECRET_KEY=your_secure_random_string
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_role_key

# LLM Configuration
LLM_PROVIDER=openrouter
LLM_API_KEY=your_api_key
LLM_MODEL=openrouter/auto

# --- Frontend Config ---
# For local docker deployment
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 2. Local Deployment (Docker Compose)

To run the entire stack locally with a single command:

1.  Ensure Docker is running.
2.  Run the following command in the project root:

```bash
docker-compose up --build
```

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8000/docs (API Documentation)

To stop: `Ctrl+C` or `docker-compose down`.

---

## 3. Cloud Deployment

### Step A: Backend (Render.com)

1.  Push your code to a GitHub repository.
2.  Log in to [Render](https://render.com/).
3.  Click **New +** -> **Web Service**.
4.  Connect your GitHub repository.
5.  **Settings**:
    - **Name**: `quizcraft-backend`
    - **Root Directory**: `backend`
    - **Runtime**: `Docker` (Render will detect the Dockerfile in `backend/`)
    - **Region**: Choose one close to you.
    - **Instance Type**: Free (or Starter).
6.  **Environment Variables**:
    - Add all variables from your `.env` file (excluding `NEXT_PUBLIC_API_URL`).
    - Make sure `PYTHON_VERSION` is not set (Docker handles it).
7.  Click **Create Web Service**.
8.  Wait for deployment. Copy the **Service URL** (e.g., `https://quizcraft-backend.onrender.com`).

### Step B: Frontend (Vercel)

1.  Log in to [Vercel](https://vercel.com/).
2.  Click **Add New...** -> **Project**.
3.  Import your GitHub repository.
4.  **Configure Project**:
    - **Root Directory**: Click `Edit` and select `frontend`.
    - **Framework Preset**: Next.js (should be auto-detected).
    - **Environment Variables**:
        - `NEXT_PUBLIC_API_URL`: Paste the **Backend Service URL** from Step A (e.g., `https://quizcraft-backend.onrender.com`).
        - Add any other public vars if needed.
5.  Click **Deploy**.

### Step C: Final Configuration

1.  **CORS**: Update `BACKEND_CORS_ORIGINS` in your Backend Environment Variables on Render to include your new Vercel domain (e.g., `["https://quizcraft.vercel.app"]`).
2.  **Supabase Auth**: Go to your Supabase Dashboard -> Authentication -> URL Configuration.
    - Add your Vercel URL to **Site URL** and **Redirect URLs**.

---

## Troubleshooting

- **Backend Build Fails**: Check logs on Render. Ensure `requirements/prod.txt` dependencies are compatible.
- **Frontend can't connect**: Check `NEXT_PUBLIC_API_URL` in Vercel settings. It must not have a trailing slash unless your code expects it (usually `https://domain.com` is best, and code appends `/api/v1`).
- **Database Connection**: Ensure Supabase keys are correct in the Backend Environment Variables.
