#!/bin/bash

# SAVIGN Corporate Website - Deployment Verification Script
# This script checks if the site is ready for GitHub Pages deployment

echo "🔍 SAVIGN Corporate Website - Deployment Verification"
echo "=================================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Check if index.html exists in root
echo "📄 Checking file structure..."
if [ -f "index.html" ]; then
    echo -e "${GREEN}✓${NC} index.html found in root directory"
else
    echo -e "${RED}✗${NC} index.html not found in root directory"
    ERRORS=$((ERRORS + 1))
fi

# Check if README.md exists
if [ -f "README.md" ]; then
    echo -e "${GREEN}✓${NC} README.md found"
else
    echo -e "${YELLOW}⚠${NC} README.md not found (recommended)"
    WARNINGS=$((WARNINGS + 1))
fi

# Check if GitHub Actions workflow exists
if [ -f ".github/workflows/deploy.yml" ]; then
    echo -e "${GREEN}✓${NC} GitHub Actions workflow found"
else
    echo -e "${YELLOW}⚠${NC} GitHub Actions workflow not found (optional)"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""
echo "🔗 Checking asset paths..."

# Check for absolute URLs in HTML files
if grep -q 'src="http' index.html 2>/dev/null || grep -q 'href="http' index.html 2>/dev/null; then
    echo -e "${YELLOW}⚠${NC} Found absolute URLs in index.html (should use relative paths)"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✓${NC} All paths in index.html are relative"
fi

# Check for absolute URLs in CSS files
if grep -rq 'url("http' css/ 2>/dev/null || grep -rq "url('http" css/ 2>/dev/null; then
    echo -e "${YELLOW}⚠${NC} Found absolute URLs in CSS files (should use relative paths)"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✓${NC} All paths in CSS files are relative"
fi

echo ""
echo "📁 Checking required directories..."

# Check if css directory exists
if [ -d "css" ]; then
    echo -e "${GREEN}✓${NC} css/ directory found"
    
    # Check for required CSS files
    CSS_FILES=("reset.css" "variables.css" "base.css" "layout.css" "components.css" "animations.css")
    for file in "${CSS_FILES[@]}"; do
        if [ -f "css/$file" ]; then
            echo -e "  ${GREEN}✓${NC} css/$file found"
        else
            echo -e "  ${RED}✗${NC} css/$file not found"
            ERRORS=$((ERRORS + 1))
        fi
    done
else
    echo -e "${RED}✗${NC} css/ directory not found"
    ERRORS=$((ERRORS + 1))
fi

# Check if js directory exists
if [ -d "js" ]; then
    echo -e "${GREEN}✓${NC} js/ directory found"
    
    # Check for required JS files
    JS_FILES=("main.js" "menu.js" "scroll-reveal.js" "touch-handler.js")
    for file in "${JS_FILES[@]}"; do
        if [ -f "js/$file" ]; then
            echo -e "  ${GREEN}✓${NC} js/$file found"
        else
            echo -e "  ${YELLOW}⚠${NC} js/$file not found"
            WARNINGS=$((WARNINGS + 1))
        fi
    done
else
    echo -e "${RED}✗${NC} js/ directory not found"
    ERRORS=$((ERRORS + 1))
fi

# Check if assets directory exists
if [ -d "assets" ]; then
    echo -e "${GREEN}✓${NC} assets/ directory found"
    
    # Check for logo
    if [ -f "assets/logo.svg" ]; then
        echo -e "  ${GREEN}✓${NC} assets/logo.svg found"
    else
        echo -e "  ${RED}✗${NC} assets/logo.svg not found"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${RED}✗${NC} assets/ directory not found"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "🔍 Checking HTML structure..."

# Check for viewport meta tag
if grep -q 'name="viewport"' index.html; then
    echo -e "${GREEN}✓${NC} Viewport meta tag found"
else
    echo -e "${RED}✗${NC} Viewport meta tag not found"
    ERRORS=$((ERRORS + 1))
fi

# Check for semantic HTML
if grep -q '<header' index.html && grep -q '<main' index.html && grep -q '<footer' index.html; then
    echo -e "${GREEN}✓${NC} Semantic HTML elements found"
else
    echo -e "${YELLOW}⚠${NC} Some semantic HTML elements may be missing"
    WARNINGS=$((WARNINGS + 1))
fi

# Check for ARIA labels
if grep -q 'aria-label' index.html; then
    echo -e "${GREEN}✓${NC} ARIA labels found"
else
    echo -e "${YELLOW}⚠${NC} ARIA labels not found (recommended for accessibility)"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""
echo "=================================================="
echo "📊 Verification Summary"
echo "=================================================="

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo "Your site is ready for GitHub Pages deployment."
    echo ""
    echo "Next steps:"
    echo "1. git add ."
    echo "2. git commit -m 'Ready for deployment'"
    echo "3. git push origin main"
    echo "4. Enable GitHub Pages in repository settings"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ $WARNINGS warning(s) found${NC}"
    echo "Your site should work, but consider addressing the warnings."
    echo ""
    echo "You can proceed with deployment:"
    echo "1. git add ."
    echo "2. git commit -m 'Ready for deployment'"
    echo "3. git push origin main"
    exit 0
else
    echo -e "${RED}✗ $ERRORS error(s) found${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠ $WARNINGS warning(s) found${NC}"
    fi
    echo ""
    echo "Please fix the errors before deploying."
    exit 1
fi
