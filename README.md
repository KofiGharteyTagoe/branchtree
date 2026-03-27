# Mendix Branch Visualizer

A visual branch management tool for Mendix applications. See your branch graph, track divergence, detect stale branches, and get alerts about version mismatches — all in one dashboard.

## What It Does

- **Branch Graph**: Interactive DAG visualization showing branch topology, fork points, and merge events
- **Branch Dashboard**: Sortable, filterable table with status indicators (active, stale, merged, diverged)
- **Timeline View**: Horizontal branch lifetime bars showing when branches were created and their last activity
- **Alerts**: Automatic detection of stale branches, excessive divergence from main, and Mendix version mismatches
- **Multi-App Support**: Register and switch between multiple Mendix applications

## Quick Start

### Prerequisites

- Node.js 18+
- Git
- A Mendix account with a Personal Access Token (PAT)

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/KofiGharteyTagoe/branchtree.git
cd branchtree

# 2. Configure your Mendix PAT
cp backend/.env.example backend/.env
# Edit backend/.env and add your PAT (see docs/SETUP.md for details)

# 3. Install dependencies
npm run install:all

# 4. Start the application
npm run dev
```

Then open http://localhost:5173, register your Mendix app, and click **Sync Now**.

> For detailed setup instructions including how to get your PAT and App ID, see **[docs/SETUP.md](docs/SETUP.md)**.

## Architecture

```
Frontend (React + Vite)  →  Backend (Express + SQLite)  →  Git Bare Clone + Mendix API
```

- **Frontend**: React 18, TypeScript, Tailwind CSS, TanStack Query
- **Backend**: Node.js, Express, better-sqlite3, simple-git
- **Data**: Git bare clone for DAG topology + Mendix App Repository API for metadata

## Security

- PAT is stored only in `backend/.env` (gitignored) — never reaches the frontend
- Backend proxies all Mendix API calls
- Git clone authentication happens server-side only
- CORS restricted to frontend origin
- Input validation on all API endpoints

## License

Apache 2.0
