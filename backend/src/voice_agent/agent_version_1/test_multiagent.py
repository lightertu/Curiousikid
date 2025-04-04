import os
from dotenv import load_dotenv
from kidlearn_multiagent import run_kidlearn_multiagent

# Load environment variables
load_dotenv()

# Add at the top of the file, after loading dotenv
os.environ["KIDLEARN_TEST_MODE"] = "true"

def test_multiagent():
    """Test the KidLearn multi-agent system with different queries."""
    
    # Test case 1: General educational query (should route to kidlearn)
    print("=== Test Case 1: General Educational Query ===")
    messages = []
    result = run_kidlearn_multiagent(
        user_input="Why is the sky blue?",
        messages=messages,
        user_id="test_user",
        child_age=7,
        character_persona="Explorer"
    )
    print(f"Response: {result['messages'][-1]['content']}\n")
    
    # Test case 2: Story request (should route to storyteller)
    print("=== Test Case 2: Story Request ===")
    messages = []
    result = run_kidlearn_multiagent(
        user_input="Tell me a story about dinosaurs",
        messages=messages,
        user_id="test_user",
        child_age=5,
        character_persona="Storyteller"
    )
    print(f"Response: {result['messages'][-1]['content']}\n")
    
    # Test case 3: Music request (should route to music_creator)
    print("=== Test Case 3: Music Request ===")
    messages = []
    result = run_kidlearn_multiagent(
        user_input="Can you sing a song about planets?",
        messages=messages,
        user_id="test_user",
        child_age=8,
        character_persona="Musician"
    )
    print(f"Response: {result['messages'][-1]['content']}\n")
    
    # Test case 4: Interruption during a story
    print("=== Test Case 4: Interruption During a Story ===")
    # Start with a story request
    messages = []
    result = run_kidlearn_multiagent(
        user_input="Tell me a story about space exploration",
        messages=messages,
        user_id="test_user",
        child_age=6,
        character_persona="Storyteller"
    )
    print(f"Initial Story: {result['messages'][-1]['content'][:200]}...\n")
    
    # Now interrupt with a question
    messages = result["messages"]
    result = run_kidlearn_multiagent(
        user_input="Wait, what's a rocket made of?",
        messages=messages,
        user_id="test_user",
        child_age=6,
        character_persona="Explorer"
    )
    print(f"Response to Interruption: {result['messages'][-1]['content']}\n")
    
    # Now ask to continue the story
    messages = result["messages"]
    result = run_kidlearn_multiagent(
        user_input="Thanks! Can you continue the story now?",
        messages=messages,
        user_id="test_user",
        child_age=6,
        character_persona="Storyteller"
    )
    print(f"Resumed Story: {result['messages'][-1]['content'][:200]}...\n")
    
    # Test case 5: Interruption during a song
    print("=== Test Case 5: Interruption During a Song ===")
    # Start with a song request
    messages = []
    result = run_kidlearn_multiagent(
        user_input="Sing a song about animals",
        messages=messages,
        user_id="test_user",
        child_age=4,
        character_persona="Musician"
    )
    print(f"Initial Song: {result['messages'][-1]['content'][:200]}...\n")
    
    # Now interrupt with a question
    messages = result["messages"]
    result = run_kidlearn_multiagent(
        user_input="What sound does a giraffe make?",
        messages=messages,
        user_id="test_user",
        child_age=4,
        character_persona="Explorer"
    )
    print(f"Response to Interruption: {result['messages'][-1]['content']}\n")
    
    # Now ask to continue the song
    messages = result["messages"]
    result = run_kidlearn_multiagent(
        user_input="Can we finish the animal song?",
        messages=messages,
        user_id="test_user",
        child_age=4,
        character_persona="Musician"
    )
    print(f"Resumed Song: {result['messages'][-1]['content'][:200]}...\n")

if __name__ == "__main__":
    test_multiagent()