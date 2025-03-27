from control_server.models import Story
import uuid

# Sample story data
SAMPLE_STORIES = [
    Story(
        id=str(uuid.uuid4()),
        title="Birdy on the Ski Slopes",
        cover_image_url="https://www.storynory.com/wp-content/uploads/2025/03/jake-ski-videoart-600x336.jpg",
        author="Storynory",
        description="Birdy goes skiing for the first time and learns valuable lessons about perseverance and friendship.",
        duration_seconds=360,
        tags=["adventure", "children", "winter"]
    ),
    Story(
        id=str(uuid.uuid4()),
        title="The Lost Treasure",
        cover_image_url="https://example.com/lost-treasure.jpg",
        author="Storynory",
        description="Join Captain Jack on his quest to find the lost treasure of the Caribbean.",
        duration_seconds=480,
        tags=["adventure", "pirates", "treasure"]
    ),
    Story(
        id=str(uuid.uuid4()),
        title="The Magical Forest",
        cover_image_url="https://example.com/magical-forest.jpg",
        author="Storynory",
        description="Explore the wonders of the magical forest with Ellie and her fairy friends.",
        duration_seconds=420,
        tags=["fantasy", "magic", "children"]
    )
] 