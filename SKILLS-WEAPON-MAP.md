# JERES SKILLS ARSENAL — Hvad I Har, Hvad Det Gør, Hvornår I Bruger Det

**Dato:** 2. april 2026
**Kontekst:** Komplet mapping af alle uploadede skills + MCP tools til jeres AI Agency workflow

---

## OVERSIGT: 3 CUSTOM SKILLS + 1 HTML TEMPLATE

I har 3 ekstremt kraftige custom skills og 1 prompt-template der tilsammen udgør en komplet sales-to-delivery pipeline. Her er præcis hvad de gør og hvornår I bruger dem:

---

## SKILL 1: WEBSITE INTELLIGENCE (Research-Driven Competitive Analysis)

**Fil:** `SKILL.md` (website-intelligence)
**Hvad den gør:** Scraper en kundes eksisterende hjemmeside + deres top 5 konkurrenter, laver en professionel konkurrenceanalyse-rapport (PDF-klar HTML), og bygger derefter en premium scroll-animated hjemmeside baseret på rigtige markedsdata.

### Workflow i 6 Faser:
1. **Client Brand Extraction** — Scraper kundens nuværende site: logo, brand colors, fonts, tone of voice, nøglebudskaber, site-struktur
2. **Competitive Niche Analysis** — Finder top 10 konkurrenter, scorer dem på 8 kriterier, deep-scraper top 5
3. **Competitive Analysis Report** — Genererer en smuk PDF-klar HTML rapport med konkurrentprofiler, sammenligningstabel, SEO-landskab, design-anbefalinger
4. **Build Brief & Approval** — Samler alt i en Website Build Brief med design direction, site architecture, content framework, conversion playbook
5. **Build the Website** — HTML/CSS/JS med GSAP + ScrollTrigger, scroll-animations, parallax, premium micro-interactions
6. **Quality Audit** — SEO, accessibility, performance og client-ready checklist

### BRUG I JERES AGENCY:

**I Pre-Sales (Salgsmødet):**
- Kør Fase 1-3 INDEN salgsmødet (tager 10-15 min med AI)
- Vis den genererede Competitive Analysis Report på 5-min demo-mødet
- Kunden ser: "De har allerede analyseret vores branche og konkurrenter. De er seriøse."
- **Dette er jeres killer differentiator.** Ingen andre agencies viser en konkurrenceanalyse på første møde.

**I Delivery:**
- Fase 4-6 er jeres delivery workflow
- Build Brief sikrer alignment inden I bygger
- Quality Audit sikrer professionel levering

**Kræver:** Firecrawl MCP (I har API key: `fc-ed68da6821b8491d87c14ce14d41ccca`)

---

## SKILL 2: 3D ANIMATION CREATOR (Scroll-Driven Video Websites)

**Fil:** `SKILL (1).md` (3d-animation-creator)
**Hvad den gør:** Tager en videofil og bygger en Apple-style scroll-driven website hvor videoen afspilles frem/tilbage baseret på scroll-position. Inkluderer animeret starscape, annotation cards med snap-stop scroll, specs med count-up animations, navbar med scroll-to-pill transform, loader, og fuld mobil-responsivitet.

### Workflow:
1. **Interview** — Spørger om brand, logo, accent color, baggrund, vibe, content source
2. **Video Analyse** — ffprobe for duration, fps, opløsning
3. **Frame Extraction** — FFmpeg extraherer 60-150 frames som JPEG
4. **Website Build** — Single HTML file med 12 sektioner (starscape, loader, scroll progress, navbar, hero, scroll animation, specs, features, CTA, testimonials, card scanner, footer)
5. **Content Population** — Alt content fra interview/URL
6. **Serve & Test** — Lokal preview

### BRUG I JERES AGENCY:

**Som Premium Upsell:**
- Tilbyd som "Premium Scroll Experience" add-on: **15.000-25.000 kr extra**
- Perfekt til: Produktlanceringer, portfoliosider, brand showcases, landingssider
- Kunden ser en Apple/Stripe-kvalitet scroll-animation og tænker: "Det her er next level"

