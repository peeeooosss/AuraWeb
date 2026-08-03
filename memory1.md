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

### Deployment: 2026-08-03 (Phase 1-4)

| Item | Value |
|------|-------|
| Deploy URL | `https://08245be5.arena-tryauraai.pages.dev` |
| Platform | Cloudflare Pages (`arena-tryauraai`) |

### Deployment: 2026-08-03 (Bug Fix)

| Item | Value |
|------|-------|
| Arena Deploy | `https://f8f143fd.arena-tryauraai.pages.dev` |
| Main Deploy | `https://aa52e58a.tryauraai.pages.dev` → `https://tryauraai.in` |
| Platform | Cloudflare Pages |
| Secrets | ZENGO_API_KEY, EXA_API_KEY, TAVILY_API_KEY, PEXELS_API_KEY (both projects) |
| KV Namespace | `ARENA_KV` (id: `e4a00421b3cf4ffc964733dd1c103f57`) |
| Cloudflare Secrets | `ZENGO_API_KEY`, `EXA_API_KEY`, `TAVILY_API_KEY`, `PEXELS_API_KEY` |
| Build | 11.7s, 246 files uploaded, 47 function files pass `node --check` |

### Verified Working
- Template API: returns all 7 templates (executive, momentum, dynamic, general, modern, standard, swift)
- Exa search: live search results (1.18s response, neural search)
- Tavily search: live search results (0.93s response)
- ZenGo LLM: `deepseek-v4-pro` returns valid completions
- Local wrangler dev: compiled successfully, all 5 secrets loaded, KV bound

### Known Issues (Not Fixed)
- `public/_redirects`: SPA catch-all `/* → /index.html 200` intercepts API routes on first CDN hit but corrects after Function execution

---

## Session: 2026-08-03 — Bug Fix: Empty Slide Content with DeepSeek v4-pro (Reasoning Model)

---

*End of memory*