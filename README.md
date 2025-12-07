# SAVIGN Corporate Website

A modern, mobile-first static website showcasing SAVIGN as the parent entity for a suite of AI and service-based products.

## Features

- **Mobile-First Responsive Design**: Optimized for all devices from smartphones to desktops
- **Modern Dark Theme**: Deep dark background (#050505) with glassmorphism effects
- **Fluid Typography**: Smooth text scaling using CSS clamp() functions
- **Scroll Animations**: Smooth reveal animations as content enters viewport
- **Performance Optimized**: Static site with minimal JavaScript, GPU-accelerated animations
- **Accessibility**: WCAG 2.1 AA compliant with keyboard navigation and screen reader support

## Technology Stack

- **HTML5**: Semantic markup
- **CSS3**: Custom properties, Grid, Flexbox, backdrop-filter
- **Vanilla JavaScript**: Lightweight interactions
- **GitHub Pages**: Static hosting

## Project Structure

```
savign-website/
├── index.html              # Main HTML file
├── css/
│   ├── reset.css          # CSS reset/normalize
│   ├── variables.css      # CSS custom properties
│   ├── base.css           # Base styles and typography
│   ├── layout.css         # Grid systems and layout utilities
│   ├── components.css     # Component styles
│   └── animations.css     # Animation definitions
├── js/
│   ├── main.js            # Main application logic
│   ├── menu.js            # Mobile menu interactions
│   └── scroll-reveal.js   # Scroll-based animations
├── assets/
│   ├── images/            # Optimized images
│   └── logo.svg           # SAVIGN logo
└── README.md              # Documentation
```

## Getting Started

### Local Development

1. Clone the repository
2. Open `index.html` in a web browser
3. Or use a local server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve
   ```

### Deployment to GitHub Pages

This repository includes a GitHub Actions workflow for automatic deployment.

**Pre-Deployment Verification:**
```bash
./verify-deployment.sh
```
This script checks that all files are in place and paths are relative.

**Quick Start:**
1. Run the verification script (optional but recommended)
2. Push the repository to GitHub
3. Go to repository Settings > Pages
4. Under Source, select "GitHub Actions"
5. Push to `main` branch to trigger automatic deployment

The site will be available at: `https://godsscion.github.io/savign/`

**For detailed deployment instructions and troubleshooting, see [DEPLOYMENT.md](./DEPLOYMENT.md)**

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- iOS Safari
- Chrome for Android

## Responsive Breakpoints

- **Mobile**: 320px - 767px
- **Tablet**: 768px - 1023px
- **Desktop**: 1024px+
- **Wide**: 1440px+

## Performance

- First Contentful Paint (FCP): < 1.5s
- Largest Contentful Paint (LCP): < 2.5s
- Time to Interactive (TTI): < 3.5s
- Cumulative Layout Shift (CLS): < 0.1

## Accessibility

- Semantic HTML5 elements
- ARIA labels and roles
- Keyboard navigation support
- Focus indicators
- Screen reader compatible
- Respects `prefers-reduced-motion`

## License

Copyright © 2024 SAVIGN. All rights reserved.
