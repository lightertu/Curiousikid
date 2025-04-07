import os
import requests
from elevenlabs import ElevenLabs
from pydub import AudioSegment
import re
import argparse
import asyncio
import io
import base64
import json
import time
from openai import AsyncOpenAI, OpenAI


def generate_sound_design(
    story_title,
    theme,
    key_elements,
    mood,
    story_script,
    story_description=None,
    claude_api_key=None,
    openai_api_key=None,
):
    """Generate complete sound design plan using Claude LLM with OpenAI GPT-4o fallback"""

    elements_text = ", ".join(key_elements[:3])  # Use up to 3 elements

    # Use provided story description or create default
    story_desc = story_description or f"{story_title} is a {theme} children's story"

    # If no API keys are provided, use default sound design
    if not claude_api_key and not openai_api_key:
        print("No API keys provided. Using default sound design.")
        return create_default_sound_design(
            story_title, theme, key_elements, mood
        )

    prompt = f"""
    Create a complete sound design plan for a children's story titled "{story_title}". 
    
    Story description: {story_desc}
    
    The story script is:

    "{story_script}"

    The mood is {mood} and the key story elements are: {elements_text}.

    IMPORTANT INSTRUCTIONS:
    - All sound elements should be INSTRUMENTAL ONLY - NO VOICES or VOCAL ELEMENTS should be included in any sound effects.
    - Do not include any spoken words, whispers, vocal samples, or human voice sounds in any of the sound effects.
    - Focus on pure sound design elements like music, ambient sounds, and non-vocal sound effects.
    - The voice narration will be handled separately, so your sound design should complement it without competing.
    - The sound design should be child-friendly and engaging for young listeners.

    Please provide:

    1. INTRO: A brief description for an intro sound effect (under 15 words)
       - Must be INSTRUMENTAL ONLY with NO VOICES
       - Should establish the mood and story theme
    
    2. BACKGROUND: A short description for background music (under 20 words) that includes:
       - Musical style/genre appropriate for children
       - Key instruments
       - Mood/energy level
       - Any specific elements that match the story theme
    
    3. SOUND EFFECTS: Exactly 3 sound effects with their positions in the script:
       - Each sound effect should have a brief description (under 15 words)
       - Each should include a position marker (percentage through the script, e.g., 25%, 50%, 75%)
       - Each should relate to a specific moment or element mentioned in the script
       - All sound effects must be NON-VOCAL sounds only 
       - IMPORTANT: DO NOT include any "ahh", "mmm", or similar vocal sounds 
       - DO NOT include any talking, whispering, or vocal sounds.
       - Use only mechanical, natural, or instrumental sounds (e.g., animal sounds, weather effects, magical chimes)
       - Examples of good sound effects: rustling leaves, gentle waterfall, magical twinkling, dragon flapping wings
       - Examples of BAD sound effects: person saying "wow", crowd cheering, someone humming, vocal expressions
    
    4. OUTRO: A brief description for an outro sound effect (under 15 words)
       - Must be INSTRUMENTAL ONLY with NO VOICES
       - Should provide a satisfying conclusion

    Examples:
    
    For a fairytale about a magical forest:
    INTRO: Enchanted forest ambience with magical twinkling chimes and gentle harp
    BACKGROUND: Whimsical string melody with light woodwinds, fairy-like bells, and subtle forest ambience creating a magical, cheerful atmosphere
    SOUND EFFECTS:
    - Leaves rustling with a gentle breeze (25% - when mentioning entering the forest)
    - Magical sparkling chimes (50% - when mentioning the fairy appears)
    - Owl hooting with distant water sounds (65% - when night falls in the story)
    OUTRO: Gentle magical melody with soft bells and harp resolving to conclusion
    
    For an adventure story about a dragon:
    INTRO: Heroic medieval fanfare with adventurous drums and horns
    BACKGROUND: Exciting orchestral music with dramatic strings, triumphant brass, rhythmic percussion, and heroic energy that conveys adventure and courage
    SOUND EFFECTS:
    - Dragon wings flapping and wind rushing (30% - when the dragon appears)
    - Crackling flames with dramatic woosh (50% - when dragon breathes fire)
    - Treasure chest opening with gold coins clinking (70% - when finding the treasure)
    OUTRO: Triumphant victory theme with heroic horns and drum finale

    Format your response exactly as in the examples, with the headings INTRO, BACKGROUND, SOUND EFFECTS, and OUTRO.
    Remember: NO VOICES or VOCAL ELEMENTS in any of the sound design elements.
    """

    # First, try using Claude if API key is provided
    if claude_api_key:
        try:
            headers = {
                "x-api-key": claude_api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            }

            data = {
                "model": "claude-3-7-sonnet-20250219",
                "max_tokens": 300,
                "temperature": 0.7,
                "messages": [{"role": "user", "content": prompt}],
            }

            response = requests.post(
                "https://api.anthropic.com/v1/messages", headers=headers, json=data
            )

            if response.status_code == 200:
                result = response.json()
                sound_design_text = result["content"][0]["text"].strip()

                # Print raw response for debugging
                print("Raw sound design response from Claude:")
                print(sound_design_text)
                print("-" * 50)

                # Parse the response
                sound_design = parse_sound_design(
                    sound_design_text, story_title, theme
                )

                # Print parsed sound design for verification
                print("Parsed sound design components:")
                print(f"INTRO: {sound_design['intro']}")
                print(f"BACKGROUND: {sound_design['background']}")
                print("SOUND EFFECTS:")
                for i, effect in enumerate(sound_design["effects"]):
                    position = int(sound_design["effect_positions"][i] * 100)
                    print(f"- {effect} ({position}%)")
                print(f"OUTRO: {sound_design['outro']}")
                print("-" * 50)

                return sound_design
            elif response.status_code == 529:
                # Claude rate limit error - try OpenAI if an API key is provided
                print(f"Claude API rate limited (status 529). Attempting to use OpenAI fallback.")
                if openai_api_key:
                    return generate_sound_design_with_openai(
                        story_title, theme, key_elements, mood, story_script, 
                        story_description, openai_api_key, prompt
                    )
                else:
                    print("No OpenAI API key provided for fallback. Using default sound design.")
                    return create_default_sound_design(
                        story_title, theme, key_elements, mood
                    )
            else:
                # Other Claude API error - try OpenAI if an API key is provided
                print(f"Claude API call failed with status {response.status_code}.")
                if openai_api_key:
                    print("Attempting to use OpenAI fallback.")
                    return generate_sound_design_with_openai(
                        story_title, theme, key_elements, mood, story_script, 
                        story_description, openai_api_key, prompt
                    )
                else:
                    print("No OpenAI API key provided for fallback. Using default sound design.")
                    return create_default_sound_design(
                        story_title, theme, key_elements, mood
                    )

        except Exception as e:
            print(f"Error with Claude API: {str(e)}")
            # Try OpenAI if an API key is provided
            if openai_api_key:
                print("Attempting to use OpenAI fallback.")
                return generate_sound_design_with_openai(
                    story_title, theme, key_elements, mood, story_script, 
                    story_description, openai_api_key, prompt
                )
            else:
                print("No OpenAI API key provided for fallback. Using default sound design.")
                return create_default_sound_design(
                    story_title, theme, key_elements, mood
                )
    
    # If Claude API key is not provided but OpenAI API key is provided, try OpenAI
    elif openai_api_key:
        return generate_sound_design_with_openai(
            story_title, theme, key_elements, mood, story_script, 
            story_description, openai_api_key, prompt
        )
    
    # If no API keys are provided, use default sound design
    else:
        print("No API keys provided. Using default sound design.")
        return create_default_sound_design(
            story_title, theme, key_elements, mood
        )


def generate_sound_design_with_openai(
    story_title, 
    theme, 
    key_elements, 
    mood, 
    story_script, 
    story_description, 
    openai_api_key,
    prompt=None
):
    """Generate sound design using OpenAI's GPT-4o model"""
    try:
        # Initialize the OpenAI client
        client = OpenAI(api_key=openai_api_key)
        
        # Use the same prompt as Claude for consistency
        if not prompt:
            elements_text = ", ".join(key_elements[:3])
            story_desc = story_description or f"{story_title} is a {theme} children's story"
            
            prompt = f"""
            Create a complete sound design plan for a children's story titled "{story_title}". 
            
            Story description: {story_desc}
            
            The story script is:

            "{story_script}"

            The mood is {mood} and the key story elements are: {elements_text}.

            IMPORTANT INSTRUCTIONS:
            - All sound elements should be INSTRUMENTAL ONLY - NO VOICES or VOCAL ELEMENTS should be included in any sound effects.
            - Do not include any spoken words, whispers, vocal samples, or human voice sounds in any of the sound effects.
            - Focus on pure sound design elements like music, ambient sounds, and non-vocal sound effects.
            - The voice narration will be handled separately, so your sound design should complement it without competing.
            - The sound design should be child-friendly and engaging for young listeners - Should be very calming, soothing, and relaxing!!! This is very important!!!

            Please provide:

            1. INTRO: A brief description for an intro sound effect (under 15 words)
               - Must be INSTRUMENTAL ONLY with NO VOICES
               - Should establish the mood and story theme
            
            2. BACKGROUND: A short description for background music (under 20 words) that includes:
               - Musical style/genre appropriate for children
               - Key instruments
               - Mood/energy level
               - Any specific elements that match the story theme
            
            3. SOUND EFFECTS: Exactly 3 sound effects with their positions in the script:
               - Each sound effect should have a brief description (under 15 words)
               - Each should include a position marker (percentage through the script, e.g., 25%, 50%, 75%)
               - Each should relate to a specific moment or element mentioned in the script
               - All sound effects must be NON-VOCAL sounds only 
               - IMPORTANT: DO NOT include any "ahh", "mmm", or similar vocal sounds 
               - DO NOT include any talking, whispering, or vocal sounds.
               - Use only mechanical, natural, or instrumental sounds (e.g., animal sounds, weather effects, magical chimes)
               - Examples of good sound effects: rustling leaves, gentle waterfall, magical twinkling, dragon flapping wings
               - Examples of BAD sound effects: person saying "wow", crowd cheering, someone humming, vocal expressions
            
            4. OUTRO: A brief description for an outro sound effect (under 15 words)
               - Must be INSTRUMENTAL ONLY with NO VOICES
               - Should provide a satisfying conclusion

            Format your response exactly as follows:
            
            INTRO: [brief description]
            BACKGROUND: [brief description]
            SOUND EFFECTS:
            - [effect 1] (25%)
            - [effect 2] (50%)
            - [effect 3] (75%)
            OUTRO: [brief description]
            
            Remember: NO VOICES or VOCAL ELEMENTS in any of the sound design elements.
            """
        
        print("Generating sound design with OpenAI GPT-4o...")
        
        # Call the OpenAI API
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=500,
            temperature=0.7
        )
        
        # Get the response text
        sound_design_text = response.choices[0].message.content.strip()
        
        # Print raw response for debugging
        print("Raw sound design response from OpenAI:")
        print(sound_design_text)
        print("-" * 50)
        
        # Parse the response
        sound_design = parse_sound_design(
            sound_design_text, story_title, theme
        )
        
        # Print parsed sound design for verification
        print("Parsed sound design components from OpenAI:")
        print(f"INTRO: {sound_design['intro']}")
        print(f"BACKGROUND: {sound_design['background']}")
        print("SOUND EFFECTS:")
        for i, effect in enumerate(sound_design["effects"]):
            position = int(sound_design["effect_positions"][i] * 100)
            print(f"- {effect} ({position}%)")
        print(f"OUTRO: {sound_design['outro']}")
        print("-" * 50)
        
        return sound_design
        
    except Exception as e:
        print(f"Error generating sound design with OpenAI: {str(e)}")
        return create_default_sound_design(
            story_title, theme, key_elements, mood
        )


