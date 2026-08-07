# AURA AI Project Memory

## Project Overview
- **Main Domain**: tryauraai.in
- **Subdomains**: tablely.tryauraai.in, arena.tryauraai.in, career.tryauraai.in, coach.tryauraai.in
- **Stack**: React 18 + Vite 5 + Tailwind 3, Cloudflare Pages, Supabase, Razorpay
- **Architecture**: Subdomain-based multi-app SPA (DirectoryHome, Tablely, Arena)

---

## Session: 2026-07-29 — Aura Career Landing Page Link & Cloudflare Deploy

### Changes
- Made Aura Career card clickable in DirectoryHome.jsx (redirects to career.tryauraai.in)
- Added `cta` field for custom CTA text ("Open Aura Resume")
- Created Cloudflare Pages project `auraai-web` and deployed
- Moved domain `tryauraai.in` to existing `tryauraai` project
- Deployed to `https://tryauraai.in`

---

## Session: 2026-07-29 — AURA AI Homepage Redesign (tryauraai.in)

### New Homepage Structure
| Section | Component | Description |
|---------|-----------|-------------|
| Navbar | `Navbar.jsx` | Fixed, blur backdrop, logo + nav links + Book a Demo CTA |
| Hero | `Hero.jsx` | "The AI Operating System for India's Future" with animated gradient orbs |
| VoiceProduct | `VoiceProduct.jsx` | Flagship AURA Voice - 24/7 AI Receptionist with 3-column features |
| SaaSCards | `SaaSCards.jsx` | Restro, Coach, Career cards with tags and CTAs |
| AgencySection | `AgencySection.jsx` | Custom AI Automation Agency with feature bullets |
| LabsRoadmap | `LabsRoadmap.jsx` | Timeline with progress bars + email waitlist capture |
| Footer | `Footer.jsx` | 4-column links + copyright |

### Animations
- Scroll reveal (fade-in-up) on all sections
- Staggered card animations
- Progress bar fill on Labs Roadmap
- Hover effects (lift, border glow) on cards
- Pulsing background orbs in Hero
- Navbar blur effect on scroll

### Deployment
- Built and deployed to `tryauraai` project → live at `https://tryauraai.in`

---

## Session: 2026-07-29 — Revenue Projection Analysis

### Product Portfolio (No Custom AI Agency)
| Product | Target | Pricing | Avg MRR/User |
|---------|--------|---------|--------------|
| Tablely | Restaurants/Cafes | ₹799-₹1999/mo | ₹1,400 |
| Aura Workspace | Businesses/Students | ₹299-₹599/mo | ₹450 |
| Aura Career | Job Seekers | ₹499-₹1499/mo | ₹900 |
| Aura Coach | Tutors/Coaches | ₹499-₹1999/mo | ₹1,200 |
| AURA Voice | Service Providers | ₹499-₹999/mo + usage | ₹800 |

### Projections (Solo Founder - Only Marketing Expense)
| Scenario | Month 12 MRR | Annual Revenue | Net Margin |
|----------|--------------|----------------|------------|
| Conservative | ₹14L | ₹85L | 94% |
| Moderate | ₹38L | ₹2.5Cr | 98% |
| Aggressive | ₹85L | ₹5.5Cr | 99% |

### Infrastructure Costs (500-1000 Users)
| Service | 500 Users | 1000 Users |
|---------|-----------|------------|
| Vercel | Free | ₹1,500 |
| Supabase | Free | ₹1,500 |
| Cloudflare | Free | Free |
| Voice AI (Exotel) | ₹4,000 | ₹8,000 |
| **Total** | **₹4,000** | **₹11,000** |

### Break-even: 37 users (Month 2-3)
### Key Insight: At 30 users, you're profitable. Only real expense is marketing.

---

## Session: 2026-08-02 — Arena Slides Unified Developer Portal & Branding Update

### Objective
- Implement unified Developer Portal with 3 tabs: API Keys (B2B), Credits & Plans (B2C), Wallet (B2B pay-as-you-go)
- Update branding from "Arena" to "Arena Slides" with custom Presentation icon (remove Presentron logo dependency)
- Deploy to Cloudflare Pages (`arena-tryauraai.pages.dev`)

### Backend Changes (Cloudflare Workers)

