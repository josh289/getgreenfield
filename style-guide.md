# Greenfield Redesign Plan: Dark Dramatic Theme (Osmo Supply Style)

## REVISED: Color Palette (Based on Complete Osmo Analysis)

### Primary Colors
- **Background**: `#000000` (pure black, like Osmo)
- **Surface/Cards**: `#0a0a0a` to `#141414` (very dark gray cards)
- **Borders**: `#1a1a1a` to `#252525` (subtle but visible)

### Text Colors
- **Primary Text**: `#ffffff` (pure white)
- **Secondary Text**: `#a0a0a0` (light gray)
- **Muted Text**: `#666666` (medium gray)
- **Monospace Labels**: `#999999` (for timestamps, badges)

### Accent Colors (REVISED - More Dramatic)
- **Primary Accent**: `#00d9ff` (cyan) - for primary CTAs
- **Dramatic Accent**: `#ff6b35` (orange/red) - for hero glows, special callouts (like Osmo's pricing card)
- **Success**: `#10b981` (emerald)
- **Badge/Label**: `#fbbf24` (amber) - for "NEW", "BETA" badges

### Visual Effects (NEW)
- **Gradient Glows**: Radial gradients with orange/cyan for hero sections
- **Shadows**: `0 4px 20px rgba(0, 217, 255, 0.15)` for cards
- **Hover Effects**: Border color shifts + subtle glow
- **Background Textures**: Subtle noise or gradient overlays

---

## Complete Section-by-Section Redesign (REVISED)

### 1. Hero Section - Dramatic Visual Impact

**Current Issues:**
- Not dramatic enough
- Missing visual effects
- No background interest

**New Design (Osmo-Style Dramatic):**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Full viewport height]
[Background: Pure black with radial gradient glow effect]
[Gradient: radial-gradient(circle at 50% 40%, rgba(255, 107, 53, 0.15), transparent 60%)]

Unlock AI's Full Potential
for Software Development

[MASSIVE headline, 72-80px, font-weight 800, white]
[Apply subtle text-shadow for depth: 0 4px 30px rgba(255, 107, 53, 0.3)]
[Letter-spacing: -0.02em]
[Line-height: 1.1]
[Max-width: 1100px, centered]
[250px margin top]

Bounded contexts prevent hallucinations.

