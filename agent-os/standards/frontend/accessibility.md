## UI accessibility best practices

- **Semantic HTML**: Use appropriate HTML elements (nav, main, button, etc.) that convey meaning to assistive technologies
- **Keyboard Navigation**: Ensure all interactive elements are accessible via keyboard with visible focus indicators
- **Color Contrast**: Maintain sufficient contrast ratios (4.5:1 for normal text) and don't rely solely on color to convey information
- **Alternative Text**: Provide descriptive alt text for images and meaningful labels for all form inputs
- **Screen Reader Testing**: Test and verify that all views are accessible on screen reading devices.
- **ARIA When Needed**: Use ARIA attributes to enhance complex components when semantic HTML isn't sufficient
- **Logical Heading Structure**: Use heading levels (h1-h6) in proper order to create a clear document outline
- **Focus Management**: Manage focus appropriately in dynamic content, modals, and single-page applications

## BRITE POOL Accessibility Standards

### WCAG 2.1 Level AA Compliance
All BRITE POOL interfaces must meet or exceed WCAG 2.1 Level AA standards.

### Color Contrast Requirements with Biophilic Palette
**Text Contrast:**
- `earth-dark` (#3A3428) on `earth-light` (#F5F2ED): 9.8:1 ✓ (Exceeds AAA)
- `earth-dark` (#3A3428) on `stone-warm` (#E8E3DA): 8.7:1 ✓ (Exceeds AAA)
- `earth-brown` (#8B6F47) on `earth-light` (#F5F2ED): 4.9:1 ✓ (AA)
- White text on `earth-brown` (#8B6F47): 4.8:1 ✓ (AA)
- White text on `sage` (#87A878): 3.2:1 ✗ (Fails - use sage-dark for text backgrounds)
- White text on `sage-dark` (#6B8A5F): 4.6:1 ✓ (AA)

**Interactive Elements:**
- Focus indicators: `ring-2 ring-sage-dark` (visible on all backgrounds)
- Button text on `earth-brown`: Minimum 4.5:1 contrast
- Links: Underline or bold + color for identification (never color alone)

### Keyboard Navigation
**Required Keyboard Support:**
- Tab: Navigate through interactive elements
- Shift+Tab: Navigate backwards
- Enter/Space: Activate buttons and links
- Escape: Close modals, dropdowns, menus
- Arrow keys: Navigate within components (dropdowns, tabs, sliders)

**Focus Indicators:**
- All interactive elements must have visible focus state
- Use `ring-2 ring-sage-dark` for consistency
- Never use `outline-none` without custom focus styling
- Focus order must follow logical reading order

### Screen Reader Support
**Required Practices:**
- All images have descriptive `alt` text (except decorative images: `alt=""`)
- Form inputs have associated `<label>` elements or `aria-label`
- Buttons describe action (e.g., "Submit application" not just "Submit")
- Links describe destination (e.g., "View Aliento De Vida project details" not "Click here")
- Status updates use `aria-live` regions for dynamic content

**Landmark Regions:**
```html
<header role="banner">...</header>
<nav role="navigation" aria-label="Main">...</nav>
<main role="main">...</main>
<aside role="complementary" aria-label="Sidebar">...</aside>
<footer role="contentinfo">...</footer>
```

### Form Accessibility
**Input Requirements:**
- Every input has a visible `<label>` or `aria-label`
- Required fields indicated with `aria-required="true"` + visual asterisk
- Error messages use `aria-describedby` to link to input
- Error states have `aria-invalid="true"`
- Group related inputs with `<fieldset>` and `<legend>`

**Example Accessible Form:**
```html
<div>
  <label for="email" class="text-earth-dark font-medium mb-2">
    Email Address <span class="text-terracotta">*</span>
  </label>
  <input
    id="email"
    type="email"
    required
    aria-required="true"
    aria-describedby="email-error"
    class="bg-stone-warm border border-stone rounded-lg focus:ring-2 focus:ring-sage-dark"
  />
  <span id="email-error" class="text-terracotta text-sm" role="alert">
    Please enter a valid email address
  </span>
</div>
```

### Navigation Accessibility
**Skip Links:**
- Provide "Skip to main content" link (first focusable element)
- Style to appear on focus: `focus:not-sr-only`

**Breadcrumbs:**
- Use `<nav aria-label="Breadcrumb">`
- Mark current page with `aria-current="page"`

**Mobile Navigation:**
- Hamburger button has `aria-expanded` and `aria-label="Main menu"`
- Menu uses `aria-hidden` when closed
- Focus trapped within open menu

### Modal/Dialog Accessibility
**Required Implementation:**
- Use `role="dialog"` or `<dialog>` element
- Set `aria-modal="true"`
- Label with `aria-labelledby` referencing title
- Trap focus inside modal while open
- Return focus to trigger element on close
- Close on Escape key press
- Close on backdrop click (optional but recommended)

### Table Accessibility
**Data Tables:**
- Use `<table>`, `<thead>`, `<tbody>`, `<th>`, `<td>` semantic elements
- Header cells use `<th scope="col">` or `<th scope="row">`
- Complex tables include `<caption>` describing table purpose
- Mobile: Convert to cards or use horizontal scroll with `role="region" aria-labelledby="table-caption"`

### Multilingual Accessibility (English/Spanish)
- Set `lang` attribute on `<html>`: `<html lang="en">` or `<html lang="es">`
- Use `lang` attribute on embedded content in different languages
- Screen readers will use correct pronunciation rules

### Multigenerational User Accommodations
**Larger Interactive Targets:**
- Minimum 48x48px for primary buttons (exceeds WCAG 44x44px)
- Generous spacing between clickable elements (min 8px)

**Clear Visual Feedback:**
- Hover states visible and obvious
- Loading states clearly communicated
- Success/error messages prominent

**Simple, Clear Language:**
- Avoid jargon in UI text
- Use plain language for instructions
- Provide help text for complex forms

### Testing Checklist
- [ ] Run axe DevTools on all pages (0 violations)
- [ ] Navigate entire app using keyboard only
- [ ] Test with screen reader (NVDA, JAWS, or VoiceOver)
- [ ] Verify color contrast with browser tools
- [ ] Test at 200% zoom (should remain usable)
- [ ] Validate HTML (semantic structure)
- [ ] Test with CSS disabled (content still accessible)
- [ ] Use mobile with screen reader (TalkBack, VoiceOver)