**1. Migration: `20260802050000_wallet_topups.sql`**
- Audit table for wallet top-ups with RLS policies
- Links `user_id` → `api_key_id` → Razorpay order

**2. New Endpoints**
- `POST /api/v1/wallet/create-topup-order` — Creates Razorpay order for wallet top-up (validates key ownership)
- `POST /api/v1/wallet/verify-topup` — Verifies Razorpay HMAC signature, credits `api_keys.balance`, marks top-up completed
- `GET /api/v1/wallet/history` — Returns top-up history with key name/prefix

**3. Updated Endpoint**
- `GET /api/v1/keys` — Already returns `balance` field (via `getUserApiKeys` in `_auth.js`)

### Frontend Changes

**`src/arena/lib/api.js`**
- Added `directRequest()` helper for non-PPT endpoints (`/api/v1/*`)
- Added `createWalletTopupOrder()`, `verifyWalletTopup()`, `getWalletTopupHistory()`
- Fixed `getApiKeys()`, `createApiKey()`, `deleteApiKey()`, `getUsageSummary()` to use correct base path
- Fixed `createBillingOrder()`, `verifyBilling()` to use correct base path

**`src/arena/pages/APIKeysPage.jsx` — Complete Rewrite**
- 3-tab layout: **API Keys** | **Credits & Plans** | **Wallet**
- **API Keys Tab**: Create/revoke keys, per-key INR balance display, usage stats
- **Credits & Plans Tab**: Current plan badge, credits balance/rollover, plan cards (Free/Basic/Growth/Pro) with Razorpay checkout
- **Wallet Tab**: Per-key balance cards, Razorpay top-up flow (select key → amount → checkout), top-up history
- Visual separation: Purple theme (B2C Credits), Teal theme (B2B Wallet), Blue theme (API Keys)

### Branding Updates ("Arena" → "Arena Slides")

| File | Change |
|------|--------|
| `src/arena/components/layout/Header.jsx` | Logo: Custom `Presentation` icon (lucide) + "Arena Slides" text; removed `logo-with-bg.png` |
| `src/arena/pages/Login.jsx` | Logo: Custom `Presentation` icon; "Welcome to Arena Slides" |
| `src/arena/pages/Upgrade.jsx` | Razorpay checkout `name: 'Arena Slides'` |

### Deployments

| Deploy | URL | Notes |
|------|-----|-------|
| 1 | https://1e9531bd.arena-tryauraai.pages.dev | Initial portal + wallet deploy |
| 2 | https://25b7e0b4.arena-tryauraai.pages.dev | Branding updates |
| 3 | https://c51c974f.arena-tryauraai.pages.dev | Final branding |

### E2E Verification

- ✅ Login: 3 demo accounts (Basic/Growth/Pro)
- ✅ `/api/v1/limits` returns correct credit balances
- ✅ Credit floor enforcement (8 credits → blocked at 403, need 10)
- ✅ SPA routing works for all protected routes
- ✅ Build passes (no errors)

### Key Architecture Decisions

1. **Two distinct pricing models clearly separated in UI:**
   - **B2C Credits** (Purple): Monthly rollover plans for PPT generation
   - **B2B Wallet** (Teal): Pay-as-you-go INR balance per API key

2. **Wallet top-ups use Razorpay** (same flow as B2C plans) for consistent UX

3. **Branding fully decoupled from Presentron** — custom SVG icon + "Arena Slides" text

---

## Session: 2026-08-03 — Arena Slides Deep Improvements (Phases 1–4)

### Objective
- Deep-compare Presenton open-source (`/Users/apple/Desktop/presenton-main`) with Arena Slides
- Implement 4 phases: Content Depth → Fidelity → Editing → Infrastructure
- Switch LLM provider from OpenRouter to OpenCode Zen Go
- Enable web search (Exa → Tavily fallback)
- Deploy to Cloudflare Pages

### Current Credentials

