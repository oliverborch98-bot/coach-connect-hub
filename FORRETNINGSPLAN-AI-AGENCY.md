# AI AGENCY FORRETNINGSPLAN — Oliver & Partner

**Dato:** 2. april 2026
**Baseret på:** Oscar/Odia-modellen, Jack Roberts' AI Automations, markedsresearch 2026

---

## DEL 1: JACK ROBERTS — SKILLS, TOOLS & SYSTEMER

### Hvem er Jack Roberts?
Top-100 UK entrepreneur, grundlægger af Glaido (voice-to-text tool), 1M+ følgere på YouTube. Driver et $100K/måned AI automation business og et Skool-community med 1.600+ medlemmer ($77/md).

### Jack Roberts' Kerneskills & Tools

**Automation & Workflow:**
- **n8n** — Open-source workflow automation (værdi $2.3 mia. i 2026). Bruges til at bygge AI agents, automations og integrations
- **Make.com** — Visual scenario builder til multi-step logic og højvolumen automations
- **Zapier** — Simpel automation for non-technical setups

**AI & Development:**
- **Cursor** — AI-powered code editor
- **Node.js** — Backend runtime
- **Supabase** — Database + auth + edge functions
- **Vercel** — Deployment platform
- **GitHub** — Version control
- **Google Gemini** — AI model til system-builds

**Voice & Conversational AI:**
- **Glaido** (hans eget produkt) — Voice-to-text dictation i 100+ sprog
- **Voiceflow** — No-code AI agent builder til conversational workflows

**Business Model:**
- 95+ færdige AI-systemer der kan tilpasses til kunder
- AI Agency Blueprint (step-by-step til at starte AI agency)
- $22K+ i tool discounts (n8n, Make, Stripe)
- Ugentlige live coaching sessions
- 45+ optagede expert sessions

### Firecrawl Prompt til Antigravity (Jack Roberts Scraping)

```
PROMPT TIL ANTIGRAVITY:

Brug Firecrawl MCP til at scrape Jack Roberts' YouTube-kanal og hjemmeside grundigt.

MCP Setup (allerede installeret):
npx -y firecrawl-cli@latest init --all --browser

MCP Config:
{
  "mcpServers": {
    "firecrawl-mcp": {
      "command": "npx",
      "args": ["-y", "firecrawl-mcp"],
      "env": {
        "FIRECRAWL_API_KEY": "fc-ed68da6821b8491d87c14ce14d41ccca"
      }
    }
  }
}

OPGAVE:
1. Scrape https://jackroberts.ai/ — hent ALLE sider, undersider, blog posts, kursusbeskrivelser, tools nævnt, pricing, og lead magnets
2. Scrape https://aiautomationbyjack.com/ — hent alle tools, systemer, templates, og kursusindhold
3. Scrape Jack Roberts' YouTube kanal (søg "Jack Roberts AI automations" på YouTube) — hent alle videotitler, beskrivelser, og links fra de seneste 50 videoer
4. Scrape https://aijack.gumroad.com/ — hent alle produkter, priser og beskrivelser
5. Scrape https://www.skool.com/aiautomationsbyjack/about — hent community info, moduler, og features

OUTPUT FORMAT:
- Liste over ALLE nævnte AI tools og platforms (med links)
- Liste over ALLE skills/systemer der undervises i
- Liste over ALLE templates og færdige systemer
- Pricing information
- Nøgle-strategier og frameworks han bruger
- Links til alle relevante ressourcer

Gem alt i en struktureret markdown-fil.
```

---

## DEL 2: FORRETNINGSMODEL 1 — "AI WEB AGENCY" (Speed-to-Market Model)

### Koncept
I bygger AI-drevne hjemmesider og landingssider for lokale virksomheder i Danmark. Jeres edge: I kan vise et færdigt udkast på et 5-minutters online salgsmøde, bygget med AI på under 60 sekunder.

### Målgruppe
- Håndværkere (VVS, elektriker, murer, tømrer)
- Klinikker (fysioterapi, tandlæge, kiropraktor)
- Lokale servicefirmaer (rengøring, haveservice, flyttefirma)
- Restauranter og caféer
- Ejendomsmæglere og arkitekter

### Revenue Streams

**Stream 1: Website Build (One-time)**
| Pakke | Pris | Indhold |
|-------|------|---------|
| Starter | 8.000 kr | Landingsside, mobil-optimeret, kontaktformular |
| Pro | 15.000 kr | 5-siders site, SEO-setup, Google My Business |
| Premium | 25.000 kr | Custom design, booking-system, chat-widget, analytics |

