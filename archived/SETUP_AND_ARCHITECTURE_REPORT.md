# Production Architecture & Setup Report

**Project**: Tamil Nadu Highways Project (`highways_project`)  
**Date**: August 6, 2026  
**Repository**: [tnhighwaysdep/highways_project](https://github.com/tnhighwaysdep/highways_project)  
**Production Platform**: Vercel + Supabase Cloud PostgreSQL  

---

## 1. Executive Summary

This document serves as the complete technical reference for the production infrastructure, database setup, deployment pipeline, and team collaboration workflow for the Tamil Nadu Highways Management Application.

The project is built on a **Single Full-Stack Repository (Monorepo)** architecture, eliminating mock data, local storage workarounds, and cross-origin CORS errors.

---

## 2. Infrastructure & Tech Stack Overview

| Component | Technology | Hosted On / Provider |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js 16 (App Router + React 19) | Vercel Serverless Network |
| **Styling** | Tailwind CSS v4 | Integrated in Next.js build |
| **Language** | TypeScript v5 (Strict Type Safety) | Local & CI/CD Compilation |
| **Database Engine** | PostgreSQL (Managed Cloud DB) | Supabase Cloud (`ap-south-1`) |
| **Authentication & Storage** | Supabase Auth + RLS + Storage Buckets | Supabase Cloud |
| **Version Control & CI/CD** | Git / GitHub | Vercel Automated Deployments |

---

## 3. Database Architecture (Supabase PostgreSQL)

- **Cloud Instance**: `highways_project`
- **Project URL**: `https://painfnxuqzwtmowddogt.supabase.co`
- **Security**: Row-Level Security (RLS) enabled on all public schema tables.
- **Migration Tracking**: SQL migration scripts stored locally in `supabase/migrations/`.

### Active Schema (Profiles Table)
```sql
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  username TEXT UNIQUE,
  full_name TEXT
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone."
  ON public.profiles FOR SELECT USING ( true );
```

---

## 4. Team Git Branching & CI/CD Workflow

### Branching Hierarchy
- **`main` (Production Branch)**: Represents the live production application deployed to your primary Vercel domain.
- **Feature Branches (`mathir`, etc.)**: Individual branches for developers working on new features simultaneously.

### Continuous Integration / Continuous Deployment (CI/CD)
```
  Developer (Local Code) ──► git push origin <branch> ──► GitHub Repository
                                                             │
                                                             ▼
                                                    Vercel Build Engine
                                                             │
                                       ┌─────────────────────┴─────────────────────┐
                                       ▼                                           ▼
                            Push to `mathir` branch                      Merge PR into `main`
                            =======================                      ====================
                             Vercel Preview URL                          Live Production URL
                        (Test without breaking live)                    (Updates Live App!)
```

---

## 5. Security & Environment Configuration

Environment secrets are segregated between client-safe public keys and server-only connection strings:

```env
# Client-accessible (Safe for browser)
NEXT_PUBLIC_SUPABASE_URL="https://painfnxuqzwtmowddogt.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6..."

# Server-only (Vercel & Local .env.local)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.painfnxuqzwtmowddogt.supabase.co:5432/postgres"
```

---

## 6. How to Build & Deploy New Features

1. **Local Development**:
   ```bash
   npm run dev
   ```
2. **Database Changes**: Write new migration files in `supabase/migrations/` and apply via Supabase SQL Editor.
3. **Commit & Push**:
   ```bash
   git add .
   git commit -m "feat: add highways list page and query"
   git push origin <your-branch>
   ```
4. **Vercel Build**: Check the Vercel dashboard for instant preview links and deployment status.