| Key | Value | Where Used |
|-----|-------|-------------|
| ZENGO_API_KEY | `sk-o09sQAuJbcz4Fa5jQ9r8p2KTFVKML7LOG4ANybrx6bL7x2SVyjRBVYqqCislmavD` | LLM provider (.env, .dev.vars, Cloudflare secret) |
| ZENGO_MODEL | `deepseek-v4-pro` | Model selection (wrangler.toml, .env) |
| EXA_API_KEY | `89488c18-f12f-4772-987a-d26a1b534574` | Web search primary (.dev.vars, Cloudflare secret) |
| TAVILY_API_KEY | `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` | Web search fallback (.dev.vars, Cloudflare secret) |
| PEXELS_API_KEY | `ZrRj3zNUdsAhlUKCKh5mokIBM9PVAkAAWO2JO5dF2G5tUmStS3qFcl37` | Stock photos (.dev.vars, Cloudflare secret) |
| VITE_ZENGO_KEY | `sk-o09sQAuJbcz4Fa5jQ9r8p2KTFVKML7LOG4ANybrx6bL7x2SVyjRBVYqqCislmavD` | ChatBox frontend (.env) |
| VITE_SUPABASE_URL | `https://wuaqawwclchnoqljsfao.supabase.co` | Auth/DB (.env) |
| VITE_SUPABASE_ANON_KEY | `sb_publishable_WaoAQU17ocnWKvuR5HvTBA_ID9g1wXc` | Auth (.env) |
| VITE_RAZORPAY_KEY_ID | `rzp_test_xxx` | Payments, placeholder (.env) |

### LLM Provider: OpenCode Zen Go

| Before | After |
|--------|-------|
| `openrouter.ai/api/v1/chat/completions` | `opencode.ai/zen/go/v1/chat/completions` |
| `deepseek/deepseek-v4-pro` | `deepseek-v4-pro` |
| `OPENROUTER_API_KEY` | `ZENGO_API_KEY` |
| `VITE_OPENROUTER_KEY` | `VITE_ZENGO_KEY` |
| Provider id `openrouter` | Provider id `zengo` |

**Files changed**: `functions/_llm.js`, `functions/_models.js`, `src/shared/brain/client.js`, `.env`, `.dev.vars`, `wrangler.toml`

---

### Phase 1: Content Depth (Completed)

**Web Search** — `functions/_websearch.js` (created)
- Chain: Exa (neural search, ~1400/mo) → Tavily (~1000/mo free) → Serper (unset)
- 5-min QuotaGuard cooldown on 402/429 per provider
- `generateSearchQuery`: cheap LLM call to extract 5–7 word search query from user content
- `routeSearch`: per-provider adapter functions with 6s timeout, returns `{title, url, snippet}`
- `formatSearchResults`: formats top 10 results as markdown bullet list for LLM injection

**Outline Stream** — `functions/api/v1/ppt/outlines/stream/[id].js` (rewritten)
- Calls web search before outline generation when `web_search: true`
- Injects `recent_news` + `sources` into system prompt
- Stores `pres.sources` array with citations (type, title, url)
- SSE streaming with real-time progress breadcrumbs

**Parallel Slide Generation** — `functions/api/v1/ppt/presentation/stream/[id].js` (rewritten)
- `PARALLEL_BATCH = 5`: 5 concurrent LLM calls via `Promise.allSettled`
- Pre-allocated `slides` array preserves order even when calls return out-of-order
- Sources injected per-slide so each slide can reference specific facts
- Speaker notes stored at `slide.speaker_note` (top-level, not `content.__speaker_note__`)

**Frontend**
- `CreatePage.jsx`: web-search toggle (default ON), file upload with `authFetch` + `FormData`
- `PresentationPage.jsx`: FullscreenPresenter shows speaker notes (key `N`)
- `SlideRenderer.jsx`: reads `slide.speaker_note` for both normal and fullscreen modes
- `exportClient.jsx`: embeds notes via `slide.addNotes()` in PPTX export

---

### Phase 2: Fidelity (Completed)

**Image Pipeline** — `functions/_images.js` (rewritten)
- `searchStockImage`: Pexels primary → Pixabay fallback, 5s timeout, returns `{src, alt, creditText, creditUrl}`
- `iconSvgDataUri`: ~80 icon keywords mapped to real SVG paths (people, chart, star, globe, etc.)
- Smart lettered-circle fallback for unmatched keywords (first-letter circle with hash-based color)
- `hydrateImages`: per-slide image fetch with concurrency limit 5
- `buildSlideAssets`: builds full asset catalog for all slides in parallel batches
- `injectSlideImages`/`injectImagePlaceholders`: assets → schema field injection

