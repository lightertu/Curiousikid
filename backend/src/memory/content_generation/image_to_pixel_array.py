#!/usr/bin/env python3
# Simple Pixel Grid Generator
# Converts an image to the exact format needed for the PixelGrid React component
# Outputs in YAML format

from PIL import Image
import yaml
import sys

def png_to_array(image_path: str, width: int = 32, height: int = 32) -> list[list[str]]:
    """
    Converts a PNG image into a list of lists containing hex color strings.

    Args:
        image_path: The file path to the PNG image.
        width: The desired width of the output array (default: 32).
        height: The desired height of the output array (default: 32).

    Returns:
        A list of lists where each element is a hex color string (e.g., '#RRGGBB').

    Raises:
        ValueError: If the image is not of the expected dimensions.
        FileNotFoundError: If the image file does not exist.
    """
    try:
        img = Image.open(image_path)
    except FileNotFoundError:
        raise FileNotFoundError(f"Error: Image file not found at {image_path}")

    if img.size != (width, height):
        img = img.resize((width, height), Image.NEAREST)
        print(f"Image resized to {width}x{height} pixels")

    # Ensure image is in RGB format to handle different modes like RGBA or Palette
    img = img.convert("RGB")
    pixels = img.load()

    result_array = []
    for y in range(height):
        row_list = []
        for x in range(width):
            r, g, b = pixels[x, y]
            hex_color = f"#{r:02x}{g:02x}{b:02x}"
            row_list.append(hex_color)
        result_array.append(row_list)

    img.close()
    return result_array

def convert_image_to_pixelgrid_format(image_path, output_path=None, width=64, height=64):
    """
    Convert an image to a 2D array of hex colors compatible with PixelGrid component.
    
    Args:
        image_path (str): Path to the image file
        output_path (str, optional): Path to save the YAML output
        width (int): Width of the output pixel grid (default: 64)
        height (int): Height of the output pixel grid (default: 64)
        
    Returns:
        str: YAML string of the 2D color array
    """
    try:
        # Use png_to_array to get the pixel data
        pixel_data = png_to_array(image_path, width, height)
        
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