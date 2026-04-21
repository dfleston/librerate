# Librerate — Design System
### *The Author's Operating System*

> **Platform Identity:** Librerate is not a SaaS tool. It is a publishing atelier — where the book is the seed of everything: income, community, rights, and legacy. The aesthetic borrows from rare book culture, editorial print design, and the quiet confidence of institutions that have been doing important work for centuries.

---

## 1. Philosophy & Voice

**The metaphor that drives every design decision:** A manuscript becoming a living asset.

Librerate should feel like the intersection of a fine editorial house and a modern financial instrument — neither crypto-bro nor corporate SaaS. The tone is **calm authority**. Every screen should make the author feel like a publisher, not a user.

**Words we use:**
- "Your Work" not "Your Content"
- "Patrons" not "Investors"
- "Royalty Certificate" not "NFT" or "Token"
- "Broadcasting" not "Marketing"
- "Atelier" not "Dashboard"
- "Seed" not "Source file"

**Words we never use:**
- Crypto, blockchain, NFT, token, wallet, gas fees
- SaaS, platform, tool, app
- Content, assets, product

---

## 2. Color System

The palette draws from aged vellum, Indian ink, oxidized copper, and the warm gold of archival stamps.

```css
:root {
  /* Backgrounds */
  --color-parchment:     #F5F0E8;   /* Primary canvas — warm off-white */
  --color-vellum:        #EDE7D4;   /* Card surfaces, elevated panels */
  --color-ink-wash:      #1A1714;   /* Deep background for dark sections */
  --color-ink-mid:       #2C2823;   /* Secondary dark surface */

  /* Type */
  --color-ink:           #1A1714;   /* Primary body text */
  --color-ink-secondary: #4A4540;   /* Muted body, captions */
  --color-ink-tertiary:  #7A736A;   /* Placeholder, disabled */
  --color-parchment-text:#F5F0E8;   /* Text on dark backgrounds */

  /* Brand */
  --color-copper:        #B5622A;   /* Primary accent — CTAs, highlights */
  --color-copper-light:  #D4813E;   /* Hover state */
  --color-copper-dark:   #8A4720;   /* Active / pressed */
  --color-copper-tint:   #F0E4D4;   /* Subtle backgrounds, badges */

  /* Signal */
  --color-gold:          #C9A227;   /* Success, earnings, royalty events */
  --color-gold-tint:     #FBF3DC;
  --color-sage:          #4A7C59;   /* Approved, live, published */
  --color-sage-tint:     #DFF0E4;
  --color-sienna:        #9B3A2C;   /* Error, warning */
  --color-sienna-tint:   #F7E4E1;

  /* Borders & dividers */
  --color-rule:          #D6CEC0;   /* Default border */
  --color-rule-strong:   #B8AD9E;   /* Emphasized separator */
  --color-rule-subtle:   #EDE7D4;   /* Barely-there divider */
}
```

**Dark mode** (Atelier Night — used in the writing/dashboard environment):
```css
[data-theme="night"] {
  --color-parchment:     #1A1714;
  --color-vellum:        #2C2823;
  --color-ink:           #EDE7D4;
  --color-ink-secondary: #A89F94;
  --color-rule:          #3D3730;
}
```

---

## 3. Typography

The type system pairs a distinguished serif for display with a humanist monospaced for data and an elegant sans for UI chrome.

