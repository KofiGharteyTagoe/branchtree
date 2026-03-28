# Above & Beyond: Enterprise UI/UX for Branch Visualizer

## 1. The Enterprise Reality: Deep Research & Pain Points
When scaling to a large organization with hundreds of developers managing multiple applications, standard Git processes break down. Our research into enterprise branching pain points reveals several critical issues:
- **The "Big Bang" Merge & Stale Code:** Long-lived feature branches inevitably diverge radically from `main`. By the time developers attempt to merge, they face massive, unpredictable conflict resolution, delaying releases.
- **Context Switching & "Ghost Branches":** Developers create feature branches, switch priorities, and forget them. Months later, the repository is polluted with hundreds of abandoned branches, making it impossible to find relevant work.
- **Micro-Siloing:** Because branches are isolated, teams lack visibility into overlapping work. Team A might be modifying the same domain model entity as Team B, but they won't know until merge time.
- **Visual Overload:** Traditional Git UI tools (even advanced ones) fail at scale. Showing a graph of 500 active branches looks like a tangled ball of yarn (the "subway map from hell"), offering zero actionable insight.

These pain points apply universally across Git hosting platforms — Mendix Team Server, GitHub, GitLab, Azure DevOps, Bitbucket, and self-hosted Git repositories all suffer from the same scaling challenges.

## 2. Multi-Provider Architecture
The branch visualizer was built with Mendix as the core use case and that remains the primary, zero-friction experience. However, the problems described in Section 1 are platform-agnostic. To serve teams across different ecosystems, the app needs a provider abstraction layer that keeps Mendix plug-and-play while enabling other Git platforms.

### A. Provider Abstraction Layer
A `GitProvider` interface abstracts the differences between platforms:

| Concern | Mendix (Default) | GitHub | GitLab | Plain Git |
|---------|-------------------|--------|--------|-----------|
| **App Identity** | UUID (App ID) | `owner/repo` | Project ID or `group/project` | Git URL (HTTPS/SSH) |
| **Authentication** | Mendix PAT (`MxToken`) | GitHub PAT (`x-access-token`) | GitLab token (`oauth2`) | Optional username/password or SSH key |
| **Clone URL** | Retrieved via Mendix API | Derived from identifier | Derived from identifier | Provided directly at registration |
| **Metadata Enrichment** | Mendix versions, user stories | Pull requests, issues, CI checks | Merge requests, pipelines | None (pure Git data only) |

Each provider implements:
- `validateIdentifier()` — validate the app ID format for that platform
- `buildCloneUrl()` — construct the authenticated Git URL
- `getRepoUrl()` — (optional) fetch clone URL from platform API when not directly provided
- `enrichBranches()` — (optional) enrich branch data with platform-specific metadata

### B. Mendix Stays First-Class
- Mendix is the **pre-selected default** in the registration UI — existing users see no change
- The current registration flow (App ID + PAT) remains identical for Mendix apps
- Mendix-specific features (version tracking, story linkage) display automatically for Mendix apps
- Other providers appear as additional options in a provider selector dropdown
- Provider-specific UI elements (e.g., "Mx Version" column, "Related Stories" panel) are conditionally rendered — they appear for providers that supply that data and are hidden for those that don't

### C. Database Generalization
Provider-specific metadata fields (`mendix_version`, `related_stories`) should migrate to a generic `provider_metadata JSON` column on the `branches` and `commits` tables. This allows each provider to store its own enrichment data without schema changes. A `provider_type TEXT` column on the `apps` table tracks which provider each app uses.

## 3. Core UI/UX Strategy for the Branch Tree View
How do we make the DAG (Directed Acyclic Graph) legible when there are 50+ branches and thousands of commits?

### A. Semantic Zooming & Progressive Disclosure
Instead of rendering the entire graph by default:
- **Macro View (Zoom Out):** Show only long-lived branches (e.g., `main`, `development`, `release/*`). Feature branches are collapsed into actionable "nodes" indicating volume (e.g., "[ 12 active feature branches ]").
- **Micro View (Zoom In):** When a user clicks a cluster or zooms in, expand the specific feature branches related to their team or current context.

**Technology Assessment:** The current custom SVG renderer uses static `viewBox` scaling for zoom, which renders all commits as individual DOM elements at every zoom level. Semantic zooming requires dynamic node creation/destruction based on zoom level — a fundamentally different rendering approach. Before implementing this feature, evaluate:
- **react-flow / xyflow** — Best React integration; built-in zoom, pan, minimap, and custom node types. Recommended starting point.
- **Cytoscape.js** — Best for scale (handles thousands of nodes); built-in DAG layout algorithms. Best fit if the app must handle 500+ branches.
- **D3.js** — Most powerful and flexible, but requires careful integration with React's virtual DOM.

The current custom SVG approach can support simpler features (opacity fading, CSS animations) but will hit performance limits beyond ~200 commits and cannot support semantic zooming without a near-complete rewrite.

