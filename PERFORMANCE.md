# Performance Optimization Guide

## Overview
This document outlines all performance optimizations implemented in the SAVIGN website and provides guidelines for maintaining optimal performance.

## Performance Targets

### Core Web Vitals
- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.5s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Input Delay (FID)**: < 100ms

### File Size Budgets
- **Total Page Weight**: < 500KB (initial load)
- **HTML**: < 50KB
- **CSS**: < 50KB (minified)
- **JavaScript**: < 100KB (minified)
- **Images**: < 200KB per hero image, < 100KB per content image

## Implemented Optimizations

### 1. Image Optimization

#### WebP Format with Fallbacks
```html
<picture>
  <source srcset="image.webp" type="image/webp">
  <source srcset="image.jpg" type="image/jpeg">
  <img src="image.jpg" alt="Description" loading="lazy">
</picture>
```

**Benefits:**
- WebP provides 25-35% better compression than JPEG
- Fallback ensures compatibility with all browsers
- Lazy loading reduces initial page weight

#### Responsive Images
```html
<picture>
  <source srcset="image-small.webp 400w,
                  image-medium.webp 800w,
                  image-large.webp 1200w"
          type="image/webp"
          sizes="(max-width: 768px) 100vw, 50vw">
  <img src="image-medium.jpg" alt="Description" loading="lazy">
</picture>
```

**Benefits:**
- Serves appropriately sized images for each device
- Reduces bandwidth usage on mobile devices
- Improves load times

#### Lazy Loading
- All below-the-fold images use `loading="lazy"`
- Above-the-fold images load immediately
- Reduces initial page weight by 40-60%

**Implementation:**
See `assets/images/README.md` for detailed guidelines

### 2. CSS Optimization

#### Critical CSS Inlining
Critical above-the-fold CSS is inlined in `<head>`:
- Header/navigation styles
- Hero section styles
- Essential reset and variables
- Critical responsive breakpoints

**Benefits:**
- Eliminates render-blocking CSS requests
- Faster First Contentful Paint
- Improved perceived performance

#### Async CSS Loading
Non-critical CSS loads asynchronously:
```html
<link rel="preload" href="./css/components.css" as="style" 
      onload="this.onload=null;this.rel='stylesheet'">
```

**Benefits:**
- Doesn't block page rendering
- Progressive enhancement
- Faster Time to Interactive

#### CSS Minification
Production CSS is minified:
- Removes comments and whitespace
- Reduces file size by 30-40%
- Faster download and parse times

**Build Command:**
```bash
./build-css.sh
```

#### Relative Units
All sizing uses relative units:
- `rem` for consistent scaling
- `em` for component-relative sizing
- `vw/vh` for viewport-relative sizing
- `clamp()` for fluid typography

**Benefits:**
- Better responsive behavior
- Accessibility (respects user font size preferences)
- Smaller CSS file size

**Implementation:**
See `css/README.md` for detailed guidelines

### 3. JavaScript Optimization

#### Deferred Script Loading
All scripts use `defer` attribute:
```html
<script src="./js/main.js" defer></script>
```

**Benefits:**
- Scripts don't block HTML parsing
- Execute after DOM is ready
- Maintains execution order
- Faster page load

#### Debouncing & Throttling
Resize and scroll events are optimized:

**Debouncing (resize events):**
```javascript
const handleResize = debounce(() => {
  // Runs 150ms after resize stops
}, 150);
```

**Throttling (scroll events):**
```javascript
const handleScroll = throttle(() => {
  // Runs at most once per 100ms
}, 100);
```

**Benefits:**
- Reduces function calls by 90%+
- Prevents performance bottlenecks
- Smoother scrolling and resizing

#### Event Delegation
Single event listener on parent instead of multiple listeners:
```javascript
// One listener handles all menu links
menuOverlay.addEventListener('click', (e) => {
  if (e.target.classList.contains('menu-link')) {
    close();
  }
});
```

**Benefits:**
- Fewer event listeners = less memory
- Better performance
- Works with dynamic content

#### Intersection Observer
Scroll animations use Intersection Observer instead of scroll events:
```javascript
const observer = new IntersectionObserver(callback, options);
observer.observe(element);
```

**Benefits:**
- More efficient than scroll listeners
- Automatic viewport calculations
- Better battery life on mobile

#### JavaScript Minification
Production JavaScript is minified:
- Removes comments and whitespace
- Shortens variable names
- Reduces file size by 40-50%

**Build Command:**
```bash
./build-js.sh
```

**Implementation:**
See `js/README.md` for detailed guidelines

### 4. Animation Performance

#### GPU-Accelerated Properties
All animations use only `transform` and `opacity`:
```css
.element {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.element:hover {
  transform: scale(1.02);
  opacity: 0.9;
}
```

**Benefits:**
- GPU acceleration
- 60fps animations
- No layout thrashing

#### Reduced Motion Support
Respects user preferences:
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}
```

**Benefits:**
- Accessibility compliance
- Better experience for users with motion sensitivity
- Improved performance on low-end devices

### 5. Network Optimization

#### Resource Hints
```html
<link rel="preload" href="./css/main.css" as="style">
<link rel="dns-prefetch" href="https://fonts.googleapis.com">
```

**Benefits:**
- Faster resource loading
- Reduced latency
- Better perceived performance

#### Compression
Enable gzip/brotli compression on server:
```
# .htaccess (Apache)
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css text/javascript
</IfModule>
```

**Benefits:**
- 70-80% file size reduction
- Faster downloads
- Lower bandwidth costs

## Build Process

### Development Build
Use unminified files for easier debugging:
```bash
# No build needed, use source files directly
```

### Production Build
Build optimized files for deployment:
```bash
# Build everything
./build.sh