**Stream 2: Månedlig Retainer**
| Pakke | Pris/md | Indhold |
|-------|---------|---------|
| Vedligehold | 1.500 kr/md | Hosting, opdateringer, support |
| Vækst | 3.500 kr/md | + SEO, content updates, Google Ads management |
| Scale | 7.000 kr/md | + Meta Ads, AI chatbot, lead nurturing automation |

**Stream 3: Add-on Services**
- AI Chatbot installation: 5.000 kr + 500 kr/md
- Booking-system integration: 3.000 kr
- Google/Meta Ads setup: 5.000 kr
- Email automation funnel: 4.000 kr

### Revenue Projektion (Konservativ)
| Måned | Kunder (kumulativ) | One-time | MRR | Total |
|-------|-------------------|----------|-----|-------|
| 1 | 2 | 30.000 | 3.000 | 33.000 |
| 3 | 8 | 45.000 | 16.000 | 61.000 |
| 6 | 20 | 50.000 | 45.000 | 95.000 |
| 12 | 40 | 60.000 | 100.000 | 160.000 |

### Tech Stack

**Website Building (under 60 sek udkast):**
- **Relume.io** ($32-40/md) — AI wireframe + sitemap generator, 1000+ components, eksport til Webflow/Figma/React
- **Webflow** — Professional website builder med CMS og hosting
- **Framer** — Alternativ til Webflow, hurtigere for simple sites
- **v0.dev** (Vercel) — AI der genererer React components fra tekst-prompts
- **Bolt.new / Lovable.dev** — Full-stack app generation med AI

**AI Chatbots til kunder:**
- **Voiceflow** — No-code AI chatbot builder
- **Botpress** — Open-source chatbot platform
- **Tidio** — Simpel chat-widget med AI

**Automation:**
- **n8n** (self-hosted) — Gratis, ubegrænset workflows
- **Make.com** — Visuel automation builder
- **Zapier** — Quick integrations

**CRM & Sales:**
- **GoHighLevel** ($97/md) — All-in-one: CRM, funnels, email, SMS, booking
- **HubSpot Free** — CRM til pipeline tracking

### Salgsproces (5-min Demo Model)

**Trin 1: Lead Finding (10 min/dag)**
- Google Maps → Find lokale virksomheder uden/med dårlig hjemmeside
- Notér: Firmanavn, telefon, nuværende site (screenshot)

**Trin 2: Pre-Build Udkast (60 sek)**
- Kør firmanavnet + branche igennem Relume/v0.dev
- Generer et visuelt udkast med AI
- Screenshot/preview link klar

**Trin 3: Cold Call Script**
```
"Hej [navn], det er Oliver fra [firmanavn].

Jeg fandt jer på Google og kunne se, at jeres hjemmeside
[ikke eksisterer / kunne trænge til en opfriskning].

Vi har faktisk allerede lavet et gratis udkast til jer —
det tog os under et minut med vores AI-system.

Har I 5 minutter til et hurtigt online møde,
så jeg kan vise jer udkastet? Helt uforpligtende."
```

**Trin 4: 5-min Salgsmøde**
- Del skærm → Vis udkastet
- "Det her tog os 60 sekunder. Forestil dig hvad vi kan på en uge."
- Pitch pakken → Luk salget
- Brug GoHighLevel til booking og opfølgning

**Trin 5: Delivery (2-5 dage)**
- Færdiggør sitet i Webflow/Framer
- Setup SEO, analytics, kontaktformularer
- Overlevering + pitch månedlig pakke

---

## DEL 3: FORRETNINGSMODEL 2 — "AI TRANSFORMATION AGENCY" (High-Ticket Model)

### Koncept
I hjælper SMV'er (5-50 ansatte) med at erstatte eller augmentere medarbejderfunktioner med AI agents. Fokus på at spare virksomheder 40-70% på lønomkostninger ved at automatisere repetitive opgaver.

### Målgruppe
- E-commerce virksomheder (kundeservice, ordrehåndtering)
- Konsulentfirmaer (admin, rapportering, scheduling)
- Ejendomsmæglere (lead qualification, opfølgning)
- Tandlæger/klinikker (booking, patientkommunikation)
- Marketing bureauer (content, reporting, client management)
- Bygge- og håndværksfirmaer (tilbudsgenerering, projektopfølgning)

