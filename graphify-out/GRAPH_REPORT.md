# Graph Report - /Users/grgurdamiani/Aurate/docs/plans  (2026-04-13)

## Corpus Check
- Corpus is ~3,222 words - fits in a single context window. You may not need a graph.

## Summary
- 37 nodes · 36 edges · 7 communities detected
- Extraction: 86% EXTRACTED · 14% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Market & Competition|Market & Competition]]
- [[_COMMUNITY_Backend Tech Stack|Backend Tech Stack]]
- [[_COMMUNITY_Product & Gamification|Product & Gamification]]
- [[_COMMUNITY_AI & Moderation|AI & Moderation]]
- [[_COMMUNITY_Monetization|Monetization]]
- [[_COMMUNITY_Viral Growth Engine|Viral Growth Engine]]
- [[_COMMUNITY_Retention Mechanics|Retention Mechanics]]

## God Nodes (most connected - your core abstractions)
1. `Core Loop (Drop Pic -> AI Check -> Score -> Share -> Mog Board)` - 7 edges
2. `Aurate` - 5 edges
3. `Node.js Backend (Express/Fastify)` - 5 edges
4. `AI Layer (GPT-4o Vision / Gemini Flash)` - 5 edges
5. `Ad Monetization (Rewarded Video + Native Feed + Interstitial)` - 3 edges
6. `Aura Phenomenon (Cultural Concept)` - 2 edges
7. `Sigma Paths (Archetypes)` - 2 edges
8. `AI Response Tone (Brainrot Voice)` - 2 edges
9. `The Mog Board (Leaderboard)` - 2 edges
10. `Share Cards (TikTok/IG Optimized Result Cards)` - 2 edges

## Surprising Connections (you probably didn't know these)
- `The Mog Board (Leaderboard)` --shares_data_with--> `Redis (Upstash) - Caching & Leaderboards`  [INFERRED]
  docs/plans/2026-04-13-aurate-research-design.md → docs/plans/2026-04-13-aurate-research-design.md  _Bridges community 2 → community 1_
- `Aurate` --references--> `Core Loop (Drop Pic -> AI Check -> Score -> Share -> Mog Board)`  [EXTRACTED]
  docs/plans/2026-04-13-aurate-research-design.md → docs/plans/2026-04-13-aurate-research-design.md  _Bridges community 0 → community 2_
- `Core Loop (Drop Pic -> AI Check -> Score -> Share -> Mog Board)` --references--> `Sigma Paths (Archetypes)`  [EXTRACTED]
  docs/plans/2026-04-13-aurate-research-design.md → docs/plans/2026-04-13-aurate-research-design.md  _Bridges community 2 → community 3_
- `Node.js Backend (Express/Fastify)` --references--> `AI Layer (GPT-4o Vision / Gemini Flash)`  [EXTRACTED]
  docs/plans/2026-04-13-aurate-research-design.md → docs/plans/2026-04-13-aurate-research-design.md  _Bridges community 1 → community 3_

## Hyperedges (group relationships)
- **Full Technical Architecture Stack** — aurate_research_design_react_native_expo, aurate_research_design_nodejs_backend, aurate_research_design_supabase, aurate_research_design_redis_upstash, aurate_research_design_ai_layer, aurate_research_design_infrastructure, aurate_research_design_google_admob [EXTRACTED 1.00]
- **Retention & Engagement Mechanism Cluster** — aurate_research_design_daily_vibe_check, aurate_research_design_streaks, aurate_research_design_mog_board, aurate_research_design_sigma_paths [EXTRACTED 1.00]
- **Viral Growth Engine (Share -> Acquire -> Engage)** — aurate_research_design_share_cards, aurate_research_design_tiktok_growth, aurate_research_design_growth_flywheel, aurate_research_design_ai_response_tone [EXTRACTED 1.00]

## Communities

### Community 0 - "Market & Competition"
Cohesion: 0.22
Nodes (9): AI Response Tone (Brainrot Voice), Aura Phenomenon (Cultural Concept), Aurascope (Competitor), Aurate, BeReal (Adjacent Competitor), Gas App (Adjacent Competitor - Shut Down), Rationale: People-Focused Scoring vs Object-Scanning, UI Language System (Brainrot Terminology) (+1 more)

### Community 1 - "Backend Tech Stack"
Cohesion: 0.29
Nodes (7): Infrastructure (Vercel + Railway/Fly.io + Cloudflare), Node.js Backend (Express/Fastify), Rationale: Why React Native over Flutter, Rationale: Why Supabase as Backend DB, React Native (Expo) - Mobile Framework, Redis (Upstash) - Caching & Leaderboards, Supabase (PostgreSQL + Auth + Realtime + Storage)

### Community 2 - "Product & Gamification"
Cohesion: 0.33
Nodes (6): Aura Tier System (0-1000 Scoring), Core Loop (Drop Pic -> AI Check -> Score -> Share -> Mog Board), The Mog Board (Leaderboard), North Star Metric: Daily Active Aura Checks, v2 Social Layer (Challenges, Voting, Group Checks), v3 Identity & Retention (Profile Evolution, Seasonal Events)

### Community 3 - "AI & Moderation"
Cohesion: 0.33
Nodes (6): AI Layer (GPT-4o Vision / Gemini Flash), Content Moderation Strategy, AI Prompt Architecture (Base + Path Overlay), Rationale: Gemini Flash for Scoring, GPT-4o for Personality, Risk Analysis, Sigma Paths (Archetypes)

### Community 4 - "Monetization"
Cohesion: 0.5
Nodes (4): Ad Monetization (Rewarded Video + Native Feed + Interstitial), Aurate Pro (Future Subscription Tier), Google AdMob (Ad Network), Rationale: Free + Ads over Subscription-First

### Community 5 - "Viral Growth Engine"
Cohesion: 1.0
Nodes (3): Growth Flywheel (Score -> Share -> Download -> Repeat), Share Cards (TikTok/IG Optimized Result Cards), TikTok-First Growth Strategy

### Community 6 - "Retention Mechanics"
Cohesion: 1.0
Nodes (2): Daily Vibe Check (Daily Challenge), Streaks (Consecutive Daily Uploads)

## Knowledge Gaps
- **17 isolated node(s):** `Aura Tier System (0-1000 Scoring)`, `UI Language System (Brainrot Terminology)`, `Daily Vibe Check (Daily Challenge)`, `Streaks (Consecutive Daily Uploads)`, `Aurate Pro (Future Subscription Tier)` (+12 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Retention Mechanics`** (2 nodes): `Daily Vibe Check (Daily Challenge)`, `Streaks (Consecutive Daily Uploads)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Core Loop (Drop Pic -> AI Check -> Score -> Share -> Mog Board)` connect `Product & Gamification` to `Market & Competition`, `AI & Moderation`?**
  _High betweenness centrality (0.373) - this node is a cross-community bridge._
- **Why does `AI Layer (GPT-4o Vision / Gemini Flash)` connect `AI & Moderation` to `Backend Tech Stack`, `Product & Gamification`?**
  _High betweenness centrality (0.283) - this node is a cross-community bridge._
- **Why does `Aurate` connect `Market & Competition` to `Product & Gamification`?**
  _High betweenness centrality (0.276) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Aurate` (e.g. with `Aurascope (Competitor)` and `Gas App (Adjacent Competitor - Shut Down)`) actually correct?**
  _`Aurate` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Aura Tier System (0-1000 Scoring)`, `UI Language System (Brainrot Terminology)`, `Daily Vibe Check (Daily Challenge)` to the rest of the system?**
  _17 weakly-connected nodes found - possible documentation gaps or missing edges._