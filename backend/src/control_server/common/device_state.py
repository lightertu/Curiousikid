from typing import Optional, List, Any
from pydantic import BaseModel, Field, ValidationError
from copy import deepcopy
from jsonpath_ng import parse

from storage.user.service import UserService
from storage.story.service import StoryService
from storage.story.models import StoryMetadata, CurrentStory, QuestionPoint
from storage.user.models import User


story_service = StoryService()
user_service = UserService()
INIT_STORY_LIST = story_service.get_stories()

# --- Define the main DeviceState model --- 
class DeviceState(BaseModel):
    user: User = Field(default=user_service.get_users()[0])
    isPlaying: bool = False
    stories: List[StoryMetadata] = Field(default_factory=lambda: INIT_STORY_LIST) # Use loaded list
    # Adjust default factory for currentStory to handle empty list or take first loaded story
    currentStory: Optional[CurrentStory] = Field(
        default_factory=lambda: CurrentStory(
            **INIT_STORY_LIST[0].model_dump(), 
            currentTime=0.0
        ) if INIT_STORY_LIST else None
    )
    questionPoint: Optional[QuestionPoint] = None
    libraryStatus: bool = False
    isChatActive: bool = False
    isWebSocketConnected: bool = False

    # --- Method to update state immutably using JSONPath --- 
    def update_subtree(self, json_path: str, new_value: Any) -> "DeviceState":
        """Updates a part of the state immutably using a JSONPath expression."""
        cloned_state = deepcopy(self) # Create a deep copy to ensure immutability
        data = cloned_state.model_dump() # Convert the Pydantic model to a dictionary

        # Parse the JSONPath expression
        expression = parse(json_path)
        # Find all matches in the data dictionary
        matches = expression.find(data)

        # Check if any matches were found
        if not matches:
            print(f"Warning: JSONPath '{json_path}' found no matches in the state.")
            return self # Return the original state if no matches

        # Iterate through matches and update the dictionary
        for match in matches:
            # Use the update method provided by jsonpath-ng on the full data dict
            match.full_path.update(data, new_value) 

        # Re-create the Pydantic model from the modified dictionary
        try:
            new_state = DeviceState.model_validate(data)
        except ValidationError as e:
            print(f"Error validating state after update with path '{json_path}': {e}")
            return self # Return original state on validation error
            
        return new_state # Return the new, updated state object

# -----------------------------
# Example usage (for testing)
# -----------------------------
if __name__ == "__main__":
    # Create an initial state instance (will load stories from YAML)
    store = DeviceState()
    print(f"Loaded {len(store.stories)} stories initially.")
    print("Initial current story:", store.currentStory.title if store.currentStory else "None")

    # Example of updating the isPlaying flag
    new_store = store.update_subtree("$.isPlaying", True)
    print("isPlaying after update:", new_store.isPlaying)
    print("Original isPlaying remains:", store.isPlaying)

    # Example of updating a specific story's title (if stories exist)
    if new_store.stories:
        path_to_first_story_title = "$.stories[0].title"
        updated_store = new_store.update_subtree(path_to_first_story_title, "A New Title for Birdy")
        print("First story title after update:", updated_store.stories[0].title)
        print("Original first story title remains:", new_store.stories[0].title)
    else:
        print("Skipping story title update example as no stories were loaded.")
