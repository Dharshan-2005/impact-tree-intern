import modal

# 1. Define the container environment and all necessary dependencies
image = (
    modal.Image.debian_slim(python_version="3.10")
    .pip_install(
        "fastapi",
        "uvicorn",
        "python-multipart",
        "opencv-python-headless", # Crucial for server environments
        "ultralytics",
        "torch",
        "torchvision",
        "numpy",
        "python-dotenv",
        "google-genai",
        "pillow"
    )
    .apt_install("libgl1-mesa-glx", "libglib2.0-0")
    .add_local_dir(".", remote_path="/root/src") 
)

app = modal.App("aass-safety-supervisor")

# 2. Define the Web Endpoint
@app.function(
    image=image,
    gpu="T4",
    secrets=[modal.Secret.from_dotenv()], 
    min_containers=1 # <--- UPDATED: This replaces keep_warm=1
)
@modal.asgi_app()
def serve_fastapi():
    # Append the cloud directory to the system path so Python can find your files
    import sys
    sys.path.append("/root/src")
    
    # Import the FastAPI app from your main.py file
    from main import app as fastapi_app
    return fastapi_app