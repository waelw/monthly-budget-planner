# Daily Spending Planner - Design Guidelines

## Design Approach: Design System-Based (Utility Focus)

**Rationale**: This is a utility-focused financial planning tool where clarity, readability, and efficiency are paramount. Drawing inspiration from productivity apps like Notion and financial tools like Stripe Dashboard, prioritizing clean information hierarchy and instant comprehension.

---

## Core Layout Structure

### App Container
- Single-column centered layout: `max-w-3xl mx-auto px-4 py-8`
- Vertically stacked: Header → Input Section → Results Section
- No hero imagery - immediate functionality

### Input Section (Top)
- Grouped input controls in rounded container with subtle shadow
- Padding: `p-6 md:p-8`
- Three input fields stacked vertically on mobile, adaptive on desktop
- Spacing between inputs: `space-y-4`

### Results Section (Bottom)
- Daily spending cards displayed below inputs
- Card grid: `grid gap-3 md:gap-4`
- Responsive columns: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`

---

## Typography System

**Primary Typeface**: Inter or SF Pro (via Google Fonts CDN)

### Hierarchy:
- **App Title**: 2xl (24px), font-weight 700, tracking-tight
- **Section Labels**: sm (14px), font-weight 600, uppercase, tracking-wide
- **Input Labels**: sm (14px), font-weight 500
- **Day Names**: lg (18px), font-weight 600
- **Date Numbers**: base (16px), font-weight 400
- **Daily Amount**: 2xl (24px), font-weight 700, tabular-nums

---

## Spacing System

**Tailwind Units**: 2, 3, 4, 6, 8, 12

- Component padding: `p-4, p-6, p-8`
- Card spacing: `gap-3, gap-4`
- Section margins: `mb-6, mb-8, mb-12`
- Input field spacing: `space-y-4`

---

## Component Specifications

### Input Fields
- Full-width text inputs with rounded corners: `rounded-lg`
- Height: `h-12`
- Padding: `px-4`
- Border width: `border-2`
- Focus ring with offset for clarity
- Month selector: Native HTML select or custom dropdown, same styling

### Daily Spending Cards
- Rounded: `rounded-xl`
- Padding: `p-4`
- Shadow: `shadow-sm hover:shadow-md` transition
- Vertical layout: Day name → Full date → Amount
- Amount display uses tabular numbers for alignment
- Spacing between elements: `space-y-2`

### Summary Card (Above Daily Cards)
- Display: "Available Money" and "Daily Allowance" prominently
- Same styling as daily cards but slightly larger: `p-6`
- Grid layout for two metrics side-by-side on desktop

### Copy Button
- Fixed position or floating above cards
- Icon + Text: "Copy Month Plan"
- Padding: `px-6 py-3`
- Rounded: `rounded-full`
- Shadow: `shadow-lg`
- Heroicons clipboard icon

### Feedback Messages
- Toast notification for "Copied!" confirmation
- Position: top-right fixed
- Animate in/out smoothly
- Auto-dismiss after 2 seconds

---

## Layout Behavior

### Viewport Handling
- Single scrollable page
- No fixed heights on containers (natural content flow)
- Sticky input section optional for long months

### Responsive Breakpoints
- Mobile (< 640px): Single column cards, stacked inputs
- Tablet (640-1024px): 2 columns for cards
- Desktop (> 1024px): 3 columns for cards, inputs can be inline

---

## Number Formatting
- Thousand separators with commas
- Two decimal precision always
- Tabular figure font variant for perfect vertical alignment
- Large, bold treatment for spending amounts

---

## Accessibility
- All inputs have visible labels
- Focus states clearly visible with ring
- Sufficient contrast for all text
- Keyboard navigation support
- Screen reader friendly labels

---

## Component Library

**Icons**: Heroicons (CDN) for calendar, clipboard, currency icons  
**No custom SVG generation** - use library icons only

---

## Animation Guidelines
**Minimal animations only**:
- Input field focus transitions: 150ms
- Card hover shadow: 200ms
- Copy button success state: Quick scale bounce
- Toast notifications: Slide-in from top

**No scroll animations, no complex transitions**

---

## Key UX Principles
1. **Instant Feedback**: All calculations update in real-time as user types
2. **Clear Hierarchy**: Inputs clearly separated from results
3. **Scannable Results**: Each day card is self-contained and easy to scan
4. **Persistent State**: Auto-save to localStorage on every change
5. **Copy Convenience**: One-click copy of entire month plan