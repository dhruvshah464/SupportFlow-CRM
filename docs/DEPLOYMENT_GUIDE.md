# Deployment Guide

This guide walks you through deploying SupportFlow CRM from zero to a live, publicly accessible application. The backend goes on **Render** (free tier) and the frontend goes on **Vercel** (free tier).

**Total time:** ~20–30 minutes

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Overview](#overview)
- [Step 1: Deploy the Database on Render](#step-1-deploy-the-database-on-render)
- [Step 2: Deploy the Backend on Render](#step-2-deploy-the-backend-on-render)
- [Step 3: Deploy the Frontend on Vercel](#step-3-deploy-the-frontend-on-vercel)
- [Step 4: Connect Frontend → Backend (CORS)](#step-4-connect-frontend--backend-cors)
- [Step 5: Verify the Deployment](#step-5-verify-the-deployment)
- [Alternative Deployments (Docker, VPS, Heroku)](#alternative-deployments-docker-vps-heroku)
- [Custom Domain Setup](#custom-domain-setup)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, make sure you have:

- [ ] A **GitHub account** — both Render and Vercel connect via GitHub
- [ ] The SupportFlow CRM repository pushed to your GitHub account
- [ ] A **Render account** — sign up at [render.com](https://render.com) (free, no credit card required)
- [ ] A **Vercel account** — sign up at [vercel.com](https://vercel.com) (free, no credit card required)

---

## Overview

```
GitHub repo
     │
     ├── /backend  ──────────────────► Render Web Service
     │              (FastAPI)              │
     │                                    │ reads from
     │              Render PostgreSQL ◄───┘
     │
     └── /frontend ──────────────────► Vercel
                    (React SPA)           │
                                          │ VITE_API_URL points to Render
                                          └────────────────────────────►
```

The three pieces:
1. **Render PostgreSQL** — the database (created first, provides `DATABASE_URL`)
2. **Render Web Service** — the FastAPI backend (connects to the database)
3. **Vercel** — the React frontend (points to the backend via `VITE_API_URL`)

> **Render free tier note:** Free web services sleep after 15 minutes of inactivity. The first request after sleep takes ~30 seconds. This is completely normal — subsequent requests are fast.

---

## Step 1: Deploy the Database on Render

1. Log into [render.com](https://render.com)
2. Click **New → PostgreSQL**
3. Configure:
   - **Name:** `supportflow-db`
   - **Database:** `supportflow`
   - **User:** `supportflow`
   - **Region:** Oregon (US West)
   - **Plan:** Free
4. Click **Create Database**
5. Wait ~2 minutes for it to be ready
6. On the database detail page, find **"Internal Database URL"** and copy it — you'll need it in the next step

The URL looks like:
```
postgresql://supportflow:password@dpg-xxx.oregon-postgres.render.com/supportflow
```

---

## Step 2: Deploy the Backend on Render

1. In Render, click **New → Web Service**
2. Connect your GitHub account if prompted, then select your repo
3. Configure:

   | Setting | Value |
   |---------|-------|
   | **Name** | `supportflow-api` |
   | **Root Directory** | `backend` |
   | **Runtime** | Python |
   | **Build Command** | `pip install -r requirements.txt` |
   | **Start Command** | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
   | **Plan** | Free |
   | **Region** | Oregon (same as the database) |

4. Scroll down to **Environment Variables** and add:

   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | Paste the Internal Database URL from Step 1 |
   | `JWT_SECRET` | Generate with: `python3 -c "import secrets; print(secrets.token_hex(32))"` |
   | `FRONTEND_URL` | `http://localhost:5173` (temporary — you'll update this after Step 3) |

5. Click **Create Web Service**

Render will:
- Clone your repo
- `cd backend && pip install -r requirements.txt`
- Run `uvicorn main:app --host 0.0.0.0 --port $PORT`

The first deploy takes 3–5 minutes. When it turns green, you'll have a URL like:
```
https://supportflow-api.onrender.com
```

**Test it:** Visit `https://supportflow-api.onrender.com/health` → you should see `{"status":"ok"}`

**Check the API docs:** Visit `https://supportflow-api.onrender.com/docs` — the FastAPI Swagger UI should load.

---

## Step 3: Deploy the Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New → Project**
2. Click **Import Git Repository** and select your repo
3. Configure:

   | Setting | Value |
   |---------|-------|
   | **Framework Preset** | Vite |
   | **Root Directory** | `frontend` |
   | **Build Command** | `npm run build` |
   | **Output Directory** | `dist` |

4. Under **Environment Variables**, add:

   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://supportflow-api.onrender.com` (your Render URL from Step 2) |

5. Click **Deploy**

Vercel builds and deploys in ~2 minutes. You'll get a URL like:
```
https://your-app.vercel.app
```

### Why `vercel.json` is needed

The `frontend/vercel.json` file contains:
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

Without it, navigating directly to `/login` or `/dashboard` after a page refresh returns a 404 from Vercel. This rewrite rule sends all paths to `index.html`, letting React Router handle the routing client-side.

---

## Step 4: Connect Frontend → Backend (CORS)

Now that you have the Vercel URL, update the CORS setting on the backend:

1. Go to Render → **supportflow-api → Environment**
2. Update `FRONTEND_URL` from the temporary value to your real Vercel URL:
   ```
   FRONTEND_URL=https://your-app.vercel.app
   ```
3. Click **Save Changes** — Render redeploys automatically

> **Multiple domains?** You can list multiple frontend URLs separated by commas:
> `FRONTEND_URL=https://your-app.vercel.app,https://your-custom-domain.com`

---

## Step 5: Verify the Deployment

Work through this checklist to confirm everything works end-to-end:

**Backend:**
- [ ] `https://supportflow-api.onrender.com/health` returns `{"status":"ok"}`
- [ ] `https://supportflow-api.onrender.com/docs` shows Swagger UI

**Frontend:**
- [ ] `https://your-app.vercel.app` loads the landing page
- [ ] Navigate to `/login` and refresh the page — doesn't show a 404

**Auth flow:**
- [ ] Sign up with a new email/password — redirects to dashboard
- [ ] Log out — goes back to landing page
- [ ] Log in — dashboard loads with the previously created user's data

**Ticket flow:**
- [ ] Create a ticket — appears in the list
- [ ] Add a note — saves and appears in the notes panel
- [ ] Filter tickets by status — table updates correctly
- [ ] Delete a ticket — removed from list

---

## Alternative Deployments (Docker, VPS, Heroku)

For teams that prefer self-hosting or alternative cloud providers, SupportFlow CRM is designed to be environment-agnostic.

### Option A: Docker (Self-Hosted / Enterprise)

Docker is the recommended approach for deploying to AWS EC2, DigitalOcean, or any Linux VPS.

1. **Backend Dockerfile (`backend/Dockerfile`)**
   ```dockerfile
   FROM python:3.11-slim
   WORKDIR /app
   COPY requirements.txt .
   RUN pip install --no-cache-dir -r requirements.txt
   COPY . .
   EXPOSE 8000
   CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
   ```

2. **Frontend Dockerfile (`frontend/Dockerfile`)**
   *(Note: You will need a basic `nginx.conf` to handle SPA routing)*
   ```dockerfile
   FROM node:18-alpine AS builder
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   # Set the API URL for the build
   ENV VITE_API_URL=https://api.yourdomain.com
   RUN npm run build

   FROM nginx:alpine
   COPY --from=builder /app/dist /usr/share/nginx/html
   EXPOSE 80
   CMD ["nginx", "-g", "daemon off;"]
   ```

3. **Deploy with Docker Compose**
   Create a `docker-compose.yml` in the root:
   ```yaml
   version: '3.8'
   services:
     api:
       build: ./backend
       ports:
         - "8000:8000"
       environment:
         - JWT_SECRET=your_secure_secret
         - DATABASE_URL=sqlite:///./support_crm.db
         - FRONTEND_URL=https://supportflow.yourdomain.com

     web:
       build: ./frontend
       ports:
         - "80:80"
   ```
   Run `docker-compose up -d` to launch the entire stack.

### Option B: Traditional Linux VPS (Ubuntu)

If you prefer a bare-metal or traditional VPS approach without Docker:

1. **Backend (Systemd + Uvicorn)**
   - Clone the repo to `/var/www/supportflow`
   - Create a virtual environment and install requirements
   - Set up a systemd service file (`/etc/systemd/system/supportflow-api.service`) to run Uvicorn.
   - Example ExecStart: `/var/www/supportflow/backend/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000`

2. **Frontend (Nginx Build)**
   - Run `npm install` and `npm run build` in the `frontend/` directory.
   - Copy the contents of `frontend/dist/` to `/var/www/html/supportflow`.

3. **Nginx Reverse Proxy**
   - Configure Nginx to serve the static frontend files on port 80/443.
   - Configure a `location /api/` block to `proxy_pass http://127.0.0.1:8000;`.
   - Use Certbot (Let's Encrypt) to provision SSL certificates.

### Option C: Heroku

1. **Backend:**
   - The backend already contains a `Procfile` (`web: uvicorn main:app --host 0.0.0.0 --port $PORT`).
   - Create a new Heroku app: `heroku create supportflow-api`
   - Set buildpack: `heroku buildpacks:set heroku/python`
   - Set environment variables: `heroku config:set JWT_SECRET=...`
   - Deploy: `git subtree push --prefix backend heroku main`

2. **Frontend:**
   - You can deploy the frontend to Heroku using the `heroku/nodejs` buildpack and a static server like `serve`, or keep the frontend on Vercel while using Heroku for the backend.

---

## Custom Domain Setup

### Vercel custom domain

1. Vercel project → **Settings → Domains → Add**
2. Enter your domain (e.g., `app.yourdomain.com`)
3. Add the DNS record at your registrar (A record or CNAME — Vercel shows the exact values)
4. TLS is provisioned automatically

### Render custom domain

1. Render service → **Settings → Custom Domains → Add Custom Domain**
2. Enter your subdomain (e.g., `api.yourdomain.com`)
3. Add the CNAME at your registrar pointing to your Render service URL
4. TLS is provisioned automatically

After adding custom domains, update:
- `FRONTEND_URL` in Render → your custom domain
- `VITE_API_URL` in Vercel → your Render custom domain
- Redeploy both (or let Render auto-redeploy on env var change)

---

## Troubleshooting

### "Failed to fetch" or CORS error in the browser console

**Cause:** Mismatch between frontend URL and the `FRONTEND_URL` env var on the backend.

**Fix:**
1. Open browser DevTools → Network tab → click the failing request → check the URL
2. Confirm `VITE_API_URL` in Vercel matches your Render service URL exactly (no trailing slash)
3. Confirm `FRONTEND_URL` in Render matches your Vercel URL exactly (no trailing slash, no `www` discrepancy)
4. After fixing, trigger a redeploy on Render and Vercel

### Blank page on Vercel after visiting `/login` directly

**Cause:** `vercel.json` is missing or not being picked up.

**Fix:**
- Confirm `frontend/vercel.json` exists and is committed to your repo
- Contents must be: `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`
- Trigger a new Vercel deployment

### Render build fails

**Fix:**
1. Render → your service → **Logs** tab → look at the build output
2. Most common causes:
   - Wrong **Root Directory** — must be `backend`
   - Python version mismatch — Render uses Python 3.11 by default; add `runtime.txt` with `python-3.11.0` if needed
   - Missing package — check `requirements.txt` is in the `backend/` directory

### "First request is slow" / 30-second delay

**Cause:** Render free services spin down after 15 min of inactivity.

**This is expected behavior.** Options:
- Accept the cold-start delay (fine for demos and assessments)
- Upgrade to Render's Starter plan ($7/month) for always-on services
- Use an external uptime monitor (UptimeRobot free tier) to ping `/health` every 14 minutes

### Database changes don't apply

The app calls `Base.metadata.create_all()` on every startup — new tables are created automatically. Existing tables are not modified.

If you change a model column type or add a NOT NULL column to an existing table, you need to either:
- Drop and recreate the database (losing all data), or
- Write a migration (use Alembic for SQLAlchemy migrations)

### "401 Unauthorized" on all requests after redeployment

**Cause:** `JWT_SECRET` changed — all existing tokens are now invalid.

**Fix:** Users just need to log in again. Tokens signed with the old key are rejected; new tokens are issued with the new key.