### Revenue Streams

**Stream 1: AI Audit & Strategi (Entry Point)**
| Service | Pris | Indhold |
|---------|------|---------|
| Gratis AI Audit | 0 kr | 15-min analyse af deres processer + rapport med besparelsespotentiale |
| AI Transformation Rapport | 5.000 kr | Dybdegående analyse, ROI-beregning, implementeringsplan |

**Stream 2: AI Agent Implementation (Project-based)**
| Agent Type | Pris | Erstatter/Augmenterer |
|------------|------|----------------------|
| AI Receptionist (telefon) | 15.000 kr + 2.000/md | Receptionist/telefonpasser |
| AI Kundeservice Agent | 20.000 kr + 3.000/md | Kundeservice medarbejder |
| AI Booking Agent | 10.000 kr + 1.500/md | Booking/scheduling funktion |
| AI Lead Qualifier | 12.000 kr + 2.000/md | SDR/lead qualification |
| AI Content Creator | 8.000 kr + 2.500/md | Social media manager (delvis) |
| AI Email/CRM Automation | 15.000 kr + 2.000/md | Admin/opfølgning |
| Custom AI Workflow | 25.000-50.000 kr + 3.000-5.000/md | Tilpasset til virksomheden |

**Stream 3: Fuld AI Transformation Package**
| Pakke | Pris | Indhold |
|-------|------|---------|
| Starter Transform | 35.000 kr + 5.000/md | 2 AI agents + basis automation |
| Business Transform | 75.000 kr + 10.000/md | 4 AI agents + fuld workflow automation |
| Enterprise Transform | 150.000 kr + 20.000/md | Komplet AI-transformation, custom agents, dedikeret support |

### Revenue Projektion (Konservativ)
| Måned | Kunder | Project Revenue | MRR | Total |
|-------|--------|----------------|-----|-------|
| 1 | 1 | 35.000 | 5.000 | 40.000 |
| 3 | 4 | 75.000 | 25.000 | 100.000 |
| 6 | 10 | 100.000 | 70.000 | 170.000 |
| 12 | 25 | 150.000 | 200.000 | 350.000 |

### Tech Stack

**AI Voice Agents (telefon-erstatning):**
- **Vapi.ai** — Developer-first voice AI platform, sub-500ms latency
- **Retell AI** — User-friendly, 99.99% uptime, skaler til højvolumen
- **Bland.ai** — Comprehensive call handling

**AI Chatbots & Customer Service:**
- **Voiceflow** — No-code AI agent builder
- **Botpress** — Open-source, fuld kontrol
- **Intercom Fin** — AI customer service agent

**Workflow Automation:**
- **n8n** — Primær automation engine (self-hosted, gratis)
- **Make.com** — Visuel backup/supplement
- **Activepieces** — Open-source alternativ

**AI Content & Marketing:**
- **Claude API** — Primær LLM til content generation
- **Opus Clip** — AI video editing
- **Canva AI** — Design automation

**CRM & Business:**
- **GoHighLevel** — All-in-one platform
- **Supabase** — Custom database til agent data
- **Stripe** — Betalinger

### Salgsproces (AI Audit → Demo → Close)

**Trin 1: Identificér Target (Research)**
- Find virksomheder med 5-50 ansatte
- Identificér deres pain points (mange telefonopkald, langsom kundeservice, manuelt arbejde)
- Brug LinkedIn, Google Maps, Proff.dk

**Trin 2: Cold Outreach Script**
```
"Hej [navn], det er Oliver fra [firmanavn].

Jeg kan se, at I er [branche] med ca. [X] ansatte.

Vi hjælper virksomheder som jeres med at spare
30-50% på lønomkostninger ved at integrere AI agents
der håndterer [specifik funktion: telefon/booking/kundeservice].

Vi har faktisk allerede lavet en gratis AI-audit af
jeres forretning — vil I have 5 minutter til at se
hvad I kunne spare?

Det er helt uforpligtende."
```

**Trin 3: 5-min Demo Meeting**
- Vis en LIVE AI agent demo (f.eks. ring til jeres AI receptionist)
- Vis besparelsesberegning: "Jeres receptionist koster 25.000/md. Vores AI agent koster 2.000/md."
- Vis ROI: "I sparer 276.000 kr/år. Implementering koster 15.000 kr. ROI på under 1 måned."

