# 🛣️ Autonomous Urban Pothole, Structural Defect & Micro-Flooding Lifecycle Engine

> **Domain**: Smart City / Urban Infrastructure / GIS / Computer Vision  
> **Repository**: [Agentic-Ai-Hackthon](https://github.com/vu241fa04461-hash/Agentic-Ai-Hackthon.git)

---

## 📌 Project Overview

Urban road and drainage maintenance is traditionally **reactive**, relying on delayed manual complaints. Waterlogging traps in surface road cracks, accelerating sub-base layer erosion and forming deep craters under heavy traffic.

This platform bridges citizens, computer vision, field repair workers, and municipal engineers into an **autonomous visual and geospatial lifecycle engine**. It detects road defects, estimates crater depth ($cm$) and surface area ($m^2$), correlates micro-flooding hotspots, suppresses duplicate complaints, auto-assigns repair squads, verifies before/after repair proof, and orders work orders from **Highest to Lowest Urgency ($100 \rightarrow 0$)**.

---

## 🚀 Key Features

| Feature | Description | Implementation Details |
| :--- | :--- | :--- |
| **📸 Direct Camera & Photo Intake** | 1-Step file dropzone, native mobile capture (`capture="environment"`), and WebRTC live viewfinder stream | `getUserMedia` API & HTML5 File API |
| **🧠 AI Defect Segmentation** | In-browser pixel sampling analyzing brightness contrast pit cavities & depth estimation | HTML5 Canvas API (`getImageData`) |
| **🛰️ Binary EXIF GPS & GIS Engine** | Extracts camera coordinates directly from JPEG binary tags down to sub-meter precision | ES6 Binary JPEG Parser (`parseExifGPS`) & Leaflet.js |
| **🌊 Micro-Flooding Correlation** | Analyzes blue-channel water reflection dominance to flag active waterpooling hazards | CartoDB Dark, Esri Satellite & Esri Terrain Tiles |
| **🤖 AI Worker Auto-Assignment** | Automatically evaluates urgency & location to auto-assign municipal repair squads | Automated dispatch engine |
| **👷 Worker Proof-of-Completion Portal** | Dedicated field worker portal (`worker.html`) to upload "After Repair Photos" | Passcode protected (`worker123`) |
| **🧠 AI Before vs After Verification** | Compares citizen "Before" defect images with worker "After" repair proof | Pixel smoothness & crater fill verification ($\ge 80\%$) |
| **👑 Urgency Priority Scoring** | Ranks work orders dynamically from **Highest ($100$) to Lowest ($0$) Urgency** | Priority calculation engine |
| **🔒 Passcode Admin Command Center** | Secure portal restricted to higher municipal authorities to dispatch squads & solve tickets | Passcode gate (`admin123`) & CSV exporter |

---

## 📂 Repository Structure

```
urbanguard-ai/
├── README.md           # Project Documentation & Architectural Guide
├── server.py           # Full-Stack Python REST API & Web Server
├── db/
│   ├── reports.json    # Persistent Defect Reports JSON Database
│   └── workers.json    # Persistent Worker Squads JSON Database
├── manifest.json       # Progressive Web App (PWA) Manifest
├── sw.js               # Service Worker for Offline Asset Caching
├── index.html          # Public Citizen Vision AI Defect Portal (Unified Entrypoint)
├── worker.html         # Restricted Worker Repair Completion Portal (Passcode: worker123)
├── admin.html          # Secure Administrator Command Portal (Passcode: admin123)
├── css/
│   ├── citizen.css     # External CSS for Citizen Portal
│   ├── worker.css      # External CSS for Worker Portal
│   └── admin.css       # External CSS for Administrator Portal
└── js/
    ├── citizen.js      # Citizen Portal JS (REST API, WebRTC Camera, EXIF, AI Segmentation)
    ├── worker.js       # Worker Portal JS (REST API, AI Before vs After Repair Verification)
    └── admin.js        # Admin Portal JS (REST API, Urgency Queue, Side-by-Side BEFORE/AFTER)
```

---

## 🛠️ Tech Stack & Tools

- **Frontend HUD**: Pure HTML5, CSS3 Custom Properties, Plus Jakarta Sans & JetBrains Mono fonts.
- **Computer Vision Engine**: Pure JavaScript HTML5 Canvas API pixel luminance sampling.
- **GIS Telemetry & Mapping**: Leaflet.js, Esri World Imagery (Satellite), Esri World Topo Map (Terrain), CartoDB Dark Matter.
- **Geocoding & Location**: ES6 Binary JPEG EXIF Reader (`parseExifGPS`), OpenStreetMap Nominatim Reverse Geocoder.
- **Backend API**: Python REST API Server (`server.py`) & File-Backed Persistent Database (`db/reports.json`).

---

## ⚡ Quick Start & Running Locally

1. **Launch Full-Stack Server**:
   ```bash
   python server.py
   ```

2. **Open in Web Browser**:
   - **Public Citizen Portal**: `http://localhost:8000/index.html`
   - **Worker Repair Portal**: `http://localhost:8000/worker.html` *(Passcode: `worker123`)*
   - **Administrator Command Portal**: `http://localhost:8000/admin.html` *(Passcode: `admin123`)*

---

## 📄 License & Attribution

Developed for **Smart City / Urban Infrastructure Maintenance Platform Hackathon 2026**.
