# Git & Deployment Guide

This project is linked to GitHub and Vercel. This means you have a continuous integration pipeline: **Pushing code automatically updates the live site.**

---

## 1. The Daily Workflow (Loop)

Whenever you want to save your progress or update the live site, run these three commands in your terminal:

### Step 1: Stage Changes
This tells Git to "look" at all the files you changed.
```bash
git add .
```

### Step 2: Commit (Save)
This saves a snapshot of your code with a message explaining what changed.
```bash
git commit -m "Brief description of changes"
```
*Example: `git commit -m "Update homepage text"`*

### Step 3: Push (Publish)
This sends your snapshot to GitHub. **Vercel watches this.** As soon as the push finishes, Vercel starts building.
```bash
git push
```

---

## 2. Vercel Deployment

*   **Live URL:** (Check your Vercel Dashboard for the link, e.g., `personal-growth-os.vercel.app`)
*   **Automatic Builds:** You do **not** need to drag-and-drop folders anymore. Just `git push`.
*   **Build Time:** Usually takes 30–60 seconds.

### Troubleshooting Vercel
If the live site is failing but your local version works:
1.  Check the **Vercel Logs** (Dashboard > Deployments > Click the failed build).
2.  Ensure you added your **Environment Variables** (see below).

---

## 3. Important Notes

### Environment Variables (.env)
*   **Local:** Keys in `.env.local` work on your computer.
*   **Production:** Vercel cannot see your `.env.local` file (it is ignored for security).
*   **Action:** If you add a new key (like `Supabase` or `Google API`), you MUST paste it into the **Vercel Project Settings > Environment Variables** tab manually.

### Static Assets (Images)
*   All static images (like `background.png`) must live in the `public/` folder.
*   Refer to them in code as if the `public/` folder is the root:
    *   **Correct:** `src="background.png"`
    *   **Incorrect:** `src="public/background.png"`

### Node Modules
*   Never commit the `node_modules` folder (it is huge and generated automatically).
*   The `.gitignore` file handles this for you.

---

## 4. Cheat Sheet

| Command | Action |
| :--- | :--- |
| `npm run dev` | Start the app locally (port 5173). |
| `git status` | See which files have changed. |
| `git add .` | Stage all changes. |
| `git commit -m "msg"` | Save changes. |
| `git push` | Upload to GitHub & Trigger Vercel. |
| `git pull` | Download changes from GitHub (if you edited there). |
