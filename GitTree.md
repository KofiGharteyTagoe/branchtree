

I've prepared the full implementation prompt as a downloadable Markdown document for you. Here it is:

---

```markdown
# 🚀 Full Implementation Prompt: Mendix Branch Visualizer

> **Use this document as your complete implementation brief. Hand it to any AI coding assistant, development team, or contractor to build this tool end-to-end.**

---

## Table of Contents

1. [Why This Tool Needs to Exist](#1-why-this-tool-needs-to-exist)
2. [Architecture Overview](#2-architecture-overview)
3. [Data Source 1: Git Bare Clone](#3-data-source-1-git-bare-clone)
4. [Data Source 2: Mendix App Repository API](#4-data-source-2-mendix-app-repository-api)
5. [Backend Implementation](#5-backend-implementation)
6. [Frontend Implementation](#6-frontend-implementation)
7. [Operational Features](#7-operational-features)
8. [Important Constraints and Warnings](#8-important-constraints-and-warnings)
9. [Sources and Reference Documentation](#9-sources-and-reference-documentation)
10. [Implementation Phases](#10-implementation-phases)

---

## 1. Why This Tool Needs to Exist

### The Problem

Mendix Studio Pro supports version control (branching, merging, tagging) built on top of Git. However, all branch management is done through a flat list in the **Branch Line Manager** inside Studio Pro. There is:

- No visual graph showing how branches relate to each other
- No way to see fork points (where a branch was created from)
- No way to see merge points (where branches were combined)
- No way to see which branches are stale, diverged, or behind main
- No way to see who created a branch or when
- No cross-branch overview for project managers or architects managing large teams

Mendix supports three branching strategies of increasing complexity:

1. **Trunk-Based** — all work on main (small teams)
2. **Trunk-Based with Feature Branches** — short-lived feature branches merged back to main (most common among Mendix customers)
3. **Advanced Branching** — main + development + release + feature branches (large teams, strict processes)

For strategies 2 and 3, the lack of visualization becomes unmanageable as the number of branches grows. Mendix's own documentation recommends naming conventions like `feature_[issueNumber]` and periodic cleanup of old branches — but without a visualization tool, teams cannot effectively manage this.

**Source:** [Managing Branches in Studio Pro](https://docs.mendix.com/refguide/managing-branches/) — Branching Best-Practices section

### Why a Custom Tool Is Required

Mendix does not expose branch graph topology through its APIs (no parent commit references, no fork-point data, no merge-commit identification). However, Mendix Team Server is a **full Git implementation** that supports third-party Git tooling. The Mendix Version Control FAQ explicitly states: *"As the Team Server is based on a full implementation of Git, you can directly use third-party tools like GitHub Desktop."*

This means we can clone the repository using standard Git tools to extract the full commit graph (the DAG — Directed Acyclic Graph), and then enrich it with Mendix-specific metadata (related user stories, Mendix version per commit) from the Mendix App Repository API.

**Source:** [Version Control FAQ](https://docs.mendix.com/refguide10/version-control-faq/) — "Can I Use Third-Party Tools to Connect to the Team Server?"

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                   MENDIX BRANCH VISUALIZER                  │
│                                                             │
│  ┌─────────────────┐   ┌──────────────┐   ┌─────────────┐  │
│  │   Frontend       │   │   Backend    │   │  Database    │  │
│  │   React +        │◄──│   Node.js    │──►│  PostgreSQL  │  │
│  │   @gitgraph/react│   │   Express    │   │  or SQLite   │  │
│  │   or D3.js       │   │              │   │              │  │
│  └─────────────────┘   └──────┬───────┘   └─────────────┘  │
│                               │                             │
│              ┌────────────────┴────────────────┐            │
│              ▼                                 ▼            │
│    ┌──────────────────────┐    ┌──────────────────────┐     │
│    │ DATA SOURCE 1:       │    │ DATA SOURCE 2:       │     │
│    │ Git Bare Clone       │    │ Mendix App Repo API  │     │
│    │ (graph topology,     │    │ (branches, commits,  │     │
│    │  parent commits,     │    │  Mendix version,     │     │
│    │  fork/merge points)  │    │  related stories,    │     │
│    │                      │    │  author details)     │     │
│    └──────────────────────┘    └──────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Why Two Data Sources (Hybrid Approach)

| Data Point | Git Bare Clone | Mendix App Repository API |
|---|---|---|
| Commit hash | ✅ | ✅ |
| Parent commit hashes (**critical for graph**) | ✅ | ❌ NOT AVAILABLE |
| Fork points (where branch diverged) | ✅ via `git merge-base` | ❌ |
| Merge commits (commits with 2+ parents) | ✅ | ❌ |
| Branch pointers and tags | ✅ | ✅ (branch names only) |
| Author name and email | ✅ | ✅ |
| Commit date | ✅ | ✅ |
| Commit message | ✅ | ✅ |
| Mendix Studio Pro version used | ❌ | ✅ |
| Related user stories | ❌ | ✅ |

The **join key** between the two data sources is the **commit hash** — both Git and the Mendix API return the same Git SHA for each commit.

---

## 3. Data Source 1: Git Bare Clone

### What It Is

Mendix Team Server is a standard Git server. Every Mendix app is stored in a Git repository. Since Mendix explicitly supports third-party Git tool access, we can clone this repository to extract graph topology data.

**Source:** [Version Control](https://docs.mendix.com/refguide/version-control/) — "Version control in Mendix is built on top of Git."

### How to Get the Repository URL

Call the Mendix App Repository API:

```http
GET https://repository.api.mendix.com/v1/repositories/{AppId}/info
Authorization: MxToken {YOUR_PAT}
```

Response:

```json
{
  "appId": "c0af1725-edae-4345-aea7-2f94f7760e33",
  "type": "git",
  "url": "https://git.api.mendix.com/c0af1725-edae-4345-aea7-2f94f7760e33.git"
}
```

**Source:** [App Repository API](https://docs.mendix.com/apidocs-mxsdk/apidocs/app-repository-api/) — Retrieve Repository Info

### How to Clone

```bash
# Initial clone (bare = metadata only, no working files, lightweight)
git clone --bare {url} /data/repos/{appId}

