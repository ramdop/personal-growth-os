
# Personal Growth OS - Production Guide

You have built the "Personal Growth OS" in a simulated environment. This guide explains how to take this code, connect a real database, and deploy it to the live web.

## 1. Local Setup (The "Eject" Process)

To run this app outside the chat, you need a standard React environment.

1.  **Install Node.js**: Download and install from [nodejs.org](https://nodejs.org/).
2.  **Create a Vite Project**: Open your terminal/command prompt and run:
    ```bash
    npm create vite@latest personal-growth-os -- --template react-ts
    cd personal-growth-os
    npm install
    ```
3.  **Install Dependencies**: Run the following command to install the libraries we used:
    ```bash
    npm install lucide-react recharts @google/genai react-markdown clsx tailwind-merge
    ```
4.  **Copy Files**: 
    *   Replace `src/App.tsx`, `src/index.css` (with contents of style tag), and create the folders `src/components`, `src/views`, `src/services`, `src/types` with the files provided in the chat.
    *   Ensure Tailwind is set up (initialize with `npx tailwindcss init -p` and configure `tailwind.config.js`).

## 2. Choosing a Real Backend

Currently, `services/auth.ts` and `services/storage.ts` use `localStorage`. This means data is stuck on one device. To fix this, you need a cloud backend.

**Recommendation: Supabase (easiest for this app)**
It provides Authentication (Google Login) and a Database (PostgreSQL) out of the box.

1.  Go to [Supabase.com](https://supabase.com) and create a free project.
2.  Get your `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
3.  Run this SQL query in your Supabase SQL Editor to create the tables:

```sql
-- Create a table for user data blobs
create table user_data (
  user_id uuid references auth.users not null primary key,
  data jsonb default '{}'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Set up Row Level Security (RLS) so users can only see their own data
alter table user_data enable row level security;

create policy "Users can view their own data" on user_data
  for select using (auth.uid() = user_id);

create policy "Users can update their own data" on user_data
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own data" on user_data
  for update using (auth.uid() = user_id);
```

## 3. Connecting the Backend

1.  Install the Supabase client: `npm install @supabase/supabase-js`
2.  Open `src/services/auth.ts` and `src/services/storage.ts`.
3.  I have provided **commented-out code blocks** in those files labeled `PRODUCTION IMPLEMENTATION`.
4.  Uncomment those blocks and delete the `MOCK` implementation.
5.  Create a `.env` file in your project root:
    ```
    VITE_SUPABASE_URL=your_url_here
    VITE_SUPABASE_ANON_KEY=your_key_here
    VITE_GOOGLE_API_KEY=your_gemini_key_here
    ```

## 4. Deploying to the Web

1.  Push your code to a GitHub repository.
2.  Go to [Vercel.com](https://vercel.com) or [Netlify.com](https://netlify.com).
3.  "Import Project" and select your GitHub repo.
4.  Add your Environment Variables (from step 3.5) in the Vercel/Netlify dashboard.
5.  Click **Deploy**.

You now have a production-grade Personal Growth OS accessible from any device.
