# AI-Powered Autonomous Safety Supervisor (AASS)

An intelligent real-time industrial safety monitoring system that transforms passive CCTV feeds into active safety supervision using AI.

---

##  Project Overview

The AI-Powered Autonomous Safety Supervisor (AASS) is designed to improve workplace safety in industrial environments by detecting:

- PPE compliance violations  
- Dangerous proximity to machinery  
- Context-aware safety requirements  

Unlike traditional systems, AASS uses contextual reasoning and computer vision to reduce false alerts and improve real-world reliability.

---

##  Problem Statement

Industrial safety systems face major challenges:

-  **Context blindness:** Alerts everywhere leading to alert fatigue  
-  **Invisible Risks:** Inability to detect near-miss incidents  
-  **Delayed Response:** Slow reactions to safety violations or man-down incidents  

This project solves these using a hybrid AI approach.

---

##  Key Features

- ** Context-Aware PPE Verification**  
  Uses a Vision-Language Model (VLM) to dynamically determine required PPE. Detects helmets, gloves, goggles, and safety vests.

- ** Dynamic Machine Proximity Detection**  
  Detects machinery (cars, trucks, etc.), calculates the distance between worker and machine, and triggers alerts when a worker enters a danger radius.

- ** Hybrid AI Pipeline**  
  Utilizes:
  - VLM (Gemini) → Scene understanding (every 300 frames)  
  - YOLOv8 → PPE & machine detection  
  - YOLOv8-Pose → Worker detection  
  - Custom Risk Engine → Safety scoring  

- **📡 Real-Time Streaming System**  
  Backend streams frames using NDJSON, frontend renders live annotated feed.

---

## System Architecture

```text
Input Video/Image
        │
        ▼
Frame Processing Pipeline
        │
        ├── VLM (every 300 frames)
        │     └── Scene + PPE Requirements
        │
        ├── YOLO Models
        │     ├── PPE Detection
        │     ├── Machine Detection
        │     └── Pose Estimation
        │
        └── Risk Scoring Engine
              ├── Missing PPE
              └── Machine Proximity
        │
        ▼
Streaming Output (Frontend UI)
```
# Tech Stack
## AI / ML
- YOLOv8 (Ultralytics)
- YOLOv8-Pose
- Vision-Language Model (Gemini API)
- PyTorch
## Backend
- Python
- FastAPI
- OpenCV
- NumPy
- Uvicorn
## Frontend
- React (Vite)
- JavaScript
- Tailwind CSS
## Streaming
- NDJSON (real-time streaming)
- Base64 encoding

## Installation & Setup
### 1. Clone Repository
- git clone https://github.com/your-username/AASS.git
- cd AASS
### 2. Backend Setup
- pip install -r requirements.txt

- Create .env file:

- GEMINI_API_KEY=your_api_key_here

- Run backend:
- python main.py
- Server runs at:

- http://localhost:8000
### 3. Frontend Setup
- cd frontend
- npm install
- npm run dev

- Frontend runs at:

- http://localhost:5173
### API Endpoints
Upload File
POST /api/upload
Accepts image/video
Streams annotated frames (NDJSON)

### How It Works
- User uploads video/image
- Frames are processed sequentially
- Every 300 frames:
- VLM updates scene context & PPE requirements
- YOLO detects:
- Workers (pose)
- PPE items
- Machines
- Risk engine calculates:
- Missing PPE
- Proximity risk
- Results streamed to frontend

### Model Performance

| Metric | Value |
| :--- | :--- |
| **Precision** | 0.9280 |
| **Recall** | 0.8777 |
| **F1 Score** | 0.902 |
| **mAP@50** | 0.9234 |
| **mAP@50-95** | 0.7308 |

## Demo
[aquamarine-puffpuff-c1d911.netlify.app](https://aquamarine-puffpuff-c1d911.netlify.app/)