def parse_sound_design(sound_design_text, story_title, theme):
    """Parse the sound design text from Claude into a structured format"""
    # Initialize with empty values
    sound_design = {
        "intro": "",
        "background": "",
        "effects": [],
        "effect_positions": [],
        "outro": "",
    }

    # Print raw text for debugging
    print("Raw sound design text to parse:")
    print(sound_design_text)
    print("-" * 50)

    # Handle markdown formatted responses (## headers)
    # The (?s) flag makes . match newlines, equivalent to re.DOTALL
    markdown_intro = re.search(
        r"(?s)##\s*INTRO:?\s*(.*?)(?=\s*##|$)", sound_design_text, re.IGNORECASE
    )
    markdown_background = re.search(
        r"(?s)##\s*BACKGROUND:?\s*(.*?)(?=\s*##|$)",
        sound_design_text,
        re.IGNORECASE,
    )
    markdown_effects = re.search(
        r"(?s)##\s*SOUND EFFECTS:?\s*(.*?)(?=\s*##|$)",
        sound_design_text,
        re.IGNORECASE,
    )
    markdown_outro = re.search(
        r"(?s)##\s*OUTRO:?\s*(.*?)(?=\s*##|$)", sound_design_text, re.IGNORECASE
    )

    # Handle plain text formatted responses
    plain_intro = re.search(
        r"(?s)INTRO:?\s*(.*?)(?=\s*BACKGROUND:|$)",
        sound_design_text,
        re.IGNORECASE,
    )
    plain_background = re.search(
        r"(?s)BACKGROUND:?\s*(.*?)(?=\s*SOUND EFFECTS:|$)",
        sound_design_text,
        re.IGNORECASE,
    )
    plain_outro = re.search(
        r"(?s)OUTRO:?\s*(.*?)(?=$)", sound_design_text, re.IGNORECASE
    )

    # Extract intro (try markdown first, then plain text)
    if markdown_intro and markdown_intro.group(1).strip():
        # Clean up whitespace - replace multiple whitespace chars with a single space
        intro_text = markdown_intro.group(1).strip()
        intro_text = re.sub(r"\s+", " ", intro_text)
        sound_design["intro"] = intro_text
        print(f"Found intro (markdown): {sound_design['intro']}")
    elif plain_intro and plain_intro.group(1).strip():
        intro_text = plain_intro.group(1).strip()
        intro_text = re.sub(r"\s+", " ", intro_text)
        sound_design["intro"] = intro_text
        print(f"Found intro (plain): {sound_design['intro']}")

    # Extract background (try markdown first, then plain text)
    if markdown_background and markdown_background.group(1).strip():
        background_text = markdown_background.group(1).strip()
        background_text = re.sub(r"\s+", " ", background_text)
        sound_design["background"] = background_text
        print(f"Found background (markdown): {sound_design['background']}")
    elif plain_background and plain_background.group(1).strip():
        background_text = plain_background.group(1).strip()
        background_text = re.sub(r"\s+", " ", background_text)
        sound_design["background"] = background_text
        print(f"Found background (plain): {sound_design['background']}")

    # Extract outro (try markdown first, then plain text)
    if markdown_outro and markdown_outro.group(1).strip():
        outro_text = markdown_outro.group(1).strip()
        outro_text = re.sub(r"\s+", " ", outro_text)
        sound_design["outro"] = outro_text
        print(f"Found outro (markdown): {sound_design['outro']}")
    elif plain_outro and plain_outro.group(1).strip():
        outro_text = plain_outro.group(1).strip()
        outro_text = re.sub(r"\s+", " ", outro_text)
        sound_design["outro"] = outro_text
        print(f"Found outro (plain): {sound_design['outro']}")

    # Extract sound effects
    effects = []
    effect_positions = []

    # Try to extract effects from markdown section
    if markdown_effects and markdown_effects.group(1).strip():
        effect_section = markdown_effects.group(1).strip()
        effect_lines = effect_section.split("\n")

        for line in effect_lines:
            line = line.strip()
            if line.startswith("-"):
                # Parse effect and position
                effect_line = line.replace("-", "", 1).strip()

                # Extract position percentage
                position_match = re.search(r"\((\d+)%", effect_line)
                if position_match:
                    position = (
                        int(position_match.group(1)) / 100.0
                    )  # Convert to decimal
                    # Remove the position part from the effect description
                    effect_desc = re.sub(
                        r"\(\d+%.*?\)", "", effect_line
                    ).strip()

                    effects.append(effect_desc)
                    effect_positions.append(position)
                    print(
                        f"Found effect (markdown): {effect_desc} at position {int(position * 100)}%"
                    )

    # If no effects found in markdown, try plain text
    if not effects:
        # Look for effect lines that start with a dash and contain a percentage
        effect_pattern = r"-\s*(.*?)\s*\((\d+)%"
        effect_matches = re.finditer(effect_pattern, sound_design_text)

        for match in effect_matches:
            effect_desc = match.group(1).strip()
            position = (
                int(match.group(2)) / 100.0
            )  # Convert percentage to decimal

            # Clean up the effect description (remove position info if it's in the description)
            effect_desc = re.sub(r"\(\d+%.*?\)", "", effect_desc).strip()

            effects.append(effect_desc)
            effect_positions.append(position)
            print(
                f"Found effect (plain): {effect_desc} at position {int(position * 100)}%"
            )

    # Update sound design with found effects
    if effects:
        sound_design["effects"] = effects
        sound_design["effect_positions"] = effect_positions

    # Ensure we have exactly 3 effects with positions
    while len(sound_design["effects"]) < 3:
        # Add default effects at evenly spaced positions
        positions_needed = 3 - len(sound_design["effect_positions"])
        for i in range(positions_needed):
            position = 0.25 + (i * 0.25)  # 25%, 50%, 75%
            if position not in sound_design["effect_positions"]:
                # Use a generic effect description based on position
                if position == 0.25:
                    effect = f"Subtle sound effect highlighting {theme} introduction"
                elif position == 0.5:
                    effect = f"Medium impact sound effect emphasizing {theme} story element"
                else:
                    effect = (
                        f"Distinctive sound effect for {story_title} story climax"
                    )

                sound_design["effects"].append(effect)
                sound_design["effect_positions"].append(position)
                print(
                    f"Added generic effect at position {int(position * 100)}%"
                )

    # If intro is still empty, create a generic one
    if not sound_design["intro"]:
        sound_design["intro"] = (
            f"Story introduction sound for {story_title} {theme} children's story"
        )
        print(f"Using generic intro: {sound_design['intro']}")

    # If background is still empty, create a generic one
    if not sound_design["background"]:
        sound_design["background"] = (
            f"Instrumental background music appropriate for {theme} children's story with {story_title} theme"
        )
        print(f"Using generic background: {sound_design['background']}")

    # If outro is still empty, create a generic one
    if not sound_design["outro"]:
        sound_design["outro"] = (
            f"Story conclusion sound for {story_title} {theme} children's story"
        )
        print(f"Using generic outro: {sound_design['outro']}")

    # Print final parsed sound design
    print("\nFinal parsed sound design:")
    print(f"INTRO: {sound_design['intro']}")
    print(f"BACKGROUND: {sound_design['background']}")
    print("SOUND EFFECTS:")
    for i, effect in enumerate(sound_design["effects"]):
        position = int(sound_design["effect_positions"][i] * 100)
        print(f"- {effect} ({position}%)")
    print(f"OUTRO: {sound_design['outro']}")
    print("-" * 50)

    return sound_design


