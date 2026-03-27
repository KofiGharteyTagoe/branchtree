# Setup Guide — Mendix Branch Visualizer

Follow these steps to get the Mendix Branch Visualizer running on your machine.

---

## Prerequisites

Before you begin, make sure you have installed:

1. **Node.js 18+** — [Download here](https://nodejs.org/)
   - Verify: `node --version` (should show v18 or higher)
2. **Git** — [Download here](https://git-scm.com/)
   - Verify: `git --version`
3. **A Mendix account** with access to at least one app on the Mendix Team Server

---

## Step 1: Clone the Repository

```bash
git clone https://github.com/KofiGharteyTagoe/branchtree.git
cd branchtree
```

---

## Step 2: Get Your Mendix Personal Access Token (PAT)

The PAT allows the tool to read your Mendix app's repository data.

1. Open your browser and go to:
   **https://user-settings.mendixcloud.com/link/developersettings**

2. Log in with your Mendix account

3. Scroll down to the **Personal Access Tokens** section

4. Click **"New Token"**

5. Fill in the form:
   - **Token Name**: `Branch Visualizer` (or any name you prefer)
   - **Scopes**: Check **`mx:modelrepository:repo:read`**

6. Click **"Create"**

7. **IMPORTANT**: Copy the token immediately! You will not be able to see it again after closing the dialog.

8. Keep this token safe — you'll need it in the next step.

> **Security Note**: This token grants read-only access to your Mendix repositories. Never share it or commit it to version control.

---

## Step 3: Get Your Mendix App ID

You need the App ID of the Mendix application you want to visualize.

### Option A: From the Mendix Portal URL

1. Open your app in the Mendix Portal (https://sprintr.home.mendix.com)
2. Look at the URL — it will look like:
   ```
   https://sprintr.home.mendix.com/link/project/c0af1725-edae-4345-aea7-2f94f7760e33
   ```
3. The App ID is the UUID at the end: `c0af1725-edae-4345-aea7-2f94f7760e33`

### Option B: From Mendix Studio Pro

1. Open your app in Mendix Studio Pro
2. Go to **App** → **App Settings**
3. The App ID is displayed in the settings dialog

---

## Step 4: Configure the Backend

1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```

2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

3. Open `backend/.env` in your text editor and fill in:

   ```env
   # Paste the PAT you copied in Step 2:
   MENDIX_PAT=your_actual_token_here

   # Leave the rest as defaults, or customize:
   PORT=3001
   CORS_ORIGIN=http://localhost:5173
   SYNC_INTERVAL_MINUTES=15
   STALE_BRANCH_DAYS=30
   DIVERGENCE_THRESHOLD=20
   ```

4. Save the file

5. Go back to the root:
   ```bash
   cd ..
   ```

> **IMPORTANT**: The `.env` file contains your secret PAT. It is already in `.gitignore` and will NOT be committed to version control.

---

## Step 5: Install Dependencies

From the project root, run:

```bash
npm run install:all
```

This installs dependencies for both the backend and frontend.

---

## Step 6: Start the Application

From the project root, run:

```bash
npm run dev
```

This starts both servers:
- **Backend API**: http://localhost:3001
- **Frontend UI**: http://localhost:5173

---

## Step 7: Register Your App and Sync

1. Open http://localhost:5173 in your browser

2. Click **"+ Add App"** on the dashboard

3. Enter your **App ID** (from Step 3)

4. Optionally enter a friendly name for the app

5. Click **"Register App"**

6. Select the app from the dropdown in the header

7. Click **"Sync Now"** to pull data from the Mendix Team Server

8. Wait for the sync to complete (first sync may take a minute as it clones the repository)

9. You should now see branch data across all views:
   - **Dashboard**: Summary stats and alerts
   - **Branch Graph**: Visual DAG showing branch topology
   - **Branches**: Sortable table of all branches
   - **Timeline**: Horizontal view of branch lifetimes

---

## Troubleshooting

### "Missing required environment variable: MENDIX_PAT"
- Make sure you copied `.env.example` to `.env` (not `.env.example`)
- Make sure you replaced the placeholder with your actual PAT
- Make sure the `.env` file is in the `backend/` directory

### Sync fails with "401 Unauthorized"
- Your PAT may have expired. Generate a new one in the Mendix Portal.
- Make sure your PAT has the `mx:modelrepository:repo:read` scope.

### Sync fails with "404 Not Found"
- Double-check your App ID. It should be a UUID like `c0af1725-edae-4345-aea7-2f94f7760e33`.
- Make sure you have access to the app in the Mendix Portal.

### Git clone fails
- Ensure `git` is installed and available on your PATH.
- If you're behind a corporate proxy, configure Git's proxy settings.

### No data after sync
- Check the terminal running the backend for error messages.
- Try clicking "Sync Now" again.

---

## Configuration Reference

All settings are in `backend/.env`:

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | Backend API port |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed frontend origin |
| `MENDIX_PAT` | (required) | Your Mendix Personal Access Token |
| `DATA_DIR` | `./data` | Where Git clones and DB are stored |
| `DB_PATH` | `./data/branchtree.sqlite` | SQLite database file path |
| `SYNC_INTERVAL_MINUTES` | `15` | Auto-sync frequency |
| `STALE_BRANCH_DAYS` | `30` | Days of inactivity before a branch is flagged stale |
| `DIVERGENCE_THRESHOLD` | `20` | Commits behind main before divergence warning |
