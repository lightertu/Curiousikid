import os
import time
import logging
from typing import List, Dict, Any
import anthropic
from anthropic.types import TextBlock
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from mem0 import MemoryClient
from mem0 import Memory
from langchain_community.utilities import SearxSearchWrapper
from langchain_core.tools import Tool
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("kidlearn.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("KidLearn")

class KidLearnEducationalAI:
    def __init__(self, anthropic_api_key: str = None, mem0_api_key: str = None, searxng_host: str = None):
        """
        Initialize the KidLearn Educational AI with Mem0 for memory and SearxNG for educational content.
        
        Args:
            anthropic_api_key: API key for Anthropic (defaults to env var)
            mem0_api_key: API key for Mem0 (defaults to env var)
            searxng_host: Host URL for SearxNG instance (defaults to env var)
        """
        logger.info("Initializing KidLearn Educational AI")
        
        # Get API keys from parameters or environment variables
        self.anthropic_api_key = anthropic_api_key or os.getenv("ANTHROPIC_API_KEY")
        self.mem0_api_key = mem0_api_key or os.getenv("MEM0_API_KEY")
        self.searxng_host = searxng_host or os.getenv("SEARXNG_HOST")
        
        if not self.anthropic_api_key:
            logger.error("No Anthropic API key provided")
            raise ValueError("Anthropic API key is required")
        
        if not self.mem0_api_key:
            logger.error("No Mem0 API key provided")
            raise ValueError("Mem0 API key is required")
        
        if not self.searxng_host:
            logger.warning("No SearxNG host provided, using default")
            self.searxng_host = "https://searx.thegpm.org"
        
        # Set environment variables
        os.environ["ANTHROPIC_API_KEY"] = self.anthropic_api_key
        os.environ["MEM0_API_KEY"] = self.mem0_api_key
        
        # Initialize components
        try:
            self.anthropic_client = anthropic.Anthropic(api_key=self.anthropic_api_key)
            logger.info("Anthropic client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Anthropic client: {str(e)}")
            raise
        
        try:
            # Initialize Mem0 client with API key
            # Note: org_id and project_id can be added as environment variables if needed
            # Create memory config with custom prompt
            # Custom prompt for extracting child interests and developmental indicators
            custom_prompt = """
            Please analyze this child's message to extract:
            1. Explicit interests (topics they directly ask about)
            2. Implicit interests (topics they seem curious about but don't directly ask)
            3. Developmental indicators (language skills, reasoning, creativity, etc.)
            4. Emotional state (excited, curious, confused, etc.)
            
            Here are some examples:
            Please analyze this child's message to extract key facts as concise entities, topics, or short behavioral phrases. Return the analysis in JSON format as shown below:

            Input: I like dinosaurs.
            Output: {{"facts": ["dinosaurs"]}}

            Input: Why is the sky blue? Is it because of magic?
            Output: {{"facts": ["sky", "colors", "magic", "asking why", "natural phenomena"]}}

            Input: I don't want to learn about math. It's boring.
            Output: {{"facts": ["math aversion", "boredom"]}}

            Input: I made a rocket ship yesterday with my blocks. It went to Mars!
            Output: {{"facts": ["rockets", "blocks", "Mars", "building", "imaginative play"]}}

            Return the analysis in JSON format as shown above.
            """
            config = {
                    "vector_store": {
                        "provider": "qdrant",
                        "config": {
                            "host": "localhost",
                            "port": 6333,
                        },
                    }, 
                "llm": {
                    "provider": "openai",
                    "config": {
                        "model": "gpt-4o",
                        "temperature": 0.2,
                        "max_tokens": 2000,
                    }
                },
                "custom_prompt": custom_prompt,
                "version": "v1.1"
            }
            self.mem0 = Memory.from_config(config_dict=config)
            logger.info("Mem0 client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Mem0 client: {str(e)}")
            raise
        
        # Initialize SearxNG search wrapper for educational content
        try:
            self.search_wrapper = SearxSearchWrapper(searx_host=self.searxng_host)
            self.tools = [
                Tool(
                    name="EducationalSearch",
                    func=self.search_wrapper.run,
                    description="Useful for finding age-appropriate educational content, facts, and information for children."
                )
            ]
            logger.info(f"SearxNG search wrapper initialized with host: {self.searxng_host}")
        except Exception as e:
            logger.error(f"Failed to initialize SearxNG search wrapper: {str(e)}")
            raise
        
        # Create the system prompt for KidLearn
        logger.info("Setting up system prompt")
        self.system_prompt = """# KidLearn: Your Educational Guide for Kids Ages 3-11

## Your Core Mission
You are KidLearn, an educational companion designed to inspire curiosity and a love of learning in children ages 3-11. Your approach balances education with engagement, providing accurate information in a friendly, approachable way that makes learning exciting.

## ⭐ YOUR GUIDING PRINCIPLES ⭐
- Balance EDUCATION with ENGAGEMENT - learning should be fun but substantive
- Be FRIENDLY and ENCOURAGING without using a specific character persona
- Focus on CURIOSITY-DRIVEN learning that follows the child's interests
- Provide AGE-APPROPRIATE explanations and information
- Create MEANINGFUL interactions that build knowledge

## Age-Appropriate Communication

### For Young Learners (3-5 years):
- Use short, clear sentences (5-7 words is ideal)
- Focus on concrete concepts they can relate to
- Use simple vocabulary with occasional new words (with explanation)
- Incorporate gentle repetition of key ideas
- Include visual descriptions: "The butterfly's wings are blue like the sky"
- Use friendly emojis to highlight concepts 🦋🌱🔍

### For Developing Learners (6-7 years):
- Use straightforward language with some complexity
- Connect new information to familiar concepts
- Introduce cause-and-effect relationships
- Share fascinating facts that spark "why" questions
- Encourage observation: "What patterns do you notice?"
- Use emojis that reinforce learning concepts 🧲🌡️🔭

### For Advanced Learners (8-11 years):
- Introduce more complex concepts with clear explanations
- Build on their existing knowledge: "You already know about X, now let's explore Y"
- Share detailed information that respects their intellect
- Encourage critical thinking: "Why do you think this happens?"
- Present multiple perspectives when appropriate
- Use emojis sparingly and purposefully to highlight key points ⚛️🧠🌍

## Educational Engagement Strategies

1. **Start With Questions**: "Have you ever wondered why leaves change colors?"
2. **Use Guided Discovery**: "Let's observe what happens when we mix these colors"
3. **Provide Clear Explanations**: "The sky looks blue because air molecules scatter blue light more than other colors"
4. **Connect to Real Life**: "This is like when you feel the warmth of sunshine on your skin"
5. **Scaffold Learning**: Build from what they know to new concepts
6. **Encourage Reflection**: "What did you notice about how the water changed?"
7. **Balance Facts with Wonder**: Provide accurate information while maintaining a sense of awe

## Educational Tools

1. **Curiosity Hooks**: "One of the most amazing things about space is..."
2. **Knowledge Builders**: "First we need to understand X, which helps explain Y"
3. **Thinking Prompts**: "What might happen if we changed this one thing?"
4. **Positive Reinforcement**: "That's a thoughtful observation! Let's explore that more"
5. **Gentle Redirection**: "That's an interesting idea. Another way to think about it is..."
6. **Learning Extensions**: "Now that you know this, you might be curious about..."
7. **Interactive Elements**: "Can you count the sides on this shape with me?"

## CRITICAL RULES

1. DO NOT adopt a specific character voice (like Bluey or any TV character)
2. DO NOT use catchphrases like "For real life!" or character-specific language
3. ALWAYS prioritize educational content while keeping responses engaging
4. RESPOND to emotional states (like boredom or sadness) with empathy AND learning opportunities
5. ANSWER factual questions (like "Why is the sky blue?") with age-appropriate but accurate scientific explanations
6. KEEP responses concise (3-5 sentences for young children, 4-7 for older)
7. USE simple language but DON'T talk down to children
8. INCLUDE an engaging question or prompt at the end of most responses
9. USE emojis purposefully to highlight concepts, not just for decoration
10. BALANCE fun with substance - every interaction should have educational value
11. ADAPT your tone to match the child's energy while maintaining your educational role

When responding to factual questions:
- Start with a clear, direct answer
- Explain using age-appropriate concepts
- Add a fascinating detail to spark further curiosity
- End with a follow-up question that extends the learning

When responding to emotional statements:
- Acknowledge the feeling with empathy
- Offer a constructive way to address the emotion
- Transition to a learning opportunity related to their interests
- Suggest an engaging activity with educational value

- DO NOT MENTION THEIR AGE IN YOUR RESPONSE. BE VERY VERY HUMAN AND NATURAL LIKE HOW YOU WOULD TALK TO A KID.
Remember: You are their trusted guide to discovering the wonders of the world through learning! And remember to be a good friend and guide to the child by embracing the persona of the character you are given."""
        
        # Create the prompt template
        self.prompt = ChatPromptTemplate.from_messages([
            SystemMessage(content=self.system_prompt),
            MessagesPlaceholder(variable_name="context"),
            MessagesPlaceholder(variable_name="chat_history"),
            HumanMessage(content="{input}")
        ])
        
        logger.info("KidLearn Educational AI initialization complete")
    
    def get_anthropic_response(
            self,
            prompt_data,
            temperature=0.7,
            model="claude-3-7-sonnet-20250219",
            stream_handler=None
        ) -> str | None:
        """
        Get a response from Claude using the Anthropic API.
        
        Args:
            prompt_data: The text prompt to send to Claude
            temperature: Controls randomness (0-1)
            model: The Claude model to use
            stream_handler: Optional callback function for streaming responses
            
        Returns:
            The complete response text, or None if an error occurred
        """
        logger.info(f"Generating response with model: {model}, temperature: {temperature}")
        
        # Prepare the message content
        content = []

        # Add the text prompt
        content.append({"type": "text", "text": prompt_data})

        max_retries = 5
        retry_count = 0

        while retry_count <= max_retries:
            try:
                # If a stream handler is provided, use streaming mode
                if stream_handler:
                    logger.info("Using streaming mode for response generation")
                    full_response = ""
                    
                    # Stream the response
                    with self.anthropic_client.messages.stream(
                        model=model,
                        max_tokens=4096,
                        temperature=temperature,
                        messages=[{"role": "user", "content": content}],
                    ) as stream:
                        for text in stream.text_stream:
                            # Call the stream handler with each chunk of text
                            if stream_handler:
                                stream_handler(text)
                            # Also accumulate the full response
                            full_response += text
                    
                    logger.info(f"Streaming response completed, total length: {len(full_response)} characters")
                    return full_response
                
                # Non-streaming mode
                else:
                    logger.debug(f"Sending request to Anthropic API (attempt {retry_count+1}/{max_retries+1})")
                    start_time = time.time()
                    message = self.anthropic_client.messages.create(
                        model=model,
                        max_tokens=4096,
                        temperature=temperature,
                        messages=[{"role": "user", "content": content}],
                    )
                    end_time = time.time()
                    logger.info(f"Anthropic API response received in {end_time - start_time:.2f} seconds")
                    
                    # Return the response text
                    generated_content = message.content[0]
                    if hasattr(generated_content, 'text'):
                        logger.debug("Successfully extracted text from response")
                        return generated_content.text
                    else:
                        logger.warning("Response did not contain expected text attribute")
                        return "I'm sorry, I couldn't generate a proper response."

            except anthropic.RateLimitError:
                logger.warning(f"Rate limit error encountered (attempt {retry_count+1}/{max_retries+1})")
                if retry_count == max_retries:
                    logger.error("Max retries reached for rate limit error")
                    raise
                wait_time = 1 + retry_count * retry_count
                logger.info(f"Waiting {wait_time} seconds before retry")
                time.sleep(wait_time)
                retry_count += 1

            except anthropic.AuthenticationError:
                logger.error("Authentication Error: Invalid API key")
                return "I'm having trouble connecting to my knowledge base. Please ask a parent to check my settings."

            except anthropic.APIError as e:
                logger.error(f"API Error: {str(e)}")
                return "I'm having a bit of trouble thinking right now. Let's try again in a moment!"

            except Exception as e:
                logger.error(f"Unexpected error in get_anthropic_response: {str(e)}", exc_info=True)
                return "Something unexpected happened. Let's try a different question!"
    
    def _get_context(self, input_data: Dict[str, Any]) -> List[Dict]:
        """Retrieve relevant context from Mem0"""
        query = input_data["input"]
        user_id = input_data.get("user_id", "default_user")
        child_age = input_data.get("child_age", None)
        
        logger.info(f"Retrieving context for user_id: {user_id}, child_age: {child_age}")
        
        # Search for relevant memories using v2 API
        try:
            # If no results, get the most recent memories for this user
            logger.info("No search results found, retrieving recent memories")
            memories = self.mem0.get_all(user_id=user_id)["results"]
            
            logger.info(f"Retrieved {len(memories)} memories from Mem0")
        except Exception as e:
            logger.error(f"Error retrieving memories from Mem0: {str(e)}")
            memories = []
        
        context_messages = []
        
        # Add age-specific context if available
        if child_age:
            age_group = self._determine_age_group(child_age)
            context_messages.append(
                SystemMessage(content=f"The child is {child_age} years old, in the {age_group} age group. Adapt your communication style and content accordingly.")
            )
            logger.debug(f"Added age context: {child_age} years old, {age_group} age group")
        
        if memories:
            print("memories: ", memories)
            # Format memories as context messages
            # Adjust this based on the actual structure of memories returned by Mem0 v2 API
            if isinstance(memories[0], dict) and "memory" in memories[0]:
                # Old format
                serialized_memories = ' '.join([mem["memory"] for mem in memories])
            else:
                # New v2 format - adjust this based on the actual structure
                serialized_memories = ' '.join([str(mem) for mem in memories])
            
            context_messages.append(
                SystemMessage(content=f"Relevant information from past interactions: {serialized_memories}")
            )
            logger.debug("Added memory context from past interactions")
            
            # Extract interests and topics from memories
            interests = self._extract_interests(memories)
            if interests:
                context_messages.append(
                    SystemMessage(content=f"The child has shown interest in these topics: {', '.join(interests)}")
                )
                logger.debug(f"Added interest context: {', '.join(interests)}")
        
        logger.info(f"Generated {len(context_messages)} context messages")
        return context_messages
    
    def _determine_age_group(self, age: int) -> str:
        """Determine the age group based on the child's age"""
        if 3 <= age <= 5:
            return "younger children (3-5)"
        elif 6 <= age <= 7:
            return "middle range (6-7)"
        elif 8 <= age <= 10:
            return "older children (8-10)"
        else:
            return "unknown"
    
    def _extract_interests(self, memories: List[Dict]) -> List[str]:
        """Extract potential interests from memories"""
        interests = set()
        interest_keywords = [
            "like", "love", "favorite", "enjoy", "interested", "curious", "wonder", 
            "dinosaur", "space", "animal", "plant", "science", "math", "art", "music",
            "story", "book", "game", "puzzle", "build", "create", "explore"
        ]
        
        for memory in memories:
            memory_text = memory["memory"].lower()
            for keyword in interest_keywords:
                if keyword in memory_text:
                    # Simple extraction - could be improved with NLP
                    interests.add(keyword)
        
        logger.debug(f"Extracted interests: {list(interests)}")
        return list(interests)
    
    def _get_chat_history(self, input_data: Dict[str, Any]) -> List[Dict]:
        """Retrieve chat history"""
        return input_data.get("history", [])
    
    def _use_search_tool(self, query: str) -> str:
        """Use the SearxNG search tool to find educational information"""
        logger.info(f"Using search tool for query: {query}")
        try:
            # Add kid-friendly focus to the search query
            educational_query = f"simple fun facts for kids about: {query}"
            logger.debug(f"Modified search query: {educational_query}")
            
            start_time = time.time()
            search_result = self.search_wrapper.run(educational_query)
            end_time = time.time()
            
            logger.info(f"Search completed in {end_time - start_time:.2f} seconds")
            logger.debug(f"Search result length: {len(search_result)} characters")
            
            # If the search result is too long, truncate it to the most relevant parts
            if len(search_result) > 1500:
                logger.info("Search result too long, truncating to 1500 characters")
                search_result = search_result[:1500] + "..."
            
            # If search result is empty or too short, try a more kid-friendly search
            if len(search_result) < 50:
                logger.info("Search result too short, trying more kid-friendly search")
                general_query = f"explain {query} to a 5 year old child"
                search_result = self.search_wrapper.run(general_query)
                
                # If still too short, try one more approach
                if len(search_result) < 50:
                    logger.info("Still insufficient results, trying fun approach")
                    final_query = f"fun facts about {query} for kindergarten kids"
                    search_result = self.search_wrapper.run(final_query)
            
            return search_result
        except Exception as e:
            logger.error(f"Error using search tool: {str(e)}", exc_info=True)
            return f"Error using search tool: {str(e)}"
    
    def save_interaction(self, user_id: str, user_input: str, assistant_response: str):
        """Save the interaction to Mem0 with custom analysis of child's interests and behaviors"""
        logger.info(f"Saving interaction for user_id: {user_id}")
        try:
            # Store the interaction with metadata
            text = user_input  # The text to analyze is the user's input
            
            self.mem0.add(text, user_id="alice")
            

            logger.info("Interaction saved successfully with interest analysis")
        except Exception as e:
            logger.error(f"Error saving interaction to Mem0: {str(e)}")
    
    def chat(self, user_input: str, user_id: str = "default_user", child_age: int = None, history: List = None, personalization: str = None, stream_handler=None, persona: str = "Explorer", store_in_mem0: bool = True) -> str:
        """
        Process a single chat turn with the educational AI.
        
        Args:
            user_input: The user's message
            user_id: Identifier for the user (for memory retrieval)
            child_age: Age of the child (3-10)
            history: Optional chat history
            personalization: Additional personalization context about the child
            stream_handler: Optional callback function for streaming responses
            persona: The character persona to use (Explorer, Scientist, etc.)
            store_in_mem0: Whether to store the interaction in Mem0
            
        Returns:
            The assistant's educational response
        """
        logger.info(f"Processing chat for user_id: {user_id}, child_age: {child_age}, persona: {persona}")
        logger.debug(f"User input: {user_input}")
        
        if history is None:
            history = []
        
        # Always use search for educational content - make it mandatory
        logger.info("Using search tool to find educational content")
        search_result = self._use_search_tool(user_input)
        
        # Add search result to context
        if search_result:
            history.append(SystemMessage(content=f"Educational information from search: {search_result}"))
            logger.debug("Added search results to context")
        else:
            logger.warning("No search results found")
            history.append(SystemMessage(content="No specific educational information found from search. Provide a general educational response based on your knowledge."))
        
        # Build the full prompt
        logger.info("Building context for prompt")
        context = self._get_context({"input": user_input, "user_id": user_id, "child_age": child_age})
        
        # Format the prompt for Anthropic
        formatted_prompt = f"{self.system_prompt}\n\n"
        
        
        formatted_prompt += str(persona)
        logger.debug(f"Added persona instructions for: {persona}")
        
        # Add personalization context if available
        if personalization:
            formatted_prompt += f"PERSONALIZATION: {personalization}\n\n"
            logger.debug(f"Added personalization context: {personalization}")
        
        # Add context
        if context:
            for ctx in context:
                formatted_prompt += f"CONTEXT: {ctx.content}\n\n"
        
        # Add chat history
        if history:
            formatted_prompt += "PREVIOUS CONVERSATION:\n"
            for msg in history:
                if isinstance(msg, HumanMessage):
                    formatted_prompt += f"Child: {msg.content}\n"
                elif isinstance(msg, AIMessage):
                    formatted_prompt += f"KidLearn: {msg.content}\n"
                elif isinstance(msg, SystemMessage):
                    formatted_prompt += f"[System note: {msg.content}]\n"
            formatted_prompt += "\n"
            logger.debug(f"Added {len(history)} history messages to prompt")
        
        # Add specific instructions for response length based on child's age
        if child_age and 3 <= child_age <= 5:
            formatted_prompt += """RESPONSE GUIDELINES: 
- Keep your response SUPER SHORT - maximum 3-4 sentences total
- Use only words a 3-5 year old would know
- Include at least one emoji or fun sound effect
- End with a VERY simple question or choice
- Focus on just ONE simple idea
- Make it FUN and PLAYFUL!
"""
        elif child_age and 6 <= child_age <= 10:
            formatted_prompt += """RESPONSE GUIDELINES:
- Keep your response SHORT - maximum 5-6 sentences total
- Use simple words a 6-10 year old would understand
- Include fun examples or comparisons
- End with an engaging question or choice between two topics
- Suggest a simple imagination activity
- Make it EXCITING and ADVENTUROUS!
"""
        else:
            formatted_prompt += """RESPONSE GUIDELINES:
- Keep your response VERY SHORT and SIMPLE
- Use basic vocabulary only
- Make it FUN and PLAYFUL
- End with a question or choice
- Include at least one emoji or sound effect
"""
        
        # Add the current user input
        formatted_prompt += f"Child: {user_input}\n\nKidLearn:"
        
        # Generate response using Anthropic
        logger.info("Generating response using Anthropic")
        response = self.get_anthropic_response(
            formatted_prompt, 
            stream_handler=stream_handler
        )
        
        if not response:
            logger.warning("No response received from Anthropic, using fallback")
            response = "I'm sorry, I'm having trouble thinking right now. Let's try a different question!"
        else:
            logger.info(f"Generated response of length: {len(response)} characters")
            logger.debug(f"Response preview: {response[:100]}...")
        
        # Save interaction to Mem0 only if requested
        if store_in_mem0:
            self.save_interaction(user_id, user_input, response)
        
        # We don't need to update history here since it's managed by the Streamlit app
        
        return response

def main():
    """Main function to run the educational AI interface"""
    logger.info("Starting KidLearn CLI interface")
    
    # Get API keys from environment or configuration
    anthropic_api_key = os.getenv("ANTHROPIC_API_KEY", "your-anthropic-api-key")
    mem0_api_key = os.getenv("MEM0_API_KEY", "your-mem0-api-key")
    searxng_host = os.getenv("SEARXNG_HOST", "http://your-searxng-instance.com")
    
    # Initialize the educational AI
    try:
        logger.info("Initializing KidLearn Educational AI")
        kidlearn_ai = KidLearnEducationalAI(
            anthropic_api_key=anthropic_api_key,
            mem0_api_key=mem0_api_key,
            searxng_host=searxng_host
        )
    except Exception as e:
        logger.error(f"Failed to initialize KidLearn AI: {str(e)}", exc_info=True)
        print("Error initializing KidLearn. Check the log file for details.")
        return
    
    # Chat history
    history = []
    
    print("Welcome to KidLearn! I'm here to explore and learn with you.")
    user_id = input("Parent: Please enter a user ID for your child: ")
    logger.info(f"Session started for user_id: {user_id}")
    
    try:
        child_age = int(input("Parent: How old is your child? (3-10): "))
        if not (3 <= child_age <= 10):
            logger.warning(f"Invalid age provided: {child_age}, setting to default")
            print("Age must be between 3 and 10. Setting to default age 7.")
            child_age = 7
    except ValueError:
        logger.warning("Non-numeric age provided, setting to default")
        print("Invalid age. Setting to default age 7.")
        child_age = 7
    
    logger.info(f"Child age set to: {child_age}")
    print("\nKidLearn is ready! Your child can start asking questions or talking about what they're interested in learning.")
    
    while True:
        user_input = input("Child: ")
        if user_input.lower() in ['quit', 'exit', 'bye', 'goodbye']:
            logger.info("Session ended by user")
            print("KidLearn: It was wonderful learning with you today! Remember to keep being curious!")
            break
        
        logger.info(f"Processing user input: {user_input}")
        response = kidlearn_ai.chat(user_input, user_id, child_age, history)
        print(f"KidLearn: {response}")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        logger.critical(f"Unhandled exception in main: {str(e)}", exc_info=True)
        print("An unexpected error occurred. Please check the log file for details.")
