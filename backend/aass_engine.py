import os
import cv2
import torch
import numpy as np
from ultralytics import YOLO
import json
import PIL.Image
from dotenv import load_dotenv
import re

load_dotenv()

try:
    from google import genai
    VLM_AVAILABLE = True
except ImportError:
    VLM_AVAILABLE = False

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# ⚠️ REMEMBER: Replace these with your actual model metrics for your submission
MODEL_METRICS = {
    "precision": 0.9280,
    "recall": 0.8777,
    "f1": 0.902,
    "map50": 0.9234,
    "map50_95": 0.7308,
}

# The "Danger Radius" for machinery proximity
PROXIMITY_THRESHOLD_PX = 120 
VALID_PPE_CLASSES = {"helmet", "gloves", "goggles", "vest"}

CLASS_MAP = {
    "helmet": "helmet",
    "hardhat": "helmet",
    "gloves": "gloves",
    "goggles": "goggles",
    "safety glasses": "goggles",
    "vest": "vest",
}

# ───────────── VLM (Context-Aware PPE Verification) ─────────────
class VLMSceneAnalyzer:
    def __init__(self):
        self.client = None
        key = os.getenv("GEMINI_API_KEY")
        if key and VLM_AVAILABLE:
            self.client = genai.Client(api_key=key)

    def analyze_scene_context(self, frame):
        if not self.client:
            return {"scene_type": "industrial", "danger_level": 2, "required_ppe": ["helmet", "gloves", "goggles"]}

        try:
            img = PIL.Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            
            # 🔥 UPDATED PROMPT: Forces the VLM to choose from specific environments
            prompt = f"""
Return ONLY JSON.

Detect:
- scene_type (Choose ONLY from this list: "Construction Site", "Foundry / Forging", "Warehouse", "Manufacturing Assembly", "Oil & Gas Refinery")
- danger_level (1-3)
- required_ppe ONLY from {list(VALID_PPE_CLASSES)}
"""
            res = self.client.models.generate_content(model="gemini-2.5-flash", contents=[prompt, img])
            txt = re.sub(r'```json|```', '', res.text).strip()
            parsed = json.loads(txt)

            safe = [v for p in parsed.get("required_ppe", []) for v in VALID_PPE_CLASSES if v in p.lower()]
            parsed["required_ppe"] = safe or ["helmet"]
            return parsed
        except Exception as e:
            print(f"VLM Error: {e}")
            return {"scene_type": "Industrial Site", "danger_level": 2, "required_ppe": ["helmet", "gloves", "goggles"]}

# ───────────── MACHINE DETECTOR ─────────────
class MachineDetector:
    def __init__(self):
        self.model = YOLO("yolov8n.pt")

    def detect(self, frame):
        res = self.model.predict(frame, conf=0.3, verbose=False)[0]
        boxes = []
        for box, cls in zip(res.boxes.xyxy, res.boxes.cls):
            name = self.model.names[int(cls)].lower()
            if name in ["truck", "bus", "car"]: 
                boxes.append(list(map(int, box.cpu().numpy())))
        return boxes

# ───────────── PPE DETECTOR ─────────────
class PPEDetector:
    def __init__(self, weights):
        self.model = YOLO(weights)

    def detect(self, crop):
        res = self.model.predict(crop, conf=0.15, iou=0.3, verbose=False)[0]
        detected = [CLASS_MAP.get(self.model.names[int(c)].lower(), self.model.names[int(c)].lower()) for c in res.boxes.cls]
        return list(set(detected))

