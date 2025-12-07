# Design Document: SAVIGN Corporate Website

## Overview

The SAVIGN Corporate Website is a single-page static site built with a mobile-first approach, featuring a modern dark aesthetic with glassmorphism effects. The architecture prioritizes performance, accessibility, and responsive design to deliver an equally impressive experience across all devices.

### Technology Stack

- **HTML5**: Semantic markup for structure
- **CSS3**: Custom properties, Grid, Flexbox, clamp() for fluid typography, backdrop-filter for glassmorphism
- **Vanilla JavaScript**: Lightweight interactions (menu toggle, scroll animations, intersection observers)
- **Build Process**: None required (pure static files) or optional Vite for development experience
- **Hosting**: GitHub Pages
- **Version Control**: Git/GitHub

### Design Principles

1. **Mobile-First**: Design and develop for mobile screens first, then enhance for larger viewports
2. **Progressive Enhancement**: Core content accessible to all, enhanced features for capable browsers
3. **Performance**: Minimize payload, optimize assets, leverage browser caching
4. **Accessibility**: WCAG 2.1 AA compliance, keyboard navigation, screen reader support

## Architecture

### File Structure

```
savign-website/
├── index.html              # Main HTML file
├── css/
│   ├── reset.css          # CSS reset/normalize
│   ├── variables.css      # CSS custom properties (colors, spacing, typography)
│   ├── base.css           # Base styles and typography
│   ├── layout.css         # Grid systems and layout utilities
│   ├── components.css     # Reusable component styles
│   └── animations.css     # Animation definitions
├── js/
│   ├── main.js            # Main application logic
│   ├── menu.js            # Mobile menu interactions
│   ├── scroll-reveal.js   # Scroll-based animations
│   └── utils.js           # Utility functions
├── assets/
│   ├── images/            # Optimized images (WebP + fallbacks)
│   ├── logo.svg           # SAVIGN logo
│   └── fonts/             # Web fonts (if custom fonts used)
└── README.md              # Documentation
```

### Responsive Breakpoints

```css
/* Mobile-first approach */
/* Base styles: 320px - 767px (mobile) */
/* Tablet: 768px - 1023px */
/* Desktop: 1024px+ */

--breakpoint-tablet: 768px;
--breakpoint-desktop: 1024px;
--breakpoint-wide: 1440px;
```

### CSS Architecture

Using a modular approach with CSS custom properties for maintainability:

- **variables.css**: Define all design tokens (colors, spacing scale, typography scale)
- **base.css**: Typography system, global resets, utility classes
- **layout.css**: Grid systems, container widths, spacing utilities
- **components.css**: Header, hero, product cards, footer
- **animations.css**: Keyframes, transition definitions

## Components and Interfaces

### 1. Header / Navigation Component

**Desktop Layout (≥1024px)**
- Fixed position header with backdrop blur
- Logo (left): SVG, max-width 180px
- Navigation links (right): Horizontal flex layout, 16px spacing
- Height: 80px

**Mobile Layout (<1024px)**
- Fixed position header
- Logo (left): SVG, max-width 140px
- Hamburger icon (right): 44x44px touch target
- Height: 64px

**Full-Screen Menu Overlay (Mobile)**
- Position: fixed, full viewport (100vw × 100vh)
- Background: rgba(5, 5, 5, 0.95) with backdrop-filter: blur(20px)
- Navigation links: Vertical stack, centered, slide-in animation from bottom
- Close button (X): Animated transformation from hamburger icon
- Z-index: 1000

**Interface:**
```javascript
// menu.js
class MobileMenu {
  constructor(toggleButton, menuOverlay)
  open()
  close()
  toggle()
  handleKeyboard(event) // ESC to close
}
```

### 2. Hero Section Component

**Desktop Layout (≥1024px)**
- Container: max-width 1440px, centered
- Layout: CSS Grid (2 columns, 60/40 split or centered)
- Headline: clamp(3rem, 5vw, 6rem)
- Subheadline: clamp(1.25rem, 2vw, 1.75rem)
- CTA Button: 56px height, 200px min-width
- Background animation: Canvas or CSS animation, full opacity

