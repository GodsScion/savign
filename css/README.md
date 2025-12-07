# CSS Architecture & Optimization

## Overview
The CSS is organized in a modular architecture for maintainability and performance.

## File Structure

### Development Files
- `reset.css` - CSS reset/normalize for consistent cross-browser rendering
- `variables.css` - CSS custom properties (design tokens)
- `base.css` - Base typography and global styles
- `layout.css` - Grid systems and layout utilities
- `components.css` - Component-specific styles
- `animations.css` - Animation definitions and keyframes

### Production Files
- `dist/` - Minified CSS files for production deployment
- `dist/main.min.css` - Combined and minified CSS bundle

## CSS Optimization Strategy

### 1. Critical CSS Inlining
Critical above-the-fold CSS is inlined in the `<head>` of `index.html` to eliminate render-blocking requests. This includes:
- Essential reset styles
- Header/navigation styles
- Hero section styles
- Critical responsive breakpoints

### 2. Async CSS Loading
Non-critical CSS is loaded asynchronously using the preload pattern:
```html
<link rel="preload" href="./css/components.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
```

### 3. Relative Units
All sizing uses relative units for responsive design:
- `rem` - Root-relative sizing (based on root font size)
- `em` - Element-relative sizing
- `vw/vh` - Viewport-relative sizing
- `%` - Percentage-based sizing
- `clamp()` - Fluid typography with min/max bounds

### 4. CSS Custom Properties
Design tokens are defined as CSS custom properties in `variables.css`:
- Colors
- Spacing scale
- Typography scale
- Transitions
- Z-index layers
- Border radius
- Shadows
- Blur values

## Building for Production

### Using the Build Script
```bash
# Make script executable (first time only)
chmod +x build-css.sh

# Run the build
./build-css.sh
```

This will:
1. Create minified versions of all CSS files in `css/dist/`
2. Generate a combined `main.min.css` file
3. Display file size comparisons

### Manual Minification
If you prefer to use a CSS minifier tool:

**Using cssnano (Node.js):**
```bash
npm install -g cssnano-cli
cssnano css/reset.css css/dist/reset.min.css
```

**Using clean-css (Node.js):**
```bash
npm install -g clean-css-cli
cleancss -o css/dist/main.min.css css/*.css
```

**Online tools:**
- CSS Minifier (https://cssminifier.com/)
- CSS Compressor (https://csscompressor.com/)

## Performance Best Practices

### 1. Minimize Render-Blocking CSS
- Inline critical CSS in `<head>`
- Load non-critical CSS asynchronously
- Use media queries to load print styles conditionally

### 2. Use Efficient Selectors
- Avoid deep nesting (max 3 levels)
- Use classes over complex selectors
- Avoid universal selectors in performance-critical code

### 3. Optimize Animations
- Use `transform` and `opacity` for GPU acceleration
- Avoid animating `width`, `height`, `top`, `left`
- Use `will-change` sparingly for complex animations
- Implement `prefers-reduced-motion` for accessibility

### 4. Reduce File Size
- Remove unused CSS
- Minify for production
- Use shorthand properties
- Combine similar rules

## Browser Support

### Modern Features Used
- CSS Custom Properties (CSS Variables)
- CSS Grid
- Flexbox
- `clamp()` for fluid typography
- `backdrop-filter` for glassmorphism effects

### Fallbacks Provided
- Flexbox fallback for CSS Grid (via `@supports`)
- Solid background fallback for `backdrop-filter`
- Vendor prefixes for cross-browser compatibility

## Responsive Design

### Breakpoints
```css
/* Mobile-first approach */
/* Base: 320px - 767px (mobile) */
/* Tablet: 768px - 1023px */
/* Desktop: 1024px+ */

--breakpoint-tablet: 768px;
--breakpoint-desktop: 1024px;
--breakpoint-wide: 1440px;
```

### Media Query Strategy
- Mobile-first: Base styles for mobile, enhance for larger screens
- Use `min-width` media queries for progressive enhancement
- Test at common breakpoints: 375px, 768px, 1024px, 1440px

## Maintenance

### Adding New Styles
1. Determine which file the styles belong in
2. Use existing CSS custom properties for consistency
3. Follow BEM naming convention for classes
4. Test responsive behavior at all breakpoints
5. Rebuild minified files for production

### Updating Design Tokens
1. Modify values in `variables.css`
2. Changes automatically propagate to all components
3. Rebuild for production

### Performance Monitoring
- Target: First Contentful Paint < 1.5s
- Monitor CSS file sizes (keep under 50KB minified)
- Use Chrome DevTools Coverage to identify unused CSS
- Test on slow 3G connections

## Tools & Resources
- **PostCSS**: CSS transformation tool
- **PurgeCSS**: Remove unused CSS
- **cssnano**: CSS minifier
- **Autoprefixer**: Add vendor prefixes automatically
- **stylelint**: CSS linter for code quality
