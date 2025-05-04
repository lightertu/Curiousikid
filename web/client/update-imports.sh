#!/bin/bash
# This script updates import statements in TypeScript files to use TypeScript extensions

cd src

# Find all TypeScript files and update imports
find . -name "*.ts" -o -name "*.tsx" | while read file; do
  # Update .js imports to .ts
  sed -i '' 's/\.js/\.ts/g' "$file"
  # Update .jsx imports to .tsx
  sed -i '' 's/\.jsx/\.tsx/g' "$file"
  echo "Updated imports in $file"
done

echo "Import updates complete. Please check for any missed imports." 