from typing import Literal, List, Dict, Any, Optional, Union, Type
from typing_extensions import TypedDict
import os
import json
import streamlit as st
import random
from pydantic import BaseModel, Field

from langchain_anthropic import ChatAnthropic
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain.tools import BaseTool

# Import the KidLearn agent
from langchain_chat import KidLearnEducationalAI

# Define the metadata for our local MP3 files
MUSIC_LIBRARY = [
    {
        "id": "song-001",
        "title": "The Animal Song",
        "description": "A fun song about different animals and the sounds they make",
        "topics": ["animals", "farm", "pets", "sounds", "nature"],
        "age_range": [3, 8],
        "duration_sec": 120,
        "filename": "animal_song.mp3"
    },
    {
        "id": "song-002",
        "title": "Counting Stars",
        "description": "A gentle song about counting and astronomy",
        "topics": ["numbers", "counting", "space", "stars", "planets", "astronomy"],
        "age_range": [4, 10],
        "duration_sec": 180,
        "filename": "counting_stars.mp3"
    },
    {
        "id": "song-003",
        "title": "The Weather Dance",
        "description": "An upbeat song about different weather types with dance moves",
        "topics": ["weather", "rain", "sun", "snow", "dance", "movement"],
        "age_range": [3, 7],
        "duration_sec": 150,
        "filename": "weather_dance.mp3"
    },
    {
        "id": "song-004",
        "title": "Dinosaur Stomp",
        "description": "A fun song about dinosaurs with stomping actions",
        "topics": ["dinosaurs", "prehistoric", "animals", "movement"],
        "age_range": [4, 9],
        "duration_sec": 165,
        "filename": "dinosaur_stomp.mp3"
    },
    {
        "id": "song-005",
        "title": "Ocean Adventures",
        "description": "A calming song about sea creatures and ocean exploration",
        "topics": ["ocean", "sea", "fish", "marine", "water", "exploration"],
        "age_range": [5, 10],
        "duration_sec": 210,
        "filename": "ocean_adventures.mp3"
    }
]

# Define the metadata for our local story MP3 files
STORY_LIBRARY = [
    {
        "id": "story-001",
        "title": "The Brave Little Turtle",
        "description": "A story about a turtle who overcomes his fears",
        "topics": ["animals", "courage", "ocean", "friendship", "adventure"],
        "age_range": [3, 7],
        "duration_sec": 300,
        "filename": "brave_turtle.mp3"
    },
    {
        "id": "story-002",
        "title": "The Magic Garden",
        "description": "A story about a garden with magical plants and creatures",
        "topics": ["nature", "magic", "plants", "imagination", "discovery"],
        "age_range": [4, 8],
        "duration_sec": 360,
        "filename": "magic_garden.mp3"
    },
    {
        "id": "story-003",
        "title": "Space Explorers",
        "description": "A story about children who travel to different planets",
        "topics": ["space", "planets", "astronomy", "adventure", "science"],
        "age_range": [5, 10],
        "duration_sec": 420,
        "filename": "space_explorers.mp3"
    },
    {
        "id": "story-004",
        "title": "The Friendly Dragon",
        "description": "A story about a misunderstood dragon who makes friends",
        "topics": ["dragons", "friendship", "kindness", "fantasy", "acceptance"],
        "age_range": [4, 9],
        "duration_sec": 330,
        "filename": "friendly_dragon.mp3"
    },
    {
        "id": "story-005",
        "title": "The Curious Caterpillar",
        "description": "A story about a caterpillar's journey to becoming a butterfly",
        "topics": ["insects", "nature", "transformation", "growth", "life cycle"],
        "age_range": [3, 8],
        "duration_sec": 270,
        "filename": "curious_caterpillar.mp3"
    }
]

# Define tool schemas
class StoryPlayerInput(BaseModel):
    topic: str = Field(description="The topic or theme of the story the child wants to hear")
    age: int = Field(description="The child's age (3-10)")
    
class MusicPlayerInput(BaseModel):
    topic: str = Field(description="The topic or theme of the song the child wants to hear")
    age: int = Field(description="The child's age (3-10)")

