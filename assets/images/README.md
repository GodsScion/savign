# Image Optimization Guide

## Overview
This directory contains optimized images for the SAVIGN website. All images should be properly optimized before deployment to ensure fast loading times.

## Image Optimization Process

### 1. Convert to WebP Format
WebP provides superior compression compared to JPEG/PNG while maintaining quality.

**Using command-line tools:**
```bash
# Convert JPEG/PNG to WebP
cwebp -q 85 input.jpg -o output.webp

# For PNG with transparency
cwebp -q 85 -alpha_q 85 input.png -o output.webp
```

**Using online tools:**
- Squoosh.app (https://squoosh.app/)
- CloudConvert (https://cloudconvert.com/)

### 2. Create Fallback Images
Always maintain JPEG/PNG fallbacks for browsers that don't support WebP.

**Compression guidelines:**
- JPEG: Quality 80-85 for photos
- PNG: Use tools like pngquant or TinyPNG
- SVG: Minify with SVGO

### 3. Generate Responsive Sizes
Create multiple sizes for responsive images:
- Small: 400px width (mobile)
- Medium: 800px width (tablet)
- Large: 1200px width (desktop)
- XLarge: 1600px width (wide screens)

### 4. Implementation Pattern

**Above-the-fold images (critical, no lazy loading):**
```html
<picture>
  <source srcset="./assets/images/hero.webp" type="image/webp">
  <source srcset="./assets/images/hero.jpg" type="image/jpeg">
  <img src="./assets/images/hero.jpg" alt="Hero image" width="1200" height="600">
</picture>
```

**Below-the-fold images (with lazy loading):**
```html
<picture>
  <source srcset="./assets/images/product.webp" type="image/webp">
  <source srcset="./assets/images/product.jpg" type="image/jpeg">
  <img src="./assets/images/product.jpg" alt="Product image" width="800" height="600" loading="lazy">
</picture>
```

**Responsive images with srcset:**
```html
<picture>
  <source srcset="./assets/images/feature-small.webp 400w,
                  ./assets/images/feature-medium.webp 800w,
                  ./assets/images/feature-large.webp 1200w"
          type="image/webp"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 800px">
  <source srcset="./assets/images/feature-small.jpg 400w,
                  ./assets/images/feature-medium.jpg 800w,
                  ./assets/images/feature-large.jpg 1200w"
          type="image/jpeg"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 800px">
  <img src="./assets/images/feature-medium.jpg" alt="Feature" width="800" height="600" loading="lazy">
</picture>
```

## File Naming Convention
- Use descriptive, lowercase names with hyphens
- Include size suffix for responsive variants
- Examples:
  - `hero-background.webp` / `hero-background.jpg`
  - `product-card-small.webp` / `product-card-small.jpg`
  - `team-photo-large.webp` / `team-photo-large.jpg`

## Performance Targets
- WebP images: 50-70% smaller than JPEG/PNG equivalents
- Maximum file size: 200KB for hero images, 100KB for content images
- Use lazy loading for all images below the fold
- Always specify width and height attributes to prevent layout shift

## Tools & Resources
- **cwebp**: Command-line WebP encoder (https://developers.google.com/speed/webp/docs/cwebp)
- **Squoosh**: Online image optimizer (https://squoosh.app/)
- **ImageOptim**: Mac app for image optimization
- **TinyPNG**: PNG/JPEG compression (https://tinypng.com/)
- **SVGO**: SVG optimizer (https://github.com/svg/svgo)

## Current Images
- `logo.svg` - SAVIGN logo (SVG, no optimization needed)
- `.gitkeep` - Placeholder to maintain directory structure