**TOC + Title Slide** — `functions/api/v1/ppt/presentation/prepare.js` (rewritten)
- Inserts title slide at index 0 when `include_title_slide: true`
- Inserts Agenda/TOC slide at index 1 when `include_table_of_contents: true`
- Title slide: presentation title + topic metadata
- TOC slide: numbered list from slide titles (bullet slides only)

**Document Upload** — `functions/api/v1/ppt/files/upload.js` (created)
- POST multipart → extract text from TXT, MD, PDF, DOCX
- 10MB max, 50k char limit
- TXT/MD: direct read
- PDF: latin1 stream text extraction between `BT`/`ET` blocks
- DOCX: parse `word/document.xml` for `<w:t>` text nodes

---

### Phase 3: Editing & Customization (Completed)

**AI Slide Edit** — `functions/api/v1/ppt/slide/edit.js` (upgraded)
- Full AI slide regeneration: LLM re-picks appropriate layout from template
- Regenerates content matching the new layout's JSON schema
- Re-hydrates UI elements and fetches new images if needed
- Falls back to original slide on any error (no data loss)

**Theme Generator** — `functions/api/v1/ppt/theme/generate.js` (created)
- POST `{topic, mood}` → LLM generates 6-color palette + 10 graph colors
- Stored per-presentation in `pres.theme`

**Language Expansion** — `CreatePage.jsx`
- Expanded from ~8 to 47 languages including "Auto-detect"
- Covers Hindi, Bengali, Tamil, Telugu, Kannada, Malayalam, Marathi, Gujarati, Punjabi, Urdu, and more

---

### Phase 4: Infrastructure (Completed)

**Chat Conversations**
- `functions/api/v1/ppt/chat/message.js` (rewritten): persists `pres.chat_history` array per-presentation with `{role, content, at}` format, includes recent 20 messages in LLM context
- `functions/api/v1/ppt/chat/history.js` (created): GET/DELETE conversation history by `presentation_id`

**Async Tasks**
- `functions/api/v1/ppt/presentation/generate/async.js` (created): POST to queue generation, returns task with `pending` status + 202
- `functions/api/v1/ppt/presentation/status/[id].js` (created): GET task status/progress from KV (`task:` prefix)

**Webhooks**
- `functions/api/v1/webhook/subscribe.js` (created): POST/GET/DELETE for webhook subscriptions per user
- `functions/_lib.js`: `fanOutWebhooks(env, userId, event)` utility — calls all subscribed URLs with 5s timeout, bearer auth if secret set
- Triggers: `outline.completed` and `presentation.completed` events auto-fan-out after generation

**Export Quality**
- `src/arena/lib/exportClient.jsx`: `scale: 2` (2x resolution) → 2560×1440 raster slides, JPEG quality 0.92
- Result: 4x pixel density for crisp exports

---

### New Endpoints (10 total)

| Endpoint | Method | Phase |
|----------|--------|-------|
| `/api/v1/ppt/files/upload` | POST | Phase 2 |
| `/api/v1/ppt/slide/edit` | POST | Phase 3 (upgraded) |
| `/api/v1/ppt/theme/generate` | POST | Phase 3 |
| `/api/v1/ppt/chat/history` | GET/DELETE | Phase 4 |
| `/api/v1/ppt/presentation/generate/async` | POST | Phase 4 |
| `/api/v1/ppt/presentation/status/{id}` | GET | Phase 4 |
| `/api/v1/webhook/subscribe` | POST/GET/DELETE | Phase 4 |

---

### Deployment: 2026-08-03

| Item | Value |
|------|-------|
| Phase 1-4 URL | `https://08245be5.arena-tryauraai.pages.dev` |
| Bug Fix Arena | `https://f8f143fd.arena-tryauraai.pages.dev` |
| Bug Fix Main | `https://aa52e58a.tryauraai.pages.dev` → **`https://tryauraai.in`** |
| Project | `arena-tryauraai` (arena.tryauraai.in) + `tryauraai` (tryauraai.in) |
| Secrets (both) | `ZENGO_API_KEY`, `EXA_API_KEY`, `TAVILY_API_KEY`, `PEXELS_API_KEY` |
| KV Namespace | `ARENA_KV` (id: `e4a00421b3cf4ffc964733dd1c103f57`) |
| Build | 11.7s initial, 29.6s bug-fix, 246 files, 47 functions |

