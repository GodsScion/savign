#!/bin/bash

# JavaScript Build Script
# Minifies JavaScript files for production deployment

echo "Building minified JavaScript files..."

# Create dist directory if it doesn't exist
mkdir -p js/dist

# Function to minify JavaScript
# This is a simple minification - for production, use tools like terser or uglify-js
minify_js() {
  input_file=$1
  output_file=$2
  
  # Simple minification using sed (removes comments and extra whitespace)
  # For production, use: npm install -g terser && terser input.js -o output.min.js
  sed 's|//.*$||g' "$input_file" | \
  sed 's|/\*[^*]*\*\+\([^/*][^*]*\*\+\)*/||g' | \
  tr -d '\n' | \
  sed 's/  */ /g' > "$output_file"
  
  echo "✓ Minified: $input_file -> $output_file"
}

# Check if terser is available (better minification)
if command -v terser &> /dev/null; then
  echo "Using terser for minification..."
  terser js/menu.js -o js/dist/menu.min.js -c -m
  terser js/scroll-reveal.js -o js/dist/scroll-reveal.min.js -c -m
  terser js/main.js -o js/dist/main.min.js -c -m
  echo "✓ Minified all JavaScript files with terser"
else
  echo "terser not found, using basic minification..."
  echo "For better minification, install terser: npm install -g terser"
  
  # Basic minification
  minify_js "js/menu.js" "js/dist/menu.min.js"
  minify_js "js/scroll-reveal.js" "js/dist/scroll-reveal.min.js"
  minify_js "js/main.js" "js/dist/main.min.js"
fi

# Create combined minified file
cat js/dist/menu.min.js \
    js/dist/scroll-reveal.min.js \
    js/dist/main.min.js > js/dist/bundle.min.js

echo "✓ Created combined file: js/dist/bundle.min.js"

# Calculate file sizes
echo ""
echo "File sizes:"
du -h js/*.js js/dist/*.js 2>/dev/null

echo ""
echo "JavaScript build complete!"
echo ""
echo "For production, update index.html to use minified files:"
echo '<script src="./js/dist/menu.min.js" defer></script>'
echo '<script src="./js/dist/scroll-reveal.min.js" defer></script>'
echo '<script src="./js/dist/main.min.js" defer></script>'
echo ""
echo "Or use the combined bundle:"
echo '<script src="./js/dist/bundle.min.js" defer></script>'
