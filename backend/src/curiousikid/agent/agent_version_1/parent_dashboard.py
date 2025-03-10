import logging
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
from collections import Counter

# Configure logging
logger = logging.getLogger("KidLearnApp.Dashboard")

def extract_topics(user_input, response):
    """Extract educational topics from the interaction"""
    # Simple keyword-based topic extraction
    all_text = (user_input + " " + response).lower()
    
    topics = []
    topic_keywords = {
        "animals": ["animal", "pet", "zoo", "wildlife", "species", "mammal", "bird", "fish", "reptile"],
        "space": ["space", "planet", "star", "galaxy", "astronaut", "rocket", "moon", "sun", "solar system"],
        "dinosaurs": ["dinosaur", "fossil", "prehistoric", "jurassic", "triceratops", "t-rex", "paleontology"],
        "oceans": ["ocean", "sea", "marine", "fish", "shark", "whale", "coral", "beach", "tide"],
        "weather": ["weather", "rain", "snow", "sun", "cloud", "storm", "temperature", "climate", "wind"],
        "plants": ["plant", "flower", "tree", "garden", "seed", "leaf", "root", "photosynthesis"],
        "human body": ["body", "heart", "brain", "muscle", "bone", "blood", "organ", "health"],
        "math": ["math", "number", "count", "add", "subtract", "shape", "measure"],
        "art": ["art", "draw", "paint", "color", "create", "craft", "design"],
        "history": ["history", "past", "ancient", "old", "time", "year", "century"],
        "science": ["science", "experiment", "discover", "research", "learn", "observe"]
    }
    
    for topic, keywords in topic_keywords.items():
        if any(keyword in all_text for keyword in keywords):
            topics.append(topic)
    
    return topics

def extract_vocabulary(text):
    """Extract potentially educational vocabulary words from text"""
    # This is a simplified approach - in a real app, you might use NLP
    words = text.lower().split()
    
    # Filter out common words and keep words longer than 5 letters as potential vocabulary
    common_words = {"the", "and", "that", "this", "with", "for", "you", "have", "are", "your"}
    educational_words = {word for word in words if len(word) > 5 and word not in common_words}
    
    return educational_words

def get_memories_from_mem0(agent, user_id):
    """Retrieve memories from Mem0 for the dashboard"""
    if not agent:
        return []
    
    try:
        # Get all memories for this user
        memories = agent.mem0.get_all(user_id=user_id)
        return memories
    except Exception as e:
        logger.error(f"Error retrieving memories from Mem0: {str(e)}")
        return []

def load_cdc_milestones():
    """Load CDC developmental milestones based on age"""
    # This would ideally come from a database or structured file
    # Simplified example based on CDC guidelines
    milestones = {
        # 3 years
        3: {
            "social_emotional": [
                "Takes turns in games", 
                "Shows concern for crying friend",
                "Understands the idea of 'mine' and 'his' or 'hers'"
            ],
            "language": [
                "Follows instructions with 2 or 3 steps",
                "Can name most familiar things",
                "Understands words like 'in,' 'on,' and 'under'"
            ],
            "cognitive": [
                "Can work toys with buttons, levers, and moving parts",
                "Plays make-believe with dolls, animals, and people",
                "Completes puzzles with 3 or 4 pieces"
            ],
            "physical": [
                "Climbs well",
                "Runs easily",
                "Pedals a tricycle"
            ],
            "creative": [
                "Copies a circle with pencil or crayon",
                "Builds towers of more than 6 blocks",
                "Engages in imaginative play"
            ]
        },
        # 4 years
        4: {
            "social_emotional": [
                "Enjoys doing new things",
                "Plays 'Mom' and 'Dad'",
                "Is more and more creative with make-believe play"
            ],
            "language": [
                "Knows some basic rules of grammar, such as correctly using 'he' and 'she'",
                "Sings a song or says a poem from memory",
                "Tells stories"
            ],
            "cognitive": [
                "Names some colors and some numbers",
                "Understands the idea of counting",
                "Starts to understand time"
            ],
            "physical": [
                "Hops and stands on one foot up to 2 seconds",
                "Catches a bounced ball most of the time",
                "Pours, cuts with supervision, and mashes own food"
            ],
            "creative": [
                "Draws a person with 2 to 4 body parts",
                "Uses scissors",
                "Creates recognizable artwork"
            ]
        },
        # 5 years
        5: {
            "social_emotional": [
                "Wants to please friends",
                "Wants to be like friends",
                "More likely to agree with rules"
            ],
            "language": [
                "Speaks very clearly",
                "Tells a simple story using full sentences",
                "Uses future tense"
            ],
            "cognitive": [
                "Counts 10 or more things",
                "Knows about things used every day, like money and food",
                "Can draw a person with at least 6 body parts"
            ],
            "physical": [
                "Stands on one foot for 10 seconds or longer",
                "Hops; may be able to skip",
                "Can do a somersault"
            ],
            "creative": [
                "Copies geometric shapes",
                "Draws detailed pictures",
                "Follows multi-step creative instructions"
            ]
        },
        # Additional ages 6-10 would be added here
        6: {
            "social_emotional": [
                "Shows more independence from parents and family",
                "Begins to understand the concept of time",
                "Wants to please friends and be like them"
            ],
            "language": [
                "Speaks clearly with sentences of 5-6 words",
                "Uses future tense properly",
                "Tells longer stories from memory"
            ],
            "cognitive": [
                "Counts to 100 by ones",
                "Can count by 5s and 10s",
                "Understands the concept of addition and subtraction"
            ],
            "physical": [
                "Can catch a ball",
                "Hops on one foot",
                "Can tie shoelaces"
            ],
            "creative": [
                "Creates recognizable artwork with details",
                "Follows multi-step craft instructions",
                "Engages in complex pretend play"
            ]
        },
        # Add more age groups as needed
    }
    
    # For ages not explicitly defined, use the closest lower age
    all_ages = list(milestones.keys())
    
    def get_milestones_for_age(age):
        if age in milestones:
            return milestones[age]
        else:
            # Find the closest lower age
            valid_ages = [a for a in all_ages if a <= age]
            if valid_ages:
                closest_age = max(valid_ages)
                return milestones[closest_age]
            else:
                # If no lower age, use the lowest available
                return milestones[min(all_ages)]
    
    return get_milestones_for_age

