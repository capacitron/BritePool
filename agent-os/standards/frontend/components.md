## UI component best practices

- **Single Responsibility**: Each component should have one clear purpose and do it well
- **Reusability**: Design components to be reused across different contexts with configurable props
- **Composability**: Build complex UIs by combining smaller, simpler components rather than monolithic structures
- **Clear Interface**: Define explicit, well-documented props with sensible defaults for ease of use
- **Encapsulation**: Keep internal implementation details private and expose only necessary APIs
- **Consistent Naming**: Use clear, descriptive names that indicate the component's purpose and follow team conventions
- **State Management**: Keep state as local as possible; lift it up only when needed by multiple components
- **Minimal Props**: Keep the number of props manageable; if a component needs many props, consider composition or splitting it
- **Documentation**: Document component usage, props, and provide examples for easier adoption by team members

## BRITE POOL Component Library Guidelines

### Core Component Philosophy
Build a cohesive component library that embodies BRITE POOL's biophilic design principles while maintaining flexibility and accessibility.

### Component Categories & Standards

#### 1. Layout Components
**Container** - Max-width wrapper with responsive padding
- Use `stone-warm` or `earth-light` backgrounds
- Apply generous padding (px-6 md:px-12 lg:px-16)
- Center content with `mx-auto`

**Section** - Full-width content sections
- Vertical rhythm with py-16 md:py-24
- Background variants: default (earth-light), accent (stone-warm), dark (earth-dark)

**Card** - Content containers with natural elevation
- Rounded corners (`rounded-xl` or `rounded-2xl`)
- Soft shadows (`shadow-md`)
- Warm background (`bg-stone-warm`)
- Padding: `p-6` or `p-8`

#### 2. Navigation Components
**Header/Navbar** - Primary navigation
- Minimal, clean design with earth-tone accents
- Active state: `text-earth-brown` with `border-b-2 border-earth-brown`
- Smooth transitions on hover
- Mobile: hamburger menu with slide-in drawer

**Sidebar** - Secondary navigation for dashboards
- Fixed or sticky positioning
- `bg-earth-light` with `border-r border-stone`
- Highlight active item with `bg-stone-warm`

**Breadcrumbs** - Navigation trail
- Earth-tone separators
- Current page in `text-earth-brown font-medium`

#### 3. Form Components
**Input** - Text inputs
- `bg-stone-warm` with `border border-stone`
- Focus: `ring-2 ring-sage focus:border-sage`
- Rounded: `rounded-lg`
- Labels: `text-earth-dark font-medium mb-2`

**Button** - Primary actions
- **Primary**: `bg-earth-brown hover:bg-earth-brown-dark text-white`
- **Secondary**: `bg-sage hover:bg-sage-dark text-white`
- **Tertiary**: `bg-transparent border-2 border-earth-brown text-earth-brown hover:bg-earth-brown hover:text-white`
- All: `rounded-lg px-6 py-3 transition-all duration-300`

**Select/Dropdown** - Selection inputs
- Match input styling
- Custom arrow icon in earth tones
- Dropdown menu: `bg-stone-warm shadow-lg rounded-lg`

**Checkbox/Radio** - Selection controls
- Custom styling with `accent-earth-brown`
- Generous click targets (min 44x44px)
- Clear labels with `text-earth-dark`

#### 4. Data Display Components
**Table** - Tabular data
- Header: `bg-stone-warm border-b-2 border-stone`
- Rows: Alternate `bg-earth-light` and `bg-white`
- Hover: `hover:bg-stone-warm/50`
- Responsive: Horizontal scroll or stacked cards on mobile

**Badge/Tag** - Status indicators
- Small, rounded pills (`rounded-full px-3 py-1 text-sm`)
- Color-coded: success (sage), warning (terracotta), info (sky-soft)
- Always include icon for accessibility

**ProgressBar** - Progress indicators
- Track: `bg-stone` rounded
- Fill: `bg-sage` or `bg-earth-brown` with smooth transition
- Display percentage or status text

#### 5. Feedback Components
**Alert/Toast** - User notifications
- Variants: success (sage), error (terracotta), info (sky-soft), warning (earth-brown-light)
- Icon + message + close button
- Auto-dismiss or manual close
- Slide-in animation from top-right

**Modal/Dialog** - Overlays
- Backdrop: `bg-earth-dark/60 backdrop-blur-sm`
- Content: `bg-stone-warm rounded-2xl shadow-2xl`
- Max-width constraints for readability
- Close on backdrop click or ESC key

**Loading Spinner** - Loading states
- Organic, smooth rotation
- Earth-brown or sage color
- Size variants: sm, md, lg

#### 6. Media Components
**Image** - Photos and visuals
- Use Next.js Image component for optimization
- Rounded corners matching card style
- Lazy loading enabled
- Alt text required for accessibility

**VideoPlayer** - Embedded video (drone footage, etc.)
- Custom controls matching design system
- Poster images in earth tones
- Accessible play/pause controls

**Gallery** - Image collections
- Grid layout with consistent gaps
- Lightbox for full-screen viewing
- Navigation arrows in earth tones

#### 7. Dashboard-Specific Components
**StatCard** - Metric display
- Large number in heading font
- Label in body font
- Icon in earth-brown
- Optional trend indicator (↑↓) in sage/terracotta

**Timeline** - Project progress
- Vertical timeline with earth-brown line
- Milestones as filled circles
- Timestamp verification badges

**MemberAvatar** - User representation
- Circular with subtle border
- Fallback initials on earth-brown background
- Online indicator: small sage dot

### Accessibility Requirements (All Components)
- Semantic HTML (button, nav, main, article, etc.)
- ARIA labels and roles where needed
- Keyboard navigation support (Tab, Enter, ESC)
- Focus indicators (ring-2 ring-sage)
- Screen reader friendly text
- Color contrast meeting WCAG AA minimum

### Component Development Checklist
- [ ] Uses biophilic color palette from CSS standards
- [ ] Implements proper rounded corners (no sharp edges)
- [ ] Includes hover/focus states with smooth transitions
- [ ] Responsive across mobile, tablet, desktop
- [ ] Accessible (keyboard, screen reader, color contrast)
- [ ] TypeScript types for all props
- [ ] PropTypes documented with JSDoc comments
- [ ] Example usage in Storybook or docs