# Subsequent updates (just fetch new data)
git -C /data/repos/{appId} fetch --all --prune
```

A bare clone does **NOT** download the `.mpr` model files as working copies — it only gets the Git object database (commits, trees, refs). This is lightweight and safe.

> **CRITICAL: Never modify, merge, or write to this clone. It is READ-ONLY for data extraction.**

### How to Extract Graph Data

Run this command against the bare clone:

```bash
git -C /data/repos/{appId} log --all --format="%H|%P|%an|%ae|%aI|%s|%D"
```

This outputs one line per commit:

```
abc123def|parent1hash parent2hash|Jane Smith|jane@company.com|2025-03-15T10:30:00+01:00|Merged feature_1234 into main|HEAD -> main
```

#### Field Breakdown

| Format Code | Example | What It Provides |
|---|---|---|
| `%H` | `abc123def` | Commit hash (unique identifier) |
| `%P` | `parent1 parent2` | Parent hash(es) — **SPACE-SEPARATED if merge commit** |
| `%an` | `Jane Smith` | Author name |
| `%ae` | `jane@company.com` | Author email |
| `%aI` | `2025-03-15T10:30:00+01:00` | Author date (ISO 8601) |
| `%s` | `Merged feature_1234 into main` | Commit subject (first line of message) |
| `%D` | `HEAD -> main` | Ref names (branch pointers, tags) pointing at this commit |

### How to Determine Branch Relationships

**Fork point** (where a branch was created from main):

```bash
git -C /data/repos/{appId} merge-base main {branchName}
# Returns: the commit hash where the branch diverged
```

**Merge detection**: Any commit with 2+ parent hashes (space-separated in `%P`) is a merge commit. Parent 1 is the branch being merged INTO, Parent 2 is the branch being merged FROM.

**Branch divergence** (how far behind/ahead of main a branch is):

```bash
git -C /data/repos/{appId} rev-list --count main..{branchName}   # commits ahead
git -C /data/repos/{appId} rev-list --count {branchName}..main   # commits behind
```

**Whether a branch has been merged**:

```bash
git -C /data/repos/{appId} branch --contains {branchTipHash}
# If main appears in the output, the branch has been merged into main
```

---

## 4. Data Source 2: Mendix App Repository API

### Base URL

```
https://repository.api.mendix.com/v1
```

### Authentication

Generate a Personal Access Token (PAT) in the Mendix Portal under **User Settings**. Required scope: `mx:modelrepository:repo:read`.

Every request must include:

```
Authorization: MxToken {GENERATED_PAT}
```

**Source:** [App Repository API — Authentication](https://docs.mendix.com/apidocs-mxsdk/apidocs/app-repository-api/)

### Available Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/repositories/{AppId}/info` | Repository type (git/svn) and URL |
| `GET` | `/repositories/{AppId}/branches` | Paginated list of all branches |
| `GET` | `/repositories/{AppId}/branches/{Name}` | Single branch detail |
| `GET` | `/repositories/{AppId}/branches/{Name}/commits` | Paginated commit history for a branch |

