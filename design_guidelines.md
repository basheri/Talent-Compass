# Career & Talent Discovery - Design Guidelines

## Design Approach
**System-Based with Minimalist Principles** - Drawing from Linear's clarity + Notion's calm aesthetics + Apple HIG's restraint for a productivity-focused tool that feels sophisticated yet approachable.

## Core Visual Language

### Typography
- **Primary Font**: Inter (400, 500, 600 weights) via Google Fonts
- **Hierarchy**: 
  - Hero/Main Titles: text-4xl/5xl font-semibold
  - Section Headers: text-2xl/3xl font-semibold
  - Body: text-base/lg font-normal
  - Labels/Meta: text-sm font-medium
- **RTL Support**: Apply `dir="rtl"` and `font-arabic` class when Arabic detected

### Layout System
**Spacing Units**: Consistent use of 4, 6, 8, 12, 16, 24 (p-4, gap-6, mb-8, etc.)
- Container: max-w-6xl centered with px-6 padding
- Sections: py-16 vertical rhythm (py-12 mobile)
- Card spacing: p-6 to p-8 for content cards
- Form elements: gap-4 between fields, gap-6 between sections

### Component Architecture

**Single-Page Layout Structure**:
1. **Sticky Header** (h-16): Logo, navigation tabs, settings icon (top-right)
2. **Hero Section** (py-20): No large image - typographic hero with gradient text accent and concise value prop
3. **Assessment Interface**: Multi-step form with progress indicator, clean input fields, generous whitespace
4. **Results Display**: Card-based grid (2-3 columns), data visualizations, exportable report preview
5. **Footer**: Minimal - privacy notice, export options

**Key Components**:
- **Settings Modal**: Centered overlay (max-w-md), clean input for API key with visibility toggle, save to localStorage indicator
- **Form Inputs**: Rounded-lg borders, focus:ring-2 states, placeholder text at 50% opacity, proper RTL text alignment
- **Cards**: Rounded-xl with subtle shadow (shadow-sm), hover:shadow-md transition
- **Buttons**: 
  - Primary: Solid with px-6 py-3, rounded-lg, font-medium
  - Secondary: Outlined with border-2
  - All buttons: Active/hover states built-in (no custom hover for image overlays)
- **Progress Indicator**: Stepped timeline/dots showing assessment completion
- **Export Button**: Icon + text, positioned prominently in results section

**PDF Export View**: A4-optimized layout with professional formatting, logo header, structured sections, clean typography for print

### Visual Treatment
- **Backgrounds**: Soft gradient overlay (gray-50 to white) on main sections
- **Borders**: border-gray-200 for subtle separation
- **Shadows**: Minimal use - shadow-sm for cards, shadow-lg for modals only
- **Rounded Corners**: rounded-lg (forms), rounded-xl (cards), rounded-full (avatars/icons)
- **Buttons on Overlays**: backdrop-blur-sm bg-white/90 for legibility

### RTL Considerations
- Mirror all layouts automatically with `dir="rtl"`
- Icons flip appropriately (chevrons, arrows)
- Text alignment: text-right for RTL, text-left for LTR
- Margin/padding: Use logical properties (ms-4 instead of ml-4)

### Animations
**Minimal & Purposeful**:
- Page transitions: None
- Modal entrance: Fade + scale from center (200ms)
- Form validation: Subtle shake on error
- Loading states: Simple spinner, no elaborate animations

## Critical Features
- **API Key Protection**: Visible indicator when key is set, one-click settings access
- **Responsive Breakpoints**: Mobile-first, stack columns at md breakpoint
- **Accessibility**: ARIA labels, keyboard navigation, sufficient contrast ratios
- **No Hero Image**: Focus on clean typography and immediate value communication

**Design Philosophy**: Every element serves a purpose. No decorative bloat. Professional, trustworthy, and calming user experience that respects user privacy and data.