import json
from typing import Any, Dict

# from voice_agent.agents.proactive_question_agent import ProactiveQuestionAgent
# from voice_agent.agents.chat_character_agent import ChatCharacterAgent
from voice_agent.agents.user_question_agent import UserQuestionAgent
from voice_agent.agents.connection_metadata import (
    ParticipantConnectionMetadata,
    AgentType,
)


class AgentFactory:
    def __init__(self):
        self.agent_creators = {
            # AgentType.PROACTIVE_QUESTION: self._create_proactive_question_agent,
            # AgentType.CHAT_CHARACTER: self._create_chat_character_agent,
            AgentType.USER_QUESTION: self._create_user_question_agent,
        }

    def get_agent(self, participant_metadata: str):
        metadata = json.loads(participant_metadata)
        agent_type = ParticipantConnectionMetadata(**metadata).agentType
        if agent_type not in self.agent_creators:
            raise ValueError(f"Invalid agent type: {agent_type}")

        return self.agent_creators[agent_type](metadata)

    # def _create_proactive_question_agent(self, metadata: Dict[str, Any]):
    #     return ProactiveQuestionAgent(metadata)

    def _create_user_question_agent(self, metadata: Dict[str, Any]):
        return UserQuestionAgent(metadata)

    # def _create_chat_character_agent(self, metadata: Dict[str, Any]):
    #     return ChatCharacterAgent(metadata)