def create_default_sound_design(story_title, theme, key_elements, mood):
    """Create a default sound design when the API call fails"""

    # Create more detailed background music based on theme and mood
    background_music = ""

    if theme.lower() in ["adventure", "action", "explorer"]:
        background_music = f"Exciting orchestral music with adventurous melody, playful percussion, and a {mood} energy that sparks curiosity and bravery"
    elif theme.lower() in ["fairy tale", "fantasy", "magic", "princess", "wizard"]:
        background_music = f"Enchanting fantasy music with sparkling chimes, magical harp, gentle strings, and a {mood} melody that creates wonder"
    elif theme.lower() in ["animal", "nature", "jungle", "forest", "farm"]:
        background_music = f"Playful natural sounds with light woodwinds, organic textures, and a {mood} rhythm that evokes the outdoors"
    elif theme.lower() in ["space", "sci-fi", "future", "robot", "alien"]:
        background_music = f"Cosmic electronic music with twinkling synths, gentle beeps, spacey pads, and a {mood} progression that suggests exploration"
    elif theme.lower() in ["friendship", "family", "love", "togetherness"]:
        background_music = f"Warm acoustic melody with gentle piano, soft strings, light percussion, and a {mood} progression that conveys comfort and connection"
    elif theme.lower() in ["underwater", "ocean", "sea", "mermaid"]:
        background_music = f"Flowing aquatic music with bubbling sounds, ethereal synths, harp arpeggios, and a {mood} atmosphere that feels like floating"
    elif theme.lower() in ["bedtime", "sleep", "dream", "lullaby"]:
        background_music = f"Soothing lullaby with gentle piano, soft music box tones, and a {mood} progression perfect for calming little ones"
    else:
        # Generic but still child-appropriate background music
        background_music = f"Child-friendly instrumental track with uplifting melody, gentle instruments, and {mood} elements that enhance the story"

    # Create default sound effects based on theme
    intro_sound = f"Child-friendly story introduction for {story_title} with {mood} mood and magical sparkle"

    effects = []
    if theme.lower() in ["adventure", "action", "explorer"]:
        effects = [
            "Adventurous footsteps and rustling leaves",
            "Discovery fanfare with magical chimes",
            "Excited gasp and adventure theme",
        ]
    elif theme.lower() in ["fairy tale", "fantasy", "magic", "princess", "wizard"]:
        effects = [
            "Magical sparkles and twinkling fairy dust",
            "Enchanted transformation with magical whoosh",
            "Royal trumpet fanfare and magical shimmer",
        ]
    elif theme.lower() in ["animal", "nature", "jungle", "forest", "farm"]:
        effects = [
            "Cheerful birds chirping and gentle forest sounds",
            "Friendly animal calls and rustling leaves",
            "Flowing stream and nature ambience",
        ]
    elif theme.lower() in ["space", "sci-fi", "future", "robot", "alien"]:
        effects = [
            "Spaceship whoosh and gentle beeping",
            "Robot movement with friendly mechanical sounds",
            "Space discovery with twinkling stars sound",
        ]
    elif theme.lower() in ["friendship", "family", "love", "togetherness"]:
        effects = [
            "Warm laughter and playful chimes",
            "Group celebration with happy clapping",
            "Heartwarming moment with gentle bell tones",
        ]
    elif theme.lower() in ["underwater", "ocean", "sea", "mermaid"]:
        effects = [
            "Bubbling underwater sounds and gentle waves",
            "Fish swimming with water movement sounds",
            "Treasure discovery with underwater chimes",
        ]
    elif theme.lower() in ["bedtime", "sleep", "dream", "lullaby"]:
        effects = [
            "Gentle yawn and soft wind chimes",
            "Music box lullaby with soft tones",
            "Dreamy twinkling stars and soft night sounds",
        ]
    else:
        # Generic but child-friendly effects
        effects = [
            f"Story beginning sound with magical elements",
            f"Story middle event with gentle surprise sound",
            f"Story resolution with happy musical element",
        ]

    outro_sound = f"Child-friendly story conclusion for {story_title} with satisfying, gentle ending and no scary elements"

    return {
        "intro": intro_sound,
        "background": background_music,
        "effects": effects,
        "effect_positions": [0.25, 0.5, 0.75],  # 25%, 50%, 75% through the story
        "outro": outro_sound,
    }


async def generate_voice_with_openai(
    story_script, 
    output_file, 
    voice="nova", 
    model="gpt-4o-mini-tts",
    openai_api_key=None,
    instructions=None
):
    """Generate voice narration using OpenAI's TTS API
    
    Args:
        story_script (str): The story script to narrate
        output_file (str): Path to save the output audio file
        voice (str, optional): Voice to use. Defaults to "nova".
        model (str, optional): OpenAI TTS model to use. Defaults to "gpt-4o-mini-tts".
        openai_api_key (str, optional): OpenAI API key. Required.
        instructions (str, optional): Voice styling instructions. Defaults to None.
        
    Returns:
        str: Path to the generated audio file
    """
    if not openai_api_key:
        raise ValueError("OpenAI API key must be provided")
    
    # Default instructions for children's story narration if none provided
    instructions = None
    if not instructions:
        instructions = """
        Affect/personality: A warm, engaging storyteller for children
        
        Tone: Friendly, clear, and expressive, creating an enchanting atmosphere that captures children's imagination
        
        Pronunciation: Clear, articulate, and dynamic, with appropriate emphasis on character dialogue and emotional moments
        
        Pause: Natural pauses between sentences and paragraphs, slightly longer pauses at dramatic moments or scene transitions
        
        Emotion: Warm and expressive, conveying the emotional journey of the story, using a range of tones for different characters while maintaining a soothing, child-friendly delivery
        """

    instructions = """
    Voice Affect: Soft, gentle, soothing; embody tranquility.

    Tone: Calm, reassuring, peaceful; convey genuine warmth and serenity.

    Pacing: Slow, deliberate, and unhurried; pause gently after instructions to allow the listener time to relax and follow along.

    Emotion: Deeply soothing and comforting; express genuine kindness and care.

    Pronunciation: Smooth, soft articulation, slightly elongating vowels to create a sense of ease.

    Pauses: Use thoughtful pauses, especially between breathing instructions and visualization guidance, enhancing relaxation and mindfulness.
    
    """
    
    # Set up OpenAI client
    client = AsyncOpenAI(api_key=openai_api_key)
    
    # Prepare directory if it doesn't exist
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    
    print(f"Generating voice with OpenAI using {voice} voice...")
    
    try:
        # Generate speech audio
        response = await client.audio.speech.create(
            model=model,
            voice=voice,
            input=story_script,
            instructions=instructions,
            response_format="mp3",
        )
        
        # Save to file
        with open(output_file, "wb") as f:
            f.write(response.content)
        
        print(f"✓ Voice narration saved to {output_file}")
        return output_file
    
    except Exception as e:
        print(f"✗ Error generating voice with OpenAI: {str(e)}")
        raise


