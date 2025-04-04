from pathlib import Path
from typing import List
from environment.config import PROJECT_ROOT
from memoryuser.models import User
from memorydata_loader import load_models_from_yaml
import logging
import os

logger = logging.getLogger(__name__)

DEFAULT_USERS_FILE = Path(os.path.join(PROJECT_ROOT, "src", "storage", "user", "data", "users.yml"))

def load_users_from_yaml(file_path: Path = DEFAULT_USERS_FILE) -> List[User]:
    """Loads story metadata from a YAML file using the generic loader."""
    logger.info(f"Loading users from: {file_path}")
    users = load_models_from_yaml(file_path, User)
    if not users:
        logger.warning(f"No users were loaded from {file_path}.")
    return users

class UserService:
    def __init__(self):
        self.users = {user.id: user for user in load_users_from_yaml()}

    def get_user(self, id: str) -> User:
        return self.users.get(id) 
        
    def get_users(self) -> List[User]:
        return list(self.users.values())
        
if __name__ == "__main__":
    users = load_users_from_yaml()
    print(users)

