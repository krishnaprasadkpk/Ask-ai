
import base64
import re
import tempfile
from bson import ObjectId
from fastapi import Depends, FastAPI, HTTPException, APIRouter, Path, Query
import requests
from pydantic import BaseModel
from starlette import status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
import os
from openai import OpenAI
from dotenv import load_dotenv
import google.generativeai as genai
from .state_manager import app_state
from models.models import *
from .auth import *
import logging
# from pydrive2.auth import GoogleAuth
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
import traceback
import io
from googleapiclient.http import MediaIoBaseDownload
from fastapi.responses import StreamingResponse

# from pydrive2.drive import GoogleDrive
import json
load_dotenv()

router=APIRouter()
# app.state.generated_characters = None
# app.state.character_prompts=None

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")
ACCESS_TOKEN_EXPIRE_MINUTES = 30




async def get_user(email: str):
    return await User.find_one({"email": email})


async def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    email:str = payload.get("sub")
    if email is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await get_user(email)
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user


client=OpenAI(api_key=os.getenv("TOGETHER_API_KEY"), base_url="https://api.together.xyz/v1")

genai.configure(api_key=os.environ["GEMINI_API_KEY"])
generation_config = {
  "temperature": 1,
  "top_p": 0.95,
  "top_k": 40,
  "max_output_tokens": 8192,
  "response_mime_type": "text/plain",
}
model = genai.GenerativeModel(
  model_name="gemini-1.5-flash",
  generation_config=generation_config,
)



def authenticate_drive():
    credentials_file_path = "ask-ai-445105-bd7e05bc345c.json"
    if os.path.exists(credentials_file_path):
        credentials = service_account.Credentials.from_service_account_file(
            "ask-ai-445105-bd7e05bc345c.json",
            scopes=["https://www.googleapis.com/auth/drive.file"]
        )
    else:
        credentials_base64 = os.getenv("GOOGLE_CREDENTIALS")
        
        if credentials_base64 is None:
            raise ValueError("Google credentials are missing, and no file or base64 string is available.")
        
        
        credentials_json = base64.b64decode(credentials_base64)
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            temp_file.write(credentials_json)
            temp_file_path = temp_file.name
        
        
        credentials = service_account.Credentials.from_service_account_file(
            temp_file_path,
            scopes=["https://www.googleapis.com/auth/drive.file"]
        )

    drive_service = build('drive', 'v3', credentials=credentials)
    return drive_service

def upload_to_google_drive(file_path, folder_id):
    drive_service = authenticate_drive()

    file_metadata = {
        'name': file_path.split("/")[-1],  
        'parents': [folder_id]  
    }

    media = MediaFileUpload(file_path, mimetype='image/png')

    
    file = drive_service.files().create(
        body=file_metadata,
        media_body=media,
        fields='id, webViewLink'  
    ).execute()

    
    return file['id'], file['webViewLink']






@router.post("/register")
async def register_user(user: User):
    
    existing_user = await User.find_one(User.email == user.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="User already registered")
    
    
    hashed_password = get_password_hash(user.password)
    
    
    new_user = User(user_id=str(uuid4()), name=user.name, email=user.email, password=hashed_password)
    await new_user.insert()
    
    return {"msg": "User registered successfully"}


