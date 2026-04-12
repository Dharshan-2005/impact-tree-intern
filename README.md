# 🛡️ AI-Powered Autonomous Safety Supervisor (AASS)

[cite_start]An intelligent real-time industrial safety monitoring system that transforms passive CCTV feeds into active safety supervision using AI[cite: 11].

---

## 🚀 Project Overview

[cite_start]The AI-Powered Autonomous Safety Supervisor (AASS) is designed to improve workplace safety in industrial environments by detecting PPE compliance violations, dangerous proximity to machinery, and context-aware safety requirements[cite: 14]. 

[cite_start]Unlike traditional systems, AASS uses contextual reasoning and computer vision to reduce false alerts and improve real-world reliability[cite: 12].

---

## 🎯 Problem Statement

Industrial safety systems face major challenges:
* [cite_start]❌ **Context blindness:** Alerts everywhere leading to alert fatigue[cite: 17].
* [cite_start]❌ **Invisible Risks:** Inability to detect near-miss incidents[cite: 18].
* [cite_start]❌ **Delayed Response:** Slow reactions to safety violations or man-down incidents[cite: 19].

This project solves these using a hybrid AI approach.

---

## 🔥 Key Features

* **✅ Context-Aware PPE Verification:** Uses a Vision-Language Model (VLM) to dynamically determine required PPE. [cite_start]Detects Helmets, Gloves, Goggles, and Safety Vests[cite: 21, 23].
* [cite_start]**⚠️ Dynamic Machine Proximity Detection:** Detects machinery (cars, trucks, etc.), calculates the distance between worker and machine, and triggers immediate alerts when a worker enters a danger radius[cite: 26, 27].
* **🧠 Hybrid AI Pipeline:** Utilizes VLM (Gemini) for scene understanding every 300 frames, YOLOv8 for PPE and machine detection, YOLOv8-Pose for worker detection, and a Custom Risk Engine for safety scoring.
* **📡 Real-Time Streaming System:** The backend streams processed frames using NDJSON, while the frontend renders a live annotated video feed.

---

## 🏗️ System Architecture

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