### Retrieve All Branches

```http
GET /v1/repositories/{AppId}/branches?limit=100
Authorization: MxToken {PAT}
```

Response:

```json
{
  "items": [
    {
      "name": "trunk",
      "latestCommit": {
        "id": "abc123hash",
        "author": { "name": "John Doe", "email": "john@company.com" },
        "date": "2025-03-15T10:30:00.000Z",
        "message": "My commit message",
        "mendixVersion": "10.12.1.12345",
        "relatedStories": [{ "id": "1234567" }]
      }
    }
  ],
  "cursors": {
    "first": "...",
    "next": "...",
    "last": "..."
  }
}
```

**Pagination**: Cursor-based. If `cursors.next` exists, fetch the next page using `?cursor={cursors.next}`. Maximum 100 items per page.

**Branch name encoding**: Branch names must be URL-encoded in path parameters (e.g., `branches/development` becomes `branches%2Fdevelopment`).

### Retrieve Commits for a Branch

```http
GET /v1/repositories/{AppId}/branches/{BranchName}/commits?limit=100
Authorization: MxToken {PAT}
```

Returns commits in **reverse chronological order**. Each commit includes: `id` (hash), `author`, `date`, `message`, `mendixVersion`, `relatedStories`.

---

## 5. Backend Implementation

### Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Git operations**: `simple-git` npm package (wrapper around Git CLI) or direct `child_process.exec` calls
- **Database**: PostgreSQL (production) or SQLite (development)
- **Scheduling**: `node-cron` for periodic data refresh

### Data Models

```sql
CREATE TABLE apps (
    app_id TEXT PRIMARY KEY,
    app_name TEXT,
    repo_url TEXT,
    repo_type TEXT,
    last_synced TIMESTAMP
);

CREATE TABLE branches (
    id SERIAL PRIMARY KEY,
    app_id TEXT REFERENCES apps(app_id),
    name TEXT NOT NULL,
    fork_point_commit TEXT,
    forked_from_branch TEXT,
    first_unique_commit TEXT,
    first_unique_commit_author TEXT,
    first_unique_commit_date TIMESTAMP,
    latest_commit_hash TEXT,
    latest_commit_date TIMESTAMP,
    mendix_version TEXT,
    commits_ahead_of_main INTEGER,
    commits_behind_main INTEGER,
    is_merged BOOLEAN DEFAULT FALSE,
    is_stale BOOLEAN DEFAULT FALSE,
    branch_type TEXT,
    UNIQUE(app_id, name)
);

CREATE TABLE commits (
    hash TEXT PRIMARY KEY,
    app_id TEXT REFERENCES apps(app_id),
    author_name TEXT,
    author_email TEXT,
    commit_date TIMESTAMP,
    message TEXT,
    parent_hashes TEXT[],
    is_merge_commit BOOLEAN DEFAULT FALSE,
    branch_names TEXT[],
    ref_names TEXT,
    mendix_version TEXT,
    related_stories TEXT[]
);

CREATE TABLE merge_events (
    id SERIAL PRIMARY KEY,
    app_id TEXT REFERENCES apps(app_id),
    merge_commit_hash TEXT REFERENCES commits(hash),
    source_branch TEXT,
    target_branch TEXT,
    merged_by TEXT,
    merged_date TIMESTAMP
);
```

