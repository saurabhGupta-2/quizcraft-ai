# Railway Deployment Guide - QuizCraft AI

This guide covers deploying both the frontend and backend of QuizCraft AI to Railway.app.

## Prerequisites

- [Railway.app](https://railway.app/) account (sign up with GitHub)
- GitHub repository with your code pushed
- Supabase account with database set up
- LLM API key (OpenRouter, Groq, or Google Gemini)

---

## Step 1: Prepare Your Repository

1. **Ensure all code is committed and pushed to GitHub:**
   ```bash
   git add .
   git commit -m "Prepare for Railway deployment"
   git push origin main
   ```

2. **Verify configuration files exist:**
   - ✅ `backend/railway.json`
   - ✅ `backend/nixpacks.toml`
   - ✅ `backend/Dockerfile`
   - ✅ `frontend/railway.json`
   - ✅ `frontend/Dockerfile`

---

## Step 2: Deploy Backend to Railway

1. **Go to [Railway.app](https://railway.app/) and log in**

2. **Create a New Project:**
   - Click **"New Project"**
   - Select **"Deploy from GitHub repo"**
   - Choose your `quizcraft-ai` repository
   - Railway will detect it's a monorepo

3. **Configure Backend Service:**
   - Click **"Add a service"** → **"GitHub Repo"**
   - Select your repository
   - **Root Directory**: Set to `backend`
   - **Service Name**: `quizcraft-backend`

4. **Add Environment Variables:**
   Click on the backend service → **Variables** tab → Add all these:

   ```env
   # Backend Configuration
   SECRET_KEY=your_secure_random_string_here
   DEBUG=False
   
   # Supabase
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your_anon_key
   SUPABASE_SERVICE_KEY=your_service_role_key
   
   # LLM Configuration
   LLM_PROVIDER=openrouter
   LLM_API_KEY=your_llm_api_key
   LLM_MODEL=openrouter/auto
   
   # Optional: CORS (will be updated after frontend deployment)
   BACKEND_CORS_ORIGINS=["*"]
   ```

5. **Deploy:**
   - Railway will automatically build and deploy using the Dockerfile
   - Wait for deployment to complete (check logs)
   - Copy your backend URL (e.g., `https://quizcraft-backend.up.railway.app`)

---

## Step 3: Deploy Frontend to Railway

1. **In the same Railway project, add another service:**
   - Click **"New"** → **"GitHub Repo"**
   - Select your repository again
   - **Root Directory**: Set to `frontend`
   - **Service Name**: `quizcraft-frontend`

2. **Add Environment Variables:**
   Click on the frontend service → **Variables** tab:

   ```env
   # Backend API URL (use the URL from Step 2)
   NEXT_PUBLIC_API_URL=https://quizcraft-backend.up.railway.app
   
   # Supabase (for client-side auth)
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

3. **Deploy:**
   - Railway will build using the Dockerfile
   - Wait for deployment to complete
   - Copy your frontend URL (e.g., `https://quizcraft-frontend.up.railway.app`)

---

## Step 4: Update CORS Configuration

1. **Go back to your backend service on Railway**

2. **Update the `BACKEND_CORS_ORIGINS` variable:**
   ```env
   BACKEND_CORS_ORIGINS=["https://quizcraft-frontend.up.railway.app"]
   ```
   Replace with your actual frontend URL

3. **Redeploy backend** (Railway will auto-redeploy on variable change)

---

## Step 5: Configure Supabase

1. **Go to your Supabase Dashboard**

2. **Navigate to Authentication → URL Configuration**

3. **Add your Railway frontend URL:**
   - **Site URL**: `https://quizcraft-frontend.up.railway.app`
   - **Redirect URLs**: Add `https://quizcraft-frontend.up.railway.app/**`

---

## Step 6: Test Your Deployment

1. **Visit your frontend URL**
2. **Test user registration/login**
3. **Try creating a quiz**
4. **Check backend logs** on Railway if issues occur

---

## Railway Features & Tips

### Automatic Deployments
- Railway auto-deploys on every git push to your main branch
- You can disable this in Settings → Deployments

### Custom Domains
- Go to service → Settings → Domains
- Add your custom domain (e.g., `quizcraft.yourdomain.com`)

### View Logs
- Click on service → Deployments → Select deployment → View logs
- Real-time logs help debug issues

### Persistent Storage (for ChromaDB)
- Railway provides persistent volumes
- Your ChromaDB data in `/app/data/chromadb` will persist across deployments

### Pricing
- **Free Trial**: $5 credit (no credit card required)
- **Hobby Plan**: $5/month for both services
- **Usage-based**: Pay only for what you use

### Monitoring
- Railway provides metrics for CPU, Memory, and Network usage
- Access via service → Metrics tab

---

## Troubleshooting

### Backend Build Fails
- **Check logs** in Railway dashboard
- Verify `requirements/prod.txt` has all dependencies
- Ensure Dockerfile is in `backend/` directory

### Frontend Build Fails
- Check if `NEXT_PUBLIC_API_URL` is set correctly
- Verify Node.js version compatibility (using Node 18)
- Check build logs for missing dependencies

### Database Connection Issues
- Verify Supabase URL and keys are correct
- Check if Supabase project is active
- Test connection from Railway logs

### CORS Errors
- Ensure `BACKEND_CORS_ORIGINS` includes your frontend URL
- No trailing slashes in URLs
- Redeploy backend after changing CORS settings

### ChromaDB Errors
- Ensure `/app/data/chromadb` directory exists (Dockerfile creates it)
- Check if persistent storage is enabled on Railway

### LLM API Errors
- Verify API key is correct
- Check API rate limits
- Ensure `LLM_PROVIDER` and `LLM_MODEL` are compatible

---

## Environment Variables Reference

### Backend Variables (Required)
| Variable | Description | Example |
|----------|-------------|---------|
| `SECRET_KEY` | Django/FastAPI secret key | Random 50+ char string |
| `SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_KEY` | Supabase anon key | `eyJhbG...` |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | `eyJhbG...` |
| `LLM_PROVIDER` | LLM provider name | `openrouter`, `groq`, `gemini` |
| `LLM_API_KEY` | LLM API key | Your API key |
| `LLM_MODEL` | Model identifier | `openrouter/auto` |

### Frontend Variables (Required)
| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `https://backend.railway.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | `eyJhbG...` |

---

## Updating Your Deployment

1. **Make code changes locally**
2. **Commit and push to GitHub:**
   ```bash
   git add .
   git commit -m "Update feature"
   git push origin main
   ```
3. **Railway automatically deploys** the changes
4. **Monitor deployment** in Railway dashboard

---

## Rollback to Previous Version

1. Go to service → **Deployments**
2. Find the working deployment
3. Click **"..."** → **"Redeploy"**

---

## Cost Estimation

**Free Trial**: $5 credit
- Backend: ~$3-4/month (depending on usage)
- Frontend: ~$1-2/month
- **Total**: ~$5/month for both services

**Tips to reduce costs:**
- Use sleep mode for non-production environments
- Optimize Docker images (multi-stage builds already in place)
- Monitor usage in Railway dashboard

---

## Next Steps

- ✅ Set up custom domain
- ✅ Configure environment-specific variables (staging/production)
- ✅ Set up monitoring and alerts
- ✅ Configure backup strategy for ChromaDB data
- ✅ Implement CI/CD pipeline (optional)

---

## Support

- **Railway Docs**: https://docs.railway.app/
- **Railway Discord**: https://discord.gg/railway
- **Project Issues**: Check Railway logs and GitHub issues

---

**Your QuizCraft AI is now live on Railway! 🚀**