def generate_audio_story(
    story_title,
    theme,
    key_elements=None,
    mood="warm",
    elevenlabs_api_key=None,
    claude_api_key=None,
    openai_api_key=None,
    pixellab_api_key=None,
    use_openai_voice=False,
    openai_voice="nova",
    story_description=None,
    story_transcript=None,
    generate_images=False,
    num_images=4,
):
    """Generate a high-quality audio children's story with music and sound effects
    
    Args:
        story_title (str): Title of the children's story
        theme (str): Theme or genre of the story (e.g., "fantasy", "adventure")
        key_elements (list, optional): List of key elements to include in the story. Defaults to None.
        mood (str, optional): Emotional mood of the story. Defaults to "warm".
        elevenlabs_api_key (str, optional): API key for ElevenLabs voice synthesis. Required if not using OpenAI.
        claude_api_key (str, optional): API key for Claude story generation. Required.
        openai_api_key (str, optional): API key for OpenAI voice synthesis. Required if using OpenAI voice.
        pixellab_api_key (str, optional): API key for Pixellab image generation. Required if generate_images is True.
        use_openai_voice (bool, optional): Whether to use OpenAI for voice generation. Defaults to False.
        openai_voice (str, optional): OpenAI voice to use. Defaults to "nova".
        story_description (str, optional): Brief description of the story. Defaults to None.
        story_transcript (str, optional): Story transcript text to use instead of generating a story. Defaults to None.
        generate_images (bool, optional): Whether to generate images for the story. Defaults to False.
        num_images (int, optional): Number of images to generate. Defaults to 4.
        
    Returns:
        tuple: (Path to the generated audio story file, List of paths to generated images)
    """
    print(f"Generating Audio Story for {story_title}...")

    # Check for required API keys
    if not use_openai_voice and not elevenlabs_api_key:
        raise ValueError("ElevenLabs API key must be provided when not using OpenAI for voice")
    
    if use_openai_voice and not openai_api_key:
        raise ValueError("OpenAI API key must be provided when using OpenAI for voice")
    
    # Always need ElevenLabs for sound effects, even when using OpenAI for voice
    if not elevenlabs_api_key:
        raise ValueError("ElevenLabs API key must be provided for sound effects")
    
    # Check if Pixellab API key is provided when generate_images is True
    if generate_images and not pixellab_api_key:
        print("WARNING: Pixellab API key not provided. Images will not be generated.")
        generate_images = False

    # Initialize ElevenLabs client - always needed for sound effects
    client = ElevenLabs(api_key=elevenlabs_api_key)

    # Default key elements if none provided
    if not key_elements:
        key_elements = ["friendship", "adventure", "learning"]
        
    # Generate story script from transcript or using Claude
    if story_transcript:
        print("Using transcript as inspiration for the story")
        if not claude_api_key and not openai_api_key:
            raise ValueError("Either Claude or OpenAI API key must be provided even when using a transcript")
    
    # Generate story script using Claude with OpenAI fallback
    print("Generating story script...")
    story_script = generate_story_script(
        story_title,
        theme,
        key_elements,
        mood,
        story_description,
        claude_api_key,
        story_transcript,
        openai_api_key,
    )
    print("Story script:", story_script)

    # Generate images if requested
    image_paths = []
    if generate_images:
        print("Generating images for the story...")
        image_paths = generate_story_images(
            story_title,
            story_script,
            theme,
            mood,
            num_images,
            pixellab_api_key,
            openai_api_key
        )

    # Generate complete sound design plan
    sound_design = generate_sound_design(
        story_title,
        theme,
        key_elements,
        mood,
        story_script,
        story_description,
        claude_api_key if 'claude_api_key' in locals() else None,
        openai_api_key if 'openai_api_key' in locals() else None,
    )

    # Create a folder for the story's audio components
    sanitized_title = "".join(c if c.isalnum() else "_" for c in story_title)
    components_folder = f"{sanitized_title}_components"
    if not os.path.exists(components_folder):
        os.makedirs(components_folder)

    try:
        # 1. Generate voice narration
        voice_file = f"{components_folder}/{sanitized_title}_voice.mp3"
        
        if use_openai_voice:
            # Generate voice instructions based on mood
            voice_instructions = get_openai_voice_instructions(mood, theme)
            
            # Use OpenAI for voice generation
            # Since this is an async function, we need to run it in an event loop
            voice_file = asyncio.run(generate_voice_with_openai(
                story_script=story_script,
                output_file=voice_file,
                voice=openai_voice,
                openai_api_key=openai_api_key,
                instructions=voice_instructions
            ))
        else:
            # Use ElevenLabs for voice generation
            print("Generating voice narration with ElevenLabs...")
            # Select appropriate voice based on mood
            voice_id = select_voice_for_mood(mood)
            
            voice_stream = client.text_to_speech.convert(
                voice_id=voice_id,
                output_format="mp3_44100_128",
                text=story_script,
                model_id="eleven_multilingual_v2",
                voice_settings={
                    "stability": 0.75,
                    "similarity_boost": 0.75,
                    "style": 0.3,  # Slightly stylized for story character voice
                    "use_speaker_boost": True,
                },
            )

            voice_bytes = b"".join(chunk for chunk in voice_stream)

            # Save voice to file
            with open(voice_file, "wb") as f:
                f.write(voice_bytes)

        # 2. Generate intro sound
        print("Generating intro sound...")
        intro_stream = client.text_to_sound_effects.convert(
            text=sound_design["intro"]
        )

        intro_bytes = b"".join(chunk for chunk in intro_stream)

        # Save intro to file
        intro_file = f"{components_folder}/{sanitized_title}_intro.mp3"
        with open(intro_file, "wb") as f:
            f.write(intro_bytes)

        # 3. Generate background music
        print("Generating background music...")
        print(f"Background music description: '{sound_design['background']}'")
        bg_stream = client.text_to_sound_effects.convert(
            text=sound_design["background"]
        )

        bg_bytes = b"".join(chunk for chunk in bg_stream)

        # Save background to file
        bg_file = f"{components_folder}/{sanitized_title}_background.mp3"
        with open(bg_file, "wb") as f:
            f.write(bg_bytes)

        # 4. Generate sound effects
        print("Generating sound effects...")
        effect_files = []

        for i, effect_prompt in enumerate(sound_design["effects"]):
            effect_stream = client.text_to_sound_effects.convert(
                text=effect_prompt
            )
            effect_bytes = b"".join(chunk for chunk in effect_stream)

            effect_file = (
                f"{components_folder}/{sanitized_title}_effect_{i + 1}.mp3"
            )
            with open(effect_file, "wb") as f:
                f.write(effect_bytes)

            effect_files.append(effect_file)

        # 5. Generate outro effect
        print("Generating outro effect...")
        outro_stream = client.text_to_sound_effects.convert(
            text=sound_design["outro"]
        )

        outro_bytes = b"".join(chunk for chunk in outro_stream)

        # Save outro to file
        outro_file = f"{components_folder}/{sanitized_title}_outro.mp3"
        with open(outro_file, "wb") as f:
            f.write(outro_bytes)

        # 6. Load all audio segments
        print("Assembling audio components...")
        voice = AudioSegment.from_file(voice_file)
        intro = AudioSegment.from_file(intro_file)
        background = AudioSegment.from_file(bg_file)
        outro = AudioSegment.from_file(outro_file)
        effects = [AudioSegment.from_file(ef) for ef in effect_files]

        # 7. Adjust volumes based on theme and mood
        volume_settings = get_volume_settings(theme, mood)

        # Save original volumes before adjustment
        intro.export(
            f"{components_folder}/{sanitized_title}_intro_original.mp3",
            format="mp3",
        )
        background.export(
            f"{components_folder}/{sanitized_title}_background_original.mp3",
            format="mp3",
        )
        outro.export(
            f"{components_folder}/{sanitized_title}_outro_original.mp3",
            format="mp3",
        )
        for i, effect in enumerate(effects):
            effect.export(
                f"{components_folder}/{sanitized_title}_effect_{i + 1}_original.mp3",
                format="mp3",
            )

        # Apply volume adjustments
        intro_adjusted = intro - volume_settings["intro"]
        background_adjusted = background - volume_settings["background"]
        outro_adjusted = outro - volume_settings["outro"]
        effects_adjusted = [ef - volume_settings["effects"] for ef in effects]

        # Process sound effects to add fade-in and fade-out for smoother transitions
        # Use the settings from volume_settings
        effects_processed = []
        for effect in effects_adjusted:
            # effect_length = len(effect)
            # Use the fade durations from settings
            fade_in_duration = volume_settings["effect_fade_in"]
            fade_out_duration = volume_settings["effect_fade_out"]
            # Apply fades
            effect_processed = effect.fade_in(fade_in_duration).fade_out(
                fade_out_duration
            )
            effects_processed.append(effect_processed)

        # Replace the adjusted effects with the processed ones
        effects_adjusted = effects_processed

        # Save volume-adjusted components
        intro_adjusted.export(
            f"{components_folder}/{sanitized_title}_intro_adjusted.mp3",
            format="mp3",
        )
        background_adjusted.export(
            f"{components_folder}/{sanitized_title}_background_adjusted.mp3",
            format="mp3",
        )
        outro_adjusted.export(
            f"{components_folder}/{sanitized_title}_outro_adjusted.mp3",
            format="mp3",
        )
        for i, effect in enumerate(effects_adjusted):
            effect.export(
                f"{components_folder}/{sanitized_title}_effect_{i + 1}_adjusted.mp3",
                format="mp3",
            )

        # 8. Ensure background is long enough
        while (
            len(background_adjusted)
            < len(voice) + len(intro_adjusted) + len(outro_adjusted) + 3000
        ):
            background_adjusted = background_adjusted + background_adjusted

        # Save extended background
        background_adjusted.export(
            f"{components_folder}/{sanitized_title}_background_extended.mp3",
            format="mp3",
        )

        # 9. Assemble the story
        # Start with intro
        story = intro_adjusted

        # Add voice after intro with appropriate crossfade
        crossfade = volume_settings["crossfade"]
        story = story.append(voice, crossfade=crossfade)

        # Save intro + voice
        story.export(
            f"{components_folder}/{sanitized_title}_intro_voice.mp3",
            format="mp3",
        )

        # Create a copy of the story to add effects
        story_with_effects = story

        # Add effects at strategic points in the voice track using the positions from sound design
        voice_duration = len(voice)

        # Get effect overlay gain from settings
        effect_gain_overlay = volume_settings["effect_gain_overlay"]

        for i, position in enumerate(sound_design["effect_positions"]):
            if i < len(effects_adjusted):
                # Calculate actual position based on percentage through voice track
                effect_pos = int(voice_duration * position)
                actual_pos = len(intro_adjusted) - crossfade + effect_pos

                # Get a segment of the story at the position where we'll add the effect
                # This allows us to create a crossfade between the story and the effect
                if actual_pos > 0 and actual_pos < len(story_with_effects):
                    # Create a crossfade by gradually increasing the effect volume
                    # We'll overlay the effect with crossfade parameters
                    story_with_effects = story_with_effects.overlay(
                        effects_adjusted[i],
                        position=actual_pos,
                        gain_during_overlay=effect_gain_overlay,  # Use the gain from settings
                        loop=False,
                    )
                else:
                    # Fallback to regular overlay if position is out of bounds
                    story_with_effects = story_with_effects.overlay(
                        effects_adjusted[i], position=max(0, actual_pos)
                    )

                # Save after each effect is added
                story_with_effects.export(
                    f"{components_folder}/{sanitized_title}_with_effect_{i + 1}.mp3",
                    format="mp3",
                )

        story = story_with_effects

        # Add outro with appropriate crossfade
        story = story.append(outro_adjusted, crossfade=crossfade)

        # Save with outro
        story.export(
            f"{components_folder}/{sanitized_title}_with_outro.mp3",
            format="mp3",
        )

        # Trim background to match story length plus fade out
        background_final = background_adjusted[: len(story) + 2000]
        background_final.export(
            f"{components_folder}/{sanitized_title}_background_final.mp3",
            format="mp3",
        )

        # Overlay background on the entire story
        story = story.overlay(background_final, loop=True)

        # Save with background
        story.export(
            f"{components_folder}/{sanitized_title}_with_background.mp3",
            format="mp3",
        )

        # Add fade in and fade out
        story = story.fade_in(crossfade).fade_out(2000)

        # 10. Export final story
        output_path = f"{sanitized_title}_story.mp3"
        story.export(output_path, format="mp3", bitrate="192k")

        # Create a README file with descriptions of each component
        with open(f"{components_folder}/README.txt", "w") as readme:
            readme.write(f"Audio Components for {story_title} Story\n")
            readme.write("=" * 50 + "\n\n")
            readme.write("VOICE NARRATION:\n")
            readme.write(
                f"- {sanitized_title}_voice.mp3: The main voice narration\n\n"
            )

            readme.write("SOUND DESIGN COMPONENTS (ORIGINAL):\n")
            readme.write(
                f"- {sanitized_title}_intro_original.mp3: Original intro sound - {sound_design['intro']}\n"
            )
            readme.write(
                f"- {sanitized_title}_background_original.mp3: Original background music - {sound_design['background']}\n"
            )
            for i, effect in enumerate(sound_design["effects"]):
                position = int(sound_design["effect_positions"][i] * 100)
                readme.write(
                    f"- {sanitized_title}_effect_{i + 1}_original.mp3: Original sound effect {i + 1} - {effect} (at {position}% of voice track)\n"
                )
            readme.write(
                f"- {sanitized_title}_outro_original.mp3: Original outro sound - {sound_design['outro']}\n\n"
            )

            readme.write("VOLUME-ADJUSTED COMPONENTS:\n")
            readme.write(
                f"- {sanitized_title}_intro_adjusted.mp3: Volume-adjusted intro (-{volume_settings['intro']}dB)\n"
            )
            readme.write(
                f"- {sanitized_title}_background_adjusted.mp3: Volume-adjusted background music (-{volume_settings['background']}dB)\n"
            )
            for i in range(len(effects)):
                readme.write(
                    f"- {sanitized_title}_effect_{i + 1}_adjusted.mp3: Volume-adjusted sound effect {i + 1} (-{volume_settings['effects']}dB)\n"
                )
            readme.write(
                f"- {sanitized_title}_outro_adjusted.mp3: Volume-adjusted outro (-{volume_settings['outro']}dB)\n\n"
            )

            readme.write("SOUND EFFECT TRANSITIONS:\n")
            readme.write(
                f"- Fade-in duration: {volume_settings['effect_fade_in']}ms\n"
            )
            readme.write(
                f"- Fade-out duration: {volume_settings['effect_fade_out']}ms\n"
            )
            readme.write(
                f"- Initial gain during overlay: {volume_settings['effect_gain_overlay']}dB\n\n"
            )

            readme.write("ASSEMBLY STAGES:\n")
            readme.write(
                f"- {sanitized_title}_background_extended.mp3: Extended background music to cover full story length\n"
            )
            readme.write(
                f"- {sanitized_title}_intro_voice.mp3: Intro + voice narration with {volume_settings['crossfade']}ms crossfade\n"
            )
            for i in range(len(effects)):
                readme.write(
                    f"- {sanitized_title}_with_effect_{i + 1}.mp3: Story with sound effect {i + 1} added\n"
                )
            readme.write(
                f"- {sanitized_title}_with_outro.mp3: Story with outro added\n"
            )
            readme.write(
                f"- {sanitized_title}_background_final.mp3: Final trimmed background music\n"
            )
            readme.write(
                f"- {sanitized_title}_with_background.mp3: Complete story with background music\n\n"
            )

            readme.write("FINAL OUTPUT:\n")
            readme.write(
                f"- ../{output_path}: Final audio story with fade-in and fade-out\n"
            )

        print(
            f"✓ {story_title} story generated successfully and saved to {output_path}"
        )
        print(
            f"✓ All audio components saved in the '{components_folder}' folder"
        )
        
        if image_paths:
            print(f"✓ Generated {len(image_paths)} story images")
            
        return output_path, image_paths

    except Exception as e:
        print(f"✗ Error generating story: {str(e)}")
        return None, []