@router.post("/login")
async def login_user(form_data: OAuth2PasswordRequestForm = Depends()):
    
    db_user = await User.find_one(User.email == form_data.username)
    if not db_user or not verify_password(form_data.password, db_user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    
    access_token = create_access_token(data={"sub": db_user.email})
    
    
    token = Token(access_token=access_token, token_type="bearer")
    await token.insert()
    
    return {"access_token": access_token, "token_type": "bearer", "Name": db_user.name}




class Prompt(BaseModel):
    prompt: str


@router.post("/generate-characters")
async def generate_character_details(request: Prompt, current_user: User = Depends(get_current_user)):
    
    gemini_prompt = (
            "Generate a text includes single elaborated line prompt of characters from the script including character name, traits ,physical description, emotions etc. and each character prompt seperated by $" + request.prompt
        )
    
    response=model.generate_content(gemini_prompt)

    # response_text = response.text.split('\n')

    # characters = process_gemini_response(response_text)

    # Use the characters as needed
    response_text=response.text
    allowed_chars_pattern = r"[^a-zA-Z0-9:, $]+"
    cleaned_response_text = re.sub(allowed_chars_pattern, "", response_text)
    cleaned_response_text = cleaned_response_text.replace("\n", "").replace("\r", "")

    characters_list = [char.strip() for char in cleaned_response_text.split("$") if char.strip()]
    app_state.character_prompts=characters_list
    
    new_script_prompt = ScriptPrompt(
        user_id=str(current_user.id),
        script=request.prompt,
        uploaded_time=datetime.now(timezone.utc),
        generated_prompt=characters_list
    )

    await new_script_prompt.insert()

    script_id = new_script_prompt.id

    for prompt in characters_list:
    
        name, description = prompt.split(":", 1)
    
        name = name.strip()
        description = description.strip()
    
    
        character_description=CharacterDesc(
            user_id=str(current_user.id),
            script_id=script_id,
            character_name=name,
            character_description=description


        )
        await character_description.insert()


    return {"message": "Script created successfully", "script_id": str(script_id)}



@router.post("/generate-image/{script_id}")
async def generate_image(script_id: str, current_user: User = Depends(get_current_user)):
    """
    Generate images based on character prompts and save them locally.
    """
    if not ObjectId.is_valid(script_id):
        raise HTTPException(status_code=400, detail="Invalid script ID.")
    script_id = ObjectId(script_id)
    try:
        characters_desc = await CharacterDesc.find({"script_id": ObjectId(script_id), "user_id": current_user.id}).to_list()
        if not characters_desc:
            raise HTTPException(status_code=404, detail="No characters found for the given script ID.")
        print(characters_desc)

        folder_id = "1IrULfBEYg2fLM0QCt9o_Poj-5d33KlMc"
        generated_characters = []

        for character in characters_desc:
            try:
                # Call OpenAI's image generation API
                response = client.images.generate(
                    prompt=f"A cinematic character portrait of  "+ character.character_name + character.character_description,
                    model="black-forest-labs/FLUX.1-schnell",
                    n=1,
                )
                
                image_url = response.data[0].url

                image_data = requests.get(image_url).content
                image_path = os.path.join("image", f"image_{character.character_name}.png")
                with open(image_path, "wb") as image_file:
                    image_file.write(image_data)

                
                file_id, file_url = upload_to_google_drive(image_path, folder_id)

                character_image = Characters(
                    user_id=character.user_id,
                    script_id=character.script_id,
                    character_id=character.id,
                    character_name=character.character_name,
                    character_description=character.character_description,
                    image_url=file_url
                )
                await character_image.insert()

                generated_characters.append({
                    "character_name": character.character_name,
                    "character_id": str(character.id),
                    "image_url": file_url,
                })

                os.remove(image_path)

            except Exception as inner_error:
                print("Error processing character:", character.character_name)
                print(inner_error)  
                print(traceback.format_exc())  

                raise HTTPException(status_code=500, detail=f"Error generating image for character '{character.character_name}': {str(inner_error)}")

        return {"generated_images": generated_characters}

    except Exception as outer_error:
        print("Error in main process:")
        print(outer_error)  
        print(traceback.format_exc())  

        raise HTTPException(status_code=500, detail=f"An error occurred: {str(outer_error)}\n\nStack Trace:\n{traceback.format_exc()}")

@router.get("/prompts")
async def get_user_prompts(current_user: User = Depends(get_current_user)):
    try:
        
        prompts = await ScriptPrompt.find(ScriptPrompt.user_id == current_user.id).to_list()
        
        if not prompts:
            raise HTTPException(status_code=404, detail="No prompts found")
        
        
        return prompts
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving prompts: {str(e)}")
@router.get("/character/{character_id}")
async def get_character(character_id: str):
    character_desc = await Characters.find_one({"character_id": ObjectId(character_id)})
    if not character_desc:
        raise HTTPException(status_code=404, detail="Character description not found")
    return character_desc

@router.get("/generated_characters/{script_id}")
async def get_generated_characters(script_id: str):
    if not ObjectId.is_valid(script_id):
        raise HTTPException(status_code=400, detail="Invalid script_id format")
    
    characters = await Characters.find_many({"script_id": ObjectId(script_id)}).to_list()
    if not characters:
        raise HTTPException(status_code=404, detail="No characters found for the given script_id")
    
    return characters


@router.get("/fetch-image/{file_id}")
async def fetch_image(file_id: str):
    try:
        
        drive_service = authenticate_drive()

        
        request = drive_service.files().get_media(fileId=file_id)
        fh = io.BytesIO()
        downloader = MediaIoBaseDownload(fh, request)
        done = False
        while done is False:
            _, done = downloader.next_chunk()
        fh.seek(0)  

        # Return the image as a StreamingResponse to the client
        return StreamingResponse(fh, media_type="image/jpeg")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching image: {str(e)}")
    
@router.get("/fetch-history")
async def fetch_history(
    current_user: User = Depends(get_current_user),
):
    
    

    try:
        
        script_prompts = await ScriptPrompt.find({"user_id": current_user.id}).to_list()

        if not script_prompts:
            raise HTTPException(status_code=404, detail="No prompts found for this user")

        
        history = []
        for prompt in script_prompts:
            
            characters = await Characters.find({"script_id": prompt.id}).to_list()
            
            history.append({
                "script_id": str(prompt.id),
                "script": prompt.script,
                "characters": [
                    {
                        "character_name": char.character_name,
                        "character_description": char.character_description,
                        "image_url": char.image_url
                    } for char in characters
                ]
            })

        return history


    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred while fetching history: {str(e)}")
    
@router.delete("/delete-script/{script_id}")
async def delete_script(script_id: str, user=Depends(get_current_user)):
    script = await ScriptPrompt.find_one({"_id": PydanticObjectId(script_id), "user_id": user.id})
    
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")
    
    await script.delete()
    return {"message": "Script deleted successfully"}

# @router.post("/save-prompt")
# async def save_prompt(prompt_history: PromptHistory):
#     # Check if the prompt already exists
#     existing_prompt = await PromptHistory.find_one(PromptHistory.prompt == prompt_history.prompt)
#     if existing_prompt:
#         raise HTTPException(status_code=400, detail="Prompt already exists")
    
#     # Create a new document
#     prompt_history.generated_time = datetime.now(timezone.utc)  # Ensure the generated time is set
#     new_prompt = PromptHistory(**prompt_history.model_dump())

#     # Save to the database
#     await new_prompt.insert()
    
#     return {"message": "Prompt saved successfully"}

# @router.get("/prompt-history/{user_id}", response_model=List[PromptHistory])
# async def get_prompt_history(current_user: User = Depends(get_current_user)):
#     prompts = await PromptHistory.find(PromptHistory.user_id == current_user.id).to_list()

#     if not prompts:
#         raise HTTPException(status_code=404, detail="No prompts found for this user")
    
#     return prompts

# # Request schema
# class ImagePrompt(BaseModel):
#     prompt: str


# @router.post("/generate-image")
# async def generate_image(script_id: PydanticObjectId, current_user: User = Depends(get_current_user)):
#     """
#     Generate images based on character prompts and save them locally.
#     """
#     if not ObjectId.is_valid(script_id):
#         raise HTTPException(status_code=400, detail="Invalid script ID.")
    
#     characters_desc = await CharacterDesc.find({"script_id": ObjectId(script_id), "user_id": current_user.id}).to_list()
#     if not characters_desc:
#         raise HTTPException(status_code=404, detail="No characters found for the given script ID.")
#     print(characters_desc)
#     folder_id = "1IrULfBEYg2fLM0QCt9o_Poj-5d33KlMc"
#     generated_characters = []

#     for character in characters_desc:
#         try:
#             # Call OpenAI's image generation API
#             response = client.images.generate(
#                 prompt="create a 3d realisitc and cinematic image of  {character.character_name}:{character.character_description}",
#                 model="black-forest-labs/FLUX.1-schnell",
#                 n=1,
#             )
#             # Get the URL of the generated image
#             image_url = response.data[0].url

#             # Save the image locally
#             image_data = requests.get(image_url).content
#             image_path = os.path.join("images", f"image_{character.character_name}.png")
#             with open(image_path, "wb") as image_file:
#                 image_file.write(image_data)

#             # image_urls.append({"prompt": character_prompt, "image_url": image_url, "local_path": image_path})
#             file_id, file_url = upload_to_google_drive(image_path, folder_id)

#             character_image = Characters(
#                 script_id=character.script_id,
#                 character_id=character.id,
#                 image_url=file_url
#             )
#             await character_image.insert()
#             generated_characters.append({
#                 "character_name": character.character_name,
#                 "character_id": str(character.id),
#                 "image_url": file_url,
#             })

#             os.remove(image_path)

#         except Exception as e:
#             raise HTTPException(status_code=500, detail=f"Error generating image for prompt '{character_prompt}': {str(e)}")

#     return {"generated_images": generated_characters}

'''    
@app.post("/generate-character-prompt")
async def generate_character_prompt():
    char_prompts=[]
    if app.state.generated_characters is None:
        return{"error": "no characters generated yet"}
    for character in app.state.generated_characters:
        print(character)
        #generated_characters=app.state.generated_characters
        gemini_prompt = (
            "make it as a one line prompt for giving for an image generation model "
            + "'" + character + "'"
        )
        response=model.generate_content(gemini_prompt)
        character_prompt=response.text
        char_prompts.append(character_prompt)
        
    app.state.character_prompts=char_prompts
        


    return char_prompts

    '''

'''
@app.post("/generate-image")
async def generate_image():
    """
    Generate an image based on a given prompt using OpenAI's DALL·E.
    """
    for character_prompt in app.state.character_prompts:

        try:
            # Call OpenAI's image generation API
            response = client.images.generate(
            prompt=character_prompt,      # Description of the image          # Image resolution
            model="black-forest-labs/FLUX.1-schnell",
            n=1 ,           # Specify the model (DALL-E 3)
            )
            # Get the URL of the generated image
            image_url = response.data[0].url
            return {"prompt": request.prompt, "image_url": image_url}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
'''
'''
def parse_character_data(text_data):
    characters = []
    current_character = {}

    for line in text_data.split('\n'):
        line = line.strip()  # Remove leading/trailing whitespace

        if line.startswith("name:"):
            if current_character:
                characters.append(current_character)
            current_character = {"name": line.split(":")[1].strip()}
        elif line.startswith("traits:"):
            current_character["traits"] = line.split(":")[1].strip().split(", ")
        elif line.startswith("features:"):
            current_character["features"] = line.split(":")[1].strip().split(", ")

    if current_character:
        characters.append(current_character)

    return characters

'''

'''
@router.post("/generate-image")
async def generate_image(script_id: PydanticObjectId, current_user: User = Depends(get_current_user)):
    """
    Generate images based on character prompts and save them locally.
    """
    if not ObjectId.is_valid(script_id):
        raise HTTPException(status_code=400, detail="Invalid script ID.")
    
    characters_desc = await CharacterDesc.find({"script_id": ObjectId(script_id), "user_id": current_user.id}).to_list()
    if not characters_desc:
        raise HTTPException(status_code=404, detail="No characters found for the given script ID.")
    
    image_urls = []

    for idx, character_prompt in enumerate(app_state.character_prompts):
        try:
            # Call OpenAI's image generation API
            response = client.images.generate(
                prompt="create a 3d realisitc and cinematic image of  "+character_prompt,
                model="black-forest-labs/FLUX.1-schnell",
                n=1,
            )
            # Get the URL of the generated image
            image_url = response.data[0].url

            # Save the image locally
            image_data = requests.get(image_url).content
            image_path = os.path.join("images", f"image_{idx + 1}.png")
            with open(image_path, "wb") as image_file:
                image_file.write(image_data)

            image_urls.append({"prompt": character_prompt, "image_url": image_url, "local_path": image_path})

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error generating image for prompt '{character_prompt}': {str(e)}")

    return {"generated_images": image_urls}


'''