### Verified Working
- Template API: returns all 7 templates (executive, momentum, dynamic, general, modern, standard, swift)
- Exa search: live search results (1.18s response, neural search)
- Tavily search: live search results (0.93s response)
- ZenGo LLM: `deepseek-v4-pro` returns valid completions
- Local wrangler dev: compiled successfully, all 5 secrets loaded, KV bound

### Known Issues (Not Fixed)
- `public/_redirects`: SPA catch-all `/* → /index.html 200` intercepts API routes on first CDN hit but corrects after Function execution

---

## Session: 2026-08-03 — Transcript (Complete)

### 1. User asked for missing API keys → Added EXA_API_KEY + TAVILY_API_KEY
- User provided `EXA_API_KEY` and `TAVILY_API_KEY`
- Wrote both keys into `.dev.vars`
- Verified live: Exa (1.18s neural search) and Tavily (0.93s) both returning valid results
- Restarted wrangler dev — all 5 secrets loaded correctly

### 2. User asked to switch LLM provider → OpenRouter → OpenCode Zen Go
- User specified: base URL `https://opencode.ai/zen/go/v1`, model `deepseek-v4-pro`, API key provided
- Changed 6 files:
  - `functions/_llm.js`: URL, key env var (`OPENROUTER_API_KEY` → `ZENGO_API_KEY`), function names, removed OpenRouter-specific headers
  - `functions/_models.js`: internal IDs simplified (no `deepseek/` prefix), comments updated
  - `src/shared/brain/client.js`: ChatBox URL, model registry (simplified to 2 models), removed Anthropic cache logic, removed OpenRouter headers
  - `.env`: keys renamed (`ZENGO_API_KEY`, `ZENGO_MODEL`, `VITE_ZENGO_KEY`)
  - `.dev.vars`: key renamed
  - `wrangler.toml`: removed `OPENROUTER_MODEL`/`OPENROUTER_FALLBACK_MODEL`, added `ZENGO_MODEL`
- Verified ZenGo API: `deepseek-v4-pro` returns valid completions

### 3. User asked to test and deploy → Cloudflare Pages
- Fixed `generate/async.js` import path (4→5 levels deep)
- Compiled Worker successfully in `wrangler pages dev`
- Set 4 Cloudflare secrets via `wrangler pages secret put`
- Deployed to `arena-tryauraai` → `https://08245be5.arena-tryauraai.pages.dev`
- Verified: template API returns 7 templates

### 4. User reported empty slides — diagnosed and fixed DeepSeek reasoning model bug
- **Root cause**: DeepSeek v4-pro is a reasoning model. With tight `max_tokens`, it exhausts all tokens on `reasoning_content` (chain-of-thought), leaving `content` empty. `llmJson`/`llmStructured`/`llmText`/`llmComplete` only read `content` — producing empty slides.
- **4 fixes applied**:
  - `_llm.js`: new `extractContent()` helper — reads `content` first, falls back to `reasoning_content`
  - Token limits raised: outline 6k→10k, layout 2k→4k, slide 4k→8k
  - `_slidegen.js:520`: `lines.write` → `lines.push` (was silent no-op on array)
  - `presentation/stream/[id].js`: fallback now parses `outline.content` instead of discarding it
- Verified: direct ZenGo test with 3-slide outline → all slides have 277–415 chars of real content

### 5. User asked to deploy to main website → tryauraai.in
- Synced all 4 secrets to `tryauraai` project via `wrangler pages secret put`
- Deployed dist to `tryauraai` project → `https://aa52e58a.tryauraai.pages.dev`
- Propagated to main domain → **`https://tryauraai.in`** — template API returns 7 templates

### 6. User asked to save credentials + update memory1.md

### Current State

