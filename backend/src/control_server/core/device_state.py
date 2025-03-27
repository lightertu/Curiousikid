from typing import Optional, List, Any
from pydantic import BaseModel, Field
from copy import deepcopy
from jsonpath_ng import parse

# -----------------------------
# 1) Define your Pydantic models
# -----------------------------
class StoryMetadata(BaseModel):
    id: str
    title: str
    description: str
    artist: str
    audioUrl: str
    duration: float
    thumbnailUrl: str

class CurrentStory(StoryMetadata):
    currentTime: float
    
class QuestionPoint(BaseModel):
    storyId: str
    questionPointId: str
    connectAt: float
    interruptAt: float

# This is just a default list, similar to your INIT_STORY_LIST in TS
INIT_STORY_LIST = [
    StoryMetadata(
        id="1",
        title="Birdy on the Ski Slopes",
        description="A journey through the magical forest begins with a single step.",
        artist="Storynory",
        audioUrl="/birdy_on_the_ski_slopes-storynory-kaboom.mp3",
        duration=856.842449,
        thumbnailUrl="https://www.storynory.com/wp-content/uploads/2025/03/jake-ski-videoart-600x336.jpg?"
    )
]

class DeviceState(BaseModel):
    isPlaying: bool = False
    stories: List[StoryMetadata] = Field(default_factory=lambda: INIT_STORY_LIST)
    currentStory: Optional[CurrentStory] = Field(
        default_factory=lambda: CurrentStory(
            id=INIT_STORY_LIST[0].id,
            title=INIT_STORY_LIST[0].title,
            description=INIT_STORY_LIST[0].description,
            artist=INIT_STORY_LIST[0].artist,
            audioUrl=INIT_STORY_LIST[0].audioUrl,
            duration=INIT_STORY_LIST[0].duration,
            thumbnailUrl=INIT_STORY_LIST[0].thumbnailUrl,
            currentTime=0.0
        )
    )
    questionPoint: Optional[QuestionPoint] = None
    libraryStatus: bool = False
    isChatActive: bool = False
    isWebSocketConnected: bool = False

    def update_subtree(self, json_path: str, new_value: Any) -> "DeviceState":
        cloned_state = deepcopy(self)
        data = cloned_state.model_dump()

        # Use jsonpath_ng's "ext" parse for extended JSONPath features
        expression = parse(json_path)
        matches = expression.find(data)

        # Pass in 'data' (the full dict), not 'match.context.value'
        for match in matches:
            match.full_path.update(data, new_value)

        # Re-parse the modified dict back into a new GlobalState
        new_state = DeviceState.model_validate(data)
        return new_state

# -----------------------------
# 4) Example usage
# -----------------------------
if __name__ == "__main__":
    store = DeviceState()
    print("Before update:", store.stories)

    # Suppose we want to update the currentStory's title using JSONPath
    # (Make sure your path is valid JSONPath, e.g., '$.currentStory.title')
    new_store = store.update_subtree("$.stories", [StoryMetadata(
        id="2",
        title="Birdy on the Ski ",
        description="A journey through the magical forest begins with a single step.",
        audioUrl="/birdy_on_the_ski_slopes-storynory-kaboom.mp3",
        duration=180.5,
        artist="Storynory",
        thumbnailUrl="https://www.storynory.com/wp-content/uploads/2025/03/jake-ski-videoart-600x336.jpg?"
    )])

    print("After update:", new_store.stories)
    # The original store is unchanged (immutable style)
    print("Original store remains:", store.stories)
