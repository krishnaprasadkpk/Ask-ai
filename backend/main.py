from contextlib import asynccontextmanager
from configurations import init_db
from fastapi import FastAPI
from routes import router
from starlette.middleware import Middleware
from starlette.middleware.cors import CORSMiddleware

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    
    yield

app=FastAPI(lifespan=lifespan)

app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000",
                       "https://ask-ai.up.railway.app/"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


app.include_router(router)


   