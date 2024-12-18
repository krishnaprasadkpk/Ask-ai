from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
import certifi
from models import User, Token, ScriptPrompt,Characters, CharacterDesc
from dotenv import load_dotenv
import os

load_dotenv()
MONGODB_USERNAME = os.getenv("MONGODB_USERNAME")
MONGODB_PWD = os.getenv("MONGODB_PWD")
MONGODB_HOST = os.getenv("MONGODB_HOST")
uri = f"mongodb+srv://{MONGODB_USERNAME}:{MONGODB_PWD}@{MONGODB_HOST}/?retryWrites=true&w=majority&appName=Ask-ai"

async def init_db():
    client = AsyncIOMotorClient(uri, tlsCAFile=certifi.where())
    db = client["ask-ai"]
    await init_beanie(database=db, document_models=[User, Token, ScriptPrompt, CharacterDesc, Characters])