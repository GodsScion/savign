#!/bin/bash

# CSS Build Script
# Minifies CSS files for production deployment

echo "Building minified CSS files..."

# Create dist directory if it doesn't exist
mkdir -p css/dist

# Function to minify CSS (removes comments, whitespace, newlines)
minify_css() {
  input_file=$1
  output_file=$2
  
  # Simple minification using sed
  # Remove comments, collapse whitespace, remove newlines
  sed 's/\/\*[^*]*\*\///g' "$input_file" | \
  tr -d '\n' | \
  sed 's/  */ /g' | \
  sed 's/ *{ */{/g' | \
  sed 's/ *} */}/g' | \
  sed 's/ *: */:/g' | \
  sed 's/ *; */;/g' | \
  sed 's/ *, */,/g' > "$output_file"
  
  echo "✓ Minified: $input_file -> $output_file"
}

# Minify all CSS files
minify_css "css/reset.css" "css/dist/reset.min.css"
minify_css "css/variables.css" "css/dist/variables.min.css"
minify_css "css/base.css" "css/dist/base.min.css"
minify_css "css/layout.css" "css/dist/layout.min.css"
minify_css "css/components.css" "css/dist/components.min.css"
minify_css "css/animations.css" "css/dist/animations.min.css"

# Create combined minified file
cat css/dist/reset.min.css \
    css/dist/variables.min.css \
    css/dist/base.min.css \
    css/dist/layout.min.css \
    css/dist/components.min.css \
    css/dist/animations.min.css > css/dist/main.min.css

echo "✓ Created combined file: css/dist/main.min.css"

# Calculate file sizes
echo ""
echo "File sizes:"
du -h css/*.css css/dist/*.css

echo ""
echo "CSS build complete!"
echo "For production, update index.html to use minified files:"
echo '<link rel="stylesheet" href="./css/dist/main.min.css">'
