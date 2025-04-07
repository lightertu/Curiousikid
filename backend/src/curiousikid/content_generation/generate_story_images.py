#!/usr/bin/env python3
import os
import argparse
import sys
import requests
import json
import time
import base64
from pathlib import Path
from openai import OpenAI

# Import the image generation functions from audio_story_generator
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from content_generation.audio_story_generator import (
    generate_scene_descriptions_with_openai,
    generate_simple_scene_descriptions
)

def generate_images(
    story_title,
    story_script,
    theme="fantasy",
    mood="warm",
    num_frames=4,
    pixellab_api_key=None,
    openai_api_key=None,
    image_width=1024,
    image_height=1024,
    output_dir=None
):
    """Generate images for a story using the Pixellab API
    
    Args:
        story_title (str): Title of the story
        story_script (str): Story script or text
        theme (str): Theme of the story
        mood (str): Mood of the story
        num_frames (int): Number of images to generate
        pixellab_api_key (str): Pixellab API key
        openai_api_key (str): OpenAI API key for generating descriptions
        image_width (int): Width of the images
        image_height (int): Height of the images
        output_dir (str): Directory to save images to
        
    Returns:
        list: List of paths to generated images
    """
    if not pixellab_api_key:
        raise ValueError("Pixellab API key is required for image generation")
    
    # Create output directory if not provided
    if not output_dir:
        sanitized_title = "".join(c if c.isalnum() else "_" for c in story_title)
        output_dir = f"{sanitized_title}_images"
    
    os.makedirs(output_dir, exist_ok=True)
    
    # Generate scene descriptions
    if openai_api_key:
        print("Generating scene descriptions with OpenAI...")
        scene_descriptions = generate_scene_descriptions_with_openai(
            story_title, story_script, theme, mood, num_frames, openai_api_key
        )
    else:
        print("Generating simple scene descriptions...")
        scene_descriptions = generate_simple_scene_descriptions(
            story_title, story_script, theme, mood, num_frames
        )
    
    print(f"Generated {len(scene_descriptions)} scene descriptions:")
    for i, desc in enumerate(scene_descriptions):
        print(f"Scene {i+1}: {desc}")
    
    # Generate images for each scene description
    image_paths = []
    
    for i, description in enumerate(scene_descriptions):
        print(f"\nGenerating image {i+1}/{len(scene_descriptions)}...")
        print(f"Description: {description}")
        
        # Construct appropriate negative prompts based on theme/mood
        negative_prompt = "ugly, blurry, low quality, distorted, deformed, text, watermark, signature"
        
        # Set image parameters using the exact format required
        try:
            # Make API request to Pixellab using the exact format provided
            response = requests.post(
                "https://api.pixellab.ai/v1/generate-image-pixflux",
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {pixellab_api_key}"
                },
                json={
                    "description": description,
                    "negative_description": negative_prompt,
                    "image_size": {
                        "width": image_width,
                        "height": image_height
                    },
                    "seed": i + 1  # Use different seed for each image
                }
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"Response received with status code 200")
                
                if "image" in result and "base64" in result["image"]:
                    # Decode the base64 image
                    image_data = base64.b64decode(result["image"]["base64"])
                    
                    # Save the image
                    image_filename = f"{output_dir}/scene_{i+1}.png"
                    with open(image_filename, "wb") as f:
                        f.write(image_data)
                    
                    print(f"✓ Image saved to {image_filename}")
                    image_paths.append(image_filename)
                else:
                    print(f"✗ No image data in response: {result.keys()}")
            else:
                print(f"✗ API request failed with status code {response.status_code}: {response.text}")
        except Exception as e:
            print(f"✗ Error generating image: {str(e)}")
        
        # Add a small delay to avoid rate limiting
        time.sleep(1)
    
    return image_paths

def main():
    parser = argparse.ArgumentParser(description="Generate images for a story")
    parser.add_argument("--title", required=True, help="Story title")
    parser.add_argument("--story", required=True, help="Story script or path to story script file")
    parser.add_argument("--theme", default="fantasy", help="Story theme")
    parser.add_argument("--mood", default="warm", help="Story mood")
    parser.add_argument("--num-images", type=int, default=4, help="Number of images to generate")
    parser.add_argument("--pixellab-api-key", required=True, help="Pixellab API key")
    parser.add_argument("--openai-api-key", help="OpenAI API key for generating descriptions")
    parser.add_argument("--width", type=int, default=1024, help="Image width")
    parser.add_argument("--height", type=int, default=1024, help="Image height")
    parser.add_argument("--output-dir", help="Directory to save images to")
    
    args = parser.parse_args()
    
    # Check if story is a file path or a direct script
    story_script = args.story
    if os.path.isfile(args.story):
        with open(args.story, "r") as f:
            story_script = f.read()
    
    # Generate images
    image_paths = generate_images(
        story_title=args.title,
        story_script=story_script,
        theme=args.theme,
        mood=args.mood,
        num_frames=args.num_images,
        pixellab_api_key=args.pixellab_api_key,
        openai_api_key=args.openai_api_key,
        image_width=args.width,
        image_height=args.height,
        output_dir=args.output_dir
    )
    
    print(f"\n✓ Generated {len(image_paths)} images:")
    for i, path in enumerate(image_paths):
        print(f"  - Image {i+1}: {path}")

if __name__ == "__main__":
    main() 