**I Sales Demo:**
- Hav 2-3 pre-built eksempler klar (en for VVS, en for tandlæge, en for restaurant)
- Vis dem på 5-min mødet: "Det her er hvad jeres konkurrenter IKKE har"

**Demo Flow:**
1. Vis standard website udkast (Website Intelligence skill)
2. Vis derefter scroll-animation versionen
3. "Den her premium version koster X ekstra — men se forskellen"

---

## SKILL 3: SEO STRATEGY (Unified SEO Skill)

**Fil:** `SKILL (2).md` (seo-strategy)
**Hvad den gør:** Har to modes — Article/Page Optimization og Full Website Audit. Laver komplet SEO-analyse med konkurrentresearch, keyword mapping, LSI keyword extraction, og producerer en visuel HTML-rapport med tabs.

### Mode 1: Article/Page SEO Optimization
- Tager en artikel/side og producerer en rewritten SEO-optimeret version
- 3-tab HTML rapport: Revised Article, Changelog, Original
- Komplet keyword research med LSI keywords
- Competitor analysis af top 5-10 ranking sider

### Mode 2: Full Website Audit
- Crawler multiple sider på en hjemmeside
- Producerer comprehensive HTML rapport med site-wide analysis
- Cross-page patterns, architecture review, prioriteret strategi

### BRUG I JERES AGENCY:

**Som Månedlig Service (Retainer Revenue):**
- Kør Mode 2 (Full Audit) som entry-point service: "Gratis SEO Audit" → viser kunden hvad de mangler → sælger månedlig SEO-pakke
- Kør Mode 1 (Article Optimization) månedligt for content-kunder
- Pricing: 2.000-5.000 kr/md for ongoing SEO management

**I Sales Pipeline:**
- Kør en SEO audit på kundens site INDEN mødet
- Vis rapporten: "Jeres site scorer 3/10 på SEO. Her er hvad der mangler."
- Sælg website rebuild + SEO-pakke som combo

**Som Lead Magnet:**
- "Gratis SEO Audit af jeres hjemmeside" → kør Mode 2 → send rapport → book møde
- Perfekt cold email hook: "Jeg har lavet en gratis SEO-analyse af [firmanavn]. Vil du se den?"

---

## HTML TEMPLATE: SCROLL-STOP PROMPT PAGE

**Fil:** `prompt-page-template (1).html`
**Hvad den gør:** En flot, dark-mode prompt-display side med 3 tabs (A, B, C), copy-to-clipboard med confetti-animation, og glassmorphism design. Template-variabler markeret med `{{VARIABEL}}`.

### BRUG I JERES AGENCY:

**Som Client Deliverable:**
- Brug som template til at præsentere prompts/scripts til kunder
- Tilpas med kundens branding (accent color, tabs, content)

**Som Intern Tool:**
- Gem jeres cold call scripts, email templates, og sales scripts i denne template
- Hurtigt copy-paste under outreach

**Som Showcase/Portfolio:**
- Vis potentielle kunder kvaliteten af jeres UI-work
- "Selv vores interne tools ser sådan her ud"

---

## ZIP-FILER INDHOLD

### examples/ → `sample-brand-snapshot.md`
- Eksempel på brand extraction output fra Website Intelligence skill
- Brug som reference for hvad en "Client Brand Extraction" rapport skal indeholde

### references/ → `process-overview.html`
- Design reference for Competitive Analysis rapporten
- Warm paper tones, Instrument Serif + DM Sans, grain texture, elegant cards
- Print-ready med `@media print` rules
- **Brug dette som jeres rapport-design standard for alle client-facing deliverables**

### references/ → `sections-guide.md`
- Komplet CSS/JS implementation guide for alle sektioner i 3D Animation Creator
- Starscape, loader, scroll progress, navbar pill transform, hero, scroll animation, specs count-up, features, CTA, testimonials, card scanner, footer
- **Jeres tekniske playbook for premium websites**

---

## KOMPLET SALES-TO-DELIVERY PIPELINE MED SKILLS

