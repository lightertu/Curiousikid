class StoryContextService:
    def __init__(self):
        self.story_context = {}

    def get_story_context(self, question_point: QuestionPoint) -> str:
        return self.story_context.get(story_id, "")
