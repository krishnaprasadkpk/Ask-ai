
from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
import os
from openai import OpenAI
from dotenv import load_dotenv
import google.generativeai as genai
load_dotenv()


app = FastAPI()

client=OpenAI(api_key=os.getenv("TOGETHER_API_KEY"), base_url="https://api.together.xyz/v1")
# Load environment variables
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


# Initialize OpenAI API key

# Initialize FastAPI
class ScriptPrompt(BaseModel):
    prompt: str

@app.post("/generate-characters")
async def generate_character_details(request: ScriptPrompt):
    gemini_prompt = (
            "Find each character from this script and create an array for each character including its features, traits, and other details for generating an image: "
            + request.prompt
        )
    
    response=model.generate_content(gemini_prompt)
    return {"characters":response.text}
'''
@app.post("/generate-character-prompt")
async def generate_character_prompt():
'''




# Request schema
class ImagePrompt(BaseModel):
    prompt: str

@app.post("/generate-image")
async def generate_image(request: ImagePrompt):
    """
    Generate an image based on a given prompt using OpenAI's DALL·E.
    """
    try:
        # Call OpenAI's image generation API
        response = client.images.generate(
        prompt=request.prompt,      # Description of the image          # Image resolution
        model="black-forest-labs/FLUX.1-schnell",
        n=1 ,           # Specify the model (DALL-E 3)
        )
        # Get the URL of the generated image
        image_url = response.data[0].url
        return {"prompt": request.prompt, "image_url": image_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