### B. The "Lanes of Urgency" Visual Model
Not all branches are equal. Instead of random colors, use a predictable layout:
- **The Trunk (Center Lane):** `main` is always a thick, steady line in the center.
- **Active Lanes (Near Center):** Branches with activity in the last 7 days are plotted closest to the trunk.
- **Stale Lanes (Outer Edges):** Branches with no recent activity drift to the outer edges of the graph, visually fading out (reduced opacity) to reduce cognitive load.
- **Warning Indicators:** Branches with severe divergence or version mismatches (for providers that track versions) have glowing red/orange pulsating halos on their latest commit nodes.

**Edge Crossing Note:** Reordering lanes by activity level will cause edge crossings when an outer-lane branch connects to a recent main commit across multiple lanes. Implementing edge routing or Bezier curves (instead of straight lines) is necessary to keep the graph readable at scale.

### C. Contextual Overlays (The "Hover-to-Discover")
When hovering over a commit or branch line, dim the rest of the graph and highlight only that branch's lineage (its parents back to the fork point). Pop up a lightweight "baseball card" showing:
- **Author** who created the branch
- **Related work items** (Mendix stories, GitHub PRs/issues, GitLab merge requests — varies by provider)
- **Merge Readiness Score** (see Section 4C)
- **Last activity** and **divergence metrics**

**Implementation Note:** Lineage highlighting requires precomputing ancestry sets for each branch (a DAG traversal from each branch tip back to its fork point). These sets should be computed once when graph data loads, not on every hover event. CSS class-based dimming (toggling an `.is-dimmed` class on non-ancestor elements) is more performant than React state-driven re-renders for graphs with hundreds of nodes.

### D. Performance at Scale
The current architecture sends ALL commits in a single API response and renders ALL of them as DOM elements. For repositories with thousands of commits, this will cause:
- Multi-megabyte API responses and slow page loads
- Browser DOM thrashing and layout reflow with 1000+ SVG elements

Mitigations:
- **Backend pagination:** The graph API should support a `depth` or `since` parameter to limit how far back in history the graph extends.
- **Frontend virtualization:** Only render commits visible in the current viewport. Off-screen nodes should be represented as lightweight placeholders.
- **Level-of-detail rendering:** At low zoom, replace individual commits with aggregated "commit range" nodes (e.g., "47 commits, Mar 1–15").

## 4. Core UI/UX Strategy for the Branch Dashboard
A table of 200 branches is useless. The dashboard must transition from *passive reporting* to *active workflow management*.

### A. Persona-Driven Landing Pages
- **For Developers:** "My Branches & Reviews." Shows only branches where the user is the author (matched by git commit email from local config or a user-configured email). Highlights immediate actions: "Branch feature/login is 45 commits behind main — sync needed."
- **For Leads/Architects:** "Team Health View." Shows divergence metrics, stale branch count, and version mismatch warnings (where applicable) grouped by application or sprint.

**Prerequisite:** "My Branches" requires mapping a user identity to commit authors. This can be achieved without full authentication by matching the user's local git email (`git config user.email`) or allowing them to set a preferred email in the app's settings (stored in `localStorage`). Full auth is not required for this feature.

### B. "Action-First" Widgets Instead of Just Tables
At the top of the dashboard, include a "Triage Row" with cards:
- **Critical Divergences** — Branches more than 50 commits behind main (count + click-to-filter)
- **Stale Branches** — No commits in 30+ days (count + click-to-filter)
- **Version Mismatches** — Branches on a different platform version than main (only shown for providers that track versions, e.g., Mendix Studio Pro versions)

Clicking a triage card immediately filters the branch table below. These cards build directly on the existing alert system (`alerts.service.ts`) with minimal new code.

### C. The "Merge Readiness" Score
Abstract raw Git metrics into a calculated "Merge Readiness" score (0-100) per branch.

**Algorithm (weighted formula, computed on the backend for consistency):**

| Factor | Weight | Calculation |
|--------|--------|-------------|
| Divergence from main | 40 pts max | Deduct `min(commitsBehind * 0.8, 40)` |
| Staleness | 25 pts max | Deduct `min(daysSinceLastCommit / 30 * 25, 25)` |
| Version mismatch | 15 pts max | Deduct 15 if branch version differs from main (provider-specific; skip if provider has no version tracking) |
| Branch age | 10 pts max | Deduct `min(daysSinceBranchCreation / 60 * 10, 10)` |
| Merge commit density | 10 pts max | Deduct 10 if branch has never been synced from main (no merge commits from main detected) |

**Score interpretation:**
- **Green (80-100):** Recently branched, in sync, ready to merge.
- **Yellow (50-79):** Diverged or aging, requires review before merging.
- **Red (0-49):** Stale, heavily diverged, conflicts likely. High risk.

Display as a colored progress bar in the branch table. Sort by this score to surface technical debt.

### D. Provider-Conditional UI
Provider-specific columns and widgets render conditionally:
- **Mendix apps:** Show "Mx Version" column, "Related Stories" in detail panel, version mismatch alerts
- **GitHub apps (future):** Show "Open PRs" column, "CI Status" badge, linked issues
- **GitLab apps (future):** Show "Merge Requests" column, "Pipeline Status" badge
- **Plain Git:** Show only core Git metrics (divergence, staleness, commits ahead/behind)