def create_audio_story(
    story_title,
    theme,
    key_elements=None,
    mood="warm",
    elevenlabs_api_key=None,
    claude_api_key=None,
    openai_api_key=None,
    pixellab_api_key=None,
    use_openai_voice=False,
    openai_voice="nova",
    story_description=None,
    story_transcript=None,
    generate_images=True,
    num_images=4,
):
    """Simple function to create an audio children's story with minimal parameters
    
    Args:
        story_title (str): Title of the children's story
        theme (str): Theme or genre of the story (e.g., "fantasy", "adventure")
        key_elements (list, optional): List of key elements to include in the story. Defaults to None.
        mood (str, optional): Emotional mood of the story. Defaults to "warm".
        elevenlabs_api_key (str, optional): API key for ElevenLabs voice synthesis. Required if not using OpenAI.
        claude_api_key (str, optional): API key for Claude story generation. Can be omitted if using OpenAI.
        openai_api_key (str, optional): API key for OpenAI voice synthesis and fallback for Claude. Required if using OpenAI voice.
        pixellab_api_key (str, optional): API key for Pixellab image generation. Required if generate_images is True.
        use_openai_voice (bool, optional): Whether to use OpenAI for voice generation. Defaults to False.
        openai_voice (str, optional): OpenAI voice to use. Defaults to "nova".
        story_description (str, optional): Brief description of the story. Defaults to None.
        story_transcript (str, optional): Story transcript text to use instead of generating a story. Defaults to None.
        generate_images (bool, optional): Whether to generate images for the story. Defaults to False.
        num_images (int, optional): Number of images to generate. Defaults to 4.
        
    Returns:
        tuple: (Path to the generated audio story file, List of paths to generated images)
    """
    print(f"Creating audio story: {story_title}")
    return generate_audio_story(
        story_title=story_title,
        theme=theme,
        key_elements=key_elements,
        mood=mood,
        elevenlabs_api_key=elevenlabs_api_key,
        claude_api_key=claude_api_key,
        openai_api_key=openai_api_key,
        pixellab_api_key=pixellab_api_key,
        use_openai_voice=use_openai_voice,
        openai_voice=openai_voice,
        story_description=story_description,
        story_transcript=story_transcript,
        generate_images=generate_images,
        num_images=num_images,
    )


def get_openai_voice_instructions(mood, theme):
    """Generate voice instructions for OpenAI TTS based on the story mood and theme
    
    Args:
        mood (str): Emotional mood of the story (e.g., "warm", "adventurous")
        theme (str): Theme of the story (e.g., "fantasy", "space")
        
    Returns:
        str: Voice instructions for OpenAI TTS
    """
    # Base instructions for all children's stories
    base_instructions = """
    Affect/personality: A warm, engaging storyteller for children
    
    Pronunciation: Clear, articulate, and dynamic, with appropriate emphasis on character dialogue
    
    Pause: Natural pauses between sentences and paragraphs
    """
    
    # Customize tone based on mood
    tone_instructions = {
        "warm": "Tone: Friendly, gentle, and comforting, creating a cozy atmosphere that makes children feel safe and loved",
        "playful": "Tone: Upbeat, energetic, and joyful, with lots of expression and playfulness to make children giggle and engage",
        "adventurous": "Tone: Exciting, dynamic, and bold, with moments of suspense and wonder that spark children's curiosity",
        "calm": "Tone: Soothing, peaceful, and relaxed, perfect for bedtime or creating a tranquil listening experience",
        "emotional": "Tone: Heartfelt, tender, and sincere, with gentle moments that convey meaningful emotions",
        "exciting": "Tone: Enthusiastic, animated, and high-energy, building excitement and anticipation throughout the story",
        "gentle": "Tone: Soft, delicate, and nurturing, creating a gentle storytelling approach for younger children",
        "humorous": "Tone: Light-hearted, funny, and whimsical, with playful vocal variety to bring humor to life",
        "mysterious": "Tone: Intriguing, curious, and slightly dramatic, with a sense of mystery that captivates young listeners",
        "educational": "Tone: Clear, engaging, and thoughtful, balancing entertainment with helpful learning moments"
    }
    
    # Customize emotion based on theme
    emotion_instructions = {
        "fantasy": "Emotion: Magical and wonder-filled, conveying enchantment and awe, using a range of tones for different magical characters",
        "adventure": "Emotion: Brave and enthusiastic, conveying excitement and courage, with moments of triumph and discovery",
        "space": "Emotion: Curious and awe-inspired, conveying the vastness and wonder of space exploration",
        "underwater": "Emotion: Flowing and peaceful, with a slightly echoing quality that suggests being underwater",
        "animal": "Emotion: Friendly and expressive, with subtle voice variations to distinguish different animal characters",
        "fairy tale": "Emotion: Classic storytelling warmth with a timeless quality, occasionally majestic for royal characters",
        "friendship": "Emotion: Warm and inclusive, emphasizing connection and togetherness with a kind, inviting tone",
        "bedtime": "Emotion: Gentle and soothing, gradually becoming softer and calmer toward the end of the story"
    }
    
    # Get the appropriate tone and emotion instructions or use defaults
    tone = tone_instructions.get(mood.lower(), tone_instructions["warm"])
    emotion = emotion_instructions.get(theme.lower(), "Emotion: Warm and expressive, conveying the emotional journey of the story while maintaining a child-friendly delivery")
    
    # Combine all instructions
    instructions = f"{base_instructions}\n\n{tone}\n\n{emotion}"
    
    return instructions


def process_transcript(transcript_text):
    """Process a transcript by removing timestamps and formatting it for narration
    
    Args:
        transcript_text (str): Raw transcript text with timestamps
        
    Returns:
        str: Cleaned transcript suitable for narration
    """
    # Remove timestamp lines (lines that are just numbers and colons like "0:00" or "1:23")
    lines = transcript_text.split('\n')
    cleaned_lines = []
    
    for line in lines:
        # Skip empty lines
        if not line.strip():
            continue
            
        # Skip lines that are just timestamps (e.g., "0:00", "1:23")
        if re.match(r'^\d+:\d+$', line.strip()):
            continue
            
        # Remove timestamps at the beginning of lines
        line = re.sub(r'^\d+:\d+\s+', '', line)
        
        # Keep the line
        cleaned_lines.append(line)
    
    # Join the lines back together
    cleaned_text = '\n'.join(cleaned_lines)
    
    # Remove parenthetical directions like "(A version of the tale by TheFableCottage.com)"
    cleaned_text = re.sub(r'\([^)]*\)', '', cleaned_text)
    
    # Replace double quotes with proper typographical quotes for better narration
    cleaned_text = cleaned_text.replace('"', '"').replace('"', '"')
    
    # Remove any remaining multiple consecutive whitespace
    cleaned_text = re.sub(r'\s+', ' ', cleaned_text)
    
    return cleaned_text.strip()


