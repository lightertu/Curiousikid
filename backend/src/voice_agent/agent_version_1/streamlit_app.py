import os
import streamlit as st
import logging
import time
import pandas as pd
import matplotlib.pyplot as plt
import numpy as np
from datetime import datetime, timedelta
from dotenv import load_dotenv
from langchain_chat import KidLearnEducationalAI
import tempfile
import uuid
import openai
import base64
import json
from langchain.schema import HumanMessage, AIMessage
from parent_dashboard import (
    load_cdc_milestones, 
    update_milestone_tracking, 
    update_analytics, 
    get_memories_from_mem0
)

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("kidlearn_app.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("KidLearnApp")

# Define character personas with descriptions and emojis before initializing session state
personas = {
    "Bluey": {
        "emoji": "🐶", 
        "description": "A friendly blue heeler pup who loves games and making everyday life an adventure!",
        "greeting": "G'day mate! I'm KidLearn, your playful pup friend! What fun game should we play today? 🐶"
    },
    "Spider-Man": {
        "emoji": "🕸️", 
        "description": "A super-powered hero who uses amazing spider abilities to help others!",
        "greeting": "Hey there, web friend! I'm KidLearn, your friendly neighborhood learning buddy! What amazing discovery should we swing into today? 🕸️"
    },
    "Elsa": {
        "emoji": "❄️", 
        "description": "A magical ice princess with the power to create snow and ice!",
        "greeting": "Hello! I'm KidLearn, your magical friend with icy cool knowledge! What wonderful things should we learn about today? ❄️"
    },
    "Mario": {
        "emoji": "🍄", 
        "description": "An adventurous plumber who jumps through worlds and solves puzzles!",
        "greeting": "It's-a me, KidLearn! Your adventure buddy! What super question should we jump into today? 🍄"
    },
    "Sonic": {
        "emoji": "⚡", 
        "description": "The fastest hedgehog around who zooms through adventures at lightning speed!",
        "greeting": "Zoom! I'm KidLearn, your super-fast learning friend! What speedy adventure should we race through today? ⚡"
    }
}

# Initialize session state variables
if "messages" not in st.session_state:
    # Get the current persona or use Explorer as default
    current_persona = st.session_state.get("character_persona", "Bluey")
    # Use the persona-specific greeting from the personas dictionary
    greeting = personas.get(current_persona, personas["Bluey"])["greeting"]
    st.session_state.messages = [{"role": "assistant", "content": greeting}]
if "user_id" not in st.session_state:
    st.session_state.user_id = "default_user"
if "child_age" not in st.session_state:
    st.session_state.child_age = 7
if "agent" not in st.session_state:
    st.session_state.agent = None
if "view_mode" not in st.session_state:
    st.session_state.view_mode = "chat"  # Options: "chat", "parent_dashboard"
if "topic_interests" not in st.session_state:
    st.session_state.topic_interests = {}
if "vocabulary" not in st.session_state:
    st.session_state.vocabulary = set()
if "learning_milestones" not in st.session_state:
    st.session_state.learning_milestones = []
if "session_count" not in st.session_state:
    st.session_state.session_count = 1
if "total_interactions" not in st.session_state:
    st.session_state.total_interactions = 0
if "last_dashboard_update" not in st.session_state:
    st.session_state.last_dashboard_update = None
if "openai_client" not in st.session_state:
    st.session_state.openai_client = None
if "character_persona" not in st.session_state:
    st.session_state.character_persona = "Bluey"  # Default persona

# Initialize additional session state variables for milestone tracking
if "developmental_milestones" not in st.session_state:
    st.session_state.developmental_milestones = {
        "social_emotional": {"observed": [], "in_progress": [], "not_yet": []},
        "language": {"observed": [], "in_progress": [], "not_yet": []},
        "cognitive": {"observed": [], "in_progress": [], "not_yet": []},
        "physical": {"observed": [], "in_progress": [], "not_yet": []},
        "creative": {"observed": [], "in_progress": [], "not_yet": []}
    }
if "milestone_observations" not in st.session_state:
    st.session_state.milestone_observations = []
if "developmental_summary" not in st.session_state:
    st.session_state.developmental_summary = ""
if "last_milestone_update" not in st.session_state:
    st.session_state.last_milestone_update = None

logger.info("Session state initialized")

def initialize_agent():
    """Initialize the KidLearn agent with API keys from environment variables"""
    logger.info("Initializing KidLearn agent")
    
    if st.session_state.agent is None:
        # Get API keys from environment variables
        anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
        mem0_api_key = os.getenv("MEM0_API_KEY")
        searxng_host = os.getenv("SEARXNG_HOST")
        openai_api_key = os.getenv("OPENAI_API_KEY")
        print("anthropic_key", anthropic_api_key)
        print("mem0_api_key", mem0_api_key)
        print("searxng_host", searxng_host)
        print("openai_api_key", openai_api_key)

        # Initialize the agent if all required keys are available
        if anthropic_api_key and mem0_api_key and searxng_host:
            try:
                st.session_state.agent = KidLearnEducationalAI(
                    anthropic_api_key=anthropic_api_key,
                    mem0_api_key=mem0_api_key,
                    searxng_host=searxng_host
                )
                logger.info("KidLearn agent initialized successfully")
                
                # Initialize OpenAI client if API key is available
                if openai_api_key:
                    try:
                        st.session_state.openai_client = openai.OpenAI(api_key=openai_api_key)
                        logger.info("OpenAI client initialized successfully")
                    except Exception as e:
                        logger.error(f"Failed to initialize OpenAI client: {str(e)}")
                        st.session_state.audio_enabled = False
                else:
                    logger.warning("OpenAI API key not found, audio features disabled")
                    st.session_state.audio_enabled = False
                
                return True
            except Exception as e:
                logger.error(f"Failed to initialize KidLearn agent: {str(e)}", exc_info=True)
                return False
        else:
            missing_keys = []
            if not anthropic_api_key:
                missing_keys.append("Anthropic API key")
            if not mem0_api_key:
                missing_keys.append("Mem0 API key")
            if not searxng_host:
                missing_keys.append("SearxNG host")
            
            logger.warning(f"Missing required API keys for agent initialization: {', '.join(missing_keys)}")
            return False
    
    logger.info("Using existing KidLearn agent")
    return True

def handle_streaming_response(user_input):
    """Handle streaming response from Anthropic with audio output"""
    # Create a placeholder for the streaming text
    message_placeholder = st.chat_message("assistant").empty()
    audio_placeholder = st.empty()
    full_response = ""
    
    # Define the stream handler function
    def stream_handler(text_chunk):
        nonlocal full_response
        full_response += text_chunk
        
        # Update the text display
        message_placeholder.markdown(full_response)
    
    # Extract the conversation history from session state
    # Format it properly for the agent
    conversation_history = []
    for msg in st.session_state.messages:
        if msg["role"] == "user":
            conversation_history.append(HumanMessage(content=msg["content"]))
        elif msg["role"] == "assistant":
            conversation_history.append(AIMessage(content=msg["content"]))
    
    # Get current persona details
    current_persona = st.session_state.character_persona
    persona_info = personas[current_persona]
    
    # Create a more explicit persona context string
    persona_context = f"You are {current_persona} {persona_info['emoji']}. {persona_info['description']} Always stay in character as {current_persona} when responding. If asked about your identity, confirm you are {current_persona}. Your name is {current_persona}, not KidLearn."
    
    # Get streaming response from agent
    response = st.session_state.agent.chat(
        user_input=user_input,
        user_id=st.session_state.user_id,
        child_age=st.session_state.child_age,
        history=conversation_history,  # Pass the properly formatted history
        stream_handler=stream_handler,
        persona=persona_context,  # Pass the complete persona context as a single string
        store_in_mem0=True  # We are persisting personal knowledge in the mem0 where as using the normal caching in memory for context history
    )
    
    # Add the complete response to messages
    st.session_state.messages.append({"role": "assistant", "content": response})
    
    # Update analytics - FIX: Pass the session_state argument
    update_analytics(user_input, response, st.session_state)
    
    return response

def display_chat_interface():
    """Display the chat interface for the child"""
    # Display chat messages with audio
    for i, message in enumerate(st.session_state.messages):
        with st.chat_message(message["role"]):
            st.markdown(message["content"])
    
    # Chat input
    if prompt := st.chat_input("Ask me anything about the world!"):
        # Add user message to chat history
        st.session_state.messages.append({"role": "user", "content": prompt})
        
        # Display user message
        with st.chat_message("user"):
            st.markdown(prompt)
        
        # Generate and display assistant response with audio
        handle_streaming_response(prompt)

def display_parent_dashboard():
    """Display the parent dashboard with insights and analytics"""
    st.header("Parent Dashboard")
    st.subheader(f"Insights for: {st.session_state.user_id}")
    
    # Create tabs for different dashboard sections
    tabs = st.tabs(["Overview", "Developmental Milestones", "Topic Interests", "Learning Progress", "Interaction History"])
    
    with tabs[0]:
        # Overview tab - key metrics
        col1, col2, col3 = st.columns(3)
        
        with col1:
            st.metric("Total Interactions", st.session_state.total_interactions)
        
        with col2:
            st.metric("Topics Explored", len(st.session_state.topic_interests))
        
        with col3:
            st.metric("Vocabulary Words", len(st.session_state.vocabulary))
        
        # Add CDC resources
        st.subheader("CDC Developmental Resources")
        st.markdown("""
        The CDC's "Learn the Signs. Act Early." program provides resources to help track your child's development:
        
        - [Milestone Tracker App](https://www.cdc.gov/ncbddd/actearly/milestones-app.html)
        - [Developmental Milestone Checklists](https://www.cdc.gov/ncbddd/actearly/freematerials.html)
        - [How to Get Help for Your Child](https://www.cdc.gov/ncbddd/actearly/concerned.html)
        """)
        
        # Display a sample of recent interactions
        st.subheader("Recent Interactions")
        recent_messages = st.session_state.messages[-6:] if len(st.session_state.messages) > 5 else st.session_state.messages
        for message in recent_messages:
            if message["role"] == "user":
                st.markdown(f"**Child:** {message['content']}")
            else:
                st.markdown(f"**KidLearn:** {message['content']}")
    
    with tabs[1]:
        # Developmental Milestones tab
        display_developmental_milestones()
    
    with tabs[2]:
        # Topic Interests tab
        display_topic_interests()
    
    with tabs[3]:
        # Learning Progress tab
        display_learning_progress()
    
    with tabs[4]:
        # Interaction History tab
        display_interaction_history()
    
    # Last updated timestamp
    if st.session_state.last_dashboard_update:
        st.caption(f"Dashboard last updated: {st.session_state.last_dashboard_update}")

def display_topic_interests():
    """Display the Topic Interests tab content"""
    st.subheader("Topic Interests")
    
    if st.session_state.topic_interests:
        # Sort topics by interest level
        sorted_topics = dict(sorted(st.session_state.topic_interests.items(), 
                                   key=lambda item: item[1], reverse=True))
        
        # Create a bar chart
        fig, ax = plt.subplots(figsize=(10, 5))
        topics = list(sorted_topics.keys())
        values = list(sorted_topics.values())
        
        # Limit to top 10 topics if there are many
        if len(topics) > 10:
            topics = topics[:10]
            values = values[:10]
            
        # Create the bar chart
        bars = ax.bar(topics, values, color='skyblue')
        
        # Add labels and title
        ax.set_xlabel('Topics')
        ax.set_ylabel('Engagement Level')
        ax.set_title('Child\'s Topic Interests')
        
        # Rotate x-axis labels for better readability
        plt.xticks(rotation=45, ha='right')
        
        # Add value labels on top of bars
        for bar in bars:
            height = bar.get_height()
            ax.text(bar.get_x() + bar.get_width()/2., height + 0.1,
                    f'{height:.0f}', ha='center', va='bottom')
        
        plt.tight_layout()
        st.pyplot(fig)
        
        # Suggest activities based on interests
        st.subheader("Suggested Activities Based on Interests")
        top_interests = list(sorted_topics.keys())[:3]
        
        for interest in top_interests:
            st.markdown(f"**{interest.title()} Activities:**")
            # Generate activity suggestions based on the interest and age
            if st.session_state.openai_client:
                try:
                    activity_prompt = f"""
                    Suggest 3 age-appropriate activities for a {st.session_state.child_age}-year-old child 
                    who is interested in {interest}. Each activity should:
                    1. Be fun and engaging
                    2. Support developmental milestones
                    3. Be doable at home with minimal materials
                    4. Take 15-30 minutes to complete
                    
                    Format each activity as a bullet point with a title and brief description.
                    """
                    
                    response = st.session_state.openai_client.chat.completions.create(
                        model="gpt-4o",
                        messages=[{"role": "user", "content": activity_prompt}]
                    )
                    
                    st.markdown(response.choices[0].message.content)
                except:
                    st.markdown("- Explore books about this topic at your local library")
                    st.markdown("- Create a drawing or craft project related to this interest")
                    st.markdown("- Have a conversation about what they find most interesting about this topic")
            else:
                st.markdown("- Explore books about this topic at your local library")
                st.markdown("- Create a drawing or craft project related to this interest")
                st.markdown("- Have a conversation about what they find most interesting about this topic")
    else:
        st.info("No topic interests recorded yet. Continue interacting with KidLearn to gather data.")

def display_learning_progress():
    """Display the Learning Progress tab content"""
    st.subheader("Learning Progress")
    
    if st.session_state.learning_milestones:
        # Convert milestones to DataFrame for easier plotting
        df_milestones = pd.DataFrame(st.session_state.learning_milestones)
        
        # Create a line chart
        fig, ax = plt.subplots(figsize=(10, 5))
        ax.plot(df_milestones['interaction_count'], df_milestones['vocabulary_size'], 
                marker='o', linestyle='-', color='green', label='Vocabulary Size')
        ax.plot(df_milestones['interaction_count'], df_milestones['topics_explored'], 
                marker='s', linestyle='-', color='orange', label='Topics Explored')
        
        # Add labels and title
        ax.set_xlabel('Number of Interactions')
        ax.set_ylabel('Count')
        ax.set_title('Learning Progress Over Time')
        ax.legend()
        
        plt.tight_layout()
        st.pyplot(fig)
        
        # Vocabulary list
        if st.session_state.vocabulary:
            with st.expander("Vocabulary Words"):
                # Display in a grid layout
                vocab_list = sorted(list(st.session_state.vocabulary))
                cols = st.columns(3)
                for i, word in enumerate(vocab_list):
                    cols[i % 3].markdown(f"- {word}")
    else:
        st.info("No learning progress data recorded yet. Continue interacting with KidLearn to gather data.")

def display_interaction_history():
    """Display the Interaction History tab content"""
    st.subheader("Interaction History")
    memories = get_memories_from_mem0(st.session_state.agent, st.session_state.user_id)
    
    if memories:
        # Create an expander for each memory
        for i, memory in enumerate(memories):
            # Format timestamp if available
            timestamp = ""
            
            # Safely extract timestamp if memory is a dictionary
            if isinstance(memory, dict):
                timestamp = memory.get('timestamp', '')
                
                # Convert timestamp to readable format if it's a number
                if timestamp and isinstance(timestamp, (int, float)):
                    try:
                        timestamp = datetime.fromtimestamp(timestamp).strftime("%Y-%m-%d %H:%M")
                    except Exception as e:
                        logger.warning(f"Failed to format timestamp: {e}")
                        timestamp = str(timestamp)
            
            # Create memory display with a safe title
            memory_title = f"Interaction {i+1}"
            if timestamp:
                memory_title += f" - {timestamp}"
                
            with st.expander(memory_title):
                if isinstance(memory, dict):
                    if 'user_message' in memory and 'assistant_message' in memory:
                        st.markdown(f"**Child:** {memory['user_message']}")
                        st.markdown(f"**KidLearn:** {memory['assistant_message']}")
                    else:
                        # Fallback for other memory formats
                        st.write(memory)
                else:
                    st.write(str(memory))
    else:
        st.info("No interaction history found for this user ID.")

def display_developmental_milestones():
    """Display the developmental milestones section in the parent dashboard"""
    st.subheader("Developmental Milestones")
    
    if st.session_state.milestone_observations:
        # Display the developmental summary
        if st.session_state.developmental_summary:
            st.markdown("### Development Summary")
            st.markdown(st.session_state.developmental_summary)
        
        # Create tabs for different developmental areas
        tabs = st.tabs(["Social-Emotional", "Language", "Cognitive", "Physical", "Creative"])
        
        # Get milestones for the child's age
        milestone_getter = load_cdc_milestones()
        age_milestones = milestone_getter(st.session_state.child_age)
        
        # Function to display milestones for a category
        def display_category_milestones(category, tab):
            with tab:
                milestones = age_milestones[category]
                
                # Create columns for different status
                col1, col2, col3 = st.columns(3)
                
                with col1:
                    st.markdown("#### Observed")
                    observed = []
                    for obs in st.session_state.milestone_observations:
                        if "analysis" in obs and "observed" in obs["analysis"]:
                            observed.extend([m for m in obs["analysis"]["observed"] 
                                           if category in m.lower()])
                    
                    # Count occurrences of each milestone
                    from collections import Counter
                    observed_counts = Counter(observed)
                    
                    # Display observed milestones
                    for milestone in milestones:
                        count = observed_counts.get(milestone, 0)
                        if count > 0:
                            st.markdown(f"- {milestone} ✓ ({count})")
                
                with col2:
                    st.markdown("#### In Progress")
                    in_progress = []
                    for obs in st.session_state.milestone_observations:
                        if "analysis" in obs and "in_progress" in obs["analysis"]:
                            in_progress.extend([m for m in obs["analysis"]["in_progress"] 
                                              if category in m.lower()])
                    
                    # Count occurrences
                    in_progress_counts = Counter(in_progress)
                    
                    # Display in-progress milestones
                    for milestone in milestones:
                        count = in_progress_counts.get(milestone, 0)
                        if count > 0:
                            st.markdown(f"- {milestone} ⟳ ({count})")
                
                with col3:
                    st.markdown("#### Not Yet Observed")
                    # Display milestones not in observed or in_progress
                    observed_set = set(observed)
                    in_progress_set = set(in_progress)
                    
                    for milestone in milestones:
                        if milestone not in observed_set and milestone not in in_progress_set:
                            st.markdown(f"- {milestone}")
        
        # Display milestones for each category
        display_category_milestones("social_emotional", tabs[0])
        display_category_milestones("language", tabs[1])
        display_category_milestones("cognitive", tabs[2])
        display_category_milestones("physical", tabs[3])
        display_category_milestones("creative", tabs[4])
        
        # Display recent observations
        with st.expander("Recent Developmental Observations"):
            for obs in reversed(st.session_state.milestone_observations[-5:]):
                st.markdown(f"**{obs['timestamp']}**")
                if "analysis" in obs and "observation_notes" in obs["analysis"]:
                    st.markdown(obs["analysis"]["observation_notes"])
                st.divider()
    else:
        st.info("No developmental observations recorded yet. Continue interacting with KidLearn to gather data.")
        
        # Display CDC milestones for the child's age
        milestone_getter = load_cdc_milestones()
        age_milestones = milestone_getter(st.session_state.child_age)
        
        with st.expander(f"CDC Developmental Milestones for Age {st.session_state.child_age}"):
            for category, milestones in age_milestones.items():
                st.markdown(f"**{category.title()}**")
                for milestone in milestones:
                    st.markdown(f"- {milestone}")
                st.divider()

def main():
    """Main function to run the Streamlit app"""
    st.title("KidLearn: Your Personal AI Companion")
    
    # Sidebar for settings and navigation
    with st.sidebar:
        st.header("Settings")
        
        # User ID
        user_id = st.text_input("Child's User ID", value=st.session_state.user_id)
        if user_id != st.session_state.user_id:
            st.session_state.user_id = user_id
            logger.info(f"User ID updated to: {user_id}")
        
        # Child's age
        child_age = st.slider("Child's Age", 3, 10, st.session_state.child_age)
        if child_age != st.session_state.child_age:
            st.session_state.child_age = child_age
            logger.info(f"Child age updated to: {child_age}")
        
        # Character persona selection
        st.subheader("Choose Your Learning Buddy")
        
        # Create columns for persona selection
        cols = st.columns(3)
        selected_persona = None
        
        # Display persona options in a grid
        for i, (persona_name, persona_data) in enumerate(personas.items()):
            col_idx = i % 3
            with cols[col_idx]:
                if st.button(
                    f"{persona_data['emoji']} {persona_name}", 
                    key=f"persona_{persona_name}",
                    use_container_width=True,
                    type="primary" if st.session_state.character_persona == persona_name else "secondary"
                ):
                    selected_persona = persona_name
        
        # Update the persona if a new one was selected
        if selected_persona and selected_persona != st.session_state.character_persona:
            st.session_state.character_persona = selected_persona
            # Reset the first message to use the new persona's greeting
            if len(st.session_state.messages) > 0:
                st.session_state.messages[0] = {
                    "role": "assistant", 
                    "content": personas[selected_persona]["greeting"]
                }
                # If this is the only message, we need to reset the chat
                if len(st.session_state.messages) == 1:
                    st.rerun()
            logger.info(f"Character persona updated to: {selected_persona}")
        
        # Display the current persona description
        current_persona = st.session_state.character_persona
        st.markdown(f"**{personas[current_persona]['emoji']} {current_persona}**")
        st.markdown(personas[current_persona]['description'])
        
        # View mode toggle
        st.subheader("View Mode")
        col1, col2 = st.columns(2)
        
        if col1.button("Child Chat", use_container_width=True, 
                      type="primary" if st.session_state.view_mode == "chat" else "secondary"):
            st.session_state.view_mode = "chat"
        
        if col2.button("Parent Dashboard", use_container_width=True,
                      type="primary" if st.session_state.view_mode == "parent_dashboard" else "secondary"):
            st.session_state.view_mode = "parent_dashboard"
        
        # Clear chat button
        if st.button("Clear Chat History"):
            # Reset with the current persona's greeting
            current_persona = st.session_state.character_persona
            greeting = personas[current_persona]["greeting"]
            st.session_state.messages = [{"role": "assistant", "content": greeting}]
            st.success("Chat history cleared!")
            st.rerun()
        
        # Multi-agent system toggle
        st.subheader("Advanced Features")
        use_multiagent = st.checkbox("Enable Multi-Agent System", value=True)
        if use_multiagent != st.session_state.get("use_multiagent", True):
            st.session_state.use_multiagent = use_multiagent
            logger.info(f"Multi-agent system: {use_multiagent}")
    
    # Initialize the agent
    agent_ready = initialize_agent()
    
    if not agent_ready:
        st.warning("Please check your .env file to ensure all required API keys are set.")
        return
    
    # Display the appropriate view based on mode
    if st.session_state.view_mode == "chat":
        display_chat_interface()
    else:
        display_parent_dashboard()

if __name__ == "__main__":
    main() 