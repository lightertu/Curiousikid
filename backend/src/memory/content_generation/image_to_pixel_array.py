#!/usr/bin/env python3
# Simple Pixel Grid Generator
# Converts an image to the exact format needed for the PixelGrid React component
# Outputs in YAML format

from PIL import Image
import yaml
import sys

def convert_image_to_pixelgrid_format(image_path, output_path=None):
    """
    Convert an image to a 2D array of hex colors compatible with PixelGrid component.
    
    Args:
        image_path (str): Path to the image file
        output_path (str, optional): Path to save the YAML output
        
    Returns:
        str: YAML string of the 2D color array
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
        
        # Convert to YAML string
        yaml_data = yaml.dump(pixel_data, default_flow_style=False)
        
        # Save to file if output path provided
        if output_path:
            with open(output_path, 'w') as f:
                f.write(yaml_data)
            print(f"Saved to {output_path}")
        
        return yaml_data
        
    except Exception as e:
        print(f"Error: {e}")
        return None

# Example usage
if __name__ == "__main__":
    image_path = "/Users/paruchua/Documents/Curiousikid/backend/assets/pixel_art/550e8400-e29b-41d4-a716-446655440000/cover.png"
    output_path = "/Users/paruchua/Documents/Curiousikid/backend/sample_array_1.yaml"
    result = convert_image_to_pixelgrid_format(image_path, output_path)
    
    if result and not output_path:
        print(result)