**Trin 4: Implementering (1-2 uger)**
- Setup AI agents i n8n + Vapi/Voiceflow
- Integrer med deres eksisterende systemer
- Test og optimer
- Træning af kunden (30 min)

**Trin 5: Ongoing Management**
- Månedlig retainer for vedligehold og optimering
- Kvartalsvis performance review
- Upsell flere AI agents efterhånden som de ser resultater

---

## DEL 4: ANBEFALEDE TOOLS & PLATFORME (Udover det I allerede bruger)

### Må-Have Tools

| Tool | Formål | Pris | Prioritet |
|------|--------|------|-----------|
| **n8n** (self-hosted) | Workflow automation engine | Gratis | KRITISK |
| **Relume.io** | AI wireframe/sitemap generation | $32/md | KRITISK |
| **Vapi.ai** | AI voice agents | Pay-per-use | HØJ |
| **Voiceflow** | No-code AI chatbot builder | Gratis tier | HØJ |
| **GoHighLevel** | CRM + funnels + automation | $97/md | HØJ |
| **Cursor** | AI code editor | $20/md | HØJ |
| **Webflow** | Website building + hosting | $29/md | KRITISK |
| **Framer** | Hurtig website building | $15/md | MEDIUM |
| **v0.dev** | AI React component generation | Gratis tier | MEDIUM |
| **Bolt.new** | Full-stack AI app generation | Pay-per-use | MEDIUM |

### Nice-to-Have Tools

| Tool | Formål | Pris |
|------|--------|------|
| **Lovable.dev** | AI full-stack app builder | Pay-per-use |
| **Retell AI** | Voice AI (alternativ til Vapi) | Pay-per-use |
| **Supabase** | Backend database + auth | Gratis tier |
| **Stripe** | Betalingsprocessering | % per transaktion |
| **Loom** | Video-proposals til outreach | Gratis tier |
| **Calendly** | Booking af salgsmøder | Gratis tier |
| **Opus Clip** | AI video editing til content | $15/md |
| **Canva** | Design til social media + pitch decks | Gratis tier |

### MCP Servere & AI Agents I Allerede Har Adgang Til

Via jeres nuværende setup har I adgang til:
- **Notion MCP** — Projekt management, client portals, knowledge bases
- **Google Calendar MCP** — Booking og scheduling automation
- **Gmail MCP** — Email automation og outreach
- **Google Drive MCP** — Fil management og client delivery
- **Stripe MCP** — Betalinger og subscription management
- **Canva MCP** — Design automation
- **Zoom MCP** — Meeting management
- **WhatsApp MCP** — Client kommunikation
- **Instagram MCP** — Social media management
- **Zapier Tables MCP** — Data management

---

## DEL 5: HANDLINGSPLAN — FRA 0 TIL EKSEKUTION

### FASE 1: FOUNDATION (Uge 1-2) — "Build the Machine"

**Dag 1-3: Identitet & Setup**
- [ ] Vælg firmanavn (forslag: "BorchDigital", "AutomateNord", "NordAI Solutions")
- [ ] Registrér CVR (enkeltmandsvirksomhed eller ApS)
- [ ] Opret firma-email (Google Workspace, 50 kr/md)
- [ ] Opret LinkedIn firmpaprofil + personlige profiler optimeret
- [ ] Køb domæne + byg jeres egen hjemmeside med Webflow/Framer (1 dag max)

**Dag 4-5: Tool Setup**
- [ ] Installer n8n (self-hosted via Railway/Render, gratis)
- [ ] Opret Relume.io konto (starter plan)
- [ ] Opret Webflow/Framer konto
- [ ] Opret GoHighLevel trial (14 dage gratis)
- [ ] Setup Vapi.ai konto (til voice agent demos)
- [ ] Setup Voiceflow (til chatbot demos)

**Dag 6-7: Sales Assets**
- [ ] Byg 5 demo-udkast til forskellige brancher (VVS, tandlæge, restaurant, ejendomsmægler, rengøring)
- [ ] Optag 1 Loom-video der viser jeres AI workflow (til outreach)
- [ ] Skriv cold call script (se ovenfor)
- [ ] Skriv cold email templates (3 varianter)
- [ ] Skriv LinkedIn DM templates (3 varianter)

