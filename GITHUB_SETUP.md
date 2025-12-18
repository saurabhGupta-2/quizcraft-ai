# Push QuizCraft AI to GitHub - Step by Step Guide

Follow these steps to push your project to GitHub.

---

## Step 1: Create GitHub Repository

1. **Go to [GitHub](https://github.com) and log in**

2. **Click the "+" icon** in the top right → **"New repository"**

3. **Repository Settings:**
   - **Repository name**: `quizcraft-ai` (or your preferred name)
   - **Description**: "AI-powered quiz generation platform with FastAPI backend and Next.js frontend"
   - **Visibility**: Choose **Public** or **Private**
   - ⚠️ **DO NOT** initialize with README, .gitignore, or license (we already have these)

4. **Click "Create repository"**

5. **Copy the repository URL** (you'll need this in Step 3)
   - Example: `https://github.com/yourusername/quizcraft-ai.git`

---

## Step 2: Verify Your Local Setup

Open your terminal in the project directory and run:

```bash
# Check Git is initialized
git status

# Check your Git configuration
git config user.name
git config user.email
```

If name/email are not set, configure them:

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

---

## Step 3: Stage and Commit Your Code

Run these commands in your project root directory:

```bash
# Add all files (respects .gitignore)
git add .

# Check what will be committed
git status

# Commit with a message
git commit -m "Initial commit: QuizCraft AI with Railway deployment config"
```

---

## Step 4: Connect to GitHub and Push

Replace `YOUR_GITHUB_URL` with the URL you copied in Step 1:

```bash
# Add GitHub as remote origin
git remote add origin YOUR_GITHUB_URL

# Example:
# git remote add origin https://github.com/yourusername/quizcraft-ai.git

# Verify remote was added
git remote -v

# Push to GitHub (main branch)
git push -u origin main
```

If you're on a different branch (like `master`), use:
```bash
git branch -M main
git push -u origin main
```

---

## Step 5: Verify on GitHub

1. **Refresh your GitHub repository page**
2. **You should see all your files** (except those in .gitignore)
3. **Check that sensitive files are NOT there:**
   - ❌ `.env` files
   - ❌ `node_modules/`
   - ❌ `venv/`
   - ❌ `backend/data/chromadb/`

---

## Troubleshooting

### "Permission denied" or Authentication Error

**Option 1: Use Personal Access Token (Recommended)**
1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with `repo` scope
3. Use token as password when pushing

**Option 2: Use SSH**
```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your.email@example.com"

# Add to SSH agent
ssh-add ~/.ssh/id_ed25519

# Copy public key and add to GitHub
cat ~/.ssh/id_ed25519.pub
```

Then use SSH URL: `git@github.com:yourusername/quizcraft-ai.git`

### "Remote origin already exists"

```bash
# Remove existing remote
git remote remove origin

# Add the correct one
git remote add origin YOUR_GITHUB_URL
```

### Large files error

If you accidentally committed large files:
```bash
# Remove from Git but keep locally
git rm --cached path/to/large/file

# Commit the removal
git commit -m "Remove large file"
```

---

## What Gets Pushed (and What Doesn't)

### ✅ **Will be pushed:**
- All source code (`frontend/`, `backend/`)
- Configuration files (Dockerfiles, `railway.json`, etc.)
- Documentation (`README.md`, `DEPLOY.md`, etc.)
- `.env.example` files (templates)
- `.gitignore` file

### ❌ **Will NOT be pushed (excluded by .gitignore):**
- `.env` files (your actual secrets)
- `node_modules/` (frontend dependencies)
- `venv/` (Python virtual environment)
- `backend/data/chromadb/` (local database)
- Build outputs (`.next/`, `dist/`)
- Logs (`logs/`, `*.log`)

---

## After Pushing to GitHub

You're now ready to deploy to Railway! Follow the **RAILWAY_DEPLOY.md** guide.

Quick next steps:
1. ✅ Code is on GitHub
2. 🚀 Deploy backend to Railway
3. 🚀 Deploy frontend to Railway
4. 🎉 Your app is live!

---

## Future Updates

When you make changes to your code:

```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "Add new feature: quiz analytics"

# Push to GitHub
git push
```

Railway will automatically redeploy when you push to GitHub!

---

## Need Help?

- **Git Documentation**: https://git-scm.com/doc
- **GitHub Guides**: https://guides.github.com/
- **Railway Docs**: https://docs.railway.app/

---

**Ready? Start with Step 1! 🚀**
