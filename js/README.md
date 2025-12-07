# JavaScript Architecture & Optimization

## Overview
The JavaScript is organized in a modular architecture with performance optimizations including debouncing, throttling, event delegation, and deferred loading.

## File Structure

### Development Files
- `main.js` - Main application entry point and utilities
- `menu.js` - Mobile menu component
- `scroll-reveal.js` - Scroll-based animation component

### Production Files
- `dist/` - Minified JavaScript files for production deployment
- `dist/bundle.min.js` - Combined and minified JavaScript bundle

## Performance Optimizations

### 1. Deferred Script Loading
All scripts use the `defer` attribute to prevent blocking HTML parsing:
```html
<script src="./js/main.js" defer></script>
```

Benefits:
- Scripts download in parallel with HTML parsing
- Scripts execute after DOM is ready
- Maintains execution order
- No need for `DOMContentLoaded` wrapper

### 2. Debouncing & Throttling

**Debouncing** - Delays function execution until after a period of inactivity
```javascript
// Resize events are debounced (150ms)
const handleResize = debounce(() => {
  // Code runs 150ms after user stops resizing
}, 150);
```

**Throttling** - Limits function execution to once per time period
```javascript
// Scroll events are throttled (100ms)
const handleScroll = throttle(() => {
  // Code runs at most once every 100ms
}, 100);
```

Use cases:
- **Debounce**: Window resize, search input, form validation
- **Throttle**: Scroll events, mouse movement, animation frames

### 3. Event Delegation
Instead of attaching listeners to multiple elements, attach one listener to a parent:

```javascript
// ❌ Bad: Multiple listeners
menuLinks.forEach(link => {
  link.addEventListener('click', () => close());
});

// ✅ Good: Single delegated listener
menuOverlay.addEventListener('click', (e) => {
  if (e.target.classList.contains('menu-link')) {
    close();
  }
});
```

Benefits:
- Fewer event listeners = less memory
- Works with dynamically added elements
- Better performance

### 4. Passive Event Listeners
For scroll and touch events, use passive listeners:
```javascript
window.addEventListener('scroll', handleScroll, { passive: true });
```

Benefits:
- Tells browser the listener won't call `preventDefault()`
- Allows browser to optimize scrolling performance
- Prevents scroll jank

### 5. Intersection Observer
Used for scroll-based animations instead of scroll events:
```javascript
const observer = new IntersectionObserver(callback, options);
observer.observe(element);
```

Benefits:
- More efficient than scroll event listeners
- Automatically handles viewport calculations
- Built-in threshold and margin options
- Fallback provided for older browsers

## Building for Production

### Using the Build Script
```bash
# Make script executable (first time only)
chmod +x build-js.sh

# Run the build
./build-js.sh
```

This will:
1. Create minified versions of all JS files in `js/dist/`
2. Generate a combined `bundle.min.js` file
3. Display file size comparisons

### Using Terser (Recommended)
For better minification, install and use terser:
```bash
# Install terser globally
npm install -g terser

# Minify a single file
terser js/main.js -o js/dist/main.min.js -c -m

# Minify with source maps
terser js/main.js -o js/dist/main.min.js -c -m --source-map
```

Options:
- `-c` - Compress (remove dead code, optimize)
- `-m` - Mangle (shorten variable names)
- `--source-map` - Generate source maps for debugging

### Alternative Tools
- **UglifyJS**: `uglifyjs js/main.js -o js/dist/main.min.js -c -m`
- **esbuild**: `esbuild js/main.js --minify --outfile=js/dist/main.min.js`
- **Closure Compiler**: Advanced optimization with type checking

## Code Organization

### Component Pattern
Each component is a class with clear responsibilities:

```javascript
class ComponentName {
  constructor(element, options) {
    // Validate inputs
    // Store references
    // Initialize
  }
  
  init() {
    // Set up event listeners
    // Initialize state
  }
  
  // Public methods
  
  // Private methods (prefix with _)
}
```