[Subheadline, 22px, font-weight 400, #a0a0a0]
[60px margin bottom]
[Max-width: 600px, centered]

[Two CTAs, side by side, 16px gap]
[Primary: "Join Early Access" - Cyan background, black text]
[Secondary: "See It In Action" - Transparent with white border]
[Each: 20px padding vertical, 48px horizontal]

[180px margin bottom]

Serving 30,000+ users in production
[14px, #666666, centered]

[Total section height: ~900px]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Visual Effects:**
- Radial gradient glow emanating from behind headline
- Subtle particle effect or noise texture (optional)
- Hero CTA buttons with glow on hover
- Fade-in animation on page load

**Remove from hero:**
- All explanatory text about "AI can finally build complete systems..."
- Any secondary messaging
- Keep it MASSIVE and SIMPLE

---

### 2. Social Proof Strip (Simplified)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Background: #0a0a0a, full width]
[120px padding vertical]

[Three stats in a row, equal spacing]
[Each stat: 24px font, #ffffff, font-weight 600]
[Separated by subtle vertical lines: 1px, 40px height, #1a1a1a]

Production in 7 days    |    1000x productivity    |    30,000+ users

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### 3. Problem Statement (Simplified)

**Current Issues:**
- Four separate problem cards (too much)
- Repetitive messaging

**New Design:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[180px padding vertical]
[Centered, max 800px]

Why AI Can't Build Software That Works

[Headline, 48px, white, center-aligned]
[60px margin bottom]

Current AI fails with large codebases. It hallucinates, loses context,
and generates broken code. Without boundaries, AI generates
plausible-looking disasters.

[Body text, 20px, #a0a0a0, center-aligned, line-height 1.8]
[80px margin bottom]

[Two-column grid, 60px gap]

┌─────────────────────────┐  ┌─────────────────────────┐
│                         │  │                         │
│  AI Hallucinations      │  │  Context Overflow       │
│  [icon]                 │  │  [icon]                 │
│                         │  │                         │
│  Large contexts break   │  │  Production systems     │
│  AI accuracy            │  │  exceed AI's ability    │
│                         │  │                         │
└─────────────────────────┘  └─────────────────────────┘

[Cards: background #141414, border 1px #252525, 48px padding,
16px rounded corners, 180px min-height]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Remove:**
- "Compounding Errors" card
- "Unreliable Output" card
- Consolidate into the two most impactful problems

---

### 4. Solution Statement (The Hook)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Background: #0a0a0a, 180px padding vertical]
[Centered, max 700px]

What if AI could build without hallucinating?

[Headline, 52px, white, center-aligned]
[120px margin bottom]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### 5. How It Works (Streamlined)

**Current Issues:**
- Four feature cards (too many)
- Text-heavy

**New Design:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[160px padding vertical]

Greenfield Makes AI Development Actually Work

[Headline, 44px, white, center-aligned]
[100px margin bottom]

[Three-column grid, 40px gap, max 1200px]

┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│                 │  │                 │  │                 │
│ Perfect Context │  │ Zero            │  │ Infinite Scale  │
│                 │  │ Hallucinations  │  │                 │
│ [Simple icon]   │  │ [Simple icon]   │  │ [Simple icon]   │
│                 │  │                 │  │                 │
│ Every piece     │  │ Bounded contexts│  │ AI builds       │
│ under 1,000     │  │ eliminate       │  │ systems of any  │
│ lines           │  │ confusion       │  │ size            │
│                 │  │                 │  │                 │
└─────────────────┘  └─────────────────┘  └─────────────────┘

[Cards: no background, no border, just centered content
with icon, title, and short description]
[Icon: 48px, cyan #00d9ff]
[Title: 24px, white, font-weight 600]
[Description: 16px, #a0a0a0, line-height 1.6]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Remove:**
- "AI Memory Bank" (or move to a features section later)
- All the extra explanatory text

---

### 6. Product Showcase Section (NEW - Show the Platform!)

**Inspiration:** Osmo shows their actual product interface prominently

**New Design:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[200px padding vertical]
[Background: #000000]

See the Platform in Action

[Headline, 56px, white, center-aligned, font-weight 700]
[80px margin bottom]

[Large screenshot/demo of Greenfield Platform Interface]
[Max-width: 1400px, centered]
[Border: 1px solid #1a1a1a]
[Border-radius: 12px]
[Box-shadow: 0 20px 60px rgba(0, 217, 255, 0.1)]

[Screenshot should show:]
- Sidebar with contexts/services
- Main content area with code
- Visual representation of bounded contexts
- Clean, modern IDE-like interface

[Below screenshot, centered, 60px margin top]
[Grid of 4 feature callouts, inline]

┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│              │  │              │  │              │  │              │
│ [Icon]       │  │ [Icon]       │  │ [Icon]       │  │ [Icon]       │
│              │  │              │  │              │  │              │
│ Type-Safe    │  │ Event-Driven │  │ Auto-Deploy  │  │ AI-Native    │
│              │  │              │  │              │  │              │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘

[Each callout: 16px, #a0a0a0, no borders, just text + icon]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Visual Style:**
- Large, high-quality screenshot
- Subtle glow/shadow for depth
- Minimal explanatory text
- Let the product speak for itself

---

### 7. Visual Demo Section (Simplified from ActorDemo)

**Current Issues:**
- Too technical
- Abstract visualization

**New Design:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Background: #0a0a0a, 200px padding vertical]

How It Works

[Headline, 48px, white, center-aligned]
[100px margin bottom]

[Animated diagram or video showing:]
- Traditional monolithic code → Breaking into bounded contexts
- Event flow visualization
- Simple, clean animation
- Auto-play on scroll into view

[Max-width: 900px, centered]
[Aspect ratio: 16:9]
[Background: #141414, rounded corners]
[Border: 1px solid #252525]

[Optional: Play button overlay if video]

[Below animation, 60px margin top]
No more tangled code. Just clean, isolated contexts.

[18px, #a0a0a0, centered]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### 8. Built For Section (Tabbed Interface - Keep but Simplify)

**Current Design is Good, Just Needs:**
- Shorter benefits (3 per tab, 5-8 words each)
- More spacing around tabs
- Larger tab text

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[220px padding vertical]

Built for Everyone

[Headline, 52px, white, center-aligned]
[60px margin bottom]

From individual developers to enterprise teams

[Subheading, 20px, #a0a0a0, center-aligned]
[100px margin bottom]

┌───────────────────────────────────────────────────┐
│                                                   │
│  [Developers]  [Startups]  [Enterprise]          │
│   ─────────                                       │
│  [Active tab has cyan underline, 3px thick]      │
│                                                   │
│  [60px padding top]                              │
│                                                   │
│   Skip the boilerplate                           │
│                                                   │
│   Build features users love without getting      │
│   lost in infrastructure.                        │
│                                                   │
│   • Full-stack confidence                        │
│   • Instant productivity                         │
│   • Accelerated learning                         │
│                                                   │
│  [80px padding bottom]                           │
│                                                   │
└───────────────────────────────────────────────────┘

[Max-width: 700px, centered]
[Tabs: 18px, clean typography]
[Content: 20px body, 16px bullets]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### 9. Core Features (Large Visual Cards - Osmo Style)

**Inspiration:** Osmo shows large cards with screenshots/visuals

**New Design:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Background: #000000, 220px padding vertical]

The toolkit for modern development

[Headline, 52px, white, center-aligned]
[100px margin bottom]

[Two-column layout, alternating image/text sides]
[60px gap between columns]
[Max-width: 1200px]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FEATURE 1: [Image Left, Text Right]

┌────────────────────┐         ┌────────────────────┐
│                    │         │                    │
│  [Screenshot or    │         │  Bounded Contexts  │
│   Illustration     │         │                    │
│   showing bounded  │         │  Self-contained    │
│   contexts]        │         │  domains under     │
│                    │         │  1,000 lines.      │
│  600px width       │         │                    │
│  400px height      │         │  Perfect for AI    │
│                    │         │  understanding.    │
│                    │         │                    │
└────────────────────┘         └────────────────────┘

[120px vertical spacing]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FEATURE 2: [Text Left, Image Right]

┌────────────────────┐         ┌────────────────────┐
│                    │         │                    │
│  Event-Driven      │         │  [Screenshot or    │
│  Architecture      │         │   diagram showing  │
│                    │         │   event flow]      │
│  Clean event       │         │                    │
│  choreography.     │         │  600px width       │
│  Zero coupling.    │         │  400px height      │
│                    │         │                    │
│                    │         │                    │
└────────────────────┘         └────────────────────┘

[120px vertical spacing]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FEATURE 3: [Image Left, Text Right]

┌────────────────────┐         ┌────────────────────┐
│                    │         │                    │
│  [Screenshot of    │         │  Pattern Library   │
│   pattern library  │         │                    │
│   or code]         │         │  200+ production   │
│                    │         │  patterns. Auth,   │
│  600px width       │         │  payments, data.   │
│  400px height      │         │                    │
│                    │         │  Battle-tested.    │
│                    │         │                    │
└────────────────────┘         └────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Visual Style:**
- Large screenshot/illustration on one side
- Short, punchy text on other side
- Alternating layout (left/right)
- Images have subtle border + glow
- Text is 24px headlines, 18px body
- Each feature gets ~700px vertical space

---

### 10. Testimonials Section (NEW - Like Osmo's "Trusted By")

**Inspiration:** Osmo shows circular avatars + large testimonial cards

**New Design:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Background: #0a0a0a, 200px padding vertical]

Trusted by developers at

[Small text, 14px, #666666, center-aligned, uppercase, letter-spacing: 2px]
[40px margin bottom]

[Row of 8-10 circular avatar images]
[Each: 56px diameter, grayscale, 12px gap]
[Centered horizontally]

[100px margin bottom]

[Grid: 1 large testimonial card + 2 smaller side cards]
[Or: 3 equal testimonial cards in a row]

┌─────────────────────────────────────────────────┐
│                                                 │
│  [Large testimonial card]                      │
│                                                 │
│  "Greenfield transformed how we build          │
│  software. What used to take months now        │
│  takes days."                                   │
│                                                 │
│  [Avatar]  Sarah Chen                          │
│            CTO, TechStart Inc                   │
│                                                 │
└─────────────────────────────────────────────────┘

[Cards: background #141414, border 1px #252525]
[Padding: 48px]
[Quote: 22px, #ffffff, line-height 1.6]
[Name: 16px, #ffffff, font-weight 600]
[Title: 14px, #666666]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### 11. Code/Pattern Library Section (Visual Showcase)

**Current Issues:**
- Just a code block
- Not visual enough

**New Design:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Background: #000000, 220px padding vertical]

200+ Production-Ready Patterns

[Headline, 52px, white, center-aligned]
[60px margin bottom]

Battle-tested code for everything from auth to payments

[Subheading, 20px, #a0a0a0, center-aligned]
[100px margin bottom]

[Grid of pattern preview cards: 3 columns, 2 rows]
[Each card shows a preview/thumbnail of the pattern]

┌────────────┐  ┌────────────┐  ┌────────────┐
│            │  │            │  │            │
│ [Preview]  │  │ [Preview]  │  │ [Preview]  │
│            │  │            │  │            │
│ OAuth2     │  │ Stripe     │  │ Email      │
│ Auth       │  │ Payments   │  │ Templates  │
│            │  │            │  │            │
└────────────┘  └────────────┘  └────────────┘

┌────────────┐  ┌────────────┐  ┌────────────┐
│            │  │            │  │            │
│ [Preview]  │  │ [Preview]  │  │ [Preview]  │
│            │  │            │  │            │
│ File       │  │ Real-time  │  │ Webhooks   │
│ Upload     │  │ Chat       │  │            │
│            │  │            │  │            │
└────────────┘  └────────────┘  └────────────┘

[Each card: 350px x 250px]
[Background: #0a0a0a]
[Border: 1px solid #252525]
[Hover: border-color cyan, subtle lift]
[Preview can be code snippet or diagram]

[Below grid, centered, 60px margin top]
Explore Pattern Library →

[Link, 18px, cyan, with arrow]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### 10. Getting Started (Simplified)

**Current Issues:**
- Four-step process might be too detailed

**New Design:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Background: #141414, 180px padding vertical]

Get Started in Minutes

[Headline, 44px, white, center-aligned]
[100px margin bottom]

[Terminal-style command display]
┌─────────────────────────────────────────────┐
│ $ npm install -g @banyan/cli                │
│ $ banyan create my-app --template react-ts  │
│ $ banyan dev                                 │
└─────────────────────────────────────────────┘

[Background: #0a0a0a, 24px padding, 8px rounded,
monospace font, 16px, #00d9ff text]
[Max 600px, centered]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### 11. Final CTA Section

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[200px padding vertical]
[Centered, max 800px]

Ready to Transform Your Development?

[Headline, 48px, white, center-aligned]
[40px margin bottom]

Early access begins Q1 2025. Limited spots available.

[Subheading, 18px, #a0a0a0, center-aligned]
[60px margin bottom]

[Large CTA Button - Cyan #00d9ff]
Join Early Access →

[20px margin bottom]

[Small text, 14px, #666666]
50% lifetime discount for early members

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### 12. Footer (Minimal)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Background: #0a0a0a, 80px padding vertical]
[Centered content, max 1200px]

Greenfield Platform

[Logo/Brand, 18px, white]

[Simple navigation links, inline, 14px, #a0a0a0]
Docs  •  FAQ  •  Pricing  •  Blog  •  Contact

[Social icons - simple outline style, 20px, #666666]
[GitHub] [Twitter] [LinkedIn]

© 2025 Greenfield. Built for developers.

[12px, #666666]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Typography System

### Font Family
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### Type Scale
- **Hero Headline**: 64px / font-weight: 700 / line-height: 1.1
- **Section Headline**: 44-48px / font-weight: 700 / line-height: 1.2
- **Sub-headline**: 18-20px / font-weight: 400 / line-height: 1.6
- **Body**: 16-18px / font-weight: 400 / line-height: 1.7
- **Small**: 14px / font-weight: 400 / line-height: 1.5
- **Code**: 16px / font-family: 'Fira Code', monospace

---

## Spacing System

### Section Spacing
- **Between major sections**: 160-200px
- **Within sections**: 80-120px
- **Between elements**: 40-60px
- **Tight spacing**: 16-24px

### Container Widths
- **Hero content**: max 1000px
- **Body content**: max 800px
- **Feature grids**: max 1200px
- **Code blocks**: max 700px

---

## Interactive Elements & Visual Effects (REVISED)

### Hero Visual Effects

**Radial Gradient Glow:**
```css
.hero-section {
  background: #000000;
  position: relative;
}

.hero-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  height: 100%;
  background: radial-gradient(
    circle at 50% 40%,
    rgba(255, 107, 53, 0.15) 0%,
    rgba(255, 107, 53, 0.08) 30%,
    transparent 60%
  );
  pointer-events: none;
}

/* Alternative: Cyan glow */
.hero-section.cyan-glow::before {
  background: radial-gradient(
    circle at 50% 40%,
    rgba(0, 217, 255, 0.12) 0%,
    rgba(0, 217, 255, 0.06) 30%,
    transparent 60%
  );
}
```

**Headline Glow Effect:**
```css
.hero-headline {
  font-size: 80px;
  font-weight: 800;
  color: #ffffff;
  text-shadow: 0 4px 30px rgba(255, 107, 53, 0.25);
  letter-spacing: -0.02em;
  line-height: 1.1;
}
```

### Buttons

**Primary CTA (Cyan):**
```css
.btn-primary {
  background: #00d9ff;
  color: #000000;
  padding: 20px 48px;
  border-radius: 8px;
  font-size: 18px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 14px 0 rgba(0, 217, 255, 0.25);
}

.btn-primary:hover {
  background: #00c4e6;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px 0 rgba(0, 217, 255, 0.35);
}
```

**Secondary CTA (Outline):**
```css
.btn-secondary {
  background: transparent;
  color: #ffffff;
  padding: 18px 48px;
  border: 2px solid #252525;
  border-radius: 8px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  border-color: #00d9ff;
  color: #00d9ff;
  box-shadow: 0 0 20px rgba(0, 217, 255, 0.15);
}
```

### Cards

**Feature Card with Hover:**
```css
.feature-card {
  background: #0a0a0a;
  border: 1px solid #252525;
  border-radius: 12px;
  padding: 48px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.feature-card:hover {
  border-color: #00d9ff;
  transform: translateY(-4px);
  box-shadow: 0 10px 40px rgba(0, 217, 255, 0.15);
}
```

**Large Visual Card (Osmo Style):**
```css
.visual-card {
  background: #0a0a0a;
  border: 1px solid #1a1a1a;
  border-radius: 16px;
  padding: 0;
  overflow: hidden;
  transition: all 0.3s ease;
}

.visual-card img {
  width: 100%;
  height: auto;
  display: block;
}

.visual-card-content {
  padding: 32px;
}

.visual-card:hover {
  border-color: #252525;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}
```

### Screenshot/Product Image Styling

```css
.product-screenshot {
  max-width: 1400px;
  width: 100%;
  border: 1px solid #1a1a1a;
  border-radius: 12px;
  box-shadow:
    0 20px 60px rgba(0, 217, 255, 0.1),
    0 4px 20px rgba(0, 0, 0, 0.5);
  transition: all 0.4s ease;
}

.product-screenshot:hover {
  box-shadow:
    0 30px 80px rgba(0, 217, 255, 0.15),
    0 8px 30px rgba(0, 0, 0, 0.6);
  transform: translateY(-4px);
}
```

### Badges & Labels

**NEW Badge (Osmo Style):**
```css
.badge-new {
  display: inline-block;
  padding: 4px 12px;
  background: #ff6b35;
  color: #000000;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  border-radius: 4px;
  font-family: 'Monaco', 'Courier New', monospace;
}
```

**Timestamp Label:**
```css
.timestamp {
  font-size: 12px;
  color: #666666;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  font-family: 'Monaco', 'Courier New', monospace;
}
```

### Dividers & Separators

```css
.section-divider {
  height: 1px;
  background: linear-gradient(
    to right,
    transparent,
    #252525 20%,
    #252525 80%,
    transparent
  );
  margin: 200px 0;
}
```

### Links

```css
.link-primary {
  color: #00d9ff;
  font-size: 18px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.link-primary:hover {
  color: #00c4e6;
  transform: translateX(4px);
}

.link-primary::after {
  content: '→';
  transition: transform 0.3s ease;
}

.link-primary:hover::after {
  transform: translateX(4px);
}
```

---

## Animation Guidelines

### Scroll Animations
- Fade in elements as they enter viewport
- Delay: 0.1s between elements
- Duration: 0.6s
- Easing: ease-out

### Hover Effects
- Subtle scale (1.02) or translateY(-2px)
- Duration: 0.3s
- Easing: ease

### Page Load
- Hero fades in: 0.8s
- Sequential element reveals: stagger by 0.1s

---

## Mobile Responsiveness

### Breakpoints
- Desktop: 1200px+
- Tablet: 768px - 1199px
- Mobile: < 768px

### Mobile Adjustments
- Headline sizes: reduce by 30-40%
- Padding: reduce by 50%
- Grid layouts: convert to single column
- Spacing: reduce by 40%
- Button padding: 14px 32px

---

## New Sections to ADD (Based on Osmo Patterns)

### 1. **Resources/Update Log Page** (If applicable)
- Grid of recent updates/blog posts
- Each with thumbnail, title, timestamp
- "NEW" badges for recent items
- Clean card layout
- Single CTA: "View All Resources"

### 2. **Product Interface Showcase**
- Large, detailed screenshot of the platform
- Show actual working interface
- Sidebar navigation visible
- Main content area with code/diagrams
- Let users see the real product

### 3. **Testimonials/Social Proof**
- Circular avatar row at top
- Large testimonial cards
- Name, title, company
- Mix of quote lengths
- 2-3 testimonials max per page

### 4. **Feature Spotlight Cards**
- Large cards with screenshots
- Alternating image/text layout
- Each feature gets significant space
- Show, don't just describe

### 5. **Pricing Cards** (When ready)
- Three tiers side-by-side
- Middle tier highlighted with accent color
- Clear pricing hierarchy
- Toggle for billing periods
- Single CTA per card

---

## Sections to REMOVE or Drastically Simplify

1. ~~**"See Actors in Action"**~~ - Replace with simpler "How It Works" with animation/video
2. ~~**"The Cognitive Architecture"**~~ - Too technical, move to docs
3. ~~**"The same breakthrough, applied everywhere"**~~ - Simplify to 2-3 use case cards
4. ~~**Detailed "Early Access Benefits"**~~ - Simplify to 3 bullet points
5. ~~**Philosophy section**~~ - Integrate into other sections or remove
6. ~~**Expandable use case details**~~ - Show concise cards only, link to separate pages

---

## Key Design Principles (REVISED Based on Osmo Analysis)

### 1. **Dramatic Visual Impact**
Not flat minimalism - use depth, glows, and visual effects
- Radial gradient glows behind headlines
- Subtle shadows on cards for depth
- Large, high-quality screenshots
- Background textures or images where appropriate

### 2. **Show, Don't Just Tell**
Display the actual product prominently
- Large screenshots of the platform interface
- Visual previews of patterns/components
- Animated demos of functionality
- Grid showcases of available resources

### 3. **Strategic Color Accents**
Not monochrome - use color for emphasis
- Cyan for primary CTAs and interactive elements
- Orange/red for dramatic emphasis (hero glows, special callouts)
- Colorful thumbnails/previews break up darkness
- White text on pure black background

### 4. **Varied Layout Patterns**
Not everything centered - mix it up
- Two-column feature layouts (image + text, alternating sides)
- Three-column pricing cards
- Grid layouts for resources/patterns
- Full-width hero sections
- Sidebar + content layouts for product demos

### 5. **Multiple Visual Layers**
Create depth through layering
- Background effects behind content
- Cards floating on darker backgrounds
- Overlays and glows for emphasis
- Shadows and borders for separation

### 6. **Large, Bold Typography**
Massive headlines with clear hierarchy
- 72-80px hero headlines
- 52-56px section headlines
- Mix of weights (regular 400, semibold 600, bold 700, extra-bold 800)
- Monospace for labels and timestamps

### 7. **Generous Spacing with Purpose**
Whitespace creates breathing room, not emptiness
- 200-250px between major sections
- 100-120px internal section spacing
- 60-80px between content blocks
- But content can be dense within well-defined boundaries

### 8. **Content in Clear Containers**
Organize content into distinct visual zones
- Cards with subtle borders
- Sections with background color changes
- Clear visual boundaries between areas
- Each section is self-contained

### 9. **Product-Forward Design**
The platform is the hero
- Show the interface early and often
- Preview actual patterns and components
- Demonstrate value visually
- Let users see what they'll get

### 10. **Subtle Branding Elements**
Consistent but not overwhelming
- Simple logo in navigation
- Icon system with consistent style
- Monospace for technical labels
- Badges for "NEW", timestamps, categories

---

## Implementation Checklist (REVISED)

### Phase 1: Foundation & Visual System
- [ ] Pure black background (#000000)
- [ ] Implement Inter font family
- [ ] Configure extended spacing utilities (200px+ sections)
- [ ] Set up cyan + orange accent colors
- [ ] Create radial gradient glow system
- [ ] Add monospace font for labels/badges

### Phase 2: Dramatic Hero Section
- [ ] Massive headline (72-80px) with glow effect
- [ ] Radial gradient background glow (orange or cyan)
- [ ] Two-CTA layout (primary cyan, secondary outline)
- [ ] Remove all explanatory text
- [ ] 900px+ section height

### Phase 3: Product Showcase
- [ ] Create large platform screenshot/mockup
- [ ] Implement product interface preview section
- [ ] Add "See It In Action" section with animation/video
- [ ] Show actual code/patterns in grid layout
- [ ] Large visual cards with screenshots

### Phase 4: Large Visual Feature Cards
- [ ] Two-column layout (image + text)
- [ ] Alternating left/right layout
- [ ] 3 major features max
- [ ] Large screenshots/diagrams (600x400px)
- [ ] 120px spacing between features

### Phase 5: Social Proof & Testimonials
- [ ] Circular avatar row ("Trusted by")
- [ ] Large testimonial cards with borders
- [ ] Name, title, company for each
- [ ] 2-3 testimonials max

### Phase 6: Pattern Library Showcase
- [ ] Grid of pattern preview cards (3x2)
- [ ] Visual previews/thumbnails
- [ ] Category labels
- [ ] Hover effects with glow
- [ ] Link to full library

### Phase 7: Polish & Effects
- [ ] Card hover effects (glow + lift)
- [ ] Button shadows and hover states
- [ ] Screenshot shadows and depth
- [ ] Scroll animations (fade-in)
- [ ] Badge styling (NEW, timestamps)

### Phase 8: Content Refinement
- [ ] Trim all descriptions to 1-2 lines
- [ ] Remove technical deep-dives from landing
- [ ] Consolidate "Built For" to tabbed interface
- [ ] Simplify all benefit lists to 3 items
- [ ] Ensure each section has ONE clear message

### Phase 9: Layout Variety
- [ ] Implement alternating two-column layouts
- [ ] Add full-width sections with backgrounds
- [ ] Create grid layouts for resources
- [ ] Vary section backgrounds (black vs dark gray)
- [ ] Add visual dividers between major sections

### Phase 10: Mobile Responsiveness
- [ ] Stack two-column layouts
- [ ] Reduce headline sizes by 40%
- [ ] Maintain visual drama on mobile
- [ ] Touch-friendly CTAs
- [ ] Responsive grid layouts

---

## Success Metrics (REVISED)

After redesign, the site should achieve:

### Visual Impact
- **Dramatic First Impression**: Hero section with glow effects and massive typography
- **Product Visibility**: Large, prominent screenshots showing actual platform
- **Visual Variety**: Mix of layouts (centered, two-column, grid, full-width)
- **Depth & Dimension**: Shadows, glows, and layering create 3D effect

### Content Quality
- **Scannable Headlines**: Can understand offering by reading headlines only
- **Visual Storytelling**: Show the product through screenshots and demos
- **Concise Copy**: Each section has 1-2 line descriptions max
- **Clear Value Prop**: Immediately obvious what Greenfield does

### Technical Excellence
- **Pure Black Background**: #000000 throughout
- **Generous Spacing**: 200px+ between sections
- **Smooth Interactions**: 0.3s transitions, subtle hover effects
- **Load Performance**: < 2s initial load time
- **Mobile Experience**: Maintains drama and clarity on all devices

### Brand Alignment
- **Osmo-Level Polish**: Matches reference site's sophistication
- **Professional Confidence**: Looks like an established, premium platform
- **Technical Credibility**: Showcases actual product and patterns
- **Modern & Fresh**: Feels current, not dated

### Conversion Optimization
- **Clear CTAs**: Primary action obvious on every screen
- **Trust Signals**: Testimonials, user count, visual proof
- **Product Preview**: Users can see what they'll get
- **Multiple Entry Points**: Different sections appeal to different personas

---

## Key Differences from Original Plan

### What Changed After Full Osmo Analysis:

1. **Not Minimal Content** - Osmo shows a LOT, just with great spacing
2. **Dramatic Visual Effects** - Glows, shadows, depth (not flat minimalism)
3. **Product Screenshots** - Show the actual platform prominently
4. **Color Accents** - Use orange/red for drama, not just cyan
5. **Varied Layouts** - Mix of centered, two-column, grid patterns
6. **Large Visual Cards** - Big screenshots with text, alternating sides
7. **Social Proof** - Circular avatars, testimonial cards
8. **Pattern Showcase** - Grid of visual previews, not just code
9. **Multiple Layers** - Background effects, overlays, depth
10. **Monospace Details** - For timestamps, badges, technical labels

---

## Resources & References

### Inspiration
- **Osmo Supply**: https://www.osmo.supply/ (PRIMARY REFERENCE)
- Linear: https://linear.app/ (for product UI)
- Vercel: https://vercel.com/ (for hero drama)

### Tools
- **Color Contrast Checker**: For accessibility validation (4.5:1 minimum)
- **Inter Font**: https://rsms.me/inter/
- **Radial Gradient Generator**: For hero glow effects
- **Figma/Sketch**: For mockups and screenshots

### Best Practices
- Pure black (#000000) for maximum contrast
- Large screenshots at 1400px+ width
- Radial gradients for depth and drama
- Monospace fonts for technical labels
- 200-250px section spacing
- Optimize images with WebP format
- Implement lazy loading for screenshots
- Use semantic HTML for accessibility

---

## Quick Reference: Key Osmo Patterns

### 1. Hero Glow Effect
```css
background: radial-gradient(circle at 50% 40%, rgba(255,107,53,0.15), transparent 60%);
```

### 2. Feature Card Hover
```css
border-color: #00d9ff;
transform: translateY(-4px);
box-shadow: 0 10px 40px rgba(0,217,255,0.15);
```

### 3. Screenshot Shadow
```css
box-shadow: 0 20px 60px rgba(0,217,255,0.1), 0 4px 20px rgba(0,0,0,0.5);
```

### 4. Monospace Badge
```css
font-family: Monaco, monospace;
text-transform: uppercase;
letter-spacing: 1.5px;
font-size: 11px;
```

### 5. Two-Column Feature Layout
```html
<div class="feature-row">
  <div class="feature-image"><!-- screenshot --></div>
  <div class="feature-text"><!-- content --></div>
</div>
```

### 6. Section Spacing
```css
padding: 200px 0; /* between sections */
margin-bottom: 120px; /* between subsections */
gap: 60px; /* between cards */
```

---

## Final Notes

This redesign transforms Greenfield from a **content-dense technical landing page** into a **dramatic, product-focused showcase** that matches Osmo Supply's sophisticated aesthetic.

**Key Takeaways:**
1. Show the product, don't just describe it
2. Use dramatic visual effects for impact
3. Vary layouts for visual interest
4. Maintain massive spacing throughout
5. Let large screenshots do the talking
6. Use color strategically (cyan + orange)
7. Create depth with shadows and glows
8. Keep copy concise within visual containers
9. Make every section visually distinct
10. Build confidence through polish and detail

The result will be a landing page that feels **premium, modern, and trustworthy** - exactly like Osmo Supply, but for the Greenfield Platform.
