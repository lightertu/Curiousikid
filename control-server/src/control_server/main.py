import uvicorn
from control_server.api import app

def main():
    """Run the FastAPI application with uvicorn"""
    uvicorn.run(
        "control_server.api:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )

if __name__ == "__main__":
    main() 