**Mobile Layout (<1024px)**
- Layout: Single column, stacked
- Order: Visual → Headline → Subheadline → CTA
- Headline: clamp(2rem, 8vw, 3rem)
- Subheadline: 1.125rem
- CTA Button: 48px height, full-width with max-width 320px
- Background animation: 50% opacity for text readability

**Interface:**
```javascript
// scroll-reveal.js
class HeroAnimations {
  constructor(heroElement)
  initBackgroundAnimation()
  adjustOpacityForMobile()
  playEntranceAnimation()
}
```

### 3. Bento Grid Component (Product Ecosystem)

**Grid System**

Desktop (≥1024px):
- CSS Grid with 12 columns
- Gap: 24px
- Card sizes: Small (4 cols), Medium (6 cols), Large (8 cols), Featured (12 cols)
- Asymmetric layout for visual interest

Tablet (768px - 1023px):
- CSS Grid with 6 columns
- Gap: 16px
- Card sizes: Small (3 cols), Medium (6 cols)

Mobile (<768px):
- Single column
- Gap: 16px
- All cards full-width

**Product Card Structure**
- Container: Glassmorphism effect (backdrop-filter: blur(10px), border: 1px solid rgba(255,255,255,0.1))
- Padding: 32px (desktop), 24px (mobile)
- Content: Icon/Logo, Title, Description, Link
- Hover state (desktop): Scale(1.02), increased glow

**Interface:**
```javascript
// components.js
class BentoGrid {
  constructor(gridElement, cards)
  calculateLayout(viewportWidth)
  reflow()
  applyCardSizes()
}

class ProductCard {
  constructor(cardElement)
  render()
  applyHoverEffects()
}
```

### 4. Typography System

**Fluid Typography Implementation**

```css
/* Headings */
--font-size-h1: clamp(2rem, 5vw + 1rem, 6rem);
--font-size-h2: clamp(1.75rem, 4vw + 0.5rem, 4rem);
--font-size-h3: clamp(1.5rem, 3vw + 0.5rem, 3rem);

/* Body */
--font-size-body: clamp(1rem, 0.5vw + 0.875rem, 1.125rem);
--font-size-small: clamp(0.875rem, 0.5vw + 0.75rem, 1rem);

/* Line heights */
--line-height-tight: 1.1;  /* Headlines desktop */
--line-height-normal: 1.5; /* Headlines mobile, body text */
--line-height-relaxed: 1.75; /* Long-form content */

/* Letter spacing */
--letter-spacing-tight: -0.02em; /* Headlines desktop */
--letter-spacing-normal: 0;
--letter-spacing-wide: 0.05em; /* Small caps, labels */
```

### 5. Animation System

**Scroll Reveal Animations**

Using Intersection Observer API for performance:

```javascript
// scroll-reveal.js
class ScrollReveal {
  constructor(elements, options)
  observe()
  animateIn(element)
  animateOut(element) // Optional
}

// Default animation
.reveal {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.reveal.active {
  opacity: 1;
  transform: translateY(0);
}
```

**Menu Animations**

```css
/* Hamburger to X transformation */
.menu-icon {
  transition: transform 0.3s ease;
}

.menu-icon.open .line-1 {
  transform: rotate(45deg) translateY(8px);
}

.menu-icon.open .line-2 {
  transform: rotate(-45deg) translateY(-8px);
}

/* Menu overlay slide-in */
.menu-overlay {
  transform: translateX(100%);
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.menu-overlay.open {
  transform: translateX(0);
}

/* Navigation links stagger */
.menu-link {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.menu-overlay.open .menu-link {
  opacity: 1;
  transform: translateY(0);
}

.menu-link:nth-child(1) { transition-delay: 0.1s; }
.menu-link:nth-child(2) { transition-delay: 0.2s; }
.menu-link:nth-child(3) { transition-delay: 0.3s; }
.menu-link:nth-child(4) { transition-delay: 0.4s; }
```