**Dag 8-10: Demo Environment**
- [ ] Byg en live AI chatbot demo-side
- [ ] Setup en Vapi voice agent demo (folk kan ringe og teste)
- [ ] Lav en "AI Savings Calculator" side på jeres website
- [ ] Forbered pitch deck (5 slides max)

**Dag 11-14: Processer & SOP'er**
- [ ] Dokumentér salgsproces (lead → call → demo → close → deliver)
- [ ] Dokumentér leveringsproces (onboarding → build → test → launch)
- [ ] Setup pipeline i GoHighLevel/HubSpot
- [ ] Lav pricing sheet (PDF)

### FASE 2: TRACTION (Uge 3-8) — "Get Clients, Get Cash"

**Daglig Rutine (2-3 timer/dag per person):**

**Person 1 (Oliver):**
- 09:00-09:30: Research 10 leads på Google Maps
- 09:30-10:30: Cold call 10 virksomheder
- 10:30-11:00: Follow-up emails/DMs
- Rest af dagen: Delivery + content creation

**Person 2 (Partner):**
- 09:00-09:30: Research 10 leads på Google Maps
- 09:30-10:30: Cold call 10 virksomheder
- 10:30-11:00: LinkedIn outreach (10 DMs)
- Rest af dagen: Delivery + tool development

**Ugentlige Mål:**
- Uge 3-4: 100 cold calls, 20 emails, 20 LinkedIn DMs → Mål: 5 møder → 1-2 kunder
- Uge 5-6: 100 cold calls, 30 emails, 30 LinkedIn DMs → Mål: 8 møder → 2-3 kunder
- Uge 7-8: 100 cold calls, 40 emails, 40 LinkedIn DMs → Mål: 10 møder → 3-4 kunder

**Content Marketing (parallel):**
- 3x Instagram Reels/uge (vis AI builds, before/after, tips)
- 2x LinkedIn posts/uge (case studies, insights)
- 1x YouTube video/uge (tutorial, behind-the-scenes)

### FASE 3: SYSTEMATISERING (Uge 9-16) — "Build Systems, Scale Revenue"

- [ ] Automatisér lead generation med n8n (scrape Google Maps → enrich → auto-email)
- [ ] Byg client onboarding automation (form → Notion → task assignment → welcome email)
- [ ] Byg reporting automation (auto-generér månedlige performance rapporter til kunder)
- [ ] Standardisér website templates (5 brancher, klar-til-brug)
- [ ] Opret Skool/Discord community for netværk og fremtidig kursussalg
- [ ] Lav case studies fra de første kunder (video + skriftlig)
- [ ] Implementér referral program (2.000 kr per henvist kunde)
- [ ] Start Meta Ads til lead generation ($500/md budget)

### FASE 4: SCALE (Uge 17-26) — "Multiplicér"

- [ ] Ansæt/freelance: 1 sales closer (provision-baseret)
- [ ] Ansæt/freelance: 1 website builder (deliverer sites mens I sælger)
- [ ] Lancér "AI Transformation Package" som premium tilbud
- [ ] Byg partnerships med regnskabsfirmaer (de henviser kunder → I betaler provision)
- [ ] Udforsk white-label muligheder (sælg til andre bureauer)
- [ ] Overvej Skool community/kursus som ekstra revenue stream
- [ ] Mål: 100.000 kr/md MRR

### FASE 5: DOMINANS (Uge 27-52) — "Become the Go-To"

- [ ] Lancér podcast/YouTube kanal om AI for danske virksomheder
- [ ] Tal på events/konferencer
- [ ] Byg SaaS-produkt (AI agent platform white-label)
- [ ] Ekspandér til Sverige/Norge
- [ ] Mål: 250.000-500.000 kr/md

---

## DEL 6: EKSEKVERINGSPLAN — DE FØRSTE 30 DAGE

### Uge 1: SETUP
| Dag | Oliver | Partner |
|-----|--------|---------|
| Man | CVR + domæne + email | n8n setup + Vapi konto |
| Tir | Website build (egen) | Relume + Webflow setup |
| Ons | Cold call script + email templates | 5 demo-udkast (brancher) |
| Tor | GoHighLevel setup + pipeline | Chatbot demo + voice agent demo |
| Fre | LinkedIn profil optimering | Pitch deck + pricing sheet |

