# Revive AI - Business in a Box

An AI-powered lead reactivation platform that automates outbound calls to past customers, books appointments directly onto your Google Calendar, and tracks revenue recovery—all through a simple, beautiful dashboard.

---

## 🚀 Easiest Way to Get Started

**The easiest way to use Revive AI is the hosted Cloud Dashboard:**

👉 **[https://revive-ai-three.vercel.app](https://revive-ai-three.vercel.app)**

Simply create an account, connect your Vapi.ai phone number, and start reactivating leads in minutes. No installation required.

The source code below is provided for self-hosting if you prefer to run your own instance.

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| **One-Click Vapi Auto-Provisioning** | Paste your Vapi API key and we automatically create your AI voice assistant, configure the voice, and link it to your phone number |
| **Human-Like AI Conversations** | Natural, conversational AI that adapts to each lead's specific interest and handles objections gracefully |
| **Google Calendar Integration** | AI books appointments directly onto your calendar with real-time availability checking |
| **Revenue Tracking Dashboard** | Track calls made, appointments booked, and revenue recovered at a glance |
| **Multi-Tenant Architecture** | Each user has their own isolated data with Supabase Row Level Security (RLS) |
| **CSV Lead Import** | Bulk upload leads via CSV with automatic deduplication |

---

## 🛠️ Local Installation Guide

### Prerequisites

- Node.js 18+ 
- npm or yarn
- A Supabase project (free tier works)
- A Google Cloud service account (for calendar access)

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/aaronab3r/revive-ai.git
cd revive-ai

# 2. Install dependencies
npm install

# 3. Copy environment template
cp .env.example .env.local

# 4. Fill in your environment variables (see below)

# 5. Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🔐 Environment Variables

Create a `.env.local` file in the root directory with the following variables:

| Variable | Description | Where to Get It |
|----------|-------------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) | Supabase Dashboard → Settings → API |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Google Cloud service account credentials (as a single-line JSON string) | Google Cloud Console → IAM → Service Accounts → Create Key |

### Example `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhjsnjxi........
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJ.......
GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"...","private_key":"..."}'
```
## GOOGLE_SERVICE_ACCOUNT_JSON should go all the way from "type" to "universe_domain"


> **Note:** Vapi API keys are configured per-user through the dashboard Settings page, not as environment variables.

---

## 🗄️ Database Setup

Revive AI uses Supabase (PostgreSQL) for data storage with Row Level Security enabled.

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to initialize (~2 minutes)

### 2. Run the Database Schema

1. In your Supabase Dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy and paste the contents of [`/supabase/schema.sql`](supabase/schema.sql)
4. Click **Run** to execute

This creates:
- **`settings`** table - Stores per-user configuration (Vapi keys, business details, calendar settings)
- **`leads`** table - Stores customer leads with call status and history
- **RLS Policies** - Ensures users can only access their own data
- **Service Role Policies** - Allows server-side operations via webhook

### 3. Enable Email Auth

1. Go to Supabase Dashboard → Authentication → Providers
2. Ensure Email provider is enabled
3. (Optional) Configure email templates for a branded experience

---

## 📁 Project Structure

```
revive-ai/
├── app/
│   ├── actions/          # Server actions (settings, leads, calls, calendar)
│   ├── api/              # API routes (Vapi webhook)
│   ├── dashboard/        # Main dashboard pages
│   ├── login/            # Authentication pages
│   └── signup/
├── components/
│   ├── dashboard/        # Dashboard UI components
│   ├── landing/          # Landing page components
│   └── ui/               # Reusable UI primitives
├── lib/
│   └── supabase/         # Supabase client configuration
└── public/               # Static assets
```

---

## 🔒 Security Features

- **Row Level Security (RLS)** - All database queries are scoped to the authenticated user
- **Service Role Key** - Used only server-side for admin operations
- **No Hardcoded Secrets** - All sensitive keys stored in environment variables or user database records
- **Input Validation** - Server-side validation on all form submissions

---

## 📄 License

MIT License - feel free to use this for your own projects.

---

Built using Next.js 14, Supabase, Vapi.ai, and Tailwind CSS.