def update_milestone_tracking(user_input, response, session_state, openai_client):
    """Update milestone tracking based on the interaction"""
    # Only update if we haven't updated recently (to avoid too frequent updates)
    if (session_state.last_milestone_update is None or 
        (datetime.now() - datetime.strptime(session_state.last_milestone_update, 
                                           "%Y-%m-%d %H:%M:%S")) > timedelta(minutes=5)):
        
        # Get milestones for the child's age
        milestone_getter = load_cdc_milestones()
        age_milestones = milestone_getter(session_state.child_age)
        
        # Combine user input and response for analysis
        interaction_text = f"{user_input} {response}"
        
        # Use OpenAI to analyze the interaction for milestone indicators
        if openai_client:
            try:
                analysis_prompt = f"""
                Analyze this interaction between a {session_state.child_age}-year-old child and an AI learning companion.
                
                Child: {user_input}
                
                AI: {response}
                
                Based on this interaction, identify any developmental milestones the child might be demonstrating.
                Consider these milestone categories for a {session_state.child_age}-year-old:
                
                Social-Emotional: {age_milestones['social_emotional']}
                Language: {age_milestones['language']}
                Cognitive: {age_milestones['cognitive']}
                Physical: {age_milestones['physical']}
                Creative: {age_milestones['creative']}
                
                For each category, identify if there are any milestones that appear to be:
                1. Clearly demonstrated/observed
                2. Partially demonstrated/in progress
                3. Not demonstrated/not yet observed
                
                Format your response as JSON with this structure:
                {{
                    "observed": [list of specific milestones clearly demonstrated],
                    "in_progress": [list of specific milestones partially demonstrated],
                    "not_yet": [list of specific milestones not demonstrated],
                    "observation_notes": "Brief notes about what was observed"
                }}
                """
                
                response = openai_client.chat.completions.create(
                    model="gpt-4o",
                    messages=[{"role": "user", "content": analysis_prompt}],
                    response_format={"type": "json_object"}
                )
                
                # Parse the JSON response
                analysis = json.loads(response.choices[0].message.content)
                
                # Update milestone tracking
                timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                
                # Add the observation to the history
                session_state.milestone_observations.append({
                    "timestamp": timestamp,
                    "analysis": analysis
                })
                
                # Update the last milestone update time
                session_state.last_milestone_update = timestamp
                
                # Generate a developmental summary
                generate_developmental_summary(session_state, openai_client)
                
                logger.info(f"Updated milestone tracking at {timestamp}")
                
            except Exception as e:
                logger.error(f"Error updating milestone tracking: {str(e)}")

def generate_developmental_summary(session_state, openai_client):
    """Generate a summary of the child's developmental progress"""
    if openai_client and session_state.milestone_observations:
        try:
            # Get the last 10 observations
            recent_observations = session_state.milestone_observations[-10:]
            
            summary_prompt = f"""
            Review these developmental observations for a {session_state.child_age}-year-old child:
            
            {json.dumps(recent_observations)}
            
            Create a brief, encouraging summary of the child's developmental progress. 
            Focus on strengths while gently noting areas that might benefit from more practice.
            Use language that a parent would find helpful and actionable.
            Keep the summary to 3-4 paragraphs maximum.
            """
            
            response = openai_client.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "user", "content": summary_prompt}]
            )
            
            session_state.developmental_summary = response.choices[0].message.content
            logger.info("Generated new developmental summary")
            
        except Exception as e:
            logger.error(f"Error generating developmental summary: {str(e)}")

def update_analytics(user_input, response, session_state):
    """Update analytics based on the interaction"""
    # Increment total interactions
    session_state.total_interactions += 1
    
    # Extract topics from the interaction
    topics = extract_topics(user_input, response)
    for topic in topics:
        if topic in session_state.topic_interests:
            session_state.topic_interests[topic] += 1
        else:
            session_state.topic_interests[topic] = 1
    
    # Extract vocabulary
    new_words = extract_vocabulary(response)
    session_state.vocabulary.update(new_words)
    
    # Add milestone if appropriate
    if len(session_state.messages) % 5 == 0:  # Every 5 interactions
        milestone = {
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M"),
            "interaction_count": len(session_state.messages) // 2,
            "topics_explored": len(session_state.topic_interests),
            "vocabulary_size": len(session_state.vocabulary)
        }
        session_state.learning_milestones.append(milestone)
    
    # Update last dashboard update time
    session_state.last_dashboard_update = datetime.now().strftime("%Y-%m-%d %H:%M:%S") 