### Data Ingestion Service

```javascript
// /services/ingestion.js

const simpleGit = require('simple-git');
const axios = require('axios');
const fs = require('fs');

const MENDIX_API_BASE = 'https://repository.api.mendix.com/v1';

async function syncApp(appId, pat) {

    // ─── STEP 1: Get repo info from Mendix API ───
    const repoInfo = await axios.get(
        `${MENDIX_API_BASE}/repositories/${appId}/info`,
        { headers: { Authorization: `MxToken ${pat}` } }
    );
    const repoUrl = repoInfo.data.url;

    // ─── STEP 2: Clone or fetch bare repo ───
    const repoPath = `/data/repos/${appId}`;
    if (!fs.existsSync(repoPath)) {
        await simpleGit().clone(repoUrl, repoPath, ['--bare']);
    } else {
        await simpleGit(repoPath).fetch(['--all', '--prune']);
    }

    // ─── STEP 3: Extract full commit graph from Git ───
    const git = simpleGit(repoPath);
    const logResult = await git.raw([
        'log', '--all',
        '--format=%H|%P|%an|%ae|%aI|%s|%D'
    ]);

    const commits = logResult.trim().split('\n').map(line => {
        const [hash, parents, authorName, authorEmail, date, message, refs] =
            line.split('|');
        const parentList = parents ? parents.split(' ').filter(Boolean) : [];
        return {
            hash,
            parentHashes: parentList,
            isMergeCommit: parentList.length > 1,
            authorName,
            authorEmail,
            date: new Date(date),
            message,
            refs: refs || null
        };
    });

    // Store all commits in database
    await db.upsertCommits(appId, commits);

    // ─── STEP 4: Get all branch names ───
    const branchRefs = await git.raw([
        'branch', '-a', '--format=%(refname:short)'
    ]);
    const branchNames = branchRefs.trim().split('\n').filter(Boolean);

    // ─── STEP 5: Compute branch relationships ───
    for (const branchName of branchNames) {

        // Find fork point from main
        let forkPoint = null;
        try {
            forkPoint = (await git.raw([
                'merge-base', 'main', branchName
            ])).trim();
        } catch (e) {
            // Branch may not share history with main
        }

        // Count divergence
        let commitsAhead = 0, commitsBehind = 0;
        try {
            commitsAhead = parseInt(
                (await git.raw([
                    'rev-list', '--count', `main..${branchName}`
                ])).trim()
            );
            commitsBehind = parseInt(
                (await git.raw([
                    'rev-list', '--count', `${branchName}..main`
                ])).trim()
            );
        } catch (e) {}

        // Check if merged into main
        let isMerged = false;
        try {
            const containing = await git.raw([
                'branch', '-a', '--contains', branchName
            ]);
            isMerged = containing.includes('main');
        } catch (e) {}

        // Find first unique commit on branch (to determine creator)
        let firstUniqueCommit = null;
        try {
            const uniqueCommits = (await git.raw([
                'log', `${forkPoint}..${branchName}`,
                '--reverse', '--format=%H|%an|%aI',
                '--first-parent'
            ])).trim();
            if (uniqueCommits) {
                const first = uniqueCommits.split('\n')[0].split('|');
                firstUniqueCommit = {
                    hash: first[0],
                    author: first[1],
                    date: new Date(first[2])
                };
            }
        } catch (e) {}

        // Classify branch type from naming convention
        const branchType = classifyBranch(branchName);

        await db.upsertBranch(appId, {
            name: branchName,
            forkPointCommit: forkPoint,
            forkedFromBranch: 'main',
            firstUniqueCommit,
            commitsAhead,
            commitsBehind,
            isMerged,
            branchType
        });
    }

    // ─── STEP 6: Enrich with Mendix API data ───
    let cursor = null;
    do {
        const url = `${MENDIX_API_BASE}/repositories/${appId}/branches` +
            `?limit=100${cursor ? `&cursor=${cursor}` : ''}`;
        const res = await axios.get(url, {
            headers: { Authorization: `MxToken ${pat}` }
        });

        for (const branch of res.data.items) {
            await db.updateBranchMendixData(appId, branch.name, {
                mendixVersion: branch.latestCommit.mendixVersion,
                latestCommitHash: branch.latestCommit.id,
                latestCommitDate: branch.latestCommit.date
            });

            // Fetch commits for this branch and enrich
            await enrichBranchCommits(appId, branch.name, pat);
        }

        cursor = res.data.cursors?.next || null;
    } while (cursor);

    // ─── STEP 7: Detect merge events ───
    const mergeCommits = commits.filter(c => c.isMergeCommit);
    for (const mc of mergeCommits) {
        await db.upsertMergeEvent(appId, {
            mergeCommitHash: mc.hash,
            mergedBy: mc.authorName,
            mergedDate: mc.date,
        });
    }
}

function classifyBranch(name) {
    const lower = name.toLowerCase();
    if (lower === 'main' || lower === 'trunk' || lower === 'master')
        return 'main';
    if (lower.startsWith('feature') || lower.startsWith('feat'))
        return 'feature';
    if (lower.startsWith('release'))
        return 'release';
    if (lower.startsWith('hotfix') || lower.startsWith('fix'))
        return 'hotfix';
    if (lower.startsWith('develop') || lower === 'dev')
        return 'development';
    return 'unknown';
}

async function enrichBranchCommits(appId, branchName, pat) {
    let cursor = null;
    do {
        const encodedBranch = encodeURIComponent(branchName);
        const url =
            `${MENDIX_API_BASE}/repositories/${appId}` +
            `/branches/${encodedBranch}/commits` +
            `?limit=100${cursor ? `&cursor=${cursor}` : ''}`;
        const res = await axios.get(url, {
            headers: { Authorization: `MxToken ${pat}` }
        });

        for (const commit of res.data.items) {
            await db.enrichCommit(commit.id, {
                mendixVersion: commit.mendixVersion,
                relatedStories:
                    commit.relatedStories?.map(s => s.id) || []
            });
        }

        cursor = res.data.cursors?.next || null;
    } while (cursor);
}

module.exports = { syncApp };
```