| Layer | Config |
|-------|--------|
| LLM Provider | OpenCode Zen Go (`opencode.ai/zen/go/v1`) |
| Model | `deepseek-v4-pro` |
| Web Search | Exa (primary) → Tavily (fallback) |
| Stock Photos | Pexels → Pixabay |
| Frontend ChatBox | ZenGo (`VITE_ZENGO_KEY`) |
| Active Deploy (main) | `https://tryauraai.in` |
| Active Deploy (arena) | `https://arena.tryauraai.in` |

### Credentials (complete)

| Key | Value |
|-----|-------|
| `ZENGO_API_KEY` | `sk-o09sQAuJbcz4Fa5jQ9r8p2KTFVKML7LOG4ANybrx6bL7x2SVyjRBVYqqCislmavD` |
| `EXA_API_KEY` | `89488c18-f12f-4772-987a-d26a1b534574` |
| `TAVILY_API_KEY` | `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` |
| `PEXELS_API_KEY` | `ZrRj3zNUdsAhlUKCKh5mokIBM9PVAkAAWO2JO5dF2G5tUmStS3qFcl37` |
| `VITE_ZENGO_KEY` | `sk-o09sQAuJbcz4Fa5jQ9r8p2KTFVKML7LOG4ANybrx6bL7x2SVyjRBVYqqCislmavD` |
| `VITE_SUPABASE_URL` | `https://wuaqawwclchnoqljsfao.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `sb_publishable_WaoAQU17ocnWKvuR5HvTBA_ID9g1wXc` |
| `VITE_RAZORPAY_KEY_ID` | `rzp_test_xxx` (placeholder) |

### Files Modified in This Session

| File | Change |
|------|--------|
| `.dev.vars` | Added EXA_API_KEY, TAVILY_API_KEY; replaced OPENROUTER with ZENGO_API_KEY |
| `.env` | Replaced OPENROUTER with ZENGO keys; set VITE_ZENGO_KEY |
| `wrangler.toml` | Removed OPENROUTER vars, added ZENGO_MODEL |
| `functions/_llm.js` | ZenGo URL, extractContent() fallback for reasoning models |
| `functions/_models.js` | Simplified internal IDs (no prefix), comment updates |
| `src/shared/brain/client.js` | ZenGo URL, simplified model registry, removed Anthropic cache logic |
| `functions/_slidegen.js` | Fixed `lines.write` → `lines.push` |
| `functions/api/v1/ppt/presentation/stream/[id].js` | Token bumps + fallback uses outline.content |
| `functions/api/v1/ppt/outlines/stream/[id].js` | Token bump 6k→10k |
| `functions/api/v1/ppt/presentation/generate/async.js` | Fixed import path depth |
| `memory1.md` | Full session transcript + credentials |

### Files Created in This Session

| File | Purpose |
|------|---------|
| `functions/_websearch.js` | Exa/Tavily/Serper adapters + query refinement |
| `functions/api/v1/ppt/files/upload.js` | TXT/MD/PDF/DOCX text extraction |
| `functions/api/v1/ppt/theme/generate.js` | LLM palette generation |
| `functions/api/v1/ppt/chat/history.js` | GET/DELETE conversation history |
| `functions/api/v1/ppt/presentation/generate/async.js` | Queue async generation |
| `functions/api/v1/ppt/presentation/status/[id].js` | Task status from KV |

### Known Issues (Not Fixed)
- `public/_redirects`: SPA catch-all `/* → /index.html 200` intercepts API routes on first CDN hit but corrects after Function execution

---

## Session: 2026-08-03 — Arena Credit Deduction (Live Billing)

### Objective
- Make credit deduction work end-to-end: 2 credits on outline generation, 15–20 credits (scaled) on Generate Slides, header balance updating immediately.

### Charge Rules
| Action | Credits |
|--------|---------|
| Outline generation | 2 |
| Generate Slides | `clamp(ceil(nSlides), 15, 20)` |
| Create time | No charge |

### Root Cause
- `deductCredits()` treated ANY 2xx RPC response as success → never actually deducted.

### Fix
- **`functions/_plans.js:166`** `deductCredits` rewritten: only trusts the RPC result when it returns a numeric new balance; otherwise falls back to a direct upsert/decrement on `user_plans`.
- Migration: `supabase/migrations/20260803000000_create_deduct_credits_fn.sql` (may need manual apply to prod DB, fallback makes it work without).
- Verified live: balance 50 → 35 on 10-slide prepare (15 credits).
- Commits: `248122f` (feat), `8613293` (TDZ fix).

---

## Session: 2026-08-03 — Tablely Dashboard Fixes (TDZ, Staff Links, Owner Auth)

### Objective
- Fix customer/staff/owner dashboards on all devices (phones, tablets), including a TDZ crash, staff redirects, and the owner dashboard link.

### Two Separate Cloudflare Pages Projects (important)
- `arena-tryauraai` → `arena.tryauraai.in`
- `tablely-tryauraai` → `tablely.tryauraai.in`
- Deployments must go to BOTH; tablely domain serves from `tablely-tryauraai`.

### Fixes (commits in order: `8613293` → `82356fa` → `ba06023` → `a4f6ef1`)

1. **TDZ crash** — `CustomerMenu.jsx`: `allItems` was used in `fastDeliveryItems` before its declaration ("Cannot access 'ut' before initialization"). Moved `allItems` before `fastDeliveryItems` (lines 83–92).
2. **Stale deploy** — tablely was deployed to the wrong project. Re-deployed to `tablely-tryauraai`; added `<meta name="build-id">` cache-buster to `index.html`.
3. **Staff link/redirects** (`ba06023`):
   - `OwnerDashboard.jsx` staff card → clickable `Open Staff Login` anchor (`target="_blank"`) to `/:restaurantId/staff/login`.
   - `ProtectedRoute.jsx:23-25`: staff-role mismatch redirects to `/:restaurantId/staff/login` instead of `/`.
   - `AuthContext.jsx`: `signInAsStaff` sets `loading: true` before `setSession` to prevent hydration race.
4. **Owner auth hydration race** (`a4f6ef1`):
   - `signInAsOwner`/`signUpAsOwner` set `loading: true` before sign-in and `setLoading(false)` on error.
   - `hydrateUser` wrapped in try/catch/finally — falls back to `user_metadata` on query failure so `loading` always resolves.

### Dashboard Button Verification
- Live site confirmed running latest bundle (chunk `App-7uHM3YxW.js` contains `hydrateUser failed` + `Open Staff Login`).
- Restaurant `chakna` exists in `restaurants` (owner_id `0cbd3aa3-…`); all related tables have public-read RLS.
- Full E2E verified with a throwaway owner account + test restaurant: login → Dashboard button appears → navigates to owner dashboard. Test data cleaned up afterward.
- 28/28 device checks passed (iPhone, Android, iPad, Android Tablet) across homepage, owner login, staff login, customer login, demo, and redirects.

---

*End of memory*

---

## Session: 2026-08-04 — Arena Slides Content Density Restoration (Match Presentron)

### Problem
- Per-slide content was sparse/terse compared to Presentron, even though templates (which carry `min_length`/`max_length` constraints) are byte-for-byte identical between the two repos.
- Root cause: Arena's per-slide LLM call used soft `json_object` mode (schema only advisory text in prompt), while Presentron enforces constraints via strict `json_schema` response_format + a validation retry loop.

### Investigation
- Diffed both codebases' slide-generation stacks (prompts, schemas, LLM helpers, model routing).
- Confirmed template `min_length`/`max_length` values are identical across all 7 templates (executive/momentum/dynamic/general/modern/standard/swift).
- Identified 9 differences responsible for the sparseness; user approved fixing all 9.

### Fixes Applied (all in `functions/`, no frontend changes)

| # | Fix | File | Change |
|---|-----|------|--------|
| 1 | Strict `json_schema` response mode for per-slide content call | `api/v1/ppt/presentation/stream/[id].js` | `generateSlideContent` rewritten — `llmJson` → `llmStructured` with `responseFormat: { type:'json_schema', json_schema:{ name:'slide_content', schema, strict:false } }` |
| 2 | Schema validation retry loop (3 passes) | `_slidegen.js` + `presentation/stream/[id].js` | New `validateSlideContent(content, schema)` export walks schema recursively, checks `minLength`/`maxLength`/`minItems`/`maxItems`; on violation, appends assistant + user-feedback messages and re-calls LLM |
| 3 | Removed layout-prompt content truncation | `_slidegen.js:layoutSelectionPrompt` | `outlines[i].content.slice(0,300)` → full content |
| 4 | Removed layout-description truncation | `_slidegen.js:layoutSelectionPrompt` | `l.description.slice(0,200)` → full description |
| 5 | Added markdown emphasis rule | `_slidegen.js:slideContentPrompt` | `"- Strictly use markdown to emphasize important points, by bolding or italicizing the part of text."` |
| 6 | Raised slide-content temperature | `presentation/stream/[id].js` | `0.7` → `0.9` (closer to Presentron's unset ~1.0 default) |
| 7 | Raised slide-content max_tokens | `presentation/stream/[id].js` | `8000` → `16000` |
| 8 | Strengthened verbosity wording | `_slidegen.js:slideContentPrompt` | `"Be detailed and text-heavy."` → `"# Verbosity Instructions:\nMake slide as text-heavy as possible. Fill every text field close to its maxLength."` (and similar for concise/standard); added `"For each text field, write content close to its maxLength."` before `# Output Fields:` |
| 9 | Raised `MAX_OUTLINE_WORDS` cap | `api/v1/ppt/outlines/stream/[id].js` | `80` → `100` (matches Presentron `MAX_OUTLINE_CONTENT_WORDS`) |

### Model Decision
- Kept `deepseek-v4-pro` as the default for slide generation (not switched to `kimi-k2.7-code`).
- Reasoning: Presentron gets dense slides via schema strictness (Fix #1+#2), not better prose. Reasoning models are actually better at structured output; switching models is the wrong lever.
- Fallback chain `deepseek-v4-pro → kimi-k2.7-code` already covers failure cases (and kimi-k2.7-code is code-tuned, less natural at marketing copy).

### Files Modified (3)

| File | Lines touched |
|------|--------------|
| `functions/api/v1/ppt/presentation/stream/[id].js` | imports (drop `llmJson`/`cleanJsonText`, add `validateSlideContent`); `generateSlideContent` rewrite (83-163): strict `json_schema` + retry loop + temp 0.9 + max_tokens 16000 |
| `functions/_slidegen.js` | `layoutSelectionPrompt` (lines ~454, ~470 — drop truncations); `slideContentPrompt` (510, 519-521, 530 — markdown rule + verbosity wording + fill-to-max instruction); new `validateSlideContent` export (~577); |
| `functions/api/v1/ppt/outlines/stream/[id].js` | `MAX_OUTLINE_WORDS = 100` (line 8) |

### Verification
- esbuild parses all 3 modified files cleanly with no errors (Worker-compatible ESM).
- Exports confirmed present: `layoutSelectionPrompt`, `slideContentPrompt`, `prepareResponseSchema`, `validateSlideContent`.
- Local wrangler dev test + live generation test pending user run.

### Risk Notes
- ~1.8–2x token cost per slide (longer fields + retries + higher max_tokens).
- Retry loop only triggers on schema violations (rare after first run for `deepseek-v4-pro`).
- If ZenGo rejects `json_schema` strict for slide content (Stage 1 layout selection already uses this mode successfully), the retry-loop branch's `catch {}` will degrade gracefully to empty content (template defaults preserved).

### Next Steps (suggested)
1. Run `wrangler pages dev` locally with all 5 secrets loaded (per Aug-3 session).
2. Generate a 3-slide test deck for `"AI in Healthcare"`, verb=text-heavy, and compare per-field char counts vs the chosen layout's `minLength`/`maxLength` — expect values close to maxLength.
3. Deploy to `arena-tryauraai` Cloudflare Pages project (and `tryauraai` for the main domain if confirmed working).

---

## Finding: ZenGo + deepseek-v4-pro does NOT support `json_schema`

- **Date**: 2026-08-05
- **Observation**: ZenGo's implementation of `deepseek-v4-pro` does not support `response_format: { type: 'json_schema', ... }`. Attempting to use it causes failures or the response falls back to unstructured text.
- **Future Plan**: Switch to **OpenRouter** for features that require strict `json_schema` / structured output. OpenRouter's proxy supports `json_schema` properly, so any new feature needing schema-constrained generation should use OpenRouter instead of ZenGo.
- **Action**: When the next feature requiring `json_schema` is built, wire it through OpenRouter (`openrouter.ai/api/v1/chat/completions`) rather than ZenGo.

---

*End of memory*