```css
/* Import */
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

:root {
  /* Typefaces */
  --font-display:  'Playfair Display', Georgia, serif;       /* Headlines, hero text */
  --font-body:     'Cormorant Garamond', Georgia, serif;     /* Long-form prose, descriptions */
  --font-ui:       'DM Sans', system-ui, sans-serif;         /* Navigation, labels, buttons */
  --font-data:     'DM Mono', 'Courier New', monospace;      /* Numbers, codes, royalty amounts */

  /* Scale (Major Third — 1.250) */
  --text-xs:       0.64rem;    /* 10.2px — fine print, footnotes */
  --text-sm:       0.8rem;     /* 12.8px — captions, labels */
  --text-base:     1rem;       /* 16px   — body */
  --text-md:       1.25rem;    /* 20px   — lead text */
  --text-lg:       1.563rem;   /* 25px   — card titles */
  --text-xl:       1.953rem;   /* 31.25px — section heads */
  --text-2xl:      2.441rem;   /* 39px   — page titles */
  --text-3xl:      3.052rem;   /* 48.8px — hero */
  --text-4xl:      3.815rem;   /* 61px   — editorial splash */

  /* Weights */
  --weight-light:   300;
  --weight-regular: 400;
  --weight-medium:  500;
  --weight-semibold:600;
  --weight-bold:    700;

  /* Leading */
  --leading-tight:  1.1;
  --leading-snug:   1.3;
  --leading-normal: 1.5;
  --leading-relaxed:1.7;
  --leading-loose:  2.0;

  /* Tracking */
  --tracking-tight:  -0.02em;
  --tracking-normal:  0em;
  --tracking-wide:    0.06em;
  --tracking-widest:  0.14em;
}
```

**Type roles:**
| Role | Font | Size | Weight | Use |
|---|---|---|---|---|
| Hero Title | Playfair Display | `--text-4xl` | 700 | Landing page splash |
| Section Title | Playfair Display | `--text-2xl` | 600 | Page and section headers |
| Card Title | Cormorant Garamond | `--text-lg` | 600 | Module and card headings |
| Body | Cormorant Garamond | `--text-base` | 400 | Descriptions, paragraphs |
| UI Label | DM Sans | `--text-sm` | 500 | Buttons, nav, form labels |
| Caption | DM Sans | `--text-xs` | 400 | Meta info, timestamps |
| Royalty Number | DM Mono | `--text-lg` | 500 | Earnings, cert counts |
| Code | DM Mono | `--text-sm` | 400 | API keys, contract addresses |

---

## 4. Spacing & Layout

```css
:root {
  /* Base unit: 4px */
  --space-1:   0.25rem;   /* 4px */
  --space-2:   0.5rem;    /* 8px */
  --space-3:   0.75rem;   /* 12px */
  --space-4:   1rem;      /* 16px */
  --space-5:   1.25rem;   /* 20px */
  --space-6:   1.5rem;    /* 24px */
  --space-8:   2rem;      /* 32px */
  --space-10:  2.5rem;    /* 40px */
  --space-12:  3rem;      /* 48px */
  --space-16:  4rem;      /* 64px */
  --space-20:  5rem;      /* 80px */
  --space-24:  6rem;      /* 96px */
  --space-32:  8rem;      /* 128px */

  /* Layout containers */
  --container-sm:  640px;
  --container-md:  768px;
  --container-lg:  1024px;
  --container-xl:  1280px;
  --container-2xl: 1440px;

  /* Content reading width */
  --prose-width: 65ch;

  /* Sidebar widths */
  --sidebar-collapsed: 64px;
  --sidebar-expanded:  240px;
}
```

**Grid system:**
- Public pages: 12-column, `--space-6` gutters
- Dashboard: 24-column for precise widget placement
- Always maintain a minimum `--space-8` margin on mobile

---

## 5. Elevation & Depth

Librerate uses ink-shadow depth instead of generic box shadows — shadows are warm-tinted to feel like objects resting on parchment.

```css
:root {
  --shadow-sm:   0 1px 2px rgba(26, 23, 20, 0.06);
  --shadow-md:   0 4px 12px rgba(26, 23, 20, 0.10), 0 1px 3px rgba(26, 23, 20, 0.08);
  --shadow-lg:   0 8px 24px rgba(26, 23, 20, 0.14), 0 2px 6px rgba(26, 23, 20, 0.08);
  --shadow-xl:   0 16px 48px rgba(26, 23, 20, 0.18), 0 4px 12px rgba(26, 23, 20, 0.10);
  --shadow-inner:inset 0 2px 4px rgba(26, 23, 20, 0.08);

  /* Floating elements (modals, popovers) */
  --shadow-float: 0 24px 80px rgba(26, 23, 20, 0.22), 0 8px 24px rgba(26, 23, 20, 0.12);

  /* Copper glow — used on primary CTAs and active certificate cards */
  --shadow-copper: 0 4px 20px rgba(181, 98, 42, 0.30);
  --shadow-gold:   0 4px 20px rgba(201, 162, 39, 0.35);
}
```

