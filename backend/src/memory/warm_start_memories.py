#!/usr/bin/env python3
import logging
import argparse
import asyncio
import json
from typing import List, Dict, Any, Optional
from mem0 import AsyncMemoryClient, MemoryClient
import os

os.environ["MEM0_API_KEY"] = 'm0-JArwz5d9X6akBZLB9GiKL756KKxjmUv2UTElGNPc'

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger(__name__)

# Questionnaire data
questions_and_templates = [
    # Basic Information (Essential)
    ("Child's first name:", "Child's name is {answer}"),
    ("Child's age:", "{name} is {answer} years old"),
    ("What name does your child prefer to be called?", "{name} prefers to be called {answer} by friends and family"),
    ("Does your child have any siblings? If so, what are their names and ages?", "{name} has {answer}"),
    
    # Reading & Story Preferences (Core for story companion)
    ("What are 2-3 of your child's favorite books or stories?", 
     "{name}'s favorite books include {answer}"),
    ("Who are some of your child's favorite story characters?", 
     "{name} loves characters who are {answer}"),
    ("What type of stories does your child enjoy most? (adventure, fantasy, funny, animals, etc.)", 
     "{name} enjoys {answer} stories"),
    ("What reading level is most comfortable for your child right now?", 
     "{name} is a {answer}"),
    ("How does your child typically react to different story moments? (excited at action, emotional at sad parts, etc.)",
     "{name} typically {answer} when listening to stories"),
    
    # Personal Interests & Experiences
    ("What are 1-2 of your child's favorite activities or hobbies?", 
     "{name}'s favorite activity is {answer}"),
    ("Does your child participate in any regular activities or classes?", 
     "{name} {answer}"),
    ("Does your child have any pets? If so, what kind and what are their names?", 
     "{name} has a pet {answer}"),
    ("What's something your child has recently been excited about?", 
     "{name} recently got excited about {answer}"),
    ("What's something your child is proud of accomplishing?", 
     "{name} is proud that {answer}"),
    ("Does your child have a favorite place they like to visit?", 
     "{name} loves visiting {answer}"),
    
    # Conversation & Learning Style
    ("How would you describe your child's conversation style? (talkative, thoughtful, curious, etc.)", 
     "{name} is generally {answer} in conversations"),
    ("What questions does your child often ask?", 
     "{name} often asks questions about {answer}"),
    ("What helps your child feel comfortable in conversations with new people?", 
     "{name} feels comfortable talking to new people when {answer}"),
    ("How does your child typically express excitement?", 
     "{name} expresses excitement by {answer}"),
    ("What topics can hold your child's attention for a long time?", 
     "{name} can focus for a long time on topics related to {answer}"),
    
    # Support Preferences
    ("What words or phrases does your child find confusing or difficult?", 
     "{name} sometimes finds {answer} confusing"),
    ("What strategies help when your child feels frustrated or confused?", 
     "{name} responds well to {answer} when feeling confused"),
    ("What type of encouragement or feedback works best for your child?", 
     "{name} responds best to {answer}"),
    ("What questions or topics would your child especially enjoy discussing about stories?", 
     "{name} especially enjoys discussing {answer} in stories"),
    
    # Special Occasions & Recent Experiences
    ("Does your child have any upcoming special events or recent experiences?", 
     "{name}'s {answer}"),
    ("Is there a recent family experience your child might mention?", 
     "{name}'s family recently {answer}"),
    ("What recent accomplishment is your child proud of?", 
     "{name} recently learned to {answer}"),
    
    # Additional Information
    ("What helps your child stay engaged during longer conversations?", 
     "{name} stays engaged better when {answer}"),
    ("Is there anything that might make your child uncomfortable in conversations?", 
     "{name} might feel uncomfortable if {answer}"),
    ("Is there anything else that would help create a better story experience for your child?", 
     "{name} {answer}")
]