### Error Handling
All components include error handling:
```javascript
constructor(element) {
  if (!element) {
    console.warn('Component: Required element not found');
    return;
  }
  // Continue initialization
}
```

### Module Exports
Components can be used as modules:
```javascript
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ComponentName };
}
```

## Performance Best Practices

### 1. Minimize DOM Manipulation
```javascript
// ❌ Bad: Multiple reflows
element.style.width = '100px';
element.style.height = '100px';
element.style.background = 'red';

// ✅ Good: Single reflow
element.style.cssText = 'width:100px;height:100px;background:red';
```

### 2. Cache DOM Queries
```javascript
// ❌ Bad: Query every time
document.querySelector('.menu').classList.add('open');
document.querySelector('.menu').classList.remove('closed');

// ✅ Good: Query once, cache reference
const menu = document.querySelector('.menu');
menu.classList.add('open');
menu.classList.remove('closed');
```

### 3. Use DocumentFragment for Batch Inserts
```javascript
// ✅ Good: Single DOM insertion
const fragment = document.createDocumentFragment();
items.forEach(item => {
  const li = document.createElement('li');
  li.textContent = item;
  fragment.appendChild(li);
});
list.appendChild(fragment);
```

### 4. Avoid Memory Leaks
```javascript
// Remove event listeners when component is destroyed
destroy() {
  this.element.removeEventListener('click', this.handleClick);
  this.observer?.disconnect();
}
```

### 5. Use requestAnimationFrame for Animations
```javascript
function animate() {
  // Animation code
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
```

## Browser Compatibility

### Features Used
- ES6 Classes
- Arrow functions
- Template literals
- Destructuring
- Spread operator
- Intersection Observer API

### Fallbacks Provided
- Intersection Observer: Shows all elements immediately if not supported
- Custom events: Polyfill available if needed

### Polyfills (if needed)
For older browser support, include polyfills:
```html
<script src="https://polyfill.io/v3/polyfill.min.js?features=IntersectionObserver"></script>
```

## Debugging

### Development Mode
Use unminified files during development:
```html
<script src="./js/menu.js" defer></script>
<script src="./js/scroll-reveal.js" defer></script>
<script src="./js/main.js" defer></script>
```

### Production Mode
Use minified files in production:
```html
<script src="./js/dist/bundle.min.js" defer></script>
```

### Source Maps
Generate source maps for debugging minified code:
```bash
terser js/main.js -o js/dist/main.min.js -c -m --source-map
```

### Console Logging
- Development: Keep console.log statements
- Production: Remove or use a logging library with levels

## Testing

### Manual Testing
1. Test all interactive features
2. Test on different devices and browsers
3. Test with slow network (throttle in DevTools)
4. Test with JavaScript disabled (graceful degradation)

### Performance Testing
Use Chrome DevTools:
- **Performance tab**: Record and analyze runtime performance
- **Coverage tab**: Find unused JavaScript
- **Network tab**: Check file sizes and load times

### Automated Testing
Consider adding:
- Unit tests (Jest, Vitest)
- Integration tests (Playwright, Cypress)
- Performance tests (Lighthouse CI)

## Maintenance

### Adding New Features
1. Create new component file if needed
2. Follow existing patterns and conventions
3. Add error handling
4. Test thoroughly
5. Update build script if needed
6. Rebuild minified files

### Code Quality
- Use consistent naming conventions
- Add JSDoc comments for functions
- Keep functions small and focused
- Avoid global variables
- Use strict mode

### Performance Monitoring
- Target: Time to Interactive < 3.5s
- Monitor JavaScript file sizes (keep under 100KB minified)
- Use Chrome DevTools Performance tab
- Test on low-end devices

## Tools & Resources
- **terser**: JavaScript minifier (https://terser.org/)
- **esbuild**: Fast JavaScript bundler (https://esbuild.github.io/)
- **Lighthouse**: Performance auditing (https://developers.google.com/web/tools/lighthouse)
- **webpack**: Module bundler (https://webpack.js.org/)
- **Rollup**: Module bundler for libraries (https://rollupjs.org/)