## Data Models

### Configuration Object

```javascript
// config.js
const siteConfig = {
  brand: {
    name: 'SAVIGN',
    logoPath: './assets/logo.svg',
    tagline: 'Building the future of AI-powered services'
  },
  
  theme: {
    colors: {
      background: '#050505',
      text: '#FFFFFF',
      accent: '#FFFFFF',
      glassBorder: 'rgba(255, 255, 255, 0.1)',
      glassBackground: 'rgba(255, 255, 255, 0.05)'
    }
  },
  
  navigation: [
    { label: 'Philosophy', href: '#philosophy' },
    { label: 'Ventures', href: '#ventures' },
    { label: 'Founder', href: '#founder' },
    { label: 'Contact', href: '#contact' }
  ],
  
  products: [
    {
      id: 'product-1',
      title: 'Product Name',
      description: 'Product description',
      icon: './assets/images/product-1.svg',
      link: '#',
      gridSize: 'medium' // small, medium, large, featured
    }
    // ... more products
  ],
  
  breakpoints: {
    mobile: 0,
    tablet: 768,
    desktop: 1024,
    wide: 1440
  }
};
```

### Product Card Data Structure

```javascript
interface ProductCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  link: string;
  gridSize: 'small' | 'medium' | 'large' | 'featured';
  category?: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After analyzing all acceptance criteria, several properties can be consolidated to avoid redundancy:

**Consolidations:**
- Properties 1.1 and 1.2 (mobile/desktop layouts) can be combined into a single property about responsive layout adaptation
- Properties 1.4 and 1.5 (media queries and responsive units) both test CSS implementation and can be combined
- Properties 3.2 and 3.3 (desktop/mobile headline styles) can be combined into one property about typography adaptation
- Properties 4.2 and 4.3 (desktop/mobile navigation display) are examples that test the same responsive behavior
- Properties 5.1, 5.2, 5.3 (hero layouts) are specific examples of responsive behavior
- Properties 6.3 and 6.4 (desktop/mobile grid layouts) are examples of the same responsive grid behavior
- Properties 7.3, 7.4, 7.5 (image optimization, lazy loading, animation performance) all test performance optimizations

**Properties to Keep:**
- Responsive layout adaptation (combines 1.1, 1.2)
- Layout updates without reload (1.3)
- CSS responsive implementation (combines 1.4, 1.5)
- Brand colors consistency (2.2, 2.3)
- Glassmorphism effects (2.4)
- Scroll reveal animations (2.5)
- Fluid typography implementation (3.1)
- Typography responsive adaptation (combines 3.2, 3.3)
- Minimum body text size (3.4)
- Typography proportional scaling (3.5)
- Logo positioning (4.1)
- Menu interaction round-trip (4.7 - subsumes 4.4, 4.5, 4.6)
- Hero text readability (5.5)
- Grid responsive reflow (6.2)
- Product card hover effects (6.5)
- Touch target sizing (8.1)
- Touch feedback (8.2)
- Vendor prefixes (9.2)
- Graceful fallbacks (9.3)
- Relative asset paths (10.4)

### Correctness Properties

Property 1: Responsive layout adaptation
*For any* viewport width, the website should render with mobile-optimized stacked layouts when width < 1024px and desktop horizontal layouts when width >= 1024px
**Validates: Requirements 1.1, 1.2**

Property 2: Layout updates without page reload
*For any* browser resize event, the website should adapt its layout without triggering a page reload
**Validates: Requirements 1.3**

Property 3: CSS responsive implementation
*For all* CSS sizing declarations (excluding borders and fixed-size elements like icons), the website should use responsive units (rem, em, vw, vh, %) and implement media queries for viewport-based styling
**Validates: Requirements 1.4, 1.5**

Property 4: Brand color consistency
*For all* section elements, the website should apply background color #050505, and *for all* text elements, the website should use high-contrast white or near-white colors
**Validates: Requirements 2.2, 2.3**

Property 5: Glassmorphism effects
*For all* elements designated with glassmorphism styling, the website should apply backdrop-filter with blur values
**Validates: Requirements 2.4**

Property 6: Scroll reveal animations
*For any* section element with scroll-reveal behavior, when that element enters the viewport, the website should animate it with fade-in and slide-up transitions
**Validates: Requirements 2.5**

Property 7: Fluid typography implementation
*For all* headline elements (h1, h2, h3), the website should implement font-size using CSS clamp() functions
**Validates: Requirements 3.1**

Property 8: Typography responsive adaptation
*For any* headline element, when viewport width >= 1024px, the website should apply bold font-weight and tight letter-spacing, and when viewport width < 1024px, the website should apply increased line-height
**Validates: Requirements 3.2, 3.3**

Property 9: Minimum body text size
*For any* viewport size, body text elements should have computed font-size >= 16px
**Validates: Requirements 3.4**

Property 10: Typography proportional scaling
*For any* two viewport widths, the ratio between heading levels (h1:h2:h3) should remain consistent
**Validates: Requirements 3.5**

Property 11: Logo positioning consistency
*For any* viewport width, the SAVIGN logo should be positioned on the left side of the header
**Validates: Requirements 4.1**

Property 12: Menu interaction round-trip
*For any* mobile menu state, opening the menu (hamburger click) then closing it (X click) should restore the original state with the hamburger icon visible and overlay hidden
**Validates: Requirements 4.4, 4.5, 4.6, 4.7**

Property 13: Hero text readability
*For all* text elements in the hero section, the contrast ratio between text and background should meet WCAG AA standards (>= 4.5:1 for normal text, >= 3:1 for large text)
**Validates: Requirements 5.5**

Property 14: Grid responsive reflow
*For any* viewport width change, the Bento Grid should reflow product cards to optimize the layout for the new screen size
**Validates: Requirements 6.2**

Property 15: Product card hover effects
*For any* product card on desktop devices (width >= 1024px), hovering over the card should trigger visual changes (transform, opacity, or glow effects)
**Validates: Requirements 6.5**

Property 16: Performance optimization
*For all* images, the website should use optimized formats (WebP with fallbacks), implement lazy loading for below-fold content, and *for all* animations, use only CSS transform and opacity properties
**Validates: Requirements 7.3, 7.4, 7.5**

Property 17: Touch target sizing
*For all* interactive elements (buttons, links, menu icons) on mobile devices (width < 1024px), the computed dimensions should be >= 44x44 pixels
**Validates: Requirements 8.1**

Property 18: Touch feedback
*For any* interactive element on mobile devices, triggering a touch event should produce immediate visual feedback through CSS state changes
**Validates: Requirements 8.2**

Property 19: Vendor prefixes
*For all* CSS properties that require vendor prefixes for cross-browser compatibility, the website should include appropriate prefixes (-webkit-, -moz-, -ms-)
**Validates: Requirements 9.2**

Property 20: Graceful fallbacks
*For all* advanced CSS features (backdrop-filter, CSS Grid, clamp), the website should provide fallback declarations or @supports rules for browsers without support
**Validates: Requirements 9.3**

Property 21: Relative asset paths
*For all* asset references (images, fonts, scripts) in HTML and CSS, the website should use relative paths rather than absolute URLs
**Validates: Requirements 10.4**

## Error Handling

### JavaScript Error Handling

**Menu Interactions**
- Gracefully handle missing DOM elements (menu button, overlay)
- Prevent errors if event listeners are attached multiple times
- Handle keyboard events (ESC key) safely

```javascript
class MobileMenu {
  constructor(toggleButton, menuOverlay) {
    if (!toggleButton || !menuOverlay) {
      console.warn('MobileMenu: Required elements not found');
      return;
    }
    // ... initialization
  }
  