def generate_story_images(
    story_title,
    story_script,
    theme,
    mood,
    num_frames=4,
    pixellab_api_key=None,
    openai_api_key=None,
    image_width=64,
    image_height=64
):
    """Generate images for the children's story using Pixellab API
    
    Args:
        story_title (str): Title of the story
        story_script (str): Full story script
        theme (str): Theme of the story (e.g., "fantasy", "adventure")
        mood (str): Mood of the story (e.g., "warm", "adventurous")
        num_frames (int, optional): Number of images to generate. Defaults to 4.
        pixellab_api_key (str, optional): Pixellab API key
        openai_api_key (str, optional): OpenAI API key for generating descriptions
        image_width (int, optional): Width of generated images. Defaults to 1024.
        image_height (int, optional): Height of generated images. Defaults to 1024.
        
    Returns:
        list: List of paths to generated images
    """
    if not pixellab_api_key:
        print("WARNING: Pixellab API key not provided. Cannot generate images.")
        return []
    
    try:
        # Create a folder for the story's images
        sanitized_title = "".join(c if c.isalnum() else "_" for c in story_title)
        images_folder = f"{sanitized_title}_images"
        if not os.path.exists(images_folder):
            os.makedirs(images_folder)
        
        # Generate scene descriptions based on the story
        if openai_api_key:
            print("Generating scene descriptions with OpenAI...")
            scene_descriptions = generate_scene_descriptions_with_openai(
                story_title, story_script, theme, mood, num_frames, openai_api_key
            )
        else:
            print("Using simple scene descriptions...")
            scene_descriptions = generate_simple_scene_descriptions(
                story_title, story_script, theme, mood, num_frames
            )
        
        print(f"Generated {len(scene_descriptions)} scene descriptions")
        
        # Generate images for each scene description
        image_paths = []
        
        for i, description in enumerate(scene_descriptions):
            print(f"Generating image {i+1}/{len(scene_descriptions)}...")
            
            # Define negative prompts to avoid unwanted elements
            negative_prompt = "ugly, blurry, low quality, distorted, deformed, text, watermark, signature"
            
            try:
                # Call Pixellab API to generate the image
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
                    
                    if "image" in result and "base64" in result["image"]:
                        # Decode base64 image data
                        image_data = base64.b64decode(result["image"]["base64"])
                        
                        # Save the image
                        image_filename = f"{images_folder}/scene_{i+1}.png"
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
        
    except Exception as e:
        print(f"Error generating images: {str(e)}")
        return []


def generate_scene_descriptions_with_openai(
    story_title, story_script, theme, mood, num_frames, openai_api_key
):
    """Generate concise scene descriptions for the story using OpenAI
    
    Returns:
        list: List of scene descriptions
    """
    try:
        # Initialize the OpenAI client
        client = OpenAI(api_key=openai_api_key)
        
        prompt = f"""
        I need {num_frames} concise scene descriptions (under 50 words each) for a children's story titled "{story_title}".
        The story has a {theme} theme with a {mood} mood.
        
        The full story is:
        "{story_script}"
        
        Please create {num_frames} different and visually interesting scenes that occur at different points in the story,
        from the beginning, middle, and end. Each description should be:
        1. Very concise (under 50 words)
        2. Child-friendly and age-appropriate
        3. Visually descriptive and specific
        4. Focus on characters, settings, and key moments from the story
        5. Appropriate for the {theme} theme and {mood} mood
        
        Format your response as a numbered list, with just the descriptions.
        """
        
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=500,
            temperature=0.7
        )
        
        # Parse the response to extract the descriptions
        result_text = response.choices[0].message.content.strip()
        
        # Extract numbered list items (1. Description, 2. Description, etc.)
        descriptions = re.findall(r'^\d+\.\s*(.*?)$', result_text, re.MULTILINE)
        
        # Ensure we have exactly the requested number of descriptions
        if len(descriptions) < num_frames:
            # If we don't have enough, generate some generic ones to fill the gap
            additional_needed = num_frames - len(descriptions)
            generic_descriptions = generate_simple_scene_descriptions(
                story_title, story_script, theme, mood, additional_needed
            )
            descriptions.extend(generic_descriptions)
        
        # Trim to the exact number needed
        descriptions = descriptions[:num_frames]
        
        # Ensure each description is under 50 words
        for i in range(len(descriptions)):
            word_count = len(descriptions[i].split())
            if word_count > 50:
                # Truncate to approximately 50 words
                words = descriptions[i].split()
                descriptions[i] = ' '.join(words[:48]) + '...'
        
        return descriptions
        
    except Exception as e:
        print(f"Error generating scene descriptions with OpenAI: {str(e)}")
        return generate_simple_scene_descriptions(
            story_title, story_script, theme, mood, num_frames
        )


def generate_simple_scene_descriptions(
    story_title, story_script, theme, mood, num_frames
):
    """Generate simple scene descriptions based on the story theme and mood
    
    Returns:
        list: List of scene descriptions
    """
    # Split the story into beginning, middle, and end
    sentences = re.split(r'(?<=[.!?])\s+', story_script)
    
    if len(sentences) < num_frames:
        # Not enough sentences, duplicate some
        while len(sentences) < num_frames:
            sentences.extend(sentences[:num_frames-len(sentences)])
    
    # Extract key sections based on the desired number of frames
    section_size = len(sentences) // num_frames
    key_sections = []
    
    for i in range(num_frames):
        section_start = i * section_size
        section_end = section_start + section_size
        if i == num_frames - 1:  # For the last section, include all remaining sentences
            section_end = len(sentences)
        
        section = ' '.join(sentences[section_start:section_end])
        key_sections.append(section)
    
    # Generate descriptions for each section
    descriptions = []
    
    # Character name based on theme
    if theme.lower() in ["adventure", "action", "explorer"]:
        character = "adventurous child"
    elif theme.lower() in ["fairy tale", "fantasy", "magic", "princess", "wizard"]:
        character = "young wizard"
    elif theme.lower() in ["animal", "nature", "jungle", "forest", "farm"]:
        character = "friendly animal"
    elif theme.lower() in ["space", "sci-fi", "future", "robot", "alien"]:
        character = "curious space explorer"
    elif theme.lower() in ["friendship", "family", "love", "togetherness"]:
        character = "group of friends"
    elif theme.lower() in ["underwater", "ocean", "sea", "mermaid"]:
        character = "young mermaid"
    else:
        character = "child protagonist"
    
    # Setting based on theme
    if theme.lower() in ["adventure", "action", "explorer"]:
        setting = "magical forest"
    elif theme.lower() in ["fairy tale", "fantasy", "magic", "princess", "wizard"]:
        setting = "enchanted castle"
    elif theme.lower() in ["animal", "nature", "jungle", "forest", "farm"]:
        setting = "lush green meadow"
    elif theme.lower() in ["space", "sci-fi", "future", "robot", "alien"]:
        setting = "colorful alien planet"
    elif theme.lower() in ["friendship", "family", "love", "togetherness"]:
        setting = "cozy treehouse"
    elif theme.lower() in ["underwater", "ocean", "sea", "mermaid"]:
        setting = "vibrant coral reef"
    else:
        setting = "colorful village"
    
    # Generate appropriate descriptions
    template_descriptions = [
        f"{character} discovering something magical in {setting}, {mood} atmosphere, children's book illustration",
        f"{character} meeting new friends in {setting}, {mood} mood, child-friendly, colorful",
        f"{character} overcoming a challenge in {setting}, {mood} feeling, whimsical children's illustration",
        f"{character} celebrating victory in {setting}, {mood} and joyful, storybook art style"
    ]
    
    # Ensure we have the right number of descriptions
    while len(template_descriptions) < num_frames:
        template_descriptions.append(f"{character} in {setting}, {mood} scene, children's book style")
    
    # Return only the number of descriptions we need
    return template_descriptions[:num_frames]


def create_simple_story_script(story_title, theme, key_elements):
    """Create a simple story script when Claude API is unavailable"""
    elements = key_elements + [
        "friendship",
        "adventure",
        "learning",
    ]  # Ensure we have enough elements

    character_name = theme.title()[0] + "illy"  # Simple character name based on theme

    script = (
        f"Once upon a time, there was a little {theme} named {character_name}. "
        f"{character_name} loved {elements[0]} more than anything else in the world. "
        f"One day, {character_name} decided to go on an adventure to find {elements[1]}. "
        f"Along the way, {character_name} met new friends who taught {character_name} about {elements[2]}. "
        f"They faced challenges together, but {character_name} learned that with friends by your side, "
        f"anything is possible. When they finally found {elements[1]}, {character_name} realized that "
        f"the true treasure was the {elements[0]} they shared and the {elements[2]} they gained. "
        f"And so, {character_name} and friends lived happily ever after, always remembering their special adventure."
    )

    return script