## 5. Cross-App & App Portfolio Management
For organizations managing multiple repositories:

### A. Global Portfolio Dashboard
A high-level control center across all registered apps (regardless of provider). Each app is a card showing its "Branch Health Rating" (A to F).

**App Health Rating Algorithm:**

| Rating | Criteria |
|--------|----------|
| **A** | 0 stale branches, 0 critical divergences, avg Merge Readiness > 80 |
| **B** | < 5 stale branches, 0 critical divergences, avg Merge Readiness > 65 |
| **C** | < 10 stale branches, < 3 critical divergences, avg Merge Readiness > 50 |
| **D** | < 20 stale branches, < 5 critical divergences, avg Merge Readiness > 35 |
| **F** | 20+ stale branches OR 5+ critical divergences OR avg Merge Readiness < 35 |

If App X has 40 stale branches and an F rating, an Engineering Manager can instantly see which team needs process intervention.

Each app card also shows the provider icon (Mendix, GitHub, GitLab, Git) so teams can manage a mixed portfolio.

### B. Global Search
Search across all registered apps by:
- **Branch name** (universal)
- **Author name or email** (universal)
- **Work item ID** (provider-specific: Mendix story ID, GitHub issue number, GitLab issue ID, Jira key)
- **Commit message keyword** (universal)

**Prerequisite:** Requires SQLite full-text search (FTS5) for efficient cross-app commit message and branch name searching.

## 6. Tactical Implementation Plan

### Phase 0: "The Foundation" (Weeks 1-2)
**Goal:** Make the app functional and extensible.

**Prerequisites:** None — this is the starting point.

**Tasks:**
- Fix the sync pipeline (clone + parse + analyze) so the app can ingest data from at least one Mendix app end-to-end.
- Introduce the `GitProvider` interface and refactor the ingestion service to route through provider-specific logic. Implement `MendixProvider` (extracting existing code) and `PlainGitProvider` (direct URL, no enrichment).
- Add `provider_type` column to `apps` table. Migrate `mendix_version` and `related_stories` to `provider_metadata JSON` on `branches` and `commits`.
- Add provider selector to the registration UI (Mendix pre-selected as default).
- Make provider-specific UI elements conditional (Mx Version column, Stories panel, version mismatch alert text).
- Install a test framework (Vitest) and add core tests for: sync pipeline, git analysis service, alerts service.
- Remove unused `@gitgraph/react` dependency.

### Phase 1: "Insight Widgets" (Week 3)
**Goal:** Make the dashboard actionable instead of passive.

**Prerequisites:** Phase 0 complete (sync working, at least one app ingested).

**Tasks:**
- Add the Triage Row cards to the dashboard (Critical Divergences, Stale Branches, Version Mismatches).
- Wire triage cards to filter the branch table on click.
- Move the Merge Readiness Score calculation to the backend using the weighted algorithm defined in Section 4C.
- Display the score as a colored progress bar in the branch table.
- Add default sort-by-score to surface worst branches first.

### Phase 2: "Intelligent Graphing" (Weeks 4-5)
**Goal:** Transform the graph from a static diagram into an interactive exploration tool.

**Prerequisites:** Phase 0 complete. Evaluate and select a graph rendering library (react-flow or Cytoscape.js) based on a spike/prototype in the first day of this phase.

**Tasks:**
- Migrate graph rendering from custom SVG to the selected library.
- Implement opacity fading for stale/inactive branches (outer edges dimmed).
- Implement lineage highlight on hover (precomputed ancestry sets + CSS dimming).
- Add pulsating warning nodes (CSS keyframe animations) for low Merge Readiness branches.
- Add "baseball card" tooltip overlay on branch/commit hover.
- Add graph data pagination (backend `depth` parameter, default last 90 days).

### Phase 3: "Filtering + Identity" (Week 6)
**Goal:** Personalize the experience so developers see what matters to them.

**Prerequisites:** Phase 1 complete. A mechanism for user identity (git email matching from `localStorage` setting).

**Tasks:**
- Add email configuration option in app settings (stored in `localStorage`).
- Implement "My Branches" filter view (match configured email against commit author emails).
- Add persona toggle on dashboard (Developer View / Lead View).
- Add enhanced filtering options: by author, by date range, by divergence severity.

### Phase 4: "Portfolio Scale" (Weeks 7+)
**Goal:** Enable cross-app visibility and additional Git platform support.

**Prerequisites:** Phases 0-1 complete. Multiple apps registered and syncing successfully.

**Tasks:**
- Build the Global Portfolio Dashboard page with app cards showing Health Ratings (A-F).
- Implement cross-app aggregation API endpoints.
- Add SQLite FTS5 for global search across branch names, authors, and commit messages.
- Implement `GitHubProvider` (GitHub PAT auth, clone URL derivation, PR/issue enrichment).
- Implement `GitLabProvider` (GitLab token auth, merge request/pipeline enrichment).
- Add provider-specific columns to branch table and detail panel for GitHub/GitLab apps.