  handleKeyboard(event) {
    try {
      if (event.key === 'Escape' && this.isOpen) {
        this.close();
      }
    } catch (error) {
      console.error('MobileMenu keyboard handler error:', error);
    }
  }
}
```

**Scroll Animations**
- Check for Intersection Observer support before use
- Provide fallback for browsers without support (show all content immediately)
- Handle edge cases where elements are removed from DOM during observation

```javascript
class ScrollReveal {
  constructor(elements, options) {
    if (!('IntersectionObserver' in window)) {
      // Fallback: show all elements immediately
      elements.forEach(el => el.classList.add('active'));
      return;
    }
    // ... initialization
  }
}
```

**Image Loading**
- Handle image load failures gracefully
- Provide alt text for all images
- Use picture element with fallbacks for WebP

```html
<picture>
  <source srcset="image.webp" type="image/webp">
  <img src="image.jpg" alt="Descriptive alt text" loading="lazy">
</picture>
```

### CSS Error Handling

**Feature Detection**
- Use @supports for advanced CSS features
- Provide fallbacks for critical features

```css
/* Fallback for browsers without backdrop-filter */
.glass-effect {
  background: rgba(255, 255, 255, 0.1);
}

@supports (backdrop-filter: blur(10px)) {
  .glass-effect {
    backdrop-filter: blur(10px);
  }
}

