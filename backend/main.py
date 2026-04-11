import os
import cv2
import uuid
import shutil
import base64
import json
import time
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from aass_engine import AASSPipeline, MODEL_METRICS

app = FastAPI(title="AASS Safety Supervisor")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "temp_images"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Fallback to standard YOLO if custom best.pt doesn't exist
WEIGHTS = "best.pt" if os.path.exists("best.pt") else "yolov8n.pt"
pipeline = AASSPipeline(ppe_weights=WEIGHTS)

@app.get("/api/metrics")
def get_metrics():
    return JSONResponse(content=MODEL_METRICS)

@app.post("/api/upload")
async def upload_image(file: UploadFile = File(...)):
    """
    Accepts a single image or video. 
    Streams the annotated frames back as NDJSON in real-time.
    """
    ext = os.path.splitext(file.filename or "")[-1].lower()
    tmp_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}{ext}")

    with open(tmp_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    def frame_generator():
        cap = None
        try:
            video_exts = {".mp4", ".avi", ".mov", ".mkv", ".webm"}
            if ext in video_exts:
                cap = cv2.VideoCapture(tmp_path)
                frame_idx = 0
                
                while True:
                    cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
                    ok, frame = cap.read()
                    if not ok:
                        break
                    
                    results = pipeline.process_frame(frame)
                    _, buf = cv2.imencode(".jpg", results["output_frame"], [cv2.IMWRITE_JPEG_QUALITY, 85])
                    b64 = base64.b64encode(buf.tobytes()).decode("utf-8")
                    
                    data = {
                        "image_b64": b64,
                        "metadata": results["metadata"],
                        "frame_number": frame_idx
                    }
                    
                    # Yield as Newline Delimited JSON chunk
                    yield json.dumps(data) + "\n"
                    
                    # Advance by 30 frames (~1 sec of video)
                    frame_idx += 30 
                    
            else:
                # Single Image fallback
                frame = cv2.imread(tmp_path)
                if frame is not None:
                    results = pipeline.process_frame(frame)
                    _, buf = cv2.imencode(".jpg", results["output_frame"], [cv2.IMWRITE_JPEG_QUALITY, 88])
                    b64 = base64.b64encode(buf.tobytes()).decode("utf-8")
                    data = {
                        "image_b64": b64,
                        "metadata": results["metadata"],
                        "frame_number": 0
                    }
                    yield json.dumps(data) + "\n"
        finally:
            # 🔥 FIX: Release the video capture object immediately to free the file lock
            if cap is not None:
                cap.release()
                
            # 🔥 FIX: Attempt to remove the file safely with a slight delay
            if os.path.exists(tmp_path):
                try:
                    time.sleep(0.1) 
                    os.remove(tmp_path)
                except Exception as e:
                    print(f"Cleanup Warning: Could not remove temp file {tmp_path}: {e}")

    return StreamingResponse(frame_generator(), media_type="application/x-ndjson")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)