---

## 6. Border Radius

```css
:root {
  --radius-sm:   2px;    /* Subtle — tags, chips */
  --radius-md:   6px;    /* Cards, inputs */
  --radius-lg:   12px;   /* Panels, modals */
  --radius-xl:   20px;   /* Feature cards, illustrations */
  --radius-full: 9999px; /* Pills, avatars, badges */
}
```

Design note: Librerate uses **restrained rounding**. Cards have `--radius-md` (6px), not soft pill shapes. The aesthetic is editorial, not bubbly.

---

## 7. Iconography

**Primary library:** [Phosphor Icons](https://phosphoricons.com/) — use `Regular` weight for UI, `Duotone` for feature illustrations, `Bold` for alerts.

**Custom glyphs** (SVG, commissioned):
- `LibrerateMark` — colophon logo mark (stylized F + open book spine)
- `CertificateStamp` — circular royalty certificate seal
- `SeedIcon` — seed/sprout motif (the book as seed)
- `PatronMedal` — patron badge icon

**Usage rules:**
- Icon size tracks text size: `1em` relative sizing always
- Never use icons without accessible `aria-label` or adjacent text
- Duotone icons: primary color `currentColor`, secondary color 20% opacity
- Do not mix weights in the same component

---

## 8. Component Library

### 8.1 Buttons

```css
/* Base */
.btn {
  font-family:    var(--font-ui);
  font-size:      var(--text-sm);
  font-weight:    var(--weight-medium);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  padding:        var(--space-3) var(--space-6);
  border-radius:  var(--radius-md);
  transition:     all 180ms ease;
  cursor:         pointer;
}

/* Primary — Copper */
.btn-primary {
  background:  var(--color-copper);
  color:       var(--color-parchment);
  border:      none;
  box-shadow:  var(--shadow-sm);
}
.btn-primary:hover {
  background:  var(--color-copper-light);
  box-shadow:  var(--shadow-copper);
  transform:   translateY(-1px);
}

/* Secondary — Outlined */
.btn-secondary {
  background:  transparent;
  color:       var(--color-copper);
  border:      1.5px solid var(--color-copper);
}
.btn-secondary:hover {
  background: var(--color-copper-tint);
}

/* Ghost */
.btn-ghost {
  background:  transparent;
  color:       var(--color-ink-secondary);
  border:      1.5px solid var(--color-rule);
}

/* Sizes */
.btn-sm { padding: var(--space-2) var(--space-4); font-size: var(--text-xs); }
.btn-lg { padding: var(--space-4) var(--space-8); font-size: var(--text-base); }
```

### 8.2 Cards

Three card types are used throughout Librerate:

**Parchment Card** — default content card
```css
.card {
  background:    var(--color-vellum);
  border:        1px solid var(--color-rule);
  border-radius: var(--radius-md);
  padding:       var(--space-6);
  box-shadow:    var(--shadow-sm);
}
.card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--color-rule-strong);
}
```

**Certificate Card** — Royalty Certificate display
```css
.card-certificate {
  background:    var(--color-ink-wash);
  border:        1px solid var(--color-copper-dark);
  border-radius: var(--radius-md);
  padding:       var(--space-8);
  position:      relative;
  overflow:      hidden;
}
.card-certificate::before {
  /* Watermark pattern: faint diagonal lines */
  content: '';
  position: absolute;
  inset: 0;
  background-image: repeating-linear-gradient(
    45deg,
    rgba(181, 98, 42, 0.04) 0px,
    rgba(181, 98, 42, 0.04) 1px,
    transparent 1px,
    transparent 12px
  );
}
```

**Progress Card** — Publishing checklist step
```css
.card-step {
  background:    var(--color-parchment);
  border-left:   3px solid var(--color-rule-strong);
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
  padding:       var(--space-5) var(--space-6);
}
.card-step[data-status="complete"] {
  border-left-color: var(--color-sage);
}
.card-step[data-status="active"] {
  border-left-color: var(--color-copper);
  background: var(--color-copper-tint);
}
```

### 8.3 Form Inputs

```css
.input {
  font-family:    var(--font-ui);
  font-size:      var(--text-base);
  color:          var(--color-ink);
  background:     var(--color-parchment);
  border:         1.5px solid var(--color-rule);
  border-radius:  var(--radius-md);
  padding:        var(--space-3) var(--space-4);
  width:          100%;
  transition:     border-color 150ms, box-shadow 150ms;
}
.input:focus {
  outline:        none;
  border-color:   var(--color-copper);
  box-shadow:     0 0 0 3px rgba(181, 98, 42, 0.15);
}
.input::placeholder {
  color: var(--color-ink-tertiary);
}
```

### 8.4 Navigation

The sidebar nav uses a collapsible design. Active items receive a copper left-border marker — an editorial "thumb tab" motif.

```css
.nav-item {
  display:        flex;
  align-items:    center;
  gap:            var(--space-3);
  padding:        var(--space-3) var(--space-4);
  border-radius:  var(--radius-md);
  font-family:    var(--font-ui);
  font-size:      var(--text-sm);
  font-weight:    var(--weight-medium);
  color:          var(--color-ink-secondary);
  position:       relative;
  transition:     all 150ms;
}
.nav-item:hover {
  background: var(--color-vellum);
  color: var(--color-ink);
}
.nav-item[aria-current="page"] {
  color:      var(--color-copper);
  background: var(--color-copper-tint);
}
.nav-item[aria-current="page"]::before {
  content: '';
  position: absolute;
  left: 0;
  top: 20%;
  bottom: 20%;
  width: 3px;
  background: var(--color-copper);
  border-radius: 0 2px 2px 0;
}
```

### 8.5 Badges & Status Pills

```css
.badge {
  display:        inline-flex;
  align-items:    center;
  gap:            var(--space-1);
  font-family:    var(--font-ui);
  font-size:      var(--text-xs);
  font-weight:    var(--weight-medium);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  padding:        2px var(--space-3);
  border-radius:  var(--radius-full);
}
.badge-live     { background: var(--color-sage-tint);   color: var(--color-sage); }
.badge-draft    { background: var(--color-vellum);      color: var(--color-ink-secondary); }
.badge-earnings { background: var(--color-gold-tint);   color: var(--color-gold); }
.badge-patron   { background: var(--color-copper-tint); color: var(--color-copper); }
```

### 8.6 Data Display (Royalty Numbers)

```css
.royalty-amount {
  font-family:  var(--font-data);
  font-size:    var(--text-2xl);
  font-weight:  var(--weight-medium);
  color:        var(--color-gold);
  letter-spacing: var(--tracking-tight);
}
.royalty-label {
  font-family:    var(--font-ui);
  font-size:      var(--text-xs);
  font-weight:    var(--weight-medium);
  letter-spacing: var(--tracking-widest);
  text-transform: uppercase;
  color:          var(--color-ink-tertiary);
}
```

---

## 9. Motion & Animation

Librerate animations should feel like pages turning, ink spreading, and stamps being pressed — never bouncy or bubbly.

```css
:root {
  /* Durations */
  --duration-instant:  80ms;
  --duration-fast:    150ms;
  --duration-normal:  250ms;
  --duration-slow:    400ms;
  --duration-slower:  600ms;

  /* Easing */
  --ease-in:      cubic-bezier(0.4, 0, 1, 1);
  --ease-out:     cubic-bezier(0, 0, 0.2, 1);
  --ease-inout:   cubic-bezier(0.4, 0, 0.2, 1);
  --ease-press:   cubic-bezier(0.34, 1.56, 0.64, 1);   /* Subtle spring — stamp press */
  --ease-unfurl:  cubic-bezier(0.16, 1, 0.3, 1);        /* Page unfurling reveal */
}

/* Page entry — content stagger */
@keyframes unfurl {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Certificate reveal — ink spreading */
@keyframes ink-spread {
  from { opacity: 0; transform: scale(0.96); }
  to   { opacity: 1; transform: scale(1); }
}

/* Earnings update — gold pulse */
@keyframes gold-pulse {
  0%   { box-shadow: 0 0 0 0 rgba(201, 162, 39, 0.5); }
  70%  { box-shadow: 0 0 0 10px rgba(201, 162, 39, 0); }
  100% { box-shadow: 0 0 0 0 rgba(201, 162, 39, 0); }
}
```

**Animation principles:**
- Page-level content: `unfurl` animation with 60ms stagger between children
- Hover states: max 180ms, `ease-out`
- Data updates (new royalty): `gold-pulse` on the number
- Modal open: `ink-spread` at `--duration-slow` with `ease-unfurl`
- Never animate layout properties (width/height) — use transform + opacity only

---

## 10. Texture & Decoration

Librerate uses subtle textures to distinguish from flat SaaS aesthetics.

**Paper grain overlay** (applied to major surface sections):
```css
.surface-grain::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image: url("data:image/svg+xml,..."); /* SVG noise filter */
  opacity: 0.025;
  mix-blend-mode: multiply;
}
```

**Section divider — editorial rule:**
```css
.divider-editorial {
  border: none;
  border-top: 1px solid var(--color-rule);
  position: relative;
}
.divider-editorial::before {
  content: '§';
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  background: var(--color-parchment);
  padding: 0 var(--space-3);
  font-family: var(--font-display);
  font-size: var(--text-base);
  color: var(--color-ink-tertiary);
}
```

**Certificate watermark pattern:** Diagonal fine-line grid using `repeating-linear-gradient`.

---

## 11. Page Architecture

### 11.1 Marketing / Public Pages

```
┌─────────────────────────────────────────────┐
│  Topbar (logo + nav links + CTA)             │
├─────────────────────────────────────────────┤
│  Hero (Playfair headline + sub + 2 CTAs)     │
│  — full viewport, dark ink-wash bg           │
├─────────────────────────────────────────────┤
│  Social proof strip (logos on parchment)     │
├─────────────────────────────────────────────┤
│  Feature sections (alternating layout)       │
├─────────────────────────────────────────────┤
│  Royalty Certificate demo / preview          │
├─────────────────────────────────────────────┤
│  Testimonials — author quotes                │
├─────────────────────────────────────────────┤
│  Footer (colophon style)                     │
└─────────────────────────────────────────────┘
```

### 11.2 Author Atelier (Dashboard)

```
┌──────────┬──────────────────────────────────┐
│ Sidebar  │  Top bar (breadcrumb + account)   │
│  Nav     ├──────────────────────────────────┤
│  240px   │  Page title + context actions     │
│          ├──────────────────────────────────┤
│  (64px   │                                  │
│  when    │  Main content area               │
│  collapsed)  (12/16/24 col grid)            │
│          │                                  │
└──────────┴──────────────────────────────────┘
```

**Sidebar sections:**
1. Your Books (per-book switcher)
2. Atelier (overview)
3. The Work (manuscript & seed)
4. Broadcasting (content generation)
5. Distribution (KDP, stores, SEO)
6. Patrons (royalty certificates)
7. Earnings (royalty dashboard)
8. Campaigns (ads)
9. Settings

---

## 12. Illustration Style

Illustrations use a two-color ink style: `--color-ink` and `--color-copper`, with `--color-parchment` as ground. Think wood engraving / linocut — not flat icon, not 3D render.

Scenes to commission:
- Open book with seedling growing from spine
- Certificate stamp with radiating lines
- Broadcast tower made of stacked books
- Map with distribution routes as typeset paths

---

## 13. Responsive Breakpoints

```css
/* Mobile first */
:root {
  --bp-sm:  480px;   /* Large mobile */
  --bp-md:  768px;   /* Tablet */
  --bp-lg:  1024px;  /* Small desktop */
  --bp-xl:  1280px;  /* Desktop */
  --bp-2xl: 1536px;  /* Wide */
}
```

**Sidebar behavior:**
- `< 768px`: Hidden, accessed via overlay drawer
- `768–1024px`: Collapsed (64px icon-only)
- `> 1024px`: Expanded (240px) or user-toggled collapsed

---

## 14. Accessibility

- Minimum contrast ratio: **4.5:1** for all body text, **3:1** for UI elements
- `--color-copper` on `--color-parchment`: 4.8:1 ✓
- `--color-ink` on `--color-parchment`: 14.3:1 ✓
- All interactive elements: visible focus ring using `box-shadow: 0 0 0 3px rgba(181,98,42,0.4)`
- Never rely on color alone to convey state — always pair with icon or label
- Minimum touch target: 44×44px
- Reduced-motion: wrap all `@keyframes` calls in `@media (prefers-reduced-motion: no-preference)`

---

## 15. Improved Project Prompt

```
You are the lead product architect for Librerate — an author publishing platform
where the book is the seed of everything.

Librerate is not described as a SaaS tool, crypto platform, or NFT marketplace.
It is an Author's Operating System — a publishing atelier that combines:

1. AI-guided publishing workflow (structured checkpoints from manuscript to market)
2. Broadcast generation (social, email, press from the book's content)
3. Distribution & SEO optimization (Amazon KDP, major retailers, author's own site)
4. Paid campaigns (ad management for book launches)
5. Patron royalty agreements (fiat-purchased "Royalty Certificates" — legally structured
   revenue-share instruments backed by smart contracts, presented with zero crypto UX)

TECHNICAL STACK:
- Frontend: Next.js (React) + Tailwind CSS
- Auth & Embedded Wallets: Privy SDK (@privy-io/react-auth) — users never see a wallet
- Payments: Stripe (checkout + webhooks) — fiat-only UX
- Institutional bridge: Kraken Embed API — royalties from Amazon KDP auto-convert to USDC
- Smart contracts: Solana or Base (Ethereum L2) — distributeFunds() auto-splits to holders
- API: RESTful + MCP-compatible for developer integrations
- AI: Claude (Anthropic) as guided publishing expert embedded in every workflow

DESIGN SYSTEM: Warm editorial — parchment backgrounds, copper accents, Playfair Display
headlines, Cormorant Garamond body, DM Sans UI chrome. Feels like a rare book house
meets a modern fintech dashboard. Never generic SaaS purple gradients.

UX PRINCIPLES:
- The author feels like a publisher, not a user
- Crypto rails are completely invisible — patrons buy a "share in the book's earnings"
- Every AI-generated output traces back to the book as source of truth (the seed)
- The chat-guided AI assistant produces complete workflows: manuscripts → broadcasting
  material → SEO copy → ad campaigns → patron raise — all from a single upload

LANGUAGE:
- "Your Work" not "Your Content"
- "Patrons" not "Investors"  
- "Royalty Certificates" not "NFTs" or "tokens"
- "Atelier" not "Dashboard"
- "Broadcasting" not "Marketing"
- "Seed" (the book) not "Source file"

When building any component, page, or feature: consult this system prompt,
the design.md design system, and the technical brief before writing any code.
Every visual must feel like it belongs in a fine editorial house.
```

---

## 16. File & Naming Conventions

```
/src
  /components
    /ui          — primitive components (Button, Card, Input, Badge)
    /atelier     — dashboard-specific (BookSwitcher, RoyaltyStat, CertCard)
    /marketing   — public page sections (Hero, FeatureBand, TestimonialRow)
    /forms       — multi-step onboarding, publishing checklist
  /hooks         — useRoyalties, usePatrons, useBroadcast, useSeed
  /styles
    tokens.css   — all CSS custom properties (this file)
    reset.css
    typography.css
  /lib
    privy.ts     — wallet/auth helpers
    stripe.ts    — checkout helpers
    kraken.ts    — royalty ingestion
    contract.ts  — smart contract ABI + helpers
```

---

*Librerate Design System v1.0 — For internal use. Do not distribute.*