from datetime import date, datetime
from typing import Any, Dict, List, Optional
from uuid import uuid4

from pydantic import BaseModel, Field, constr, field_validator
from beanie import Document, Link, PydanticObjectId


class User(Document):
    name: str
    email: str
    password: str

    class Settings:
        collection = "users"


class Token(Document):
    access_token: str
    token_type: str

    class Settings:
        collection = "token_data"





class ScriptPrompt(Document):
    user_id: PydanticObjectId
    script: str
    upload_time: Optional[datetime] = None
    generated_prompt: List[str] = Field(default_factory=list)

    class Settings:
        collection = "scripts"

class CharacterDesc(Document):
    user_id: PydanticObjectId
    script_id: PydanticObjectId
    character_name: str
    character_description: str

    class Settings:
        collection = "character_desc"


class Characters(Document):
    user_id:PydanticObjectId
    script_id: PydanticObjectId
    character_id: PydanticObjectId
    character_name: str
    character_description: str
    image_url:str

    class Settings:
        collection = "characters"

# class Character(BaseModel):
#     def __init__(self, character_name: str, image_url: str):
#         self.character_name = character_name
#         self.image_url = image_url

# class PromptHistory(Document):
#     prompt: str
#     characters: List[Dict[str,str]]
#     generated_time: datetime
#     user_id: str  # To associate the prompt history with a user

#     class Config:
#         collection = "prompt_history"

# class CharacterImage(Document):
#     character_id: str  # Reference to the Character ID
#     image_url: str  # URL to the generated character image
    
#     class Settings:
#         collection = "character_images"
