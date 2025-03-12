import uvicorn
from curiousikid.api import app

def main():
    """Run the FastAPI application with uvicorn"""
    uvicorn.run(
        "curiousikid.api:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )

if __name__ == "__main__":
    main() 