# Define the tools
class StoryPlayerTool(BaseTool):
    name = "story_player"
    description = "Plays an age-appropriate story for children on a given topic from the library"
    args_schema: Type[BaseModel] = StoryPlayerInput
    
    def _run(self, topic: str, age: int) -> str:
        """Find and play a story on the given topic for a child of the specified age."""
        # Find stories that match the topic and age range
        matching_stories = []
        for story in STORY_LIBRARY:
            # Check if the topic matches any of the story's topics
            topic_match = any(t in topic.lower() for t in story["topics"]) or any(t in story["description"].lower() for t in topic.lower().split())
            # Check if the age is within the story's age range
            age_match = story["age_range"][0] <= age <= story["age_range"][1]
            
            if topic_match and age_match:
                matching_stories.append(story)
        
        # If no exact matches, find stories appropriate for the age
        if not matching_stories:
            for story in STORY_LIBRARY:
                if story["age_range"][0] <= age <= story["age_range"][1]:
                    matching_stories.append(story)
        
        # If still no matches, just pick a random story
        if not matching_stories:
            matching_stories = STORY_LIBRARY
        
        # Select the best matching story
        selected_story = random.choice(matching_stories)
        
        # In a real app, you would play the MP3 file here
        # For now, we'll just return information about the story
        
        return f"""I found the perfect story for you! 📚✨

Title: {selected_story["title"]}

{selected_story["description"]}

[Click here to listen to the story]

This story is {selected_story["duration_sec"] // 60} minutes long and perfect for your age!

Would you like me to tell you more about this story before we start?"""
    
    async def _arun(self, topic: str, age: int) -> str:
        """Async version of _run"""
        return self._run(topic, age)

class MusicPlayerTool(BaseTool):
    name = "music_player"
    description = "Plays a fun, catchy song for children on a given topic from the library"
    args_schema: Type[BaseModel] = MusicPlayerInput
    
    def _run(self, topic: str, age: int) -> str:
        """Find and play a song on the given topic for a child of the specified age."""
        # Find songs that match the topic and age range
        matching_songs = []
        for song in MUSIC_LIBRARY:
            # Check if the topic matches any of the song's topics
            topic_match = any(t in topic.lower() for t in song["topics"]) or any(t in song["description"].lower() for t in topic.lower().split())
            # Check if the age is within the song's age range
            age_match = song["age_range"][0] <= age <= song["age_range"][1]
            
            if topic_match and age_match:
                matching_songs.append(song)
        
        # If no exact matches, find songs appropriate for the age
        if not matching_songs:
            for song in MUSIC_LIBRARY:
                if song["age_range"][0] <= age <= song["age_range"][1]:
                    matching_songs.append(song)
        
        # If still no matches, just pick a random song
        if not matching_songs:
            matching_songs = MUSIC_LIBRARY
        
        # Select the best matching song
        selected_song = random.choice(matching_songs)
        
        # In a real app, you would play the MP3 file here
        # For now, we'll just return information about the song
        
        return f"""I found the perfect song for you! 🎵✨

Title: {selected_song["title"]}

{selected_song["description"]}

[Click here to listen to the song]

This song is {selected_song["duration_sec"] // 60} minutes long and perfect for your age!

You can dance and sing along! Would you like to hear another song after this one?"""
    
    async def _arun(self, topic: str, age: int) -> str:
        """Async version of _run"""
        return self._run(topic, age)

# Main KidLearn agent with tools
def create_kidlearn_agent():
    """Create the main KidLearn agent with story and music player tools."""
    # Initialize the LLM
    llm = ChatAnthropic(model="claude-3-7-sonnet-20250219")
    
    # Create the tools
    tools = [
        StoryPlayerTool(),
        MusicPlayerTool()
    ]
    
    # Bind tools to the LLM
    llm_with_tools = llm.bind_tools(tools)
    
    return llm_with_tools

# Main function to run the KidLearn agent
def run_kidlearn_multiagent(
    user_input: str, 
    messages: List[Dict[str, str]],
    user_id: str = "default_user",
    child_age: int = 7,
    character_persona: str = "Bluey"
) -> Dict[str, Any]:
    """
    Run the KidLearn agent with tools.
    
    Args:
        user_input: The user's message
        messages: The conversation history
        user_id: The user's ID
        child_age: The child's age
        character_persona: The character persona
        
    Returns:
        The updated state with the agent's response
    """
    # Create the agent
    agent = create_kidlearn_agent()
    
    # Convert messages to the format expected by LangChain
    history = []
    for msg in messages:
        if msg.get("role") == "user":
            history.append(HumanMessage(content=msg["content"]))
        elif msg.get("role") == "assistant":
            history.append(AIMessage(content=msg["content"]))
    
    # Add the system message
    system_message = f"""You are KidLearn, an educational AI assistant for children ages 3-10. 
    You're currently embodying the character of {character_persona}.
    
    The child you're talking to is {child_age} years old.
    
    You have these special abilities:
    1. You can play engaging stories using the story_player tool
    2. You can play fun songs using the music_player tool
    
    Always keep your responses:
    - Age-appropriate for a {child_age}-year-old
    - Educational but fun
    - Positive and encouraging
    - In the voice of {character_persona}
    
    When the child asks for a story or song, use the appropriate tool rather than creating it yourself.
    """
    
    history.insert(0, SystemMessage(content=system_message))
    
    # Add the user's message
    history.append(HumanMessage(content=user_input))
    
    # Generate the response
    response = agent.invoke(history)
    
    # Format the result
    result = {
        "messages": messages + [
            {"role": "user", "content": user_input},
            {"role": "assistant", "content": response.content}
        ]
    }
    
    return result 