def generate_story_script(
    story_title,
    theme,
    key_elements,
    mood,
    story_description=None,
    claude_api_key=None,
    story_transcript=None,
    openai_api_key=None,
):
    """Generate a compelling children's story script using Claude LLM with OpenAI GPT-4o fallback
    
    Args:
        story_title (str): Title of the children's story
        theme (str): Theme of the story
        key_elements (list): Key elements to include
        mood (str): Emotional mood of the story
        story_description (str, optional): Brief description of the story
        claude_api_key (str, optional): Claude API key
        story_transcript (str, optional): A transcript to use as inspiration or context
        openai_api_key (str, optional): OpenAI API key for fallback
        
    Returns:
        str: Generated story script
    """

    # Use provided story description or create default
    story_desc = story_description or f"{story_title} is a {theme} children's story"

    # API key must be provided (either Claude or OpenAI)
    if not claude_api_key and not openai_api_key:
        raise ValueError("Either Claude or OpenAI API key must be provided")

    # Prepare the prompt for Claude/OpenAI
    transcript_context = ""
    if story_transcript:
        transcript_context = f"""
        I'm providing a transcript that should be used as inspiration or reference:
        
        TRANSCRIPT:
        "{story_transcript}"
        
        Please use themes, characters, or elements from this transcript as inspiration, but create a new story in your own words that is appropriate for children.
        Don't copy the transcript directly, but incorporate its key elements and message into an original children's story.
        DO NOT FORGET THAT THE STORY SHOULD BE BETWEEN 500-600 WORDS.
        """

    prompt = f"""
    Write a children's story titled "{story_title}".
    
    Story description: {story_desc}
    
    Key story elements to include:
    {key_elements}
    
    The mood should be {mood}.
    
    {transcript_context}
    
    IMPORTANT INSTRUCTIONS:
    - Write an engaging children's story that's appropriate for ages 4-8.
    - The story should be between 500-600 WORDS.
    - Include a clear beginning, middle, and end with a simple plot.
    - Feature relatable characters that children can connect with.
    - Include some dialogue but focus on narrative storytelling.
    - Incorporate the key elements listed above naturally into the story.
    - The story should contain a gentle lesson or positive message.
    - Use language that's simple enough for young children but still interesting.
    - DO NOT include any audio direction text like "MUSIC PLAYING", "SOUND EFFECT", or similar instructions.
    - Write ONLY the story narrative that will be read by the narrator.
    - Sound design elements will be added separately, so focus only on the story itself.
    - If transcript is provided, use it as inspiration or reference, but create a new story in your own words that is appropriate for children.
    
    For reference, here are examples of good children's story openings:
    
    Example 1 (Adventure):
    "Deep in the Whispering Woods lived a little fox named Felix. His bright red fur glowed like a tiny flame among the green trees. Every morning, Felix would wake up and look out from his cozy burrow, wondering what adventures awaited him that day. On this particular morning, something unusual caught his eye – a golden feather floating down from the sky."
    
    Example 2 (Friendship):
    "Luna the little star had a problem. While all the other stars in the night sky twinkled and shone brightly, Luna could only manage a faint glow. 'Why can't I shine like everyone else?' she wondered sadly. Luna felt alone until one night, she noticed a small turtle on Earth who seemed to be looking right at her."
    
    Please write a similar quality children's story for "{story_title}".
    Return only the story text with no additional commentary, audio directions, or sound effect descriptions.
    DO NOT FORGET THAT THE STORY SHOULD BE BETWEEN 500-600 WORDS.
    """
    
    # Try using Claude first if API key is provided
    if claude_api_key:
        print(f"Generating story script using Claude...")
        try:
            # Call Claude API
            headers = {
                "x-api-key": claude_api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            }

            data = {
                "model": "claude-3-7-sonnet-20250219",
                "max_tokens": 1000,
                "temperature": 0.7,
                "messages": [{"role": "user", "content": prompt}],
            }

            response = requests.post(
                "https://api.anthropic.com/v1/messages", headers=headers, json=data
            )

            print("Claude API response status:", response.status_code)

            if response.status_code == 200:
                result = response.json()
                story_script = result["content"][0]["text"].strip()

                # Simple cleanup for any audio direction text that might have slipped through
                story_script = clean_story_script(story_script)
                return story_script
                
            elif response.status_code == 529:
                # Claude rate limit error - try OpenAI if an API key is provided
                print(f"Claude API rate limited (status 529). Attempting to use OpenAI fallback.")
                if openai_api_key:
                    return generate_story_script_with_openai(
                        story_title, theme, key_elements, mood, 
                        story_description, story_transcript, openai_api_key, prompt
                    )
                else:
                    print("No OpenAI API key provided for fallback. Using simple story approach.")
                    return create_simple_story_script(story_title, theme, key_elements)
                    
            else:
                # Other Claude API error - try OpenAI if an API key is provided
                print(f"Claude API call failed with status {response.status_code}.")
                if openai_api_key:
                    print("Attempting to use OpenAI fallback.")
                    return generate_story_script_with_openai(
                        story_title, theme, key_elements, mood, 
                        story_description, story_transcript, openai_api_key, prompt
                    )
                else:
                    print("No OpenAI API key provided for fallback. Using simple story approach.")
                    return create_simple_story_script(story_title, theme, key_elements)

        except Exception as e:
            print(f"Error using Claude API: {str(e)}.")
            # Try OpenAI if an API key is provided
            if openai_api_key:
                print("Attempting to use OpenAI fallback.")
                return generate_story_script_with_openai(
                    story_title, theme, key_elements, mood, 
                    story_description, story_transcript, openai_api_key, prompt
                )
            else:
                print("No OpenAI API key provided for fallback. Using simple approach.")
                return create_simple_story_script(story_title, theme, key_elements)
    
    # If no Claude API key but OpenAI API key is provided
    elif openai_api_key:
        print(f"Generating story script using OpenAI (Claude API key not provided)...")
        return generate_story_script_with_openai(
            story_title, theme, key_elements, mood, 
            story_description, story_transcript, openai_api_key, prompt
        )
    
    # If no API keys are provided, use simple approach (shouldn't reach here due to earlier check)
    else:
        print("No API keys provided. Using simple approach.")
        return create_simple_story_script(story_title, theme, key_elements)


def generate_story_script_with_openai(
    story_title, 
    theme, 
    key_elements, 
    mood, 
    story_description, 
    story_transcript, 
    openai_api_key,
    prompt=None
):
    """Generate a story script using OpenAI's GPT-4o model"""
    try:
        # Initialize the OpenAI client
        client = OpenAI(api_key=openai_api_key)
        
        # Use provided prompt or generate a new one
        if not prompt:
            # Use provided story description or create default
            story_desc = story_description or f"{story_title} is a {theme} children's story"
            
            # Prepare transcript context if available
            transcript_context = ""
            if story_transcript:
                transcript_context = f"""
                I'm providing a transcript that should be used as inspiration or reference:
                
                TRANSCRIPT:
                "{story_transcript}"
                
                Please use themes, characters, or elements from this transcript as inspiration, but create a new story in your own words that is appropriate for children.
                Don't copy the transcript directly, but incorporate its key elements and message into an original children's story.
                DO NOT FORGET THAT THE STORY SHOULD BE BETWEEN 500-600 WORDS.
                """
                
            prompt = f"""
            Write a children's story titled "{story_title}".
            
            Story description: {story_desc}
            
            Key story elements to include:
            {key_elements}
            
            The mood should be {mood}.
            
            {transcript_context}
            
            IMPORTANT INSTRUCTIONS:
            - Write an engaging children's story that's appropriate for ages 4-8.
            - The story should be between 500-600 WORDS.
            - Include a clear beginning, middle, and end with a simple plot.
            - Feature relatable characters that children can connect with.
            - Include some dialogue but focus on narrative storytelling.
            - Incorporate the key elements listed above naturally into the story.
            - The story should contain a gentle lesson or positive message.
            - Use language that's simple enough for young children but still interesting.
            - DO NOT include any audio direction text like "MUSIC PLAYING", "SOUND EFFECT", or similar instructions.
            - Write ONLY the story narrative that will be read by the narrator.
            - Sound design elements will be added separately, so focus only on the story itself.
            
            Return only the story text with no additional commentary, audio directions, or sound effect descriptions.
            """
        
        print("Generating story script with OpenAI GPT-4o...")
        
        # Call the OpenAI API
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1000,
            temperature=0.7
        )
        
        # Get the response text
        story_script = response.choices[0].message.content.strip()
        
        # Clean up the script
        story_script = clean_story_script(story_script)
        
        return story_script
        
    except Exception as e:
        print(f"Error generating story script with OpenAI: {str(e)}")
        return create_simple_story_script(story_title, theme, key_elements)


def clean_story_script(story_script):
    """Clean up a story script by removing audio direction text and other unwanted elements"""
    # Simple cleanup for any audio direction text that might have slipped through
    audio_direction_patterns = [
        r"\[.*?\]",  # [MUSIC PLAYING]
        r"\(.*?\)",  # (SOUND EFFECT)
        r"MUSIC\s+PLAYING",
        r"SOUND\s+EFFECT",
        r"BACKGROUND\s+MUSIC",
        r"JINGLE",
        r"SFX:",
        r"MUSIC:",
        r"AUDIO:",
        r"SOUND:",
        r"UPBEAT\s+MUSIC",
        r"SOFT\s+MUSIC",
        r"DRAMATIC\s+MUSIC",
    ]

    for pattern in audio_direction_patterns:
        story_script = re.sub(pattern, "", story_script, flags=re.IGNORECASE)

    # Clean up any double spaces or extra line breaks created by the removal
    story_script = re.sub(r"\s+", " ", story_script).strip()
    
    return story_script


def select_voice_for_mood(mood):
    """Select an appropriate voice ID based on the desired mood for a children's story"""
    # Map moods to appropriate voice IDs
    mood_to_voice = {
        # Child-friendly storytelling voices
        "warm": "XrExE9yKIg1WjnnlVkGX",  # Charlie - great for general storytelling
        "friendly": "XrExE9yKIg1WjnnlVkGX",  # Charlie
        "gentle": "XrExE9yKIg1WjnnlVkGX",  # Charlie
        
        # Exciting, adventurous voices
        "adventurous": "yoZ06aMxZJJ28mfd3POQ",  # Sam - good for adventure stories
        "exciting": "yoZ06aMxZJJ28mfd3POQ",  # Sam
        "energetic": "yoZ06aMxZJJ28mfd3POQ",  # Sam
        
        # Playful, funny voices
        "playful": "bVMeCyTHy58xNoL34h3p",  # Josh - good for humorous stories
        "humorous": "bVMeCyTHy58xNoL34h3p",  # Josh 
        "funny": "bVMeCyTHy58xNoL34h3p",  # Josh
        "light": "bVMeCyTHy58xNoL34h3p",  # Josh
        
        # Youthful voices
        "youthful": "EXAVITQu4vr4xnSDxMaL",  # Rachel - good for stories with young protagonists
        "cheerful": "EXAVITQu4vr4xnSDxMaL",  # Rachel
        
        # Calming voices for bedtime stories
        "calm": "ThT5KcBeYPX3keUQqHPh",  # Dorothy - good for bedtime stories
        "soothing": "ThT5KcBeYPX3keUQqHPh",  # Dorothy
        "peaceful": "ThT5KcBeYPX3keUQqHPh",  # Dorothy
        "bedtime": "ThT5KcBeYPX3keUQqHPh",  # Dorothy
        
        # Emotional, meaningful stories
        "emotional": "ThT5KcBeYPX3keUQqHPh",  # Dorothy
        "heartfelt": "ThT5KcBeYPX3keUQqHPh",  # Dorothy
        "touching": "ThT5KcBeYPX3keUQqHPh",  # Dorothy
        
        # More formal, educational stories
        "educational": "onwK4e9ZLuTAKqWW03F9",  # Daniel - good for educational stories
        "informative": "onwK4e9ZLuTAKqWW03F9",  # Daniel
        "instructive": "onwK4e9ZLuTAKqWW03F9",  # Daniel
    }

    # Default to Charlie (warm, conversational) if mood not found - best for general children's stories
    return mood_to_voice.get(mood.lower(), "XrExE9yKIg1WjnnlVkGX")


