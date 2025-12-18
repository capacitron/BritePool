## CSS best practices

- **Consistent Methodology**: Apply and stick to the project's consistent CSS methodology (Tailwind, BEM, utility classes, CSS modules, etc.) across the entire project
- **Avoid Overriding Framework Styles**: Work with your framework's patterns rather than fighting against them with excessive overrides
- **Maintain Design System**: Establish and document design tokens (colors, spacing, typography) for consistency
- **Minimize Custom CSS**: Leverage framework utilities and components to reduce custom CSS maintenance burden
- **Performance Considerations**: Optimize for production with CSS purging/tree-shaking to remove unused styles

## BRITE POOL Biophilic Design System

### Color Palette - Earth Tones & Natural Harmony
Use these Tailwind custom colors for all UI elements:

**Primary Earth Tones:**
- `earth-brown`: #8B6F47 - Primary brand color, grounding element
- `earth-brown-dark`: #6B5638 - Hover states, depth
- `earth-brown-light`: #A89077 - Subtle backgrounds

**Accent Colors:**
- `sage`: #87A878 - Success states, growth indicators
- `sage-dark`: #6B8A5F - Active states
- `terracotta`: #D4725C - Calls-to-action, important alerts
- `sky-soft`: #B8D4E8 - Info states, transparency elements

**Neutrals:**
- `stone-warm`: #E8E3DA - Light backgrounds
- `stone`: #C7C2B8 - Borders, dividers
- `earth-dark`: #3A3428 - Text, dark mode backgrounds
- `earth-light`: #F5F2ED - Page backgrounds

### Typography - Organic & Readable
- **Headings**: Use `font-serif` or custom organic serif (Spectral, Lora)
- **Body**: Use `font-sans` with Inter or similar humanist sans-serif
- **Font Sizes**: Follow fluid typography scale (text-sm to text-5xl)
- **Line Height**: Generous spacing (leading-relaxed, leading-loose) for readability
- **Letter Spacing**: Slightly open tracking for breathing room

### Spacing & Layout - Natural Rhythm
- **Consistent Scale**: Use Tailwind spacing (4px base unit) - prefer 4, 6, 8, 12, 16, 24, 32
- **Generous Whitespace**: Err on the side of more spacing for calm, uncluttered feel
- **Organic Shapes**: Use rounded corners (rounded-lg, rounded-xl, rounded-2xl) - avoid sharp edges
- **Asymmetric Balance**: Don't fear off-center layouts that feel natural vs. rigidly symmetrical

### Visual Elements - Nature-Inspired
- **Soft Shadows**: Use subtle, warm shadows (`shadow-sm`, `shadow-md` with earth tones)
- **Gradients**: Gentle, low-contrast gradients mimicking sunset/earth (`from-stone-warm to-sage-light`)
- **Transitions**: Smooth, organic transitions (duration-300, ease-in-out)
- **Textures**: Consider subtle background textures (noise, organic patterns) at low opacity

### Component-Specific Guidelines
- **Buttons**: Rounded corners, earth-brown primary, sage secondary, generous padding
- **Cards**: Warm backgrounds (stone-warm), soft shadows, rounded-xl borders
- **Forms**: Soft focus states (ring-sage), warm backgrounds, clear labels
- **Navigation**: Minimal, clean, earth-tone accents on active states
- **Modals**: Warm overlays (backdrop-blur with earth-dark/20), centered, rounded

### Accessibility with Biophilic Design
- **Contrast**: Ensure earth-dark text on stone-warm backgrounds meets WCAG AA (4.5:1)
- **Focus States**: Use sage ring for keyboard navigation visibility
- **Color Coding**: Never rely on color alone - use icons + text
- **Dark Mode**: Invert to earth-dark backgrounds with stone-warm text, maintain earth tones

### Animation Philosophy
- **Purposeful Motion**: Animate only to guide attention or provide feedback
- **Natural Timing**: Use organic easing (ease-in-out) matching natural movement
- **Subtle**: Prefer micro-interactions over large, flashy animations
- **Performance**: Use transform and opacity for GPU-accelerated animations