### API Endpoints (Express)

```javascript
// GET  /api/apps/:appId/graph
// Returns the full DAG data for visualization
// Response: { nodes: [...commits], edges: [...parent links],
//             branches: [...] }

// GET  /api/apps/:appId/branches
// Returns enriched branch list with metadata
// Response: { branches: [{ name, type, creator, createdDate,
//             forkPoint, isMerged, isStale, commitsAhead,
//             commitsBehind, mendixVersion, ... }] }

// GET  /api/apps/:appId/branches/:branchName
// Returns detailed branch info with its commit timeline

// GET  /api/apps/:appId/merge-events
// Returns all detected merge events

// POST /api/apps/:appId/sync
// Triggers a manual data refresh

// GET  /api/apps
// Lists all registered Mendix apps
```

---

## 6. Frontend Implementation

### Tech Stack

- **Framework**: React 18 + TypeScript + Vite
- **Graph Visualization**: `@gitgraph/react` for the primary branch view, and/or D3.js for a custom DAG layout
- **UI Components**: Tailwind CSS or Shadcn/UI
- **State Management**: React Query (TanStack Query) for API data fetching and caching

### View 1: Branch Graph (Primary View)

An interactive Git graph showing:

- Each branch as a colored swimlane
- Commits as dots along the lanes
- Fork lines showing where branches diverge from their parents
- Merge lines showing where branches were merged back
- Branch labels with type indicators (feature, release, hotfix)
- Hover/click on a commit to see: author, date, message, Mendix version, related stories

