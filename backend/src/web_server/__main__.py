import uvicorn
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get environment variables with defaults
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", 8000))
RELOAD = os.getenv("RELOAD", "True").lower() == "true"

if __name__ == "__main__":
    print(f"Starting server at http://{HOST}:{PORT}")
    print(f"API documentation available at http://{HOST}:{PORT}/docs")

    uvicorn.run("web_server.app:app", host=HOST, port=PORT, reload=RELOAD)
