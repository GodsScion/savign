#!/bin/bash

# Master Build Script
# Builds optimized CSS and JavaScript for production deployment

echo "========================================="
echo "  SAVIGN Website - Production Build"
echo "========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "index.html" ]; then
  echo "Error: index.html not found. Please run this script from the project root."
  exit 1
fi

# Build CSS
echo "Step 1: Building CSS..."
echo "---------------------------------------"
if [ -f "build-css.sh" ]; then
  chmod +x build-css.sh
  ./build-css.sh
else
  echo "Warning: build-css.sh not found, skipping CSS build"
fi

echo ""
echo "Step 2: Building JavaScript..."
echo "---------------------------------------"
if [ -f "build-js.sh" ]; then
  chmod +x build-js.sh
  ./build-js.sh
else
  echo "Warning: build-js.sh not found, skipping JavaScript build"
fi

echo ""
echo "========================================="
echo "  Build Summary"
echo "========================================="
echo ""

# Show file sizes
echo "CSS Files:"
if [ -d "css/dist" ]; then
  du -h css/dist/*.css 2>/dev/null | sort -h
else
  echo "  No CSS dist files found"
fi

echo ""
echo "JavaScript Files:"
if [ -d "js/dist" ]; then
  du -h js/dist/*.js 2>/dev/null | sort -h
else
  echo "  No JavaScript dist files found"
fi

echo ""
echo "========================================="
echo "  Deployment Instructions"
echo "========================================="
echo ""
echo "1. Use index.prod.html for production deployment"
echo "   (or update index.html to use minified files)"
echo ""
echo "2. Ensure all files in css/dist/ and js/dist/ are deployed"
echo ""
echo "3. Test the production build locally:"
echo "   python3 -m http.server 8000"
echo "   Then visit: http://localhost:8000/index.prod.html"
echo ""
echo "4. For GitHub Pages deployment:"
echo "   - Commit all files including dist/ directories"
echo "   - Push to main branch"
echo "   - Enable GitHub Pages in repository settings"
echo ""
echo "========================================="
echo "  Build Complete!"
echo "========================================="