def generate_memories(answers: List[str], child_name: str) -> List[str]:
    """
    Generate memory strings from questionnaire answers
    
    Args:
        answers: List of answers in the same order as questions_and_templates
        child_name: The child's name
        
    Returns:
        List of memory strings
    """
    memories = []
    
    for i, (question, template) in enumerate(questions_and_templates):
        if i < len(answers) and answers[i]:  # If answer exists and is not empty
            # Format the memory string
            memory = template.format(
                name=child_name,
                answer=answers[i]
            )
            memories.append(memory)
    
    return memories

async def add_memories_to_mem0(
    memories: List[str], 
    user_id: str,
    infer: bool = False
) -> None:
    """
    Add memories to mem0 for a specific user
    
    Args:
        memories: List of memory strings to add
        user_id: The user ID to associate memories with
        infer: Whether to enable inference on memory addition
    """
    mem0_client = AsyncMemoryClient(api_key=os.getenv("MEM0_API_KEY"))
    
    for memory in memories:
        try:
            # Format memory according to mem0's expected structure
            formatted_memory = [{
                "role": "user",
                "content": memory,
            }]
            
            # Add the memory
            logger.info(f"Adding memory: {memory}")
            await mem0_client.add(
                formatted_memory,
                user_id=user_id,
                infer=False
            )
            
        except Exception as e:
            logger.error(f"Failed to add memory: {e}")

def load_answers_from_file(file_path: str) -> Dict[str, Any]:
    """
    Load questionnaire answers from a JSON file
    
    Args:
        file_path: Path to the JSON file
        
    Returns:
        Dictionary with user_id, child_name, and answers
    """
    with open(file_path, 'r') as f:
        data = json.load(f)
    
    return data

def display_memories(user_id: str) -> None:
    """
    Display all memories for a user
    
    Args:
        user_id: The user ID to retrieve memories for
    """
    try:
        mem0_client = MemoryClient()
        memories = mem0_client.get_all(user_id=user_id)
        
        if not memories:
            logger.info(f"No memories found for user {user_id}")
            return
        
        logger.info(f"Found {len(memories)} memories for user {user_id}:")
        
        for i, memory in enumerate(memories, 1):
            # Extract content based on structure returned by mem0
            if hasattr(memory, 'content') and memory.content:
                # New structure - mem0 v2
                content = memory.content[0]["content"] if isinstance(memory.content, list) else str(memory.content)
            else:
                # Fallback to string representation
                content = str(memory)
                
            logger.info(f"Memory {i}: {content}")
            
    except Exception as e:
        logger.error(f"Error retrieving memories: {e}")

async def main(args):
    """Main function to warm start memories"""
    if args.display:
        # Only display memories
        display_memories(args.user_id)
        return
        
    if args.file:
        # Load data from file
        data = load_answers_from_file(args.file)
        user_id = data.get('user_id')
        child_name = data.get('child_name')
        answers = data.get('answers', [])
    else:
        # Use command line arguments
        user_id = args.user_id
        child_name = args.child_name
        answers = args.answers if args.answers else []
    
    if not user_id:
        logger.error("User ID is required")
        return
    
    if not child_name:
        logger.error("Child name is required")
        return
    
    # Generate memories from answers
    memories = generate_memories(answers, child_name)
    logger.info(f"Generated {len(memories)} memories")
    
    # Add memories to mem0
    await add_memories_to_mem0(memories, user_id, False)
    logger.info(f"Added {len(memories)} memories for user {user_id}")
    
    # Display memories if requested
    if args.display_after:
        display_memories(user_id)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Warm start memories from questionnaire answers")
    parser.add_argument("--user-id", type=str, help="User ID to associate memories with")
    parser.add_argument("--child-name", type=str, help="Child's name for memory formatting")
    parser.add_argument("--answers", type=str, nargs="+", help="List of answers to the questionnaire")
    parser.add_argument("--file", type=str, help="Path to JSON file with answers")
    parser.add_argument("--infer", action="store_true", help="Enable inference when adding memories")
    parser.add_argument("--display", action="store_true", help="Only display memories for the specified user_id")
    parser.add_argument("--display-after", action="store_true", help="Display memories after adding them")
    
    args = parser.parse_args()
    asyncio.run(main(args)) 