```tsx
import { Gitgraph, templateExtend, TemplateName } from "@gitgraph/react";

const template = templateExtend(TemplateName.Metro, {
    colors: ["#0595DD", "#2ECC71", "#E74C3C", "#F39C12", "#9B59B6"],
    branch: { spacing: 50, label: { display: true } },
    commit: {
        spacing: 40,
        dot: { size: 6 },
        message: { displayAuthor: false }
    },
});

function BranchGraph({ graphData }) {
    return (
        <Gitgraph options={{
            template,
            orientation: "vertical-reverse"
        }}>
            {(gitgraph) => {
                // Programmatically build the graph from API data
                // Create branches, add commits, call .merge()
                // at merge points
            }}
        </Gitgraph>
    );
}
```

**Alternative**: Use **D3.js** for maximum control if `@gitgraph/react` doesn't support the level of interactivity you need (zoom, pan, filtering, large graphs).

**Reference**: [GitGraph.js documentation](https://www.nicoespeon.com/gitgraph.js/) and [D3.js Git DAG visualization](https://tylercipriani.com/blog/2016/03/21/Visualizing-Git-Merkle-DAG-with-D3.js/)

### View 2: Branch Dashboard (Table/Card View)

A sortable, filterable table showing all branches with columns:

| Branch Name | Type | Created By | Created | Last Activity | Status | Behind Main | Ahead | Mx Version | Target |
|---|---|---|---|---|---|---|---|---|---|
| feature/new-dashboard | Feature | Jane Smith | Mar 1 | Mar 14 | Active | 3 | 12 | 10.12.1 | → main |
| release/2.1 | Release | Bob Jones | Feb 15 | Mar 10 | Active | 0 | 5 | 10.12.1 | → main |
| feature/old-widget | Feature | Alice Wong | Dec 1 | Jan 15 | ⚠️ Stale | 47 | 8 | 10.10.0 | → main |

Color-code rows: **green** = active & up to date, **yellow** = active but diverged, **red** = stale, **grey** = merged.

### View 3: Timeline View

A horizontal timeline showing branch lifetimes as bars:

- X axis = time
- Y axis = branch lanes
- Fork points shown as branching arrows
- Merge points shown as converging arrows
- Active branches have open-ended bars
- Merged/deleted branches have closed bars

### View 4: Branch Detail Panel

When clicking a branch, show:

- Full commit history with messages
- Related user stories from Mendix
- Mendix version progression
- Merge readiness score (based on divergence)
- Contributor list (who has committed to this branch)

---

## 7. Operational Features

### Stale Branch Detection

Flag branches with no commits in the last N days (configurable, default 30). Mendix recommends: *"Make sure that old branches are cleaned up, to prevent accumulating them over time."*

**Source:** [Managing Branches — Tips and Tricks](https://docs.mendix.com/refguide/managing-branches/)

### Divergence Alerts

Alert when a branch is more than N commits behind main (configurable). Mendix recommends: *"Periodically merge higher-level branches, such as 'development' or 'main', to lower-level branches, such as feature branches."*

**Source:** [Managing Branches — Tips and Tricks](https://docs.mendix.com/refguide/managing-branches/)

### Mendix Version Mismatch Detection

Flag when different branches are using different versions of Studio Pro. Mendix recommends: *"Where possible, keep different branches on the same version of Studio Pro."*

**Source:** [Managing Branches — Tips and Tricks](https://docs.mendix.com/refguide/managing-branches/)

### Periodic Sync

Run `git fetch` and Mendix API polling on a cron schedule (e.g., every 15 minutes) to keep data fresh.

### Multi-App Support

Allow registering multiple Mendix apps and switching between them in the UI.

---

## 8. Important Constraints and Warnings

1. **READ-ONLY**: This tool must **NEVER** write to the Git repository or call any write APIs. The Mendix `.mpr` file format will become corrupted if modified outside Studio Pro. *"Manually modifying files belonging to the .mpr storage format... will lead to a corrupted state."* — [Version Control](https://docs.mendix.com/refguide/version-control/)

2. **Bare clone only**: Always use `git clone --bare`. Do not check out working copies. This keeps the footprint minimal and avoids any risk of file corruption.

3. **Authentication**: The PAT requires `mx:modelrepository:repo:read` scope. Store it securely (environment variables, secrets manager). Never expose it to the frontend.

4. **Branch name encoding**: Branch names must be URL-encoded when used in Mendix API path parameters (e.g., `branches/development` becomes `branches%2Fdevelopment`).

5. **Pagination**: The Mendix API uses cursor-based pagination with a maximum of 100 items per page. Always handle pagination completely — loop until `cursors.next` is absent.

6. **BYO-Git compatibility**: If the Mendix app uses BYO-Git (Bring Your Own Git) with GitHub, GitLab, or Azure DevOps instead of Mendix Team Server, the same approach works — just use the BYO-Git repository URL instead. [Version Control FAQ](https://docs.mendix.com/refguide10/version-control-faq/)

7. **Merging via external tools not supported**: Do not attempt to merge branches through Git CLI or third-party tools, especially with MPRv2 format. *"Merging using Git in the command line or a third-party tool is not supported after the introduction of MPRv2."* — [Managing Branches](https://docs.mendix.com/refguide/managing-branches/)

---

## 9. Sources and Reference Documentation

| Resource | URL | Purpose |
|---|---|---|
| Mendix Version Control Concepts | https://docs.mendix.com/refguide/version-control/ | Branch, merge, commit concepts in Mendix |
| Managing Branches in Studio Pro | https://docs.mendix.com/refguide/managing-branches/ | How branches are created, merged, best practices |
| Mendix Version Control FAQ | https://docs.mendix.com/refguide10/version-control-faq/ | Confirms Team Server is full Git, supports third-party tools |
| Mendix App Repository API | https://docs.mendix.com/apidocs-mxsdk/apidocs/app-repository-api/ | REST API for branches, commits, repo info |
| Mendix APIs Overview | https://docs.mendix.com/apidocs-mxsdk/apidocs/ | Full API catalog, authentication methods |
| APIs for Apps | https://docs.mendix.com/apidocs-mxsdk/apidocs/apis-for-apps/ | App Repository API, Projects API, Epics API |
| Troubleshooting Version Control | https://docs.mendix.com/refguide/troubleshoot-version-control-issues/ | Git config, proxy, known issues |
| @gitgraph/react npm | https://www.npmjs.com/package/@gitgraph/react | React component for Git graph visualization |
| @gitgraph/js documentation | https://www.nicoespeon.com/gitgraph.js/ | Vanilla JS Git graph library |
| D3.js Git DAG Visualization | https://tylercipriani.com/blog/2016/03/21/Visualizing-Git-Merkle-DAG-with-D3.js/ | Reference for D3.js + Git DAG rendering |
| Git History (visualize-git) | https://github.com/MotiaDev/visualize-git | Open-source D3.js repo visualization reference |

---

## 10. Implementation Phases

| Phase | Scope | Estimated Duration |
|---|---|---|
| **Phase 1**: Data Ingestion | PAT auth, bare clone, Git log parsing, Mendix API fetch, database storage, join on commit hash | Week 1–2 |
| **Phase 2**: Graph Construction | Fork point detection via `merge-base`, merge event detection via parent analysis, branch classification, divergence calculation | Week 2–3 |
| **Phase 3**: Visualization | Branch graph view (@gitgraph/react or D3.js), branch dashboard table, commit detail panels, timeline view | Week 3–5 |
| **Phase 4**: Operational Features | Stale branch detection, divergence alerts, Mendix version mismatch warnings, periodic sync via cron, multi-app registration | Week 5–6 |

---

*Document generated for the Mendix Branch Visualizer project. All Mendix documentation references are current as of March 2026.*
```

---

This is the complete, self-contained Markdown document. You can:

- **Save it as** `mendix-branch-visualizer-spec.md`
- **Hand it directly** to a developer, team, or AI coding assistant
- **Import it** into any project management tool (Notion, Confluence, GitHub Issues, etc.)

It contains everything needed to build the tool without requiring any additional context from our conversation.