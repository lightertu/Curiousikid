#!/bin/bash
# This script converts .js/.jsx files to .ts/.tsx files
# Navigate to the src directory
cd src

# Convert .js files with JSX content to .tsx
find . -name "*.js" -not -path "*/node_modules/*" | while read file; do
  # Check if file contains JSX syntax (React components)
  if grep -q "React\.|import React|<[A-Z]|<\/[A-Z]|<React|\/>|render\(" "$file"; then
    tsx_file="${file%.js}.tsx"
    cp "$file" "$tsx_file"
    echo "Created $tsx_file (JSX detected)"
  else
    # Regular JS file, convert to .ts
    ts_file="${file%.js}.ts"
    cp "$file" "$ts_file"
    echo "Created $ts_file"
  fi
done

# Copy all .jsx files to .tsx
find . -name "*.jsx" -not -path "*/node_modules/*" | while read file; do
  # Create a TypeScript version of each file
  tsx_file="${file%.jsx}.tsx"
  cp "$file" "$tsx_file"
  echo "Created $tsx_file"
done

echo "Conversion complete. Please update imports in the files as needed." 