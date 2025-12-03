#!/bin/bash

# Script to create colored versions of view icons
# Converts white icons to teal (#00665C) using ImageMagick

COLOR="#00665C"

# Check if ImageMagick is installed
if ! command -v magick &> /dev/null && ! command -v convert &> /dev/null; then
    echo "Error: ImageMagick is not installed."
    echo "Please install it with: sudo apt-get install imagemagick"
    exit 1
fi

# Determine which command to use (magick for newer versions, convert for older)
if command -v magick &> /dev/null; then
    CMD="magick"
else
    CMD="convert"
fi

echo "Creating colored icon versions with color $COLOR..."

# Process each icon
for icon in decoding-model.png decoding-simple.png pretraining-model.png pretraining-simple.png; do
    if [ -f "$icon" ]; then
        output="${icon%.png}-colored.png"
        echo "Processing $icon -> $output"
        
        # Convert white to teal, preserving transparency
        $CMD "$icon" -fuzz 10% -fill "$COLOR" -opaque white "$output"
        
        if [ $? -eq 0 ]; then
            echo "✓ Created $output"
        else
            echo "✗ Failed to create $output"
        fi
    else
        echo "⚠ Warning: $icon not found"
    fi
done

echo ""
echo "Done! Colored icons created."
