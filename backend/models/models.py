from datetime import date, datetime
from typing import List, Optional
from uuid import uuid4
from pydantic import Field, constr, field_validator
from beanie import Document, Link, PydanticObjectId


class User(Document):
    name: str
    username: str
    password: str

    class Settings:
        collection = "users"


class Token(Document):
    access_token: str
    token_type: str

    class Settings:
        collection = "token_data"

class Prompt(Document):
    prompt: str


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
    script_id: PydanticObjectId
    character_id: PydanticObjectId
    image_url:str

    class Settings:
        collection = "characters"


# class CharacterImage(Document):
#     character_id: str  # Reference to the Character ID
#     image_url: str  # URL to the generated character image
    
#     class Settings:
#         collection = "character_images"
