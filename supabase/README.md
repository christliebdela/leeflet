# Leeflet BYOD (Bring Your Own Database) Setup Guide

Leeflet uses a **Bring Your Own Database (BYOD)** architecture for real-time team collaboration.

Teams connect their own [Supabase](https://supabase.com) project, and teammates onboard with a single 1-click invite link.

---

## 🚀 Quick Setup (Under 3 Minutes)

### 1. Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and create an account (or log in).
2. Click **"New Project"**.
3. Choose an organization, project name (e.g. `leeflet-team`), and secure database password.
4. Select your nearest region and click **"Create New Project"**.

### 2. Run the Initial Schema Migration
1. In your Supabase dashboard, click the **SQL Editor** tab on the left navigation bar.
2. Click **"New query"**.
3. Open [`supabase/migrations/20260901_initial_schema.sql`](./migrations/20260901_initial_schema.sql) from this repository (or click **"Copy Schema SQL"** in Leeflet Settings), paste the contents into the SQL Editor.
4. Click **"Run"** (or `Ctrl+Enter`).
   - You will see a success message: `Success. No rows returned`.

### 3. Connect Leeflet
1. In your Supabase project dashboard, go to **Project Settings** (gear icon) -> **API**.
2. Find:
   - **Project URL**: (e.g. `https://xyzabcdef.supabase.co`)
   - **Project API Keys** -> **Publishable Key** (starts with `sb_publishable_...` or legacy `anon` key `ey...`)
3. In Leeflet Desktop:
   - Open **Settings** (press `S` or click Settings in sidebar).
   - Go to **"Team Sync"**.
   - Paste your **Project URL** and **Publishable Key**.
   - Click **"Test Connection"** to verify.
   - Click **"Save & Connect"**.

> ⚠️ **SECURITY NOTICE: Never use the Secret / service_role Key**
>
> Supabase provides two types of keys:
> - **Publishable Key (Client-Safe)**: Designed for client apps (like Leeflet desktop and web). Access is strictly restricted by PostgreSQL Row-Level Security (RLS) policies.
> - **Secret Key (Backend Only)**: Bypasses Row-Level Security and provides unrestricted root administrative access to your entire database. **Never** input or distribute a secret key in client apps.

### 4. Invite Your Team
1. In Leeflet Settings -> **Team Sync**:
2. Click **"Copy Link"** under **1-Click Teammate Onboarding**.
3. Send the invite link to teammates. When they open it, their Leeflet client automatically configures the database connection with 0 manual typing!