```
LEAD GENERATION
│
├── Cold Call → "Vi har lavet et gratis udkast til jer"
├── Cold Email → "Gratis SEO Audit af jeres hjemmeside" (SEO Skill Mode 2)
└── LinkedIn DM → "Vi har analyseret jeres branche" (Website Intelligence Fase 1-3)
│
▼
5-MIN SALES DEMO
│
├── Vis: Competitive Analysis Report (Website Intelligence Fase 3)
├── Vis: SEO Audit Rapport (SEO Skill Mode 2)
├── Vis: Website Udkast (Website Intelligence Fase 5)
└── Vis: Premium Scroll-Animation Demo (3D Animation Creator)
│
▼
CLOSE DEAL
│
├── Starter: 8.000 kr (standard website)
├── Pro: 15.000 kr (website + SEO setup)
├── Premium: 25.000 kr (scroll-animation site + SEO + competition report)
└── Transform: 35.000-150.000 kr (full AI transformation)
│
▼
DELIVERY (1-5 dage)
│
├── Website Intelligence Fase 4-6 (build + audit)
├── 3D Animation Creator (if premium)
├── SEO Strategy Mode 1 (article optimization)
└── Quality Audit
│
▼
MONTHLY RETAINER
│
├── SEO Skill Mode 1: Månedlig content optimization (2.000-5.000 kr/md)
├── Website vedligehold + updates (1.500 kr/md)
├── AI Agent management (2.000-5.000 kr/md)
└── Meta/Google Ads (3.000-7.000 kr/md)
```

---

## MCP TOOLS I HAR ADGANG TIL (VIA CONNECTORS)

### Direkte Relevante for Agency:

| MCP Tool | Brug i Agency |
|----------|---------------|
| **Firecrawl** | Website scraping, konkurrentanalyse, lead research |
| **Gmail** | Cold email outreach, client kommunikation, auto-follow-up |
| **Google Calendar** | Booking af salgsmøder, client meetings |
| **Google Drive** | Client deliverables, rapporter, proposals |
| **Notion** | CRM, project management, client portals, SOPs |
| **Stripe** | Betalinger, subscriptions, invoicing |
| **Canva** | Social media content, pitch decks, proposals |
| **Zoom** | Salgsmøder, client demos, onboarding |
| **WhatsApp** | Client kommunikation, hurtig support |
| **Instagram** | Content posting, DM outreach |
| **Zapier Tables** | Lead tracking, pipeline management |

### Automation Flows I Kan Bygge:

**Lead → Meeting Pipeline:**
```
Google Maps scraping → Notion lead database
→ Gmail cold email sequence
→ Google Calendar booking link
→ Zoom auto-create meeting
→ Notion status update
```

**Client Onboarding:**
```
Stripe payment received
→ Notion project created
→ Google Drive folder created
→ Gmail welcome email sent
→ Google Calendar kickoff meeting
→ Slack/WhatsApp notification
```

**Content Machine:**
```
SEO Skill generates optimized article
→ Canva creates social graphics
→ Instagram auto-post
→ LinkedIn auto-post (via browser automation)
```

---

## EKSTRA SKILLS I BØR TILFØJE

### Fra Jack Roberts / AI Automation Community:
1. **RAG (Retrieval-Augmented Generation)** — Byg AI chatbots der kan svare på kundespecifikke spørgsmål baseret på deres dokumenter/data
2. **n8n AI Agent Workflows** — Automatisér kundeservice, lead qualification, booking
3. **Voiceflow Chatbots** — No-code AI chatbots til kunders websites
4. **Vapi Voice Agents** — AI telefon-agenter der erstatter receptionister

### Anbefalede MCP Servere at Tilføje:
1. **Firecrawl MCP** (allerede har API key) — Web scraping engine
2. **Slack MCP** — Team kommunikation og client channels
3. **Airtable MCP** — Mere avanceret CRM/database
4. **HubSpot MCP** — Professional CRM
5. **Twilio MCP** — SMS automation til outreach og reminders

### AI Platforms at Udforske:
1. **Cursor** — AI code editor (Jack Roberts bruger det)
2. **Bolt.new** — Full-stack app generation
3. **Lovable.dev** — AI app builder
4. **Replit Agent** — AI coding assistant
5. **v0.dev** — UI component generation
6. **Relume.io** — AI wireframe + sitemap generation

---

*Denne fil er jeres våben-kort. Hvert skill er et våben i jeres arsenal. Brug dem strategisk.*
