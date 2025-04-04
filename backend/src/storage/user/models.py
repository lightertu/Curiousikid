from pydantic import BaseModel

# -----------------------------
# Define Pydantic models
# -----------------------------
class User(BaseModel):
    id: str
    name: str