/* Fallback for browsers without CSS Grid */
.bento-grid {
  display: flex;
  flex-wrap: wrap;
}

@supports (display: grid) {
  .bento-grid {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
  }
}
```

**Font Loading**
- Use font-display: swap to prevent invisible text
- Provide system font fallbacks

```css
@font-face {
  font-family: 'CustomFont';
  src: url('./fonts/custom-font.woff2') format('woff2');
  font-display: swap;
}

body {
  font-family: 'CustomFont', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
```

### Accessibility Error Prevention

**Keyboard Navigation**
- Ensure all interactive elements are keyboard accessible
- Maintain logical tab order
- Provide visible focus indicators

**Screen Reader Support**
- Use semantic HTML elements
- Provide ARIA labels where needed
- Ensure menu state is announced to screen readers

```html
<button 
  class="menu-toggle" 
  aria-label="Open navigation menu"
  aria-expanded="false"
  aria-controls="mobile-menu">
  <span class="menu-icon"></span>
</button>

<nav 
  id="mobile-menu" 
  class="menu-overlay" 
  aria-hidden="true">
  <!-- Navigation links -->
</nav>
```

## Testing Strategy

### Unit Testing

**Framework:** Vitest (fast, modern, Vite-compatible)

**Unit Test Coverage:**

1. **Utility Functions**
   - Test viewport detection functions
   - Test CSS class manipulation helpers
   - Test configuration parsing

2. **Component Initialization**
   - Test MobileMenu constructor with valid/invalid elements
   - Test ScrollReveal initialization with/without IntersectionObserver support
   - Test BentoGrid initialization

3. **Event Handlers**
   - Test menu toggle functionality
   - Test keyboard event handling (ESC key)
   - Test resize event debouncing

4. **Edge Cases**
   - Test behavior with missing DOM elements
   - Test behavior with invalid configuration
   - Test rapid successive interactions (double-clicks, rapid resizes)

**Example Unit Test:**

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { MobileMenu } from '../js/menu.js';

describe('MobileMenu', () => {
  let toggleButton, menuOverlay, menu;
  
  beforeEach(() => {
    document.body.innerHTML = `
      <button class="menu-toggle"></button>
      <nav class="menu-overlay"></nav>
    `;
    toggleButton = document.querySelector('.menu-toggle');
    menuOverlay = document.querySelector('.menu-overlay');
    menu = new MobileMenu(toggleButton, menuOverlay);
  });
  
  it('should open menu when toggle is clicked', () => {
    toggleButton.click();
    expect(menuOverlay.classList.contains('open')).toBe(true);
  });
  
  it('should close menu when ESC key is pressed', () => {
    menu.open();
    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(event);
    expect(menuOverlay.classList.contains('open')).toBe(false);
  });
});
```

### Property-Based Testing

**Framework:** fast-check (JavaScript property-based testing library)

**Configuration:**
- Minimum 100 iterations per property test
- Each test must reference the design document property using the format: `**Feature: savign-corporate-website, Property {number}: {property_text}**`

**Property Test Coverage:**

Each correctness property from the design document will be implemented as a property-based test. The tests will generate random inputs (viewport sizes, element configurations, etc.) and verify that the specified properties hold across all generated inputs.

**Example Property Test:**

```javascript
import { describe, it } from 'vitest';
import fc from 'fast-check';

describe('Property-Based Tests', () => {
  it('Property 1: Responsive layout adaptation', () => {
    /**
     * Feature: savign-corporate-website, Property 1: Responsive layout adaptation
     * For any viewport width, the website should render with mobile-optimized 
     * stacked layouts when width < 1024px and desktop horizontal layouts when width >= 1024px
     */
    fc.assert(
      fc.property(
        fc.integer({ min: 320, max: 2560 }), // Generate random viewport widths
        (viewportWidth) => {
          // Set viewport width
          window.innerWidth = viewportWidth;
          window.dispatchEvent(new Event('resize'));
          
          // Check layout based on viewport
          const heroSection = document.querySelector('.hero');
          const computedStyle = window.getComputedStyle(heroSection);
          
          if (viewportWidth < 1024) {
            // Should be stacked (flex-direction: column or single grid column)
            return computedStyle.flexDirection === 'column' || 
                   computedStyle.gridTemplateColumns === '1fr';
          } else {
            // Should be horizontal (flex-direction: row or multiple grid columns)
            return computedStyle.flexDirection === 'row' || 
                   computedStyle.gridTemplateColumns.includes(' ');
          }
        }
      ),
      { numRuns: 100 }
    );
  });
  
  it('Property 9: Minimum body text size', () => {
    /**
     * Feature: savign-corporate-website, Property 9: Minimum body text size
     * For any viewport size, body text elements should have computed font-size >= 16px
     */
    fc.assert(
      fc.property(
        fc.integer({ min: 320, max: 2560 }),
        (viewportWidth) => {
          window.innerWidth = viewportWidth;
          window.dispatchEvent(new Event('resize'));
          
          const bodyElements = document.querySelectorAll('p, li, span');
          return Array.from(bodyElements).every(el => {
            const fontSize = parseFloat(window.getComputedStyle(el).fontSize);
            return fontSize >= 16;
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Integration Testing

**Framework:** Playwright (cross-browser testing)

**Integration Test Coverage:**

1. **Full User Flows**
   - Navigate through all sections via menu
   - Test scroll-triggered animations
   - Test responsive behavior across breakpoints

2. **Cross-Browser Testing**
   - Test in Chrome, Firefox, Safari, Edge
   - Test on iOS Safari and Chrome for Android
   - Verify visual consistency

3. **Performance Testing**
   - Measure page load time
   - Verify lazy loading behavior
   - Check animation frame rates

**Example Integration Test:**

```javascript
import { test, expect } from '@playwright/test';

test('mobile menu interaction flow', async ({ page }) => {
  await page.goto('/');
  await page.setViewportSize({ width: 375, height: 667 }); // Mobile viewport
  
  // Verify hamburger menu is visible
  const menuToggle = page.locator('.menu-toggle');
  await expect(menuToggle).toBeVisible();
  
  // Open menu
  await menuToggle.click();
  const menuOverlay = page.locator('.menu-overlay');
  await expect(menuOverlay).toHaveClass(/open/);
  
  // Verify menu links are visible
  const menuLinks = page.locator('.menu-overlay a');
  await expect(menuLinks.first()).toBeVisible();
  
  // Close menu
  await menuToggle.click();
  await expect(menuOverlay).not.toHaveClass(/open/);
});
```

### Visual Regression Testing

**Tool:** Percy or Chromatic

**Coverage:**
- Capture screenshots at key breakpoints (375px, 768px, 1024px, 1440px)
- Test light/dark mode if applicable
- Test hover states and interactions
- Compare against baseline to catch unintended visual changes

### Accessibility Testing

**Tools:**
- axe-core (automated accessibility testing)
- Manual keyboard navigation testing
- Screen reader testing (NVDA, VoiceOver)

**Coverage:**
- WCAG 2.1 AA compliance
- Color contrast ratios
- Keyboard navigation
- ARIA labels and roles
- Focus management

## Performance Considerations

### Optimization Strategies

1. **Critical CSS Inlining**
   - Inline above-the-fold CSS in `<head>`
   - Load remaining CSS asynchronously

2. **Image Optimization**
   - Use WebP format with JPEG/PNG fallbacks
   - Implement responsive images with srcset
   - Lazy load below-the-fold images
   - Use appropriate compression levels

3. **JavaScript Optimization**
   - Minimize JavaScript payload
   - Defer non-critical scripts
   - Use event delegation for better performance
   - Debounce resize and scroll events

4. **Animation Performance**
   - Use CSS transforms and opacity (GPU-accelerated)
   - Avoid animating layout properties (width, height, top, left)
   - Use `will-change` sparingly for complex animations
   - Implement `prefers-reduced-motion` media query

5. **Font Loading**
   - Use `font-display: swap` to prevent FOIT (Flash of Invisible Text)
   - Subset fonts to include only needed characters
   - Use WOFF2 format for better compression

### Performance Budgets

- **First Contentful Paint (FCP):** < 1.5s
- **Largest Contentful Paint (LCP):** < 2.5s
- **Time to Interactive (TTI):** < 3.5s
- **Cumulative Layout Shift (CLS):** < 0.1
- **Total Page Weight:** < 500KB (initial load)

## Deployment Strategy

### GitHub Pages Configuration

1. **Repository Structure**
   - All static files in root directory or `/docs` folder
   - `index.html` as entry point
   - Relative paths for all assets

2. **Build Process (Optional)**
   - If using a build tool (Vite), output to `/docs` or root
   - Minify CSS and JavaScript
   - Optimize images during build

3. **GitHub Actions Workflow**
   - Automatic deployment on push to main branch
   - Run tests before deployment
   - Generate build artifacts

**Example GitHub Actions Workflow:**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### Custom Domain (Optional)

- Add CNAME file to repository root
- Configure DNS records to point to GitHub Pages
- Enable HTTPS in repository settings

## Maintenance and Extensibility

### Code Organization Principles

1. **Separation of Concerns**
   - Keep HTML structure, CSS styling, and JavaScript behavior separate
   - Use CSS custom properties for easy theme modifications
   - Modularize JavaScript into separate files by functionality

2. **Naming Conventions**
   - Use BEM (Block Element Modifier) for CSS classes
   - Use semantic HTML elements
   - Use descriptive variable and function names in JavaScript

3. **Documentation**
   - Comment complex CSS calculations (especially clamp() functions)
   - Document JavaScript functions with JSDoc
   - Maintain README with setup and deployment instructions

### Future Enhancements

Potential features to add in future iterations:

1. **Dark/Light Mode Toggle**
   - Add theme switcher
   - Store preference in localStorage
   - Respect `prefers-color-scheme` media query

2. **Internationalization (i18n)**
   - Support multiple languages
   - Use language detection
   - Implement language switcher

3. **Analytics Integration**
   - Add privacy-friendly analytics (Plausible, Fathom)
   - Track user interactions
   - Monitor performance metrics

4. **Content Management**
   - Use headless CMS for product data
   - Enable non-technical content updates
   - Implement content preview

5. **Advanced Animations**
   - Add parallax scrolling effects
   - Implement more complex scroll-triggered animations
   - Add micro-interactions for enhanced UX
