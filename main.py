import os
from dotenv import load_dotenv

# Load env variables
load_dotenv()

from fastapi.middleware.cors import CORSMiddleware
from core.apis.api import app

# CORS — allow requests from frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # change to frontend url later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "core.apis.api:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
    )