### Uge 2: TEST & REFINE
| Dag | Oliver | Partner |
|-----|--------|---------|
| Man | 10 cold calls (test script) | Optimer demo-flow |
| Tir | 10 cold calls + 5 emails | Build 3 ekstra demo sites |
| Ons | 10 cold calls + 5 LinkedIn DMs | Loom video + content |
| Tor | Follow-up alle leads | Automatiser booking flow |
| Fre | Review uge → juster script/proces | Forbered næste uges assets |

### Uge 3-4: FULL SEND
| Aktivitet | Mål per uge |
|-----------|-------------|
| Cold calls | 50 per person (100 total) |
| Emails | 20 |
| LinkedIn DMs | 20 |
| Møder booket | 5-8 |
| Kunder lukket | 1-3 |
| Content posted | 5 stk |

### KPI'er at tracke
- Calls per dag
- Booking rate (calls → møder)
- Close rate (møder → kunder)
- Average deal size
- MRR
- Customer acquisition cost (CAC)
- Lifetime value (LTV)
- Churn rate

---

## DEL 7: FORRETNINGSMODEL SAMMENLIGNING

| Dimension | Model 1: AI Web Agency | Model 2: AI Transformation |
|-----------|----------------------|---------------------------|
| **Entry barrier** | Lav (alle kan se en hjemmeside) | Medium (kræver forståelse af processer) |
| **Avg. deal size** | 15.000 kr + 2.500/md | 35.000-150.000 kr + 5.000-20.000/md |
| **Sales cycle** | 1-3 dage | 1-3 uger |
| **Delivery time** | 2-5 dage | 1-4 uger |
| **Scalability** | Høj (templates) | Meget høj (recurring revenue) |
| **Churn risk** | Medium | Lav (de er afhængige af jeres system) |
| **Competitiv fordel** | Speed (60 sek udkast) | ROI-bevist (spare løn) |
| **Anbefaling** | START HER (hurtig cash) | BYGG HERTIL (big money) |

### Min Anbefaling: HYBRID MODEL
Start med Model 1 for at generere cash og bygge pipeline. Upsell Model 2 services til eksisterende kunder efter 1-2 måneder. Websiden er foot-in-the-door. AI agents er det virkelige spil.

---

## DEL 8: COLD OUTREACH TEMPLATES

### Cold Email #1 (Website)
```
Emne: Gratis hjemmeside-udkast til [Firmanavn]

Hej [Navn],

Jeg fandt [Firmanavn] på Google og lagde mærke til, at
jeres hjemmeside [ikke eksisterer / kunne bruge en opfriskning].

Vi har lavet et gratis udkast til jer med vores AI-system —
det tog under 1 minut.

Har I 5 minutter til et hurtigt videokald, så jeg kan vise jer?
Helt uforpligtende.

Med venlig hilsen,
Oliver
[Firmanavn] | AI-drevne hjemmesider
[Telefon] | [Email]
```

### Cold Email #2 (AI Agent)
```
Emne: Spar 25.000 kr/md på kundeservice — [Firmanavn]

Hej [Navn],

Vidste I, at en AI-agent kan håndtere 90% af jeres
kundeopkald/booking/support for under 2.000 kr/md?

Vi hjælper virksomheder som [Firmanavn] med at automatisere
[specifikfunktion] — og typisk sparer de 40-60% på lønomkostninger.

Jeg har lavet en gratis besparelsesanalyse for jer.
5 minutter til et hurtigt kald?

Med venlig hilsen,
Oliver
[Firmanavn] | AI Transformation
```

### LinkedIn DM Template
```
Hej [Navn] 👋

Fandt [Firmanavn] og tænkte med det samme —
I kunne spare seriøst mange timer med AI automation
på [specifik proces].

Vi har faktisk allerede forberedt et udkast/analyse for jer.
Skal jeg sende det?

/Oliver
```

---

## DEL 9: NØGLETAL & BENCHMARKS (2026 Markedet)

- **79%** af organisationer kører allerede AI agents i produktion (PwC 2025)
- **171%** gennemsnitlig ROI på AI workflow automation
- **40-70%** cost reduction i finance/procurement med AI
- **80%** af enterprise apps vil have AI agents embedded i 2026 (Gartner)
- **82%** af HR-chefer planlægger AI agent deployment inden maj 2026
- **$126 mia.** — global AI voice agent marked 2026
- **22.7% CAGR** — vækstrate for AI agent markedet

Disse tal er jeres ammunition i salgsmøder. Print dem. Brug dem. De lukker deals.

---

*Dokumentet er klar til eksekution. Ingen teori. Kun handling.*
