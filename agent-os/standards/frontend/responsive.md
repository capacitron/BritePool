## Responsive design best practices

- **Mobile-First Development**: Start with mobile layout and progressively enhance for larger screens
- **Standard Breakpoints**: Consistently use standard breakpoints across the application (e.g., mobile, tablet, desktop)
- **Fluid Layouts**: Use percentage-based widths and flexible containers that adapt to screen size
- **Relative Units**: Prefer rem/em units over fixed pixels for better scalability and accessibility
- **Test Across Devices**: Test and verify UI changes across multiple screen sizes from mobile to tablet to desktop screen sizes and ensure a balanced, user-friendly viewing and reading experience on all
- **Touch-Friendly Design**: Ensure tap targets are appropriately sized (minimum 44x44px) for mobile users
- **Performance on Mobile**: Optimize images and assets for mobile network conditions and smaller screens
- **Readable Typography**: Maintain readable font sizes across all breakpoints without requiring zoom
- **Content Priority**: Show the most important content first on smaller screens through thoughtful layout decisions

## BRITE POOL Responsive Guidelines

### Breakpoint Strategy
Use Tailwind's standard breakpoints with BRITE POOL considerations:
- **Mobile (< 640px)**: Single column, stacked navigation, simplified dashboards
- **Tablet (640px - 1024px)**: Two-column layouts, sidebar navigation, enhanced data views
- **Desktop (≥ 1024px)**: Multi-column dashboards, full sidebar, rich data visualizations

### Multigenerational User Considerations
BRITE POOL serves users aged 20-75, requiring special attention to:
- **Larger Base Font Size**: Use `text-base` (16px) as minimum, never below 14px
- **Generous Click Targets**: Minimum 48x48px for primary actions (exceed WCAG minimum)
- **Clear Visual Hierarchy**: Strong size differentiation between headings and body text
- **Simplified Mobile Navigation**: Avoid nested dropdowns, use clear labels

### Dashboard Responsiveness
**Desktop (≥ 1024px):**
- 3-4 column stat grids
- Full sidebar navigation visible
- Tables with all columns visible
- Side-by-side form layouts

**Tablet (640px - 1024px):**
- 2 column stat grids
- Collapsible sidebar or top navigation
- Tables with horizontal scroll or hidden secondary columns
- Stacked form sections

**Mobile (< 640px):**
- Single column stat cards
- Bottom tab navigation or hamburger menu
- Cards replace tables (one item per card)
- Full-width form inputs, single column

### Media-Rich Content Responsiveness
**Photography & Drone Footage:**
- Use Next.js Image with `sizes` attribute for optimal loading
- Lightbox on mobile: full-screen, swipe-friendly
- Grid layouts: 1 column mobile, 2-3 columns tablet, 3-4 columns desktop

**Interactive Maps:**
- Full-screen option on mobile
- Touch-friendly zoom/pan controls
- Simplified UI controls on smaller screens
- Larger tap targets for map markers (min 32px)

**Video Content:**
- 16:9 aspect ratio maintained across breakpoints
- Play/pause controls at least 44x44px
- Custom controls scale appropriately

### Typography Scaling
- **Headings**: Use clamp() for fluid scaling
  - H1: `clamp(2rem, 5vw, 3rem)`
  - H2: `clamp(1.5rem, 4vw, 2.25rem)`
  - H3: `clamp(1.25rem, 3vw, 1.875rem)`
- **Body**: 16px base, scale to 18px on desktop for comfortable reading
- **Line Height**: Increase on mobile (leading-relaxed) for readability

### Navigation Patterns
**Mobile:**
- Bottom tab bar for primary sections (Home, Community, Dashboard, Profile)
- Hamburger menu for secondary navigation
- Fixed positioning for easy thumb access

**Tablet/Desktop:**
- Persistent sidebar navigation
- Horizontal top nav for global actions
- Breadcrumbs for deep navigation

### Performance Considerations for Remote Locations
BRITE POOL serves sanctuary locations (Costa Rica) that may have limited connectivity:
- Lazy load images below the fold
- Progressive image loading (blur placeholder)
- Minimize initial bundle size (< 200KB)
- Cache aggressively with service workers
- Optimize for 3G network speeds
