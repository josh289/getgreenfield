# Developer Tool Branding Guidelines
## Voice, Style & Design Patterns for Developer Product Websites

*Based on analysis of Vercel, TanStack, Supabase, Astro, Next.js, and other successful developer tools*

---

## Table of Contents
1. [Brand Voice & Tone](#brand-voice--tone)
2. [Visual Design Philosophy](#visual-design-philosophy)
3. [Color Palettes](#color-palettes)
4. [Typography](#typography)
5. [Layout Patterns](#layout-patterns)
6. [Copywriting Guidelines](#copywriting-guidelines)
7. [Messaging Strategy](#messaging-strategy)
8. [Component Patterns](#component-patterns)
9. [Animation & Interaction](#animation--interaction)
10. [Complete Brand Examples](#complete-brand-examples)

---

## Brand Voice & Tone

### Core Principles

**1. Developer-First, Always**
- Write FOR developers, not AT them
- Assume technical competence
- Skip hand-holding; respect intelligence
- Be precise, not patronizing

**2. No Marketing BS**
- Avoid hyperbole and superlatives
- Let metrics speak ("40% faster" not "blazingly fast")
- No buzzwords without backing them up
- Straightforward, honest communication

**3. Confident but Not Arrogant**
- Know your value, state it clearly
- Acknowledge limitations and tradeoffs
- Open about what you're NOT good for
- Let the product speak for itself

**4. Minimal but Warm**
- Efficient language
- Occasional humor (dry, clever, nerdy)
- Human voice, not corporate
- Technical precision with personality

---

### Voice Characteristics by Brand

#### Vercel
**Voice:** Confident, minimal, sophisticated
**Tone:** "We make deployment invisible so you can focus on building"

```
✅ Good: "Build. Preview. Ship."
✅ Good: "The platform for frontend teams"
❌ Bad: "Unlock the power of seamless deployments!"
❌ Bad: "Revolutionary cloud infrastructure"
```

**Characteristics:**
- Three-word headlines
- Declarative statements
- Present tense
- No exclamation marks
- Lowercase brand assets
- Geist design system = precision

#### TanStack
**Voice:** Technical, straightforward, community-driven
**Tone:** "High-quality tools that solve real problems"

```
✅ Good: "Headless, type-safe, & powerful utilities"
✅ Good: "100% open-source. Always will be."
❌ Bad: "The ultimate solution for data fetching!"
❌ Bad: "Transform your development workflow"
```

**Characteristics:**
- Bullet point features
- Specific technical terms
- Open source emphasis
- Community-focused
- Red accent (passionate, bold)
- No VC, no acquisition = independence

#### Supabase
**Voice:** Friendly, capable, open alternative
**Tone:** "Firebase alternative you can trust"

```
✅ Good: "Build in a weekend. Scale to millions."
✅ Good: "Open source Firebase alternative"
❌ Bad: "The future of backend development"
❌ Bad: "Next-generation database platform"
```

**Characteristics:**
- Pragmatic promises
- Green accent (growth, go)
- PostgreSQL pride
- Quick wins highlighted
- Enterprise without enterprise-speak

#### Astro
**Voice:** Performance-obsessed, clear, educational
**Tone:** "Ship less JavaScript, build faster sites"

```
✅ Good: "Zero JavaScript, by default"
✅ Good: "Ships 40% less JavaScript than React"
❌ Bad: "Revolutionary web framework"
❌ Bad: "The fastest framework in the universe"
```

**Characteristics:**
- Performance metrics front and center
- Comparative statements (vs. competitors)
- Educational approach
- Islands architecture emphasis
- Purple accent (creative, different)

---

### Writing Guidelines

**DO:**
- Use specific numbers and benchmarks
- Write in active voice
- Keep sentences short (10-20 words)
- Use developer terminology correctly
- Include code examples early
- State tradeoffs honestly
- Use "we" not "our solution"

**DON'T:**
- Use marketing clichés
- Over-promise
- Hide limitations
- Write long paragraphs
- Use corporate speak
- Add unnecessary adjectives
- End with "..."

**Common Patterns:**

```markdown
# Headlines (3-7 words)
- "Ship faster. Build better."
- "Type-safe routing for React"
- "The edge runtime for everyone"

# Subheadlines (8-15 words)
- "Full-stack framework with SSR, streaming, and server functions"
- "Deploy to any hosting provider or runtime you want"
- "Open source PostgreSQL database with authentication and realtime"

# Body Copy (conversational but precise)
- "We built TanStack because managing server state is hard"
- "Astro generates static HTML by default, then adds JavaScript only where you need it"
- "Vercel handles the infrastructure so you can focus on your product"
```

---

## Visual Design Philosophy

### Design Movements

**Ultra-Minimalism (2025 Trend)**
Developer tool sites embrace extreme simplicity:
- White/black base with single accent color
- Generous whitespace
- Clean sans-serif typography
- Subtle animations only
- Function over decoration

**Dark Mode as Default**
Many developer tools show dark UI first:
- Developers work in dark environments
- Reduces eye strain
- Looks "technical" and serious
- Code blocks read better
- Toggle available but dark = primary

**Brutalist Influence**
Some tools use brutalist elements:
- Raw, unpolished aesthetics
- High contrast
- Bold typography
- Unconventional layouts
- Anti-corporate vibe
- Examples: older GitHub, some indie tools

---

### Design Principles

**1. Speed is Visible**
- Fast loading
- No animation delays
- Instant page transitions
- Snappy interactions
- Performance budgets enforced

**2. Content-First**
- No hero image carousels
- Text and code examples first
- Minimal graphics
- Information density
- Scannable hierarchy

**3. Technical Aesthetic**
- Monospace fonts prominent
- Grid-based layouts
- Sharp edges and corners
- Terminal-inspired elements
- Console/code aesthetic

**4. Accessible by Default**
- High contrast ratios
- Keyboard navigation
- Screen reader friendly
- Semantic HTML
- WCAG AAA where possible

---

## Color Palettes

### Common Patterns

**Monochrome + Accent**
Most developer tools use this approach:

```css
/* Base */
--background: #ffffff / #000000
--foreground: #000000 / #ffffff
--muted: #f5f5f5 / #1a1a1a

/* Accent (brand color) */
--accent: [brand color]
```

### Brand Color Analysis

**Vercel**
```css
--vercel-black: #000000
--vercel-white: #ffffff
--vercel-gray: #666666
--vercel-accent: #0070f3 (blue)
```
- Ultra minimal
- Black and white primary
- Blue for links/actions
- No gradients

**TanStack**
```css
--tanstack-red: #ff0080
--tanstack-dark: #0a0a0a
--tanstack-light: #ffffff
```
- Bold red accent
- High contrast
- Dark mode preferred
- Passionate, energetic

**Supabase**
```css
--supabase-green: #3ecf8e
--supabase-dark: #1c1c1c
--supabase-light: #f8f8f8
```
- Green = go, growth
- Friendly but professional
- Postgres green heritage
- Clean, accessible

**Astro**
```css
--astro-purple: #bc52ee
--astro-pink: #ff1639
--astro-dark: #17191e
```
- Purple = creativity
- Gradient between purple/pink
- Space/cosmic theme
- Playful but serious

**Next.js**
```css
--next-black: #000000
--next-white: #ffffff
```
- Pure monochrome
- Vercel aligned
- Professional
- No distractions

### Color Usage Guidelines

**Background:**
- White (#ffffff) or near-black (#0a0a0a)
- Subtle grays for sections (#f5f5f5 / #1a1a1a)
- Avoid colored backgrounds

**Text:**
- Pure black or pure white
- Muted for secondary text
- Never light gray on white
- High contrast ratios (7:1+)

**Accent Color:**
- One primary brand color
- Used sparingly (CTAs, links, highlights)
- Must work on both light/dark
- Vibrant, saturated
- 100% opacity (no transparency tricks)

**Code Blocks:**
- Dark background even on light site
- Syntax highlighting (subtle)
- Industry-standard themes:
  - Night Owl
  - GitHub Dark
  - Dracula
  - Nord

---

## Typography

### Font Stacks

**Sans-Serif (Body & UI)**
```css
/* Modern System Stack */
font-family: 
  'Inter', 
  -apple-system, 
  BlinkMacSystemFont, 
  'Segoe UI', 
  sans-serif;

/* Common Choices */
- Inter (most popular)
- System fonts (performance)
- SF Pro (Apple aesthetic)
- Geist Sans (Vercel)
- Untitled Sans
```

**Monospace (Code)**
```css
/* Code Font Stack */
font-family:
  'JetBrains Mono',
  'Fira Code',
  'SF Mono',
  'Menlo',
  'Monaco',
  'Courier New',
  monospace;

/* Common Choices */
- JetBrains Mono (ligatures)
- Fira Code (ligatures)
- Geist Mono (Vercel)
- SF Mono (Apple)
- Cascadia Code (Microsoft)
```

### Type Scale

**Heading Sizes:**
```css
/* Large headlines */
--text-6xl: 3.75rem  /* 60px - Hero */
--text-5xl: 3rem     /* 48px - Page title */
--text-4xl: 2.25rem  /* 36px - Section */
--text-3xl: 1.875rem /* 30px - Subsection */
--text-2xl: 1.5rem   /* 24px - Card title */
--text-xl: 1.25rem   /* 20px - Small heading */

/* Body */
--text-base: 1rem    /* 16px - Body text */
--text-sm: 0.875rem  /* 14px - Secondary */
--text-xs: 0.75rem   /* 12px - Captions */
```

### Typography Patterns

**Headlines:**
```markdown
# Short. Direct. Bold.
- "Ship faster"
- "Type-safe by default"
- "Zero configuration"
- "Open source"

# No unnecessary words
❌ "Start building amazing applications today"
✅ "Build better apps"

# Present tense, active voice
❌ "Will help you create"
✅ "Creates"
```

**Body Text:**
- 16px minimum
- 1.5-1.6 line height
- 60-80 characters per line
- Left-aligned (not justified)
- Comfortable reading width (65ch)

**Code Snippets:**
- 14px code font
- 1.5 line height
- Syntax highlighting
- Copy button visible
- Line numbers optional
- Filename shown in header

---

## Layout Patterns

### Page Structure

**Homepage Layout:**
```
┌─────────────────────────────────────┐
│ Nav: Logo | Docs | Pricing | GitHub │
├─────────────────────────────────────┤
│                                     │
│    HERO (centered, minimal)         │
│    Headline (huge)                  │
│    Subhead                          │
│    [Primary CTA] [Secondary CTA]    │
│    Code snippet or demo             │
│                                     │
├─────────────────────────────────────┤
│    Features (3 columns)             │
│    - Icon/emoji                     │
│    - Title                          │
│    - Short description              │
├─────────────────────────────────────┤
│    Social Proof                     │
│    "Used by X companies" + logos    │
├─────────────────────────────────────┤
│    Performance Metrics              │
│    Large numbers with labels        │
├─────────────────────────────────────┤
│    Code Example                     │
│    Side-by-side before/after        │
├─────────────────────────────────────┤
│    CTA Section                      │
│    Get started today                │
├─────────────────────────────────────┤
│    Footer                           │
│    Links | Social | OSS notice      │
└─────────────────────────────────────┘
```

### Navigation

**Header (Fixed/Sticky):**
```html
<header>
  <logo>
  <nav>
    - Docs
    - Blog
    - Pricing (if applicable)
    - GitHub
  </nav>
  <actions>
    - Dark mode toggle
    - Get Started button
  </actions>
</header>
```

**Characteristics:**
- Minimal links (4-6 max)
- No dropdown menus
- Direct navigation
- GitHub link prominent
- Dark mode toggle visible
- Logo links to home

### Grid System

**Spacing Scale (8px base):**
```css
--space-1: 0.25rem   /* 4px */
--space-2: 0.5rem    /* 8px */
--space-4: 1rem      /* 16px */
--space-6: 1.5rem    /* 24px */
--space-8: 2rem      /* 32px */
--space-12: 3rem     /* 48px */
--space-16: 4rem     /* 64px */
--space-24: 6rem     /* 96px */
```

**Layout Widths:**
```css
--container-sm: 640px
--container-md: 768px
--container-lg: 1024px
--container-xl: 1280px
--container-2xl: 1536px

/* Common: */
--max-width: 1200px (content)
--content-width: 65ch (text)
```

---

## Copywriting Guidelines

### Homepage Copy Structure

**Hero Section:**
```markdown
# Headline (5-7 words)
"The React Framework for Production"
"Powerful utilities for web applications"
"Open source Firebase alternative"

## Subheadline (one line, benefits-focused)
"Next.js gives you the best developer experience with all the features you need for production"
"Headless, type-safe, & powerful utilities for complex async state management, data visualization, and more"
"Build in a weekend. Scale to millions."

[Get Started] [View Docs]

// Optional: One-liner code example
$ npm create next-app
```

**Features Section:**
```markdown
## What we provide

### Type-Safe
TypeScript-first design with full type inference across your entire application.

### Fast by Default
Optimized bundle sizes and automatic code splitting for lightning-fast page loads.

### Developer Experience
Hot module replacement, error overlays, and the best debugging tools.
```

### Writing Patterns

**Problem → Solution Format:**
```markdown
❌ Don't: "Our revolutionary platform transforms your workflow"

✅ Do: 
"Managing server state is hard.
TanStack Query makes it simple."
```

**Before → After Format:**
```markdown
// Without TanStack Router
<Route path="/posts/:id" element={<Post />} />

// With TanStack Router (type-safe)
const route = createRoute({
  path: '/posts/$postId'
})
```

**Metric-Driven Claims:**
```markdown
❌ "Extremely fast"
✅ "40% faster build times"

❌ "Highly performant"
✅ "100 Lighthouse score"

❌ "Enterprise scale"
✅ "Powers sites with 100M+ users"
```

### Call-to-Action Patterns

**Primary CTA (Homepage):**
- "Get Started"
- "Start Building"
- "Try It Free"
- "Deploy Now"
- "Read the Docs"

**Secondary CTA:**
- "View Examples"
- "See Documentation"
- "Star on GitHub"
- "Join Discord"

**CTA Characteristics:**
- Verb-first
- No "Learn more" (too vague)
- Action-oriented
- Present tense
- 2-3 words max

---

## Messaging Strategy

### Value Propositions

**Framework for:**
- Speed/Performance
- Developer Experience
- Type Safety
- Open Source
- Flexibility
- Scalability

**Messaging Hierarchy:**

```markdown
1. Primary: What it does (one line)
   "Full-stack React framework"
   "Headless table library"
   "PostgreSQL database as a service"

2. How it's different (one line)
   "With built-in TypeScript and edge runtime"
   "Framework-agnostic and fully type-safe"
   "Open source with authentication included"

3. Benefits (3-4 bullets)
   - Type-safe routing
   - Server-side rendering
   - API routes included
   - Deploy anywhere

4. Social proof
   "Used by Uber, Twitch, and 10,000+ companies"
```

### Positioning Statements

**Formula:** [Product] is a [category] that [unique benefit] for [audience]

**Examples:**
- "Vercel is a deployment platform that makes shipping React apps effortless for frontend teams"
- "TanStack Query is a data-fetching library that eliminates boilerplate for React developers"
- "Supabase is an open source Firebase alternative that provides PostgreSQL with authentication for startups"

### Competitive Positioning

**How to mention competitors:**

```markdown
✅ Respectful comparison:
"An open source alternative to Firebase"
"Similar to React Query, but framework-agnostic"
"Inspired by Vercel, built for everyone"

❌ Attacking competitors:
"Unlike the bloated alternatives..."
"Firebase, but actually good"
"What Vercel should have been"
```

---

## Component Patterns

### Homepage Components

**1. Hero Section**
```html
<section class="hero">
  <h1>Build faster</h1>
  <p>TypeScript-first framework with zero config</p>
  <div class="ctas">
    <button primary>Get Started</button>
    <button secondary>View Docs</button>
  </div>
  <div class="code-preview">
    // Minimal code snippet
  </div>
</section>
```

**2. Feature Grid**
```html
<section class="features">
  <div class="feature">
    <icon>⚡</icon>
    <h3>Fast</h3>
    <p>Optimized for performance</p>
  </div>
  <!-- Repeat 3-6 times -->
</section>
```

**3. Code Comparison**
```html
<section class="comparison">
  <div class="before">
    <label>Before</label>
    <code>// Complex code</code>
  </div>
  <div class="after">
    <label>With Our Tool</label>
    <code>// Simple code</code>
  </div>
</section>
```

**4. Social Proof**
```html
<section class="social-proof">
  <p>Trusted by developers at</p>
  <div class="logo-grid">
    <!-- Grayscale logos -->
  </div>
</section>
```

**5. Metrics Banner**
```html
<section class="metrics">
  <div class="metric">
    <span class="number">1M+</span>
    <span class="label">Downloads</span>
  </div>
  <!-- Repeat -->
</section>
```

### Interactive Elements

**Code Blocks:**
- Syntax highlighting
- Copy button (top-right)
- Language badge (top-left)
- Filename (optional header)
- Dark theme default
- Line highlighting for emphasis

**Buttons:**
```css
/* Primary */
background: var(--accent);
color: white;
border: none;
border-radius: 6px;
padding: 12px 24px;
font-weight: 500;

/* Secondary */
background: transparent;
color: var(--foreground);
border: 1px solid var(--border);

/* Ghost */
background: transparent;
color: var(--accent);
border: none;
```

**Cards:**
```css
background: var(--card-bg);
border: 1px solid var(--border);
border-radius: 8px;
padding: 24px;
box-shadow: none; /* or very subtle */

/* Hover state */
border-color: var(--accent);
transform: translateY(-2px);
```

---

## Animation & Interaction

### Animation Principles

**Subtle and Purposeful:**
- No animations for decoration
- Fast transitions (150-300ms)
- Ease-out curves
- Respect prefers-reduced-motion
- Performance-first (GPU accelerated)

**Common Animations:**
```css
/* Page transitions */
transition: opacity 200ms ease-out;

/* Hover states */
transition: transform 150ms ease-out;
transform: translateY(-2px);

/* Button press */
transition: transform 100ms ease-in;
transform: scale(0.98);

/* Color changes */
transition: background-color 200ms ease;
```

### Hover Effects

**Links:**
```css
/* Underline slide-in */
text-decoration: underline;
text-underline-offset: 4px;
text-decoration-thickness: 2px;
text-decoration-color: transparent;

&:hover {
  text-decoration-color: currentColor;
}
```

**Cards:**
```css
/* Lift effect */
transition: transform 200ms ease;

&:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.1);
}
```

**Buttons:**
```css
/* Subtle scale */
transition: transform 100ms ease;

&:hover {
  transform: scale(1.02);
}

&:active {
  transform: scale(0.98);
}
```

### Scroll Effects

**Fade-in on scroll:**
```css
/* Intersection Observer pattern */
opacity: 0;
transform: translateY(20px);
transition: opacity 400ms, transform 400ms;

&.visible {
  opacity: 1;
  transform: translateY(0);
}
```

---

## Complete Brand Examples

### Vercel

**Visual Identity:**
- Pure black and white
- Geist Sans font family
- Triangle logo (▲)
- Ultra-minimal
- Precision and polish
- Swiss design influence

**Voice:**
- Declarative and confident
- Three-word phrases
- No punctuation excess
- Technical precision
- Future-forward

**Messaging:**
- "Build. Preview. Ship."
- "Develop. Preview. Ship."
- "The platform for frontend teams"
- Focus on developer workflow
- Edge network emphasis

**Design Elements:**
- Monochrome UI
- Sharp corners
- Thin borders
- Generous whitespace
- Grid-based layouts
- Code-first examples

### TanStack

**Visual Identity:**
- Bold red accent (#ff0080)
- Dark mode primary
- High contrast
- Technical aesthetic
- Open source pride
- Community-focused

**Voice:**
- Straightforward
- Community-driven
- No corporate speak
- Technical but approachable
- Passionate about quality

**Messaging:**
- "Headless, type-safe, & powerful"
- "High Quality Open-Source Software"
- "100% open-source, always will be"
- Framework-agnostic
- Enterprise-grade but indie spirit

**Design Elements:**
- Dark mode default
- Red accent throughout
- Clean sans-serif
- Code examples prominent
- Library showcase grid
- Open source badges

### Supabase

**Visual Identity:**
- Green accent (#3ecf8e)
- Friendly but technical
- PostgreSQL elephant heritage
- Illustrations (minimal)
- Approachable premium feel

**Voice:**
- Pragmatic and helpful
- Quick wins highlighted
- Firebase comparisons
- Open source values
- Scale-focused

**Messaging:**
- "Open source Firebase alternative"
- "Build in a weekend. Scale to millions"
- PostgreSQL emphasized
- Real-time capabilities
- Enterprise features, indie pricing

**Design Elements:**
- Green highlights
- Clean cards
- Dashboard previews
- Feature comparisons
- Pricing transparency
- PostgreSQL logo prominent

### Astro

**Visual Identity:**
- Purple/pink gradient
- Cosmic/space theme
- Houston mascot (subtle)
- Performance-obsessed
- Educational approach

**Voice:**
- Helpful teacher
- Performance metrics upfront
- Comparison-friendly
- Islands architecture evangelist
- Framework-agnostic pride

**Messaging:**
- "Ship less JavaScript"
- "Zero JS, by default"
- "40% faster than React"
- Islands architecture
- Content-focused sites
- Framework flexibility

**Design Elements:**
- Purple accent color
- Gradient highlights
- Island diagrams
- Performance charts
- Framework logos
- Benchmark comparisons

---

## Implementation Checklist

### Visual Design
- [ ] Choose monochrome base (black/white)
- [ ] Select one vibrant accent color
- [ ] Set up dark mode
- [ ] Choose sans-serif font (Inter recommended)
- [ ] Choose monospace font (JetBrains Mono)
- [ ] Establish spacing scale (8px base)
- [ ] Create minimal component library
- [ ] Design button variants
- [ ] Design card styles
- [ ] Set up syntax highlighting theme

### Typography
- [ ] Set type scale (6xl to xs)
- [ ] Configure font stacks
- [ ] Set line heights (1.5 for body, 1.2 for headings)
- [ ] Establish content width (65ch max)
- [ ] Test readability on both themes
- [ ] Ensure code font has ligatures
- [ ] Set comfortable font sizes (16px min)

### Copywriting
- [ ] Write 5-7 word headline
- [ ] Write one-line subheadline
- [ ] Draft 3-4 key features
- [ ] Write social proof statement
- [ ] Create primary CTA copy
- [ ] Create secondary CTA copy
- [ ] Write positioning statement
- [ ] Draft comparison messaging (if applicable)
- [ ] Write metrics/benchmarks
- [ ] Create code examples

### Layout
- [ ] Design hero section
- [ ] Create feature grid
- [ ] Design metrics banner
- [ ] Create code comparison section
- [ ] Design social proof section
- [ ] Create final CTA section
- [ ] Design footer
- [ ] Test mobile responsiveness
- [ ] Verify navigation clarity
- [ ] Test page load speed

### Content Strategy
- [ ] Homepage copy complete
- [ ] Documentation planned
- [ ] Blog topics identified (if applicable)
- [ ] Pricing page copy (if applicable)
- [ ] About/team page (optional)
- [ ] GitHub README aligned
- [ ] Social media bios consistent
- [ ] Email templates drafted

---

## Key Principles Summary

### Visual Design
1. **Monochrome + Accent** - Black/white base with one brand color
2. **Dark Mode First** - Developers prefer dark interfaces
3. **Minimal Always** - Remove everything unnecessary
4. **Fast Loading** - Performance is branding
5. **High Contrast** - Accessibility and clarity

### Voice & Tone
1. **Developer-First** - Talk to peers, not customers
2. **No Marketing BS** - Direct, honest, metric-driven
3. **Technical Precision** - Use correct terminology
4. **Confident Humility** - Know your value, admit limitations
5. **Show, Don't Tell** - Code examples over descriptions

### Messaging
1. **One-Line Value Prop** - Crystal clear what you do
2. **Specific Benefits** - How does it help, precisely?
3. **Metrics Matter** - Numbers beat adjectives
4. **Quick Wins** - "In 5 minutes" > "Enterprise scale"
5. **Open Source Pride** - If OSS, make it prominent

### Content
1. **Code Examples First** - Show working code immediately
2. **Short Sentences** - 10-20 words, active voice
3. **Scannable** - Bullets, headings, whitespace
4. **Honest Tradeoffs** - What it's NOT good for
5. **Real Use Cases** - Not theoretical examples

---

## Common Mistakes to Avoid

### Visual
❌ Multiple accent colors competing
❌ Busy hero sections with carousels
❌ Low contrast text on backgrounds
❌ Slow animations or transitions
❌ Non-system fonts without good reason
❌ Decorative images with no purpose
❌ Complex navigation structures
❌ Light mode only (no dark option)

### Voice
❌ "Revolutionary" and other hyperbole
❌ "Unlock the power of..."
❌ Corporate speak and buzzwords
❌ Over-explaining simple concepts
❌ Apologetic or uncertain tone
❌ Too clever/witty (be subtle)
❌ Excessive exclamation marks!!!
❌ Passive voice throughout

### Content
❌ No code examples on homepage
❌ Hiding pricing information
❌ Vague feature descriptions
❌ No GitHub link visible
❌ Long paragraphs of text
❌ Marketing before substance
❌ Slow-loading documentation
❌ No quick start guide

---

## Resources & Tools

### Design Tools
- **Figma** - Most developer tools design here
- **Geist Design System** - Vercel's open system
- **Radix Colors** - Accessible color system
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - React animations

### Font Resources
- **Inter** - Free, open source, widely used
- **JetBrains Mono** - Code font with ligatures
- **Geist** - Vercel's font family
- **Untitled Sans** - Alternative to Inter
- **IBM Plex** - Code-focused family

### Color Tools
- **Coolors.co** - Palette generator
- **Contrast Checker** - WCAG compliance
- **Radix Colors** - Accessible scales
- **Tailwind Colors** - Pre-built palettes

### Inspiration
- **vercel.com** - Ultra-minimal execution
- **tanstack.com** - Bold and technical
- **supabase.com** - Friendly but capable
- **astro.build** - Performance-focused
- **railway.app** - Dark mode excellence
- **planetscale.com** - Clean and modern
- **neon.tech** - Developer-first branding

### Writing Resources
- **Hemingway App** - Readability checker
- **Grammarly** - Technical writing
- **Style Guide by Mailchimp** - Voice inspiration
- **Microsoft Writing Style Guide** - Technical docs

---

## Conclusion

Developer tool branding in 2025 is defined by:

**Extreme Minimalism** - Remove everything that doesn't serve the developer

**Dark Mode Priority** - Match developer environment

**Technical Precision** - Speak the language, no dumbing down

**Performance as Brand** - Speed isn't a feature, it's identity

**Open Source Values** - Transparency, community, independence

**Metrics Over Marketing** - "40% faster" beats "blazing fast"

**Code-First Content** - Examples before explanations

**Honest Communication** - Tradeoffs, limitations, direct answers

The best developer tool brands respect their audience's intelligence, solve real problems, and get out of the way. They understand that developers want **tools that work**, not **brands that impress**.

Build something useful. Make it fast. Explain it clearly. That's the brand.

---

*This guide is based on analysis of successful developer tools as of November 2025. The landscape evolves quickly - these principles endure.*

*For questions or additions, contribute at [your repo here]*
