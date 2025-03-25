"""
RAG indexing for Children's Stories Collection
This script:
1. Loads the children's stories dataset
2. Processes and chunks the stories
3. Creates embeddings for each chunk using OpenAI API
4. Builds a vector store for efficient retrieval
5. Provides functions to query relevant stories based on user input
"""

import os
import json
import time
from typing import List, Dict, Any, Optional, Tuple, Union
import logging
from pathlib import Path

# Required libraries
from datasets import load_dataset
from tqdm import tqdm
import numpy as np

# OpenAI for embeddings
from openai import OpenAI

# Vector DB
from annoy import AnnoyIndex
import pickle

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)
from curiousikid.envionrment.config import settings

# Configuration
DATA_DIR = Path(os.path.dirname(os.path.abspath(__file__))) / ".." / ".." / ".." / "data"
CHUNK_SIZE = 300  # Characters per chunk
CHUNK_OVERLAP = 50  # Overlap between chunks to maintain context
DATASET_CACHE_PATH = DATA_DIR / "children_stories_cache"
MAX_STORIES = 100  # Limit to 100 stories for faster development
EMBEDDING_MODEL = "text-embedding-3-small"  # OpenAI embedding model


class StoryIndexer:
    """Handles the indexing of children's stories for RAG retrieval"""
    
    def __init__(self, max_stories: int = MAX_STORIES, embedding_model: str = EMBEDDING_MODEL):
        """Initialize the indexer"""
        self.embedding_model = embedding_model
        self.openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)  # Initialize OpenAI client
        self.annoy_index = None  # Annoy index for similarity search
        self.stories = []
        self.story_chunks = []
        self.embeddings = None
        self.max_stories = max_stories
        self.embedding_dim = 1536  # OpenAI text-embedding-3-small dimension
        
        # Create data directory if it doesn't exist
        DATA_DIR.mkdir(parents=True, exist_ok=True)
    
    def load_dataset(self, force_reload: bool = False) -> None:
        """Load the children's stories dataset from Hugging Face"""
        logger.info(f"Loading Children's Stories dataset (limited to {self.max_stories} stories)...")
        
        # Cache file for limited stories
        limited_cache_path = DATA_DIR / f"children_stories_cache_{self.max_stories}"
        
        if os.path.exists(limited_cache_path) and not force_reload:
            logger.info(f"Loading cached dataset from {limited_cache_path}")
            with open(limited_cache_path, 'rb') as f:
                self.stories = pickle.load(f)
            logger.info(f"Loaded {len(self.stories)} stories from cache")
            return
        
        try:
            dataset = load_dataset("ajibawa-2023/Children-Stories-Collection")
            self.stories = []
            story_count = 0
            
            # Process the dataset and extract useful information
            for split in ['train', 'test', 'validation']:
                if split in dataset and story_count < self.max_stories:
                    logger.info(f"Processing {split} split (limited to remaining {self.max_stories - story_count} stories)")
                    
                    # Use only the first stories up to max_stories
                    for item in tqdm(list(dataset[split])[:self.max_stories - story_count], 
                                     desc=f"Processing {split} split"):
                        story = {
                            'title': item.get('title', 'Untitled Story'),
                            'text': item.get('text', ''),
                            'source': item.get('source', 'Unknown'),
                            'age_group': self._determine_age_group(item),
                            'themes': self._extract_themes(item),
                            'id': item.get('id', len(self.stories))
                        }
                        self.stories.append(story)
                        story_count += 1
                        
                        if story_count >= self.max_stories:
                            logger.info(f"Reached maximum of {self.max_stories} stories. Stopping loading.")
                            break
            
            # Cache the processed dataset
            with open(limited_cache_path, 'wb') as f:
                pickle.dump(self.stories, f)
            
            logger.info(f"Loaded and cached {len(self.stories)} stories from the dataset")
        except Exception as e:
            logger.error(f"Error loading dataset: {str(e)}")
            raise
    
    def _determine_age_group(self, item: Dict[str, Any]) -> str:
        """Extract or infer the appropriate age group for a story"""
        # This is a placeholder - you would implement logic based on your dataset
        # Could use LLM to analyze complexity if not explicitly stated
        age_range = item.get('age_range', '')
        if age_range:
            return age_range
        
        # Simple heuristic based on text length and complexity
        text = item.get('text', '')
        if len(text) < 500:
            return "3-5 years"
        elif len(text) < 1500:
            return "6-8 years"
        else:
            return "9-11 years"
    
    def _extract_themes(self, item: Dict[str, Any]) -> List[str]:
        """Extract themes from the story"""
        # This is a placeholder - you would implement logic based on your dataset
        # Could use keyword extraction or LLM to identify themes
        themes = []
        text = item.get('text', '').lower()
        
        theme_keywords = {
            "friendship": ["friend", "together", "share"],
            "adventure": ["adventure", "journey", "quest", "discover"],
            "animals": ["animal", "dog", "cat", "bear", "fox", "bird"],
            "magic": ["magic", "spell", "wizard", "fairy", "enchant"],
            "family": ["family", "mother", "father", "sister", "brother", "parent"],
            "nature": ["nature", "forest", "tree", "flower", "garden", "plant"],
            "learning": ["learn", "school", "teach", "lesson", "discover"],
        }
        
        for theme, keywords in theme_keywords.items():
            if any(keyword in text for keyword in keywords):
                themes.append(theme)
        
        return themes
    
    def chunk_stories(self) -> None:
        """Split stories into chunks for better retrieval"""
        logger.info("Chunking stories...")
        self.story_chunks = []
        
        for story in tqdm(self.stories, desc="Chunking stories"):
            text = story['text']
            title = story['title']
            
            # Skip empty stories
            if not text or len(text) < 10:
                continue
            
            # Create initial chunk with the title to provide context
            current_chunk = f"Title: {title}\n"
            current_chunk_id = 0
            
            # Process the text character by character to create chunks
            for i in range(0, len(text), CHUNK_SIZE - CHUNK_OVERLAP):
                # Get the chunk text
                if i > 0:
                    chunk_text = text[i:i + CHUNK_SIZE]
                    current_chunk = chunk_text
                else:
                    # First chunk already has the title
                    chunk_text = text[i:i + CHUNK_SIZE - len(current_chunk)]
                    current_chunk += chunk_text
                
                # Create a chunk with metadata
                self.story_chunks.append({
                    'text': current_chunk,
                    'story_id': story['id'],
                    'title': title,
                    'chunk_id': current_chunk_id,
                    'age_group': story['age_group'],
                    'themes': story['themes']
                })
                
                current_chunk_id += 1
        
        logger.info(f"Created {len(self.story_chunks)} chunks from {len(self.stories)} stories")
    
    def create_embeddings(self, force_rebuild: bool = False) -> None:
        """Create OpenAI embeddings for all story chunks"""
        embeddings_file = DATA_DIR / f"openai_embeddings_{self.max_stories}_{self.embedding_model}.npy"
        chunks_file = DATA_DIR / f"story_chunks_{self.max_stories}.pkl"
        
        # Check if embeddings already exist
        if (os.path.exists(embeddings_file) and 
            os.path.exists(chunks_file) and 
            not force_rebuild):
            logger.info("Loading existing embeddings and chunks...")
            
            # Load embeddings
            self.embeddings = np.load(embeddings_file)
            
            # Load story chunks
            with open(chunks_file, 'rb') as f:
                self.story_chunks = pickle.load(f)
                
            logger.info(f"Loaded {len(self.story_chunks)} chunks with embeddings")
            return
        
        # Ensure we have chunks to embed
        if not self.story_chunks:
            logger.warning("No story chunks found. Chunking stories first...")
            self.chunk_stories()
        
        # Create embeddings using OpenAI API
        logger.info(f"Creating embeddings for all chunks using OpenAI {self.embedding_model}...")
        
        # Initialize array to store embeddings
        self.embeddings = np.zeros((len(self.story_chunks), self.embedding_dim), dtype=np.float32)
        
        # Process chunks in batches to avoid API limits
        batch_size = 50  # OpenAI recommends smaller batches
        for i in range(0, len(self.story_chunks), batch_size):
            end_idx = min(i + batch_size, len(self.story_chunks))
            batch = self.story_chunks[i:end_idx]
            
            logger.info(f"Processing batch {i//batch_size + 1}/{(len(self.story_chunks)-1)//batch_size + 1}...")
            
            # Extract text from chunks
            texts = [chunk['text'] for chunk in batch]
            
            try:
                # Call OpenAI API to get embeddings
                response = self.openai_client.embeddings.create(
                    input=texts, 
                    model=self.embedding_model
                )
                
                # Store embeddings
                for j, embedding_data in enumerate(response.data):
                    self.embeddings[i + j] = np.array(embedding_data.embedding, dtype=np.float32)
                
                # Sleep to avoid rate limits
                time.sleep(0.5)  # 0.5 second pause between batches
                
            except Exception as e:
                logger.error(f"Error getting embeddings from OpenAI API: {str(e)}")
                # Continue with partial embeddings if an error occurs
                if i > 0:
                    logger.info(f"Continuing with {i} embeddings")
                    self.embeddings = self.embeddings[:i]
                    self.story_chunks = self.story_chunks[:i]
                    break
                else:
                    raise
        
        # Save embeddings and chunks for future use
        logger.info("Saving embeddings and chunks...")
        np.save(embeddings_file, self.embeddings)
        
        with open(chunks_file, 'wb') as f:
            pickle.dump(self.story_chunks, f)
        
        logger.info(f"Created and saved embeddings for {len(self.story_chunks)} chunks")
    
    def build_index(self, force_rebuild: bool = False) -> None:
        """Build an Annoy index for fast similarity search"""
        index_file = DATA_DIR / f"annoy_index_openai_{self.max_stories}_{self.embedding_model}.ann"
        
        # Check if index already exists
        if os.path.exists(index_file) and not force_rebuild:
            logger.info("Loading existing Annoy index...")
            # Ensure we have embeddings
            if self.embeddings is None:
                self.create_embeddings()
            
            # Create and load Annoy index
            self.annoy_index = AnnoyIndex(self.embedding_dim, 'angular')
            self.annoy_index.load(str(index_file))
            logger.info("Annoy index loaded successfully")
            return
        
        # Ensure we have embeddings
        if self.embeddings is None:
            logger.warning("No embeddings found. Creating embeddings first...")
            self.create_embeddings()
        
        # Build the index
        logger.info("Building Annoy index...")
        
        # Create Annoy index - 'angular' is for cosine similarity
        self.annoy_index = AnnoyIndex(self.embedding_dim, 'angular')
        
        # Add embeddings to the index
        for i, embedding in enumerate(self.embeddings):
            self.annoy_index.add_item(i, embedding)
        
        # Build index with 100 trees - more trees = more accuracy but slower build
        self.annoy_index.build(100)
        
        # Save the index
        logger.info("Saving Annoy index...")
        self.annoy_index.save(str(index_file))
        logger.info("Annoy index built and saved successfully")
    
    def retrieve_stories(self, query: str, top_k: int = 5, age_group: Optional[str] = None, 
                         themes: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """
        Retrieve the most relevant story chunks for a given query
        
        Args:
            query: The user query or context
            top_k: Number of results to return
            age_group: Filter by age group (e.g., "3-5 years")
            themes: Filter by themes (e.g., ["friendship", "adventure"])
            
        Returns:
            List of relevant story chunks with metadata
        """
        # Ensure we have an index
        if self.annoy_index is None:
            logger.warning("No index found. Building index first...")
            self.build_index()
        
        # Create embedding for the query using OpenAI API
        try:
            response = self.openai_client.embeddings.create(
                input=[query],
                model=self.embedding_model
            )
            query_vector = np.array(response.data[0].embedding, dtype=np.float32)
        except Exception as e:
            logger.error(f"Error getting query embedding from OpenAI API: {str(e)}")
            raise
        
        # Increase k to account for filtering
        search_k = top_k * 3 if age_group or themes else top_k
        
        # Search for similar chunks
        # Get indices and distances
        indices, distances = self.annoy_index.get_nns_by_vector(
            query_vector, 
            search_k, 
            include_distances=True
        )
        
        # Prepare results
        results = []
        for i, idx in enumerate(indices):
            if idx >= len(self.story_chunks):
                continue
            
            chunk = self.story_chunks[idx]
            
            # Apply filters
            if age_group and chunk['age_group'] != age_group:
                continue
            
            if themes and not any(theme in chunk['themes'] for theme in themes):
                continue
            
            # Add to results
            results.append({
                'text': chunk['text'],
                'title': chunk['title'],
                'story_id': chunk['story_id'],
                'chunk_id': chunk['chunk_id'],
                'age_group': chunk['age_group'],
                'themes': chunk['themes'],
                'distance': float(distances[i])
            })
            
            # Check if we have enough results after filtering
            if len(results) >= top_k:
                break
        
        logger.info(f"Retrieved {len(results)} story chunks for query: '{query}'")
        return results
    
    def get_complete_story(self, story_id: int) -> Dict[str, Any]:
        """Retrieve the complete story by ID"""
        for story in self.stories:
            if story['id'] == story_id:
                return story
        
        logger.warning(f"Story with ID {story_id} not found")
        return {}
    
    def process_all(self, force_rebuild: bool = False) -> None:
        """Process all steps: load dataset, chunk, create embeddings, build index"""
        self.load_dataset(force_reload=force_rebuild)
        self.chunk_stories()
        self.create_embeddings(force_rebuild=force_rebuild)
        self.build_index(force_rebuild=force_rebuild)
        logger.info(f"Story indexing complete and ready for retrieval (using {len(self.stories)} stories)")


def prepare_story_index(max_stories: int = MAX_STORIES, embedding_model: str = EMBEDDING_MODEL) -> StoryIndexer:
    """Prepare the story index for use"""
    indexer = StoryIndexer(max_stories=max_stories, embedding_model=embedding_model)
    indexer.process_all()
    return indexer


def retrieve_stories(query: str, build_if_missing: bool = False, top_k: int = 3, 
                     age_group: Optional[str] = None, themes: Optional[List[str]] = None) -> List[Dict[str, Any]]:
    """
    Retrieve stories from an existing index with a flag to control fallback behavior.
    
    Args:
        query: User query or conversation context
        build_if_missing: If True, will build a new index if one doesn't exist
        top_k: Number of results to return
        age_group: Optional filter by age group (e.g., "3-5 years")
        themes: Optional filter by themes
        
    Returns:
        List of relevant story chunks with metadata
    """
    max_stories = MAX_STORIES
    embeddings_model = EMBEDDING_MODEL
    
    # Check if required files exist
    index_file = DATA_DIR / f"annoy_index_openai_{max_stories}_{embeddings_model}.ann"
    chunks_file = DATA_DIR / f"story_chunks_{max_stories}.pkl"
    
    # Try to use existing index
    if os.path.exists(index_file) and os.path.exists(chunks_file):
        try:
            # Load chunks data
            with open(chunks_file, 'rb') as f:
                story_chunks = pickle.load(f)
            
            # Initialize OpenAI client
            client = OpenAI(api_key=settings.OPENAI_API_KEY)
            
            # Get embedding for query
            response = client.embeddings.create(
                input=[query],
                model=embeddings_model
            )
            query_vector = np.array(response.data[0].embedding, dtype=np.float32)
            
            # Load existing Annoy index
            embedding_dim = 1536  # OpenAI embedding dimension
            annoy_index = AnnoyIndex(embedding_dim, 'angular')
            annoy_index.load(str(index_file))
            
            # Increase k to account for filtering
            search_k = top_k * 3 if age_group or themes else top_k
            
            # Search for similar stories
            indices, distances = annoy_index.get_nns_by_vector(
                query_vector,
                search_k,
                include_distances=True
            )
            
            # Process results
            results = []
            for i, idx in enumerate(indices):
                if idx >= len(story_chunks):
                    continue
                    
                chunk = story_chunks[idx]
                
                # Apply filters if provided
                if age_group and chunk['age_group'] != age_group:
                    continue
                    
                if themes and not any(theme in chunk['themes'] for theme in themes):
                    continue
                
                # Add to results
                results.append({
                    'text': chunk['text'],
                    'title': chunk['title'],
                    'story_id': chunk['story_id'],
                    'chunk_id': chunk['chunk_id'],
                    'age_group': chunk['age_group'],
                    'themes': chunk['themes'],
                    'distance': float(distances[i])
                })
                
                # Stop when we have enough results
                if len(results) >= top_k:
                    break
                    
            logger.info(f"Retrieved {len(results)} story chunks from existing index")
            return results
            
        except Exception as e:
            logger.error(f"Error retrieving stories from existing index: {str(e)}")
            if not build_if_missing:
                return []
            logger.info("Falling back to building new index...")
    else:
        if not build_if_missing:
            logger.warning(f"Required files not found and build_if_missing=False")
            return []
        logger.info("Index not found. Building new index...")
    
    # Build new index if requested and existing one not found or had errors
    if build_if_missing:
        try:
            logger.info("Building new index...")
            # Initialize and build the index
            indexer = prepare_story_index()
            
            # Retrieve relevant stories using the new index
            results = indexer.retrieve_stories(query, top_k=top_k, age_group=age_group, themes=themes)
            return results
        except Exception as e:
            logger.error(f"Error building new index: {str(e)}")
            return []
    
    return []


def get_story_context(query: str, child_age: Optional[str] = None, build_if_missing: bool = False) -> str:
    """
    Get story context for RAG with option to build index if missing.
    
    Args:
        query: The user's query or conversation context
        child_age: Optional child age for filtering stories
        build_if_missing: If True, will build a new index if one doesn't exist
        
    Returns:
        RAG prompt with relevant stories
    """
    # Map age to age group if provided
    age_group = None
    if child_age:
        try:
            age = int(child_age)
            if age <= 5:
                age_group = "3-5 years"
            elif age <= 8:
                age_group = "6-8 years"
            else:
                age_group = "9-11 years"
        except (ValueError, TypeError):
            pass
    
    # Get stories with flag for building index if missing
    stories = retrieve_stories(
        query=query, 
        build_if_missing=build_if_missing,
        top_k=2, 
        age_group=age_group
    )
    
    # If no stories found, return empty string
    if not stories:
        return ""
    
    # Create RAG prompt
    return add_rag_to_prompt(stories, query)


def add_rag_to_prompt(stories: List[Dict[str, Any]]) -> str:
    """Create a RAG-enhanced prompt with relevant story context"""
    rag_prompt = ""
    rag_prompt += "\n"
    
    #rag_prompt = f"The child is asking about: {query}\n\n"
    #rag_prompt += "Here are some relevant children's stories that might help you respond:\n\n"
    
    for i, story in enumerate(stories, 1):
        #rag_prompt += f"STORY {i}: {story['title']}\n"
        rag_prompt += f"{story['text'][:300]}...\n"
        #rag_prompt += f"Age Group: {story['age_group']}\n"
        #rag_prompt += f"Themes: {', '.join(story['themes'])}\n\n"
    
    rag_prompt += "Using these stories as inspiration."
    
    return rag_prompt


# Usage example:
if __name__ == "__main__":
    # Initialize and build the index
    ### 
    # Set indexer to None unconditionally
    indexer = None
    
    # Example query
    test_query = "Stories for birds"
    
    # Use our standalone function with the build_if_missing flag instead
    results = retrieve_stories(
        query=test_query,
        build_if_missing=True,  # Build the index if needed
        top_k=1
    )
    
    # Print results
    print(f"\nQuery: {test_query}")
    print(f"Found {len(results)} relevant story chunks:")
    
    for i, result in enumerate(results, 1):
        print(f"\n{i}. {result['title']} (Age: {result['age_group']})")
        print(f"   Themes: {', '.join(result['themes'])}")
        print(f"   Excerpt: {result['text'][:150]}...")
    
    # Example of creating a RAG-enhanced prompt
    rag_prompt = add_rag_to_prompt(results, test_query)
    print("\nRAG-enhanced prompt:")
    print(rag_prompt)