# Or build individually
./build-css.sh
./build-js.sh
```

### Deployment
1. Run production build
2. Use `index.prod.html` or update `index.html` to use minified files
3. Deploy all files including `css/dist/` and `js/dist/`
4. Enable compression on server
5. Set appropriate cache headers

## Performance Testing

### Tools

#### Lighthouse
```bash
# Install
npm install -g lighthouse

# Run audit
lighthouse http://localhost:8000 --view
```

**Targets:**
- Performance: > 90
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 90

#### WebPageTest
- Visit https://www.webpagetest.org/
- Test from multiple locations
- Test on different connection speeds
- Analyze waterfall charts

#### Chrome DevTools

**Performance Tab:**
1. Open DevTools (F12)
2. Go to Performance tab
3. Click Record
4. Interact with page
5. Stop recording
6. Analyze timeline

**Coverage Tab:**
1. Open DevTools (F12)
2. Press Cmd+Shift+P (Mac) or Ctrl+Shift+P (Windows)
3. Type "Coverage"
4. Click "Start instrumenting coverage"
5. Reload page
6. Identify unused CSS/JS

**Network Tab:**
1. Open DevTools (F12)
2. Go to Network tab
3. Reload page
4. Check file sizes and load times
5. Test with throttling (Slow 3G, Fast 3G)

### Performance Checklist

#### Before Deployment
- [ ] Run Lighthouse audit (score > 90)
- [ ] Test on slow 3G connection
- [ ] Test on low-end mobile device
- [ ] Verify all images are optimized
- [ ] Verify CSS is minified
- [ ] Verify JavaScript is minified
- [ ] Check for console errors
- [ ] Test all interactive features
- [ ] Verify lazy loading works
- [ ] Check Core Web Vitals

#### After Deployment
- [ ] Run Lighthouse on live site
- [ ] Test from multiple locations
- [ ] Monitor real user metrics
- [ ] Check server compression
- [ ] Verify cache headers
- [ ] Test on various devices/browsers

## Monitoring

### Real User Monitoring (RUM)
Consider implementing:
- Google Analytics 4 (Web Vitals)
- Cloudflare Web Analytics
- Vercel Analytics
- Custom performance tracking

### Synthetic Monitoring
Set up automated testing:
- Lighthouse CI
- WebPageTest API
- Pingdom
- UptimeRobot

## Optimization Opportunities

### Future Improvements

#### 1. HTTP/2 Server Push
Push critical resources before browser requests them

#### 2. Service Worker
Cache assets for offline access and faster repeat visits

#### 3. Code Splitting
Split JavaScript into smaller chunks loaded on demand

#### 4. Tree Shaking
Remove unused code from JavaScript bundles

#### 5. Image CDN
Use CDN with automatic optimization (Cloudinary, Imgix)

#### 6. Font Optimization
- Use variable fonts
- Subset fonts to include only needed characters
- Use font-display: swap

#### 7. Preconnect to Third-Party Origins
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
```

## Performance Budget

### Enforcement
Set up performance budgets in build process:

```json
{
  "budgets": [
    {
      "resourceSizes": [
        { "resourceType": "script", "budget": 100 },
        { "resourceType": "stylesheet", "budget": 50 },
        { "resourceType": "image", "budget": 200 }
      ]
    }
  ]
}
```

### Monitoring
- Fail builds that exceed budget
- Alert team when approaching limits
- Regular performance reviews

## Best Practices

### Do's
✅ Optimize images before adding to site
✅ Use lazy loading for below-fold content
✅ Minify CSS and JavaScript for production
✅ Use relative units for responsive design
✅ Debounce/throttle event handlers
✅ Use GPU-accelerated animations
✅ Test on real devices
✅ Monitor performance metrics

### Don'ts
❌ Don't add images without optimization
❌ Don't use large JavaScript libraries unnecessarily
❌ Don't animate layout properties (width, height, top, left)
❌ Don't use inline styles (except critical CSS)
❌ Don't ignore console warnings
❌ Don't skip performance testing
❌ Don't deploy without minification

## Resources

### Documentation
- [Web.dev Performance](https://web.dev/performance/)
- [MDN Performance](https://developer.mozilla.org/en-US/docs/Web/Performance)
- [Google Web Fundamentals](https://developers.google.com/web/fundamentals/performance)

### Tools
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [WebPageTest](https://www.webpagetest.org/)
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)

### Optimization Guides
- [Image Optimization](https://web.dev/fast/#optimize-your-images)
- [CSS Optimization](https://web.dev/fast/#optimize-your-css)
- [JavaScript Optimization](https://web.dev/fast/#optimize-your-javascript)
- [Web Vitals](https://web.dev/vitals/)

## Support

For questions or issues related to performance optimization, please refer to:
- `assets/images/README.md` - Image optimization
- `css/README.md` - CSS optimization
- `js/README.md` - JavaScript optimization
