import base64
import json
import os
import uuid
import requests
import yaml
from environment.config import ENV, PROJECT_ROOT
from PIL import Image

DEFAULT_NEGATIVE_PROMPT = (
    "ugly, blurry, low quality, distorted, deformed, text, watermark, signature"
)

DEFAULT_OUTPUT_DIR = f"{PROJECT_ROOT}/assets/pixel_art"


def png_to_array(image_path: str, width: int = 32, height: int = 32) -> list[list[str]]:
    """
    Converts a 32x32 PNG image into a 32x32 list of lists containing hex color strings.

    Args:
        image_path: The file path to the 32x32 PNG image.

    Returns:
        A 32x32 list of lists where each element is a hex color string (e.g., '#RRGGBB').

    Raises:
        ValueError: If the image is not 32x32 pixels.
        FileNotFoundError: If the image file does not exist.
    """
    try:
        img = Image.open(image_path)
    except FileNotFoundError:
        raise FileNotFoundError(f"Error: Image file not found at {image_path}")

    if img.size != (width, height):
        img.close()
        raise ValueError(
            f"Error: Image must be {width}x{height} pixels, but got {img.size}"
        )

    # Ensure image is in RGB format to handle different modes like RGBA or Palette
    img = img.convert("RGB")
    pixels = img.load()

    result_array = []
    for y in range(32):
        row_list = []
        for x in range(32):
            r, g, b = pixels[x, y]
            hex_color = f"#{r:02x}{g:02x}{b:02x}"
            row_list.append(hex_color)
        result_array.append(row_list)

    img.close()
    print(json.dumps(result_array, indent=4))
    return result_array


def generate_pixel_art(
    description: str,
    negative_prompt: str = DEFAULT_NEGATIVE_PROMPT,
    height: int = 32,
    width: int = 32,
) -> str:
    try:
        # Make API request to Pixellab using the exact format provided
        response = requests.post(
            "https://api.pixellab.ai/v1/generate-image-pixflux",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {ENV.PIXEL_LAB_API_KEY}",
            },
            json={
                "description": description,
                "negative_description": negative_prompt,
                "image_size": {"width": width, "height": height},
                "seed": 1,  # Use different seed for each image
            },
        )

        if response.status_code == 200:
            result = response.json()

            if "image" in result and "base64" in result["image"]:
                # Decode the base64 image
                image_data = base64.b64decode(result["image"]["base64"])

                # Save the image
                unique_id = uuid.uuid4()
                directory = f"{DEFAULT_OUTPUT_DIR}/{unique_id}"
                os.makedirs(directory, exist_ok=True)
                image_filename = f"{directory}/cover.png"
                yaml_filename = f"{directory}/cover.yml"
                json_filename = f"{directory}/cover.json"
                with open(image_filename, "wb") as f:
                    f.write(image_data)

                result_array = png_to_array(
                    image_path=image_filename, width=width, height=height
                )
                with open(yaml_filename, "w") as f:
                    f.write(yaml.dump(result_array, indent=4))

                with open(json_filename, "w") as f:
                    f.write(json.dumps(result_array, indent=4))

                print(f"✓ Image saved to {image_filename}")
                return image_filename
            else:
                print(f"✗ No image data in response: {result.keys()}")
        else:
            print(
                f"✗ API request failed with status code {response.status_code}: {response.text}"
            )
    except Exception as e:
        print(f"✗ Error generating image: {str(e)}")


if __name__ == "__main__":
    generate_pixel_art(
        """A creature with the upper part being a grey cat and the lower part being mermaid, it is called a mercat.""",
        height=32,
        width=32,
    )