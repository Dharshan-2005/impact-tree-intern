# AI-Powered Autonomous Safety Supervisor (AASS)

## 📌 Project Overview
[cite_start]The AI-Powered Autonomous Safety Supervisor (AASS) is an intelligent vision system designed to transform passive security cameras into active safety participants[cite: 11]. [cite_start]Operating within the Industrial Health, Safety, and Environment (HSE) domain [cite: 14][cite_start], this system utilizes Contextual Spatial Reasoning and Kinematic Analysis to ensure total safety compliance[cite: 12]. 

[cite_start]AASS acts as a digital supervisor, moving beyond simple object detection to understand *where* workers are and *how* they are moving [cite: 12][cite_start], directly addressing critical flaws in traditional oversight: Context Blindness (Alert Fatigue), Invisible Risks (ergonomic injuries), and Delayed Emergency Response[cite: 16, 17, 18, 19].

## 🚀 Key Features
* [cite_start]**Context-Aware PPE Verification:** Utilizes hierarchical logic to isolate specific body zones (Head, Hands, Feet) and dynamically adjusts compliance requirements based on the worker's specific zone (e.g., Welding Cell vs. Loading Bay)[cite: 21, 22, 23].
* [cite_start]**Dynamic Virtual Geofencing:** Employs virtual 'Red Zones' monitored 24/7[cite: 25]. [cite_start]Interaction logic calculates the distance between moving machinery and workers, triggering immediate alerts for Danger Radius breaches[cite: 26, 27].
* [cite_start]**Predictive Kinematic Safety:** Features an "Ergonomic Guardrail" that monitors spinal and joint angles to flag high-risk lifting postures[cite: 29, 30]. [cite_start]Advanced fall analysis distinguishes between intentional movements (kneeling) and genuine slip-and-fall accidents[cite: 31].

## 🛠️ Tech Stack
* **Computer Vision & AI:** * YOLOv8 (Custom-trained for PPE & Hazard Detection)
  * Pose Estimation (Kinematic analysis & Ergonomic tracking)
  * Moondream2 VLM (Context-aware spatial reasoning)
* **Backend & Processing:** Python, Custom Risk-Scoring Engine
* **Frontend:** React.js dashboard with real-time NDJSON frame streaming
* **Cloud Deployment:** Modal (Backend GPU Inference), Netlify (Frontend UI)

## 📊 Dataset Details & Model Training
[cite_start]The AASS model was trained entirely from scratch using a custom dataset[cite: 33]. 

* [cite_start]**Dataset Source:** Curated and aggregated from Roboflow and Open Images[cite: 39], focusing on diverse industrial environments, varying lighting conditions, and specific PPE classes.
* [cite_start]**Architecture:** State-of-the-art YOLOv8 architecture optimized for real-time edge/cloud inference[cite: 40].
* **Training Process:** The model underwent multi-stage training focusing first on generalized person detection, followed by fine-tuning on localized PPE elements (helmets, vests, boots) and hazardous interactions. 

### Model Performance Scores
* **mAP (Mean Average Precision):** [Enter Score, e.g., 0.88]
* **Precision:** [Enter Score, e.g., 0.91]
* **Recall:** [Enter Score, e.g., 0.85]
* **F1-Score:** [Enter Score, e.g., 0.88]

## ⚙️ Requirements & Local Setup Instructions

### Prerequisites
* Python 3.10+
* Node.js & npm (for React UI)
* Git

### Step-by-Step Installation

**1. Clone the Repository**
```bash
git clone [https://github.com/yourusername/AASS-Safety-Supervisor.git](https://github.com/yourusername/AASS-Safety-Supervisor.git)
cd AASS-Safety-Supervisor
