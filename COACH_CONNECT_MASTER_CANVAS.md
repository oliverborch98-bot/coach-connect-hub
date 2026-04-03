# 🧠 COACH CONNECT MASTER CANVAS
## Built By Borch — Business Brain & Permanent Knowledge Vault

> **PURPOSE**: This file is the single source of truth for everything Oliver knows, builds, and ships. Claude reads this at the start of every session. It covers the platform, the tools, the strategy, the design system, and the SaaS pivot plan. Everything is here.

---

## TABLE OF CONTENTS

1. [Platform Identity](#1-platform-identity)
2. [Tech Stack & Infrastructure](#2-tech-stack--infrastructure)
3. [Database Schema](#3-database-schema)
4. [Design System](#4-design-system)
5. [UI/UX Pro Max Framework](#5-uiux-pro-max-framework)
6. [BLAST Framework (Jack Roberts / AntiGravity)](#6-blast-framework-jack-roberts--antigravity)
7. [Vibe Design Process](#7-vibe-design-process)
8. [AI & Automation Tools](#8-ai--automation-tools)
9. [MCP Arsenal](#9-mcp-arsenal)
10. [Competitor Analysis & SaaS Strategy](#10-competitor-analysis--saas-strategy)
11. [Multi-Tenant SaaS Pivot Plan](#11-multi-tenant-saas-pivot-plan)
12. [Hidden Technical Traps](#12-hidden-technical-traps)
13. [Content & Growth Systems](#13-content--growth-systems)
14. [Rules & Non-Negotiables](#14-rules--non-negotiables)

---

## 1. PLATFORM IDENTITY

| Property | Value |
|---|---|
| **Brand** | Built By Borch |
| **Product** | Coach Connect Hub |
| **Owner** | Oliver André Borch Rojas |
| **Role** | Online fitness coach + VVS lærling |
| **URL (Production)** | coach-connect-hub-fvr4.vercel.app |
| **GitHub Repo** | coach-connect-hub |
| **Branches** | `main` (production) / `ai-dev` (development) |
| **Supabase Project ID** | nlvqrpxszbdpvqzwqifg |

### What the platform does TODAY (Single-Coach):
- Coach manages clients: training programs, nutrition plans, check-ins, habits, messages, progress photos, payments
- Clients access their dashboard: workouts, nutrition, check-ins, AI chat, leaderboard, transformation
- Built for Oliver's own coaching business — not yet white-labeled

### What the platform becomes (SaaS Vision):
- Multi-tenant B2B2C platform
- Any fitness coach can sign up, get their own white-labeled version
- Coaches get custom branding (logo, colors, domain)
- Clients never see "Coach Connect Hub" — they see "Your Coach's Brand"
- Revenue model: Monthly SaaS fee per coach + optional revenue share

---

## 2. TECH STACK & INFRASTRUCTURE

### Frontend
```
React 18.3.1 + Vite 5.4.11 + TypeScript
Routing: react-router-dom v6
State/Data: @tanstack/react-query v5
UI: Tailwind CSS + Radix UI + shadcn/ui
Animations: framer-motion
Charts: recharts
Forms: react-hook-form + zod
```

### Backend
```
Supabase (Postgres + Auth + Edge Functions + Storage + Realtime)
Stripe (Payments + Subscriptions)
```

### Deployment
```
Frontend: Vercel (auto-deploy from GitHub main)
Database: Supabase cloud (hosted Postgres)
Edge Functions: Supabase (Deno runtime)
```

### Environment Variables (Vercel)
```
VITE_SUPABASE_URL
VITE_SUPABASE_PROJECT_ID
VITE_SUPABASE_PUBLISHABLE_KEY
```
> ⚠️ ALWAYS use VITE_ prefix for client-side env vars in Vite

### Key File Locations
```
src/App.tsx                          → Main routing + auth logic
src/integrations/supabase/client.ts  → Supabase client init
src/integrations/supabase/types.ts   → Database TypeScript types
src/contexts/AuthContext.tsx         → Auth state management
src/contexts/ThemeProvider.tsx       → Theme/branding context
src/layouts/CoachLayout.tsx          → Coach dashboard shell
src/layouts/ClientLayout.tsx         → Client dashboard shell
```

---

## 3. DATABASE SCHEMA

### Current Tables (Single-Tenant)

| Table | Purpose |
|---|---|
| `profiles` | Core user identity (Coach/Client roles) |
| `client_profiles` | Extended client data (package, coach assignment, goals) |
| `subscriptions` | Stripe subscription state |
| `payment_events` | All payment transaction records |
| `exercises` | Global exercise library |
| `training_programs` | Client-specific workout programs |
| `training_days` | Days within a program |
| `training_exercises` | Exercises assigned to days |
| `workout_logs` | Recorded sets, reps, weight |
| `nutrition_plans` | Client-specific meal plans |
| `meals` | Individual meals within a plan |
| `weekly_checkins` | Client reports + coach feedback |
| `progress_photos` | Uploaded progress images |
| `phases` | Higher-level program phases |
| `goals` | Specific targets (weight, strength) |
| `milestones` | Sub-tasks for goals |
| `daily_habits` | Habit definitions per client |
| `habit_logs` | Daily habit completion state |
| `coaching_calls` | Scheduled call records |
| `coach_notes` | Internal coach observations |
| `messages` | Chat history (coach ↔ client) |
| `notifications` | In-app alerts |
| `resources` | Coaching materials and documents |
| `onboarding_responses` | Onboarding wizard collected data |
| `body_measurements` | Physical metrics tracking |
| `access_requests` | New client signup requests |
| `recipes` | Global recipe library |
| `coach_default_habits` | Templates for standard habits |

### Multi-Tenant Tables to ADD (SaaS Pivot)

```sql
-- NEW: Tenant (Coach Account) table
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,          -- e.g., "built-by-borch"
  owner_id UUID REFERENCES profiles(id),
  brand_name TEXT NOT NULL,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#D4A853',
  secondary_color TEXT DEFAULT '#1a1a2e',
  custom_domain TEXT,
  stripe_account_id TEXT,             -- Stripe Connect
  plan TEXT DEFAULT 'free',           -- free/pro/enterprise
  created_at TIMESTAMPTZ DEFAULT now()
);

-- MODIFY: profiles table
ALTER TABLE profiles ADD COLUMN tenant_id UUID REFERENCES tenants(id);

-- RLS Policy example (CRITICAL)
CREATE POLICY "tenant_isolation" ON client_profiles
  USING (tenant_id = get_current_tenant_id());
```

---

## 4. DESIGN SYSTEM

### Color Palette (NON-NEGOTIABLE)
```
Background:  #1a1a2e  (Ultra-dark navy/black)
Accent:      #D4A853  (Premium gold)
Text:        #FFFFFF  (White primary)
Subtext:     #9CA3AF  (Gray secondary)
```

> ❌ NO lime green. NO neon colors. NO bright colors. Dark + Gold ONLY.

### Typography
- **Heading**: Modern, sleek sans-serif (e.g., Inter, Geist, DM Sans)
- **Body**: Clean, readable sans-serif
- **UI Text**: All Danish language

### Layout Principles
- One hero visual per viewport
- Mobile responsive always
- 60-30-10 color rule (60% dark bg / 30% midtone / 10% gold accent)
- Glassmorphism for cards: `backdrop-blur + semi-transparent bg`

### Component Library
- **Base**: shadcn/ui (Radix UI primitives)
- **Icons**: lucide-react
- **Animations**: framer-motion
- **Charts**: recharts

---

## 5. UI/UX PRO MAX FRAMEWORK

### The 5 Design Dimensions

| Dimension | Options |
|---|---|
| **Pattern/Layout** | Bento Grid, Asymmetric, Centered, Split, Full-Bleed, Sticky Sidebar |
| **Style/Aesthetic** | Glassmorphism, Neubrutalism, Aurora UI, Linear/Vercel, Minimalist, Luxury |
| **Color/Theme** | Dark mode, Monochrome, Gradient mesh, Duotone |
| **Typography** | Display fonts, Editorial, Geometric sans, Humanist |
| **Animations** | Micro-interactions, Page transitions, Parallax, Spring physics, Scroll-triggered |

### Recommended Design Combos for Built By Borch

**Option A — Premium Coach Dashboard**:
- Layout: Bento Grid + Sticky Sidebar
- Style: Glassmorphism + Linear Aesthetic
- Color: Ultra-dark + Gold gradient
- Type: Geist/DM Sans
- Animation: Framer spring + fade-in on scroll

**Option B — Client-Facing Landing Page**:
- Layout: Full-bleed + Centered hero
- Style: Aurora UI + subtle 3D (Spline)
- Color: Dark navy + gold glow
- Type: Bold display + light body
- Animation: Particle effects + scroll parallax

### Design Anti-Patterns (NEVER DO)
- ❌ Rainbow gradients
- ❌ Comic Sans or decorative fonts
- ❌ Low-contrast text (fails WCAG AA)
- ❌ More than 3 primary colors
- ❌ Inconsistent border-radius
- ❌ Animations that block user action
- ❌ Modal-inside-modal

### WCAG Accessibility (Non-Negotiable)
- Minimum contrast ratio: 4.5:1 for body text
- Focus states on all interactive elements
- Alt text on all images
- Keyboard navigation support

### Animation Performance Rules
```css
/* ALWAYS use these for GPU-accelerated animations */
transform: translateX/Y/Z
opacity
/* NEVER animate these (cause layout reflow) */
width, height, top, left, margin, padding
```

---

## 6. BLAST FRAMEWORK (Jack Roberts / AntiGravity)

The BLAST Framework is the core workflow for every build. Execute in order, every time.

### B — Blueprint
- Create `task.md` with project brief
- Define design tokens (colors, fonts, spacing)
- Map all pages/components needed
- Write the "Done When" criteria

### L — Link
- Connect all MCPs (Universal Remotes):
  - Vercel MCP
  - Supabase MCP
  - GitHub MCP (if available)
- Verify env vars are set

### A — Architect
- Build frontend and backend **in parallel**
- Frontend: components, routing, state
- Backend: database schema, Edge Functions, RLS policies
- Use TypeScript types from Supabase at all times

### S — Style (Vibe Design)
- Apply Spline 3D hero asset
- Integrate 21st.dev / CodePen components
- Apply color palette and typography
- Add framer-motion animations

### T — Trigger
- Run Pre-Deployment Checklist
- Push to `ai-dev` branch
- Verify on localhost (or Vercel Preview)
- Merge to `main` → Vercel auto-deploys

### MCP Configs for BLAST
```json
// Vercel MCP
"vercel": {
  "command": "npx",
  "args": ["-y", "@vercel/mcp-server"],
  "env": { "VERCEL_API_KEY": "<YOUR_VERCEL_TOKEN>" }
}

// Supabase MCP
"supabase": {
  "command": "npx",
  "args": ["-y", "@supabase/mcp-server-supabase@latest", "--access-token", "<YOUR_SUPABASE_TOKEN>"]
}
```

---

## 7. VIBE DESIGN PROCESS

Step-by-step design workflow for every new UI screen:

### Step 1: Hero Asset (Spline 3D)
1. Go to spline.design → Discover → Community
2. Search for assets matching brand vibe (dark, premium, fitness/tech)
3. Export as vanilla JS web content
4. Integrate using the Spline skill in AntiGravity

### Step 2: Font Selection
- **Reference sites**: fontsinuse.com, typewolf.com, fonts.google.com
- **Method**: Screenshot a font you like → drop in AntiGravity → "match this font"
- **Built By Borch fonts**: DM Sans, Geist, or Inter (sleek, modern)

### Step 3: UI Component Sniping
- Go to **21st.dev** → search buttons, cards, testimonials, forms
- Go to **codepen.io** → trending interactive elements
- Copy URL or code → paste into AntiGravity → integrate

### Step 4: Image Generation
- Use **weevi.ai** (Nano Banana Pro model)
- Drop reference images + hex colors + text prompt
- Download minimum 2K resolution
- Remove background in Canva if needed

### Step 5: Color Extraction
- Screenshot current site
- Drop in Canva → color picker → extract hex codes
- Apply consistently across all elements

---

## 8. AI & AUTOMATION TOOLS

### Core AI Stack

| Tool | Purpose | Cost |
|---|---|---|
| **AntiGravity (Google)** | IDE/agentic coding environment using Claude Code | Free (Google credits) |
| **Claude** (Anthropic) | Primary AI brain for coding, strategy, content | Paid |
| **Open Router** | Access to 20+ AI models incl. free ones | Free tier available |
| **NotebookLM** | Research synthesis, podcast-style summaries from docs | Free |
| **ElevenLabs** | Voice AI — clone Oliver's voice for content | Paid |
| **Weevi.ai** | AI image generation (Nano Banana Pro model) | Paid |

### Automation & Scraping

| Tool | Purpose |
|---|---|
| **Appify** | Web scraping for lead generation |
| **Zapier** | Workflow automation between tools |
| **Railway** | Cloud hosting for always-on backend services |
| **Telegram Bot** | Gravity Claw personal AI assistant interface |

### Video & Content

| Tool | Purpose |
|---|---|
| **Remotion** | Programmatic video creation in React/TypeScript |
| **Spline** | 3D website assets and interactive 3D |

### Gravity Claw (Personal AI Assistant)
- Built on **Telegram + Claude Code**
- Always-on AI assistant accessible from phone
- Can execute tasks, answer questions, manage workflows
- Deployed on **Railway** for persistent hosting
- Use case: "Hey Gravity Claw, what should I post today?"

### Pinecone RAG (Vector Memory)
- **Pinecone**: Vector database for semantic search
- **RAG** = Retrieval Augmented Generation
- Use case: Feed all coaching knowledge → AI can answer client questions accurately
- Integration: Supabase Edge Function → Pinecone API → Claude response

### Remotion (Programmatic Video)
- Create workout highlight reels from logged data
- Auto-generate progress videos for clients
- Build Instagram Reels programmatically
- Tech: React components → rendered to MP4

---

## 9. MCP ARSENAL

MCPs (Model Context Protocol) are "Universal Remotes" — they give Claude Code direct control over external services.

### Active / Recommended MCPs

| MCP | What It Does | Priority |
|---|---|---|
| **Vercel MCP** | Deploy, manage projects, env vars, domains | 🔴 CRITICAL |
| **Supabase MCP** | Run queries, manage schema, RLS policies, Edge Functions | 🔴 CRITICAL |
| **GitHub MCP** | Push commits, create PRs, manage branches | 🟡 HIGH |
| **Stripe MCP** | Create products, manage subscriptions, handle webhooks | 🟡 HIGH |
| **Notion MCP** | Read/write Notion docs (CRM, knowledge base) | 🟢 MEDIUM |
| **Google Calendar MCP** | Schedule coaching calls automatically | 🟢 MEDIUM |
| **Gmail MCP** | Send automated email sequences | 🟢 MEDIUM |
| **WhatsApp MCP** | Client messaging automation | 🟢 MEDIUM |
| **Zapier Tables MCP** | Database-lite for automation triggers | 🟢 MEDIUM |
| **Zoom MCP** | Create/manage coaching call links | 🔵 NICE-TO-HAVE |

### MCP Config Location
```
/sessions/nice-amazing-hypatia/mnt/coach-connect-hub/.mcp.json
```

### How to Add an MCP
1. Get API key from the service
2. Add config to `.mcp.json`
3. Reload Claude Code session
4. Test with a simple command

---

## 10. COMPETITOR ANALYSIS & SAAS STRATEGY

### Primary Competitors

| Platform | Strengths | Weaknesses | Our Edge |
|---|---|---|---|
| **Everfit** | Mature, reliable, many coaches | Generic branding, expensive, complex | Better Custom Branding Engine — coaches change CSS/logo via UI, not code |
| **Beefit** | Social features, creator focus | Weak sales/monetization tools | Better Creator Monetization — sales landing pages, Stripe Connect revenue share |
| **Trainerize** | Enterprise, integrations | Old UI, feels dated | Modern dark aesthetic, AI-first, faster |
| **TrueCoach** | Simple, coach-friendly | Very limited features | Full feature set + AI builders |

### Competitive Moats to Build

**Moat 1: Custom Branding Engine (beats Everfit)**
- Coach uploads logo → instantly applied everywhere
- Coach picks brand colors via color picker → CSS variables update live
- Coach sets custom domain (coach.yourbrand.com) → Vercel domain routing
- Result: Clients never see "Coach Connect" — they see YOUR brand

**Moat 2: Creator Monetization Engine (beats Beefit)**
- Sales landing page builder built-in (drag & drop or template-based)
- Coaches sell programs, courses, group challenges to their audience
- Stripe Connect: Oliver takes 5-10% platform fee, coach keeps the rest
- Built-in affiliate system: coaches refer other coaches → passive income

**Moat 3: AI-First Platform (beats everyone)**
- AI Program Builder: Generate a full 12-week program from client data
- AI Nutrition Builder: Generate macros/meal plans from goals
- AI Check-in Analysis: Summarize weekly check-ins, flag red flags
- AI Client Assistant: Clients ask questions → gets coach's "voice" back

### Pricing Strategy (Multi-Tenant SaaS)

| Tier | Price/month | Includes |
|---|---|---|
| **Starter** | Free | 1-5 clients, built-by-borch branding |
| **Pro** | 299 DKK (~40 EUR) | 50 clients, custom logo/colors, AI builders |
| **Scale** | 599 DKK (~80 EUR) | Unlimited clients, custom domain, monetization tools |
| **Enterprise** | Custom | White-label, API access, dedicated support |

---

## 11. MULTI-TENANT SAAS PIVOT PLAN

### Phase 0: Foundation (Week 1-2) — DATABASE
> Most critical. Build this wrong = rebuild everything later.

**Step 1: Add `tenant_id` to ALL tables**
```sql
-- Run this in Supabase SQL editor
ALTER TABLE profiles ADD COLUMN tenant_id UUID;
ALTER TABLE client_profiles ADD COLUMN tenant_id UUID;
ALTER TABLE training_programs ADD COLUMN tenant_id UUID;
ALTER TABLE nutrition_plans ADD COLUMN tenant_id UUID;
ALTER TABLE messages ADD COLUMN tenant_id UUID;
-- ... repeat for ALL tables
```

**Step 2: Create the `tenants` table**
```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID REFERENCES profiles(id),
  brand_name TEXT NOT NULL,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#D4A853',
  secondary_color TEXT DEFAULT '#1a1a2e',
  font_family TEXT DEFAULT 'Inter',
  custom_domain TEXT UNIQUE,
  stripe_account_id TEXT,
  plan TEXT DEFAULT 'starter' CHECK (plan IN ('starter','pro','scale','enterprise')),
  client_limit INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Step 3: Lock down RLS (Row Level Security)**
```sql
-- Helper function to get current user's tenant
CREATE OR REPLACE FUNCTION get_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER;

-- Apply to ALL tables
CREATE POLICY "tenant_isolation" ON training_programs
  FOR ALL USING (tenant_id = get_tenant_id());

-- Repeat for every single table
```

---

### Phase 1: Tenant Onboarding (Week 3-4) — AUTH FLOW

**New Coach Registration Flow:**
1. Coach lands on `coachconnect.app/signup`
2. Fills: Name, Email, Brand Name, Password
3. System creates: `tenants` record + `profiles` record with `role = 'coach'`
4. Coach gets redirected to their dashboard at `coachconnect.app/[slug]/dashboard`
5. Onboarding checklist: Upload logo, set brand colors, invite first client

**URL Routing Strategy:**
```
Option A (Subdomain): borch.coachconnect.app
Option B (Path):       coachconnect.app/borch/dashboard
Option C (Custom):     app.builtbyborch.dk (custom domain via Vercel)
```
> Recommendation: Start with Option B (simpler), add Option C (custom domains) in Phase 3

---

### Phase 2: Branding Engine (Week 5-6) — CSS VARIABLES

**How it works:**
```typescript
// ThemeProvider.tsx — reads tenant config, injects CSS vars
const applyTenantTheme = (tenant: Tenant) => {
  document.documentElement.style.setProperty('--color-primary', tenant.primary_color);
  document.documentElement.style.setProperty('--color-bg', tenant.secondary_color);
  document.documentElement.style.setProperty('--font-family', tenant.font_family);
};
```

```css
/* index.css — all components use CSS variables */
:root {
  --color-primary: #D4A853;
  --color-bg: #1a1a2e;
  --font-family: 'Inter', sans-serif;
}
.btn-primary { background: var(--color-primary); }
```

**Coach Settings UI (BrandingPanel.tsx):**
- Logo upload → Supabase Storage → URL saved to `tenants` table
- Color picker (primary + secondary) → live preview
- Font selector (dropdown)
- Custom domain input → triggers Vercel domain API

---

### Phase 3: Monetization Engine (Week 7-8) — STRIPE CONNECT

**Stripe Connect = Coaches earn money through YOUR platform**

```
Flow:
1. Coach signs up → Oliver creates Stripe Connect Express account for coach
2. Client pays coach → Money goes to Oliver's Stripe first
3. Oliver's platform fee (e.g., 8%) is deducted automatically
4. Remaining 92% transferred to coach's Stripe account
5. Coach can create payment links, sell programs, manage subscriptions
```

**Implementation:**
```typescript
// Edge Function: create-connect-account
const account = await stripe.accounts.create({
  type: 'express',
  country: 'DK',
  email: coach.email,
  capabilities: { card_payments: { requested: true }, transfers: { requested: true } }
});
// Save account.id to tenants.stripe_account_id
```

---

### Phase 4: Growth & Scale (Week 9+)

- **Custom Domains**: Vercel Domains API — coach buys `app.theircoach.com`, points DNS to our Vercel
- **Affiliate System**: Each coach gets a referral link → 20% recurring commission
- **Sales Landing Pages**: Template builder → coaches create their own sales page hosted on the platform
- **Analytics Dashboard**: Coach sees MRR, churn, client LTV
- **Mobile App**: React Native or PWA wrapper

---

## 12. HIDDEN TECHNICAL TRAPS

> These are the things nobody warns you about. Each one can cost weeks of debugging.

### 🔴 TRAP 1: Supabase RLS — The Silent Killer
**What happens**: You add `tenant_id` to tables but forget to update RLS policies. Coach A can read Coach B's clients. **Complete data breach.**

**Fix**:
```sql
-- EVERY table needs this policy
CREATE POLICY "tenant_isolation" ON [table_name]
  FOR ALL
  USING (tenant_id = get_tenant_id())
  WITH CHECK (tenant_id = get_tenant_id());

-- Test it manually:
-- Log in as Coach B → try to fetch Coach A's data → should return empty
```

### 🔴 TRAP 2: Stripe Webhooks — Missing Events
**What happens**: Client pays → payment processes → but your database never updates (subscription shows as inactive). Happens when webhook endpoint isn't set up correctly.

**Fix**:
```
Supabase Edge Function: /stripe-webhook
Must handle: checkout.session.completed, customer.subscription.updated,
             customer.subscription.deleted, invoice.payment_failed
Verify Stripe signature EVERY time (STRIPE_WEBHOOK_SECRET env var)
```

### 🔴 TRAP 3: Stripe Connect — Platform Fee Missing
**What happens**: You set up Stripe Connect but forget `application_fee_amount`. Coaches get 100% of payment, you get nothing.

**Fix**:
```typescript
const session = await stripe.checkout.sessions.create({
  payment_intent_data: {
    application_fee_amount: Math.floor(amount * 0.08), // 8% platform fee
    transfer_data: { destination: coach.stripe_account_id }
  }
});
```

### 🟡 TRAP 4: Supabase Auth — User Belongs to Wrong Tenant
**What happens**: User registers but `tenant_id` isn't set on their profile automatically. They can't see any data.

**Fix**:
```sql
-- Database trigger: auto-set tenant_id on new user
CREATE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, tenant_id)
  VALUES (NEW.id, NEW.email, 'client', NEW.raw_user_meta_data->>'tenant_id');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### 🟡 TRAP 5: CSS Variables Not Updating Live
**What happens**: Coach changes brand colors in settings → page needs full reload to see changes. Bad UX.

**Fix**:
```typescript
// Call this every time tenant config changes
const updateTheme = (tenant: Tenant) => {
  const root = document.documentElement;
  root.style.setProperty('--color-primary', tenant.primary_color);
  root.style.setProperty('--color-bg', tenant.secondary_color);
  // No reload needed — CSS vars update instantly
};
```

### 🟡 TRAP 6: Vercel Custom Domains — DNS Propagation Delay
**What happens**: Coach sets custom domain → nothing works for 24-48 hours. They think it's broken.

**Fix**: Show clear status UI: "Domain is propagating — this takes up to 48 hours. Status: Pending ⏳"
Use Vercel API to check domain status and display it.

### 🟡 TRAP 7: Row Level Security Breaks Service Roles
**What happens**: Supabase Edge Functions run as `anon` by default. If RLS is strict, your Edge Functions can't read/write any data.

**Fix**:
```typescript
// Always use service role key in Edge Functions (server-side only)
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')! // Bypasses RLS
);
// NEVER expose SERVICE_ROLE_KEY to the frontend
```

### 🟡 TRAP 8: React Query Cache Cross-Tenant Contamination
**What happens**: Coach A logs out, Coach B logs in on same device. React Query cache still shows Coach A's data for a split second.

**Fix**:
```typescript
// On logout, clear ALL query cache
const queryClient = useQueryClient();
queryClient.clear(); // Nuclear option — clears everything
```

### 🔵 TRAP 9: Supabase Storage — Public vs Private Buckets
**What happens**: Progress photos (private client data) accidentally in public bucket. Anyone with URL can see them.

**Fix**: Always use private buckets for client data. Generate signed URLs server-side.
```typescript
const { data: url } = await supabase.storage
  .from('progress-photos') // private bucket
  .createSignedUrl(filePath, 3600); // expires in 1 hour
```

### 🔵 TRAP 10: Vite VITE_ Prefix — Secrets Exposed
**What happens**: You put `SUPABASE_SERVICE_ROLE_KEY` as `VITE_SUPABASE_SERVICE_ROLE_KEY`. Now it's in your client bundle. Anyone can read it in browser DevTools.

**Fix**:
- `VITE_` prefix = exposed to browser (only use for public keys)
- Server-side secrets go in Supabase Edge Functions as Deno.env
- NEVER put service role key or Stripe secret key with VITE_ prefix

---

## 13. CONTENT & GROWTH SYSTEMS

### Instagram / Reels Strategy
- **Post type 1**: Transformation videos (before/after client results)
- **Post type 2**: "1 tip" educational reels (nutrition, training)
- **Post type 3**: Behind-the-scenes (coaching calls, platform demos)
- **Post type 4**: Testimonial carousels
- **Hook formula**: Pain point → Promise → Proof → CTA

### YouTube Strategy
- Long-form: "How I built a coaching business from scratch"
- Tutorial content: "How to use AI to write client programs"
- Platform walkthroughs: "Inside my coaching platform"

### Automation Stack for Content
```
Appify → Scrape leads (Instagram, LinkedIn)
Zapier → Trigger email sequence when lead signs up
ElevenLabs → Clone Oliver's voice for video voiceovers
Remotion → Auto-generate progress videos from client data
NotebookLM → Synthesize research into content ideas
```

### Lead Generation Funnel
```
Instagram Reel → Profile Bio Link → Sales Page (on platform)
→ Free Trial Signup → Onboarding → Paid Subscription
```

### Gravity Claw Workflows
- "What should I post today?" → AI suggests content based on engagement data
- "Write me a check-in template for [client name]" → Pulls client data → generates personalized check-in
- "How is [client] doing?" → Reads latest check-in data → summary

---

## 14. RULES & NON-NEGOTIABLES

### Code Rules
- Always push to GitHub after changes
- Never push broken code to `main` — use `ai-dev` first
- Run Pre-Deployment Checklist before every merge
- Always test on localhost before pushing
- Check Vercel deployment after every push
- TypeScript strict mode — no `any` types if avoidable
- All new tables MUST have `tenant_id` column
- All new tables MUST have RLS policy

### Design Rules
- Ultra-dark (#1a1a2e) + Gold (#D4A853) — ALWAYS
- NO lime green, NO neon, NO bright colors
- Danish language in ALL UI text
- Mobile responsive — test on 375px screen minimum
- One main visual per viewport — no clutter
- Follow 60-30-10 color rule

### Workflow Rules
- Follow BLAST Framework for every build
- Read relevant SKILL.md files before starting any task
- Use AntiGravity/Claude for code, NOT Stack Overflow
- Speed > Perfection — ship, then refine
- If something is broken for more than 30 minutes, read TROUBLESHOOT.md

### Business Rules
- Platform fee on coach revenue: 5-10% via Stripe Connect
- Coach data is sacred — never exposed cross-tenant
- Free tier exists to acquire coaches — convert with features
- Affiliate program = 20% recurring for referrals

---

## QUICK REFERENCE: External Tools & Links

| Tool | URL | Purpose |
|---|---|---|
| Spline | spline.design | 3D hero assets |
| 21st.dev | 21st.dev | Premium UI components |
| CodePen | codepen.io | Interactive component inspiration |
| Weevi.ai | weevi.ai | AI image generation |
| Typewolf | typewolf.com | Font inspiration |
| Fontsinuse | fontsinuse.com | Real-world font usage |
| Cosmos | cosmos.so | Visual mood boards |
| Dribbble | dribbble.com | Design inspiration |
| Canva | canva.com | Color extraction + image editing |
| Open Router | openrouter.ai | Multi-model AI access |
| NotebookLM | notebooklm.google.com | Research synthesis |
| Railway | railway.app | Always-on backend hosting |
| Pinecone | pinecone.io | Vector database for RAG |
| Remotion | remotion.dev | Programmatic video |
| ElevenLabs | elevenlabs.io | Voice AI |
| Appify | apify.com | Web scraping |
| Jack Roberts | skool.com/aiautomationsbyjack | AntiGravity community |
| Jack's Bundle | aijack.gumroad.com/l/AntiGravity | Free tools bundle |

---

*Last Updated: 2026-03-23 | Built By Borch — Business Brain v1.0*
