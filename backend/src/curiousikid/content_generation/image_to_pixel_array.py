#!/usr/bin/env python3
# Simple Pixel Grid Generator
# Converts an image to the exact format needed for the PixelGrid React component

from PIL import Image
import json
import sys

def convert_image_to_pixelgrid_format(image_path, output_path=None):
    """
    Convert an image to a 2D array of hex colors compatible with PixelGrid component.
    
    Args:
        image_path (str): Path to the image file
        output_path (str, optional): Path to save the JSON output
        
    Returns:
        str: JSON string of the 2D color array
    """
    try:
        # Open the image
        img = Image.open(image_path)
        
        # Resize to 64x64 if needed
        if img.size != (64, 64):
            img = img.resize((64, 64), Image.NEAREST)
        
        # Convert to RGB if needed
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Create 2D array for PixelGrid
        pixel_data = []
        
        # Extract colors row by row
        for y in range(64):
            row = []
            for x in range(64):
                # Get RGB values
                r, g, b = img.getpixel((x, y))
                
                # Convert to hex format
                hex_color = "#{:02x}{:02x}{:02x}".format(r, g, b)
                row.append(hex_color)
            pixel_data.append(row)
        
        # Convert to JSON string
        json_data = json.dumps(pixel_data)
        
        # Save to file if output path provided
        if output_path:
            with open(output_path, 'w') as f:
                json.dump(pixel_data, f, indent=2)
            print(f"Saved to {output_path}")
        
        return json_data
        
    except Exception as e:
        print(f"Error: {e}")
        return None

# Example usage
if __name__ == "__main__":
    image_path = "/Users/paruchua/Documents/Curiousikid/backend/The_Frightened_Lion_images/scene_2.png"
    output_path = "/Users/paruchua/Documents/Curiousikid/backend/sample_array.json"
    result = convert_image_to_pixelgrid_format(image_path, output_path)
    
    if result and not output_path:
        print(result)