def get_volume_settings(theme, mood):
    """Get appropriate volume settings based on theme and mood for children's stories"""
    # Default settings
    settings = {
        "intro": 3,  # -3dB
        "background": 15,  # -15dB
        "effects": 7,  # -7dB
        "outro": 4,  # -4dB
        "crossfade": 600,  # 600ms
        "effect_fade_in": 250,  # 250ms fade in for effects
        "effect_fade_out": 350,  # 350ms fade out for effects
        "effect_gain_overlay": -6,  # -6dB initial gain for smooth effect overlay
    }

    # Adjust for theme
    if theme.lower() in ["adventure", "action", "explorer"]:
        settings["intro"] = 2  # Louder intro
        settings["background"] = 14  # Slightly louder background
        settings["effect_fade_in"] = 200  # Shorter fade for adventure sounds
        settings["effect_fade_out"] = 300
    elif theme.lower() in ["fairy tale", "fantasy", "magic", "princess", "wizard"]:
        settings["background"] = 13  # Slightly louder fantasy background
        settings["effects"] = 6  # Slightly louder magical effects
        settings["effect_fade_in"] = 300  
        settings["effect_fade_out"] = 400
    elif theme.lower() in ["animal", "nature", "jungle", "forest", "farm"]:
        settings["effects"] = 6  # Slightly louder nature sounds
        settings["effect_fade_in"] = 300  # Medium fades for nature sounds
        settings["effect_fade_out"] = 400
        settings["effect_gain_overlay"] = -5  # Slightly stronger nature effect presence
    elif theme.lower() in ["space", "sci-fi", "future", "robot", "alien"]:
        settings["effects"] = 6  # Slightly louder futuristic sounds
        settings["effect_fade_in"] = 300  # Medium fades for futuristic sounds
        settings["effect_fade_out"] = 400
        settings["effect_gain_overlay"] = -5  # Slightly stronger futuristic effect presence
    elif theme.lower() in ["friendship", "family", "love", "togetherness"]:
        settings["effects"] = 5  # Louder effects
        settings["crossfade"] = 400  # Shorter crossfades
        settings["effect_fade_in"] = 180  # Quicker fades for warm mood
        settings["effect_fade_out"] = 250
        settings["effect_gain_overlay"] = -4  # Stronger effect presence for warm mood
    elif theme.lower() in ["underwater", "ocean", "sea", "mermaid"]:
        settings["effects"] = 5  # Louder aquatic sounds
        settings["crossfade"] = 400  # Shorter crossfades
        settings["effect_fade_in"] = 180  # Quicker fades for aquatic mood
        settings["effect_fade_out"] = 250
        settings["effect_gain_overlay"] = -4  # Stronger effect presence for aquatic mood
    elif theme.lower() in ["bedtime", "sleep", "dream", "lullaby"]:
        settings["intro"] = 4  # Softer intro
        settings["background"] = 17  # Quieter background
        settings["crossfade"] = 800  # Longer crossfades
        settings["effect_fade_in"] = 350  # Longer, gentler fades for relaxing stories
        settings["effect_fade_out"] = 450
        settings["effect_gain_overlay"] = -8  # Gentler effect introduction

    # Adjust for mood
    if mood.lower() in ["humorous", "funny", "light", "playful"]:
        settings["effects"] = 5  # Louder effects
        settings["crossfade"] = 400  # Shorter crossfades
        settings["effect_fade_in"] = 180  # Quicker fades for humorous mood
        settings["effect_fade_out"] = 250
        settings["effect_gain_overlay"] = -4  # Stronger effect presence for humor
    elif mood.lower() in ["emotional", "heartfelt", "touching"]:
        settings["background"] = 16  # Quieter background
        settings["crossfade"] = 800  # Longer crossfades
        settings["effect_fade_in"] = 400  # Longer fades for emotional content
        settings["effect_fade_out"] = 500
        settings["effect_gain_overlay"] = -9  # Very gentle effect introduction
    elif mood.lower() in ["excited", "energetic", "upbeat"]:
        settings["intro"] = 2  # Louder intro
        settings["background"] = 13  # Louder background
        settings["effects"] = 5  # Louder effects
        settings["crossfade"] = 400  # Shorter crossfades
    elif mood.lower() in ["calm", "peaceful", "serene", "soothing"]:
        settings["intro"] = 4  # Softer intro
        settings["background"] = 17  # Quieter background
        settings["effects"] = 8  # Quieter effects
        settings["crossfade"] = 700  # Longer crossfades
        settings["effect_gain_overlay"] = -8  # Gentler effect introduction

    # Make sure all settings are child-friendly (avoid too loud or startling settings)
    settings["effect_gain_overlay"] = max(settings["effect_gain_overlay"], -10)  # Not too loud
    settings["crossfade"] = max(settings["crossfade"], 300)  # Ensure minimum crossfade
    
    return settings


if __name__ == "__main__":
    # Create command line argument parser
    parser = argparse.ArgumentParser(
        description="Audio Story Generator for Children"
    )
    parser.add_argument("--title", default="The Magic Forest", help="Story title")
    parser.add_argument("--theme", default="fantasy", help="Story theme")
    parser.add_argument(
        "--mood",
        default="warm",
        help="Mood (e.g., warm, playful, adventurous, gentle)",
    )
    parser.add_argument(
        "--elements",
        nargs="+",
        default=["friendship", "magic", "adventure"],
        help="Key story elements (space-separated)",
    )
    parser.add_argument("--elevenlabs-api-key", help="ElevenLabs API key (required if not using OpenAI voice)")
    parser.add_argument("--claude-api-key", help="Claude API key (used for story and sound design generation, will fall back to OpenAI if rate limited)")
    parser.add_argument("--openai-api-key", help="OpenAI API key (required if using OpenAI voice, also used as fallback for Claude when rate limited)")
    parser.add_argument("--pixellab-api-key", help="Pixellab API key (required for image generation)")
    parser.add_argument(
        "--use-openai-voice", 
        action="store_true",
        help="Use OpenAI for voice generation instead of ElevenLabs"
    )
    parser.add_argument(
        "--openai-voice",
        default="nova",
        choices=["alloy", "echo", "fable", "onyx", "nova", "shimmer"],
        help="OpenAI voice to use (default: nova)"
    )
    parser.add_argument(
        "--transcript",
        help="Story transcript text to use instead of generating a story",
    )
    parser.add_argument(
        "--output",
        help="Custom output filename (optional)",
    )
    parser.add_argument(
        "--description",
        help="Optional description of the story",
    )
    parser.add_argument(
        "--generate-images",
        action="store_true",
        help="Generate images for the story using Pixellab API"
    )
    parser.add_argument(
        "--num-images",
        type=int,
        default=4,
        help="Number of images to generate (default: 4)"
    )
    parser.add_argument(
        "--image-width",
        type=int,
        default=1024,
        help="Width of generated images (default: 1024)"
    )
    parser.add_argument(
        "--image-height",
        type=int,
        default=1024,
        help="Height of generated images (default: 1024)"
    )

    args = parser.parse_args()

    # Process transcript if provided
    story_transcript = None
    if args.transcript:
        story_transcript = process_transcript(args.transcript)

    # Check if either Claude or OpenAI API key is provided
    if not story_transcript and not args.claude_api_key and not args.openai_api_key:
        print("Error: Either --claude-api-key or --openai-api-key must be provided for story generation")
        exit(1)
        
    # Check if Pixellab API key is provided when generate_images is True
    if args.generate_images and not args.pixellab_api_key:
        print("Error: --pixellab-api-key must be provided when --generate-images is set")
        exit(1)

    # Generate the audio story
    try:
        output_path, image_paths = create_audio_story(
            story_title=args.title, 
            theme=args.theme, 
            key_elements=args.elements,
            mood=args.mood,
            elevenlabs_api_key=args.elevenlabs_api_key,
            claude_api_key=args.claude_api_key,
            openai_api_key=args.openai_api_key,
            pixellab_api_key=args.pixellab_api_key,
            use_openai_voice=args.use_openai_voice,
            openai_voice=args.openai_voice,
            story_description=args.description,
            story_transcript=story_transcript,
            generate_images=args.generate_images,
            num_images=args.num_images,
        )
        
        if output_path:
            print(f"✓ Story generated successfully: {output_path}")
            if image_paths:
                print(f"✓ Generated {len(image_paths)} story images:")
                for i, path in enumerate(image_paths):
                    print(f"  - Image {i+1}: {path}")
        else:
            print("✗ Failed to generate story.")
    except Exception as e:
        print(f"✗ Error: {str(e)}")
        print("Make sure you've provided valid API keys for the services you're using.")