# ───────────── PIPELINE ─────────────
class AASSPipeline:
    def __init__(self, ppe_weights="best.pt"):
        self.vlm = VLMSceneAnalyzer()
        self.machine = MachineDetector()
        self.ppe = PPEDetector(ppe_weights)
        self.pose = YOLO("yolov8n-pose.pt")
        self.cache = None
        self.frame_count = 0

    def process_frame(self, frame):
        out = frame.copy()

        if self.cache is None or self.frame_count % 300 == 0:
            self.cache = self.vlm.analyze_scene_context(frame)

        self.frame_count += 1
        required = self.cache["required_ppe"]

        # Machine detection & Center calculation
        machines = self.machine.detect(frame)
        machine_centers = []
        for m in machines:
            cv2.rectangle(out, (m[0], m[1]), (m[2], m[3]), (255, 140, 0), 2)
            cv2.putText(out, "MACHINE", (m[0], m[1]-5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 140, 0), 2)
            machine_centers.append(((m[0]+m[2])//2, (m[1]+m[3])//2))

        pose = self.pose.predict(frame, conf=0.6, verbose=False)[0]
        workers = []
        max_score = 0
        max_status = "SAFE"

        if pose.keypoints is not None:
            for kp_tensor, box in zip(pose.keypoints.xy, pose.boxes.xyxy):
                x1, y1, x2, y2 = map(int, box.cpu().numpy())
                
                # 🔥 FIX: Safely move GPU tensor to CPU memory for numpy math operations
                kp = kp_tensor.cpu().numpy()
                
                worker_center = ((x1+x2)//2, (y1+y2)//2)
                h, w = frame.shape[:2]

                # --- 1. Dynamic Virtual Geofencing (Machine Proximity) ---
                proximity_alert = False
                for mc in machine_centers:
                    dist = np.linalg.norm(np.array(worker_center) - np.array(mc))
                    if dist < PROXIMITY_THRESHOLD_PX + 50: 
                        cv2.line(out, worker_center, mc, (0, 165, 255), 2)
                    if dist < PROXIMITY_THRESHOLD_PX:
                        proximity_alert = True

                # --- 2. Predictive Kinematic Safety (Fall & Posture Analysis) ---
                is_fallen = False
                bad_posture = False
                box_w = x2 - x1
                box_h = y2 - y1

                if box_w > box_h * 1.2:
                    is_fallen = True
                
                if kp[5][0] > 0 and kp[11][0] > 0:
                    dy = kp[11][1] - kp[5][1]
                    dx = kp[11][0] - kp[5][0]
                    angle = np.abs(np.degrees(np.arctan2(dy, dx)))
                    if angle < 45 or angle > 135: 
                        bad_posture = True

                # --- 3. PPE Verification ---
                pad = 30
                crop_y1, crop_y2 = max(0, y1 - pad), min(h, y2 + pad)
                crop_x1, crop_x2 = max(0, x1 - pad), min(w, x2 + pad)
                crop = frame[crop_y1:crop_y2, crop_x1:crop_x2]
                detected_ppe = self.ppe.detect(crop) if crop.size > 0 else []

                missing_ppe = [r for r in required if r not in detected_ppe]

                # --- Status Scoring ---
                score = len(missing_ppe) * 3 
                if bad_posture: score += 5
                if proximity_alert: score += 15
                if is_fallen: score += 25

                status = "SAFE"
                color = (0, 200, 80)
                if score >= 15:
                    status = "EMERGENCY"
                    color = (0, 0, 255)
                elif score >= 5:
                    status = "WARNING"
                    color = (0, 165, 255)

                cv2.rectangle(out, (x1, y1), (x2, y2), color, 2)
                
                labels = [status]
                if is_fallen: labels.append("FALL DETECTED")
                if proximity_alert: labels.append("DANGER: MACHINE PROXIMITY")
                if bad_posture: labels.append("BAD LIFTING POSTURE")

                for i, label in enumerate(labels):
                    cv2.putText(out, label, (x1, y1 - 10 - (i*15)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

                workers.append({
                    "status": status,
                    "missing_ppe": missing_ppe,
                    "proximity_alert": proximity_alert,
                    "is_fallen": is_fallen,
                    "bad_posture": bad_posture
                })

                if score > max_score:
                    max_score = score
                    max_status = status

        return {
            "output_frame": out,
            "metadata": {
                "scene": self.cache["scene_type"],
                "global_status": max_status,
                "global_score": float(max_score),
                "workers": workers,
                "machine_count": len(machines),
                "requirements": required
            }
        }