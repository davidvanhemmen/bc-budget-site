# BC Budget AI Agent

Interactive dashboard and AI chat for BC provincial budget data (2016/17–2028/29).

---

## 🚀 Deploy to GitHub Pages (step-by-step)

### Prerequisites
- A [GitHub account](https://github.com)
- [Node.js](https://nodejs.org) v18+ — check with `node -v`
- [Git](https://git-scm.com) — check with `git --version`

---

### Step 1 — Create a GitHub repository

1. Go to https://github.com/new
2. Name your repo (e.g. `bc-budget-agent`)
3. Set it to **Public** (required for free GitHub Pages)
4. Do NOT initialize with README — click **Create repository**

---

### Step 2 — Update the base path in vite.config.js

Open `vite.config.js` and change `base` to match your **exact repo name**:

```js
base: '/your-repo-name/',   // e.g. '/bc-budget-agent/'
```

> ⚠️ Must match your repo name exactly or styles will break.

---

### Step 3 — Push the code to GitHub

Open a terminal in this folder:

```bash
npm install
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/davidvanhemmen/bc-budget-site.git
git push -u origin main
```

---

### Step 4 — Enable GitHub Pages

1. Go to your repo → **Settings** → **Pages**
2. Under **Source**, select **GitHub Actions**
3. Done — the workflow triggers automatically on every push

---

### Step 5 — Your site is live!

After ~2 minutes, check the **Actions** tab for a green ✅, then visit:

```
https://davidvanhemmen.github.io/bc-budget-site/
```

---

## 🔄 Updating the site

```bash
git add .
git commit -m "Update"
git push
```

The site redeploys automatically.

---

## 🛠 Run locally

```bash
npm install
npm run dev
# Open http://localhost:5173
```
