# 🛣️ UrbanGuard AI: Autonomous Pothole, Structural Defect & Micro-Flooding Lifecycle Engine

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
| **🔒 Unified Secure Login Portal** | Tabbed card for **Citizens, Workers, and Admins** to authenticate dynamically. Bypassing portal pages triggers immediate redirection back to login. | `login.html`, custom dynamic session checks |
| **📸 Direct Camera & Photo Intake** | 1-Step file dropzone, native mobile capture (`capture="environment"`), and WebRTC live viewfinder stream. | `getUserMedia` API & HTML5 File API |
| **🧠 AI Defect Segmentation** | In-browser pixel sampling analyzing brightness contrast pit cavities & depth estimation. | HTML5 Canvas API (`getImageData`) |
| **🛰️ Binary EXIF GPS & GIS Engine** | Extracts camera coordinates directly from JPEG binary tags down to sub-meter precision. | ES6 Binary JPEG Parser (`parseExifGPS`) & Leaflet.js |
| **🗺️ Default Indian Map & Zooming** | Map defaultly centers on India (`[20.5937, 78.9629]`, zoom level 5). Uploading a photo triggers precise map fly-to panning (`zoom level 18`). | Leaflet.js & Nominatim Reverse API |
| **👤 Citizen Contact Detail Intake** | Citizens are required to provide their Full Name and Phone Number when reporting. Phone is prefilled if they logged in with mobile. | Form inputs, HTML5 validation checks |
| **📋 Isolated Personal History List** | Citizens see overall city stats and maps, but their history section shows **only complaints they reported**, completely isolating their data. | `sessionStorage`, client-side array filters |
| **👷 Worker Portal Task Filtering** | Worker dashboard displays **only work orders assigned to their specific squad or name**, hiding other crews' tasks. | `worker.html` & `js/worker.js` roster check |
| **🌊 Micro-Flooding Correlation** | Analyzes blue-channel water reflection dominance to flag active waterpooling hazards. | Esri Satellite & Esri Terrain Tiles |
| **🤖 AI Worker Auto-Assignment** | Automatically evaluates urgency & location to auto-assign municipal repair squads. | Automated dispatch engine |
| **🧠 AI Before vs After Verification** | Compares citizen "Before" defect images with worker "After" repair proof. | Pixel smoothness & crater fill verification ($\ge 80\%$) |
| **👑 Urgency Priority Scoring** | Ranks work orders dynamically from **Highest ($100$) to Lowest ($0$) Urgency**. | Priority calculation engine |
| **👑 Operations Command Center** | Secure portal restricted to higher municipal authorities showing all city complaints, field workers directory, and CSV exporter. | `admin.html` & `js/admin.js` |

---

## 📂 Repository Structure

```
urbanguard-ai/
├── README.md           # Project Documentation & Architectural Guide
├── server.py           # Full-Stack Python REST API, Web Server & MongoDB client
├── login.html          # Unified Secure tabbed Login Portal (Citizens, Workers, Admins)
├── index.html          # Public Citizen Vision AI Defect Portal & Personal History
├── worker.html         # Restricted Worker Repair Completion Queue
├── admin.html          # Secure Administrator Operations Command Center
├── db/
│   ├── reports.json    # Persistent Defect Reports JSON Database
│   ├── workers.json    # Persistent Worker Squads JSON Database
│   └── sms_logs.json   # Local SMS dispatch event logs
├── css/
│   ├── citizen.css     # External CSS for Citizen Portal & History Styles
│   ├── worker.css      # External CSS for Worker Portal
│   └── admin.css       # External CSS for Administrator Portal
└── js/
    ├── citizen.js      # Citizen Portal JS (EXIF, AI Segmentation, Isolated History)
    ├── worker.js       # Worker Portal JS (Filtered Work Queue, BEFORE/AFTER verification)
    └── admin.js        # Admin Portal JS (Urgency Queue, Squad Directory table formatting)
```

---

## 🛠️ Tech Stack & Tools

- **Frontend HUD**: Pure HTML5, CSS3 Custom Properties (Flex-Wrap responsive design layouts), Plus Jakarta Sans & JetBrains Mono fonts.
- **Computer Vision Engine**: Pure JavaScript HTML5 Canvas API pixel luminance sampling.
- **GIS Telemetry & Mapping**: Leaflet.js, Esri World Imagery (Satellite), Esri World Topo Map (Terrain), CartoDB Dark Matter.
- **Geocoding & Location**: ES6 Binary JPEG EXIF Reader (`parseExifGPS`), OpenStreetMap Nominatim Reverse Geocoder.
- **Backend API**: Python REST API Server (`server.py`), MongoDB engine fallback, & File-Backed Persistent Database.

---

## ⚡ Quick Start & Running Locally

1. **Launch Full-Stack Server**:
   ```bash
   python server.py
   ```

2. **Open in Web Browser**:
   - **Unified Secure Login**: `http://localhost:8000/login.html` (Redirects automatically if opening other portals unauthenticated)
   - **Citizen Defect Portal**: `http://localhost:8000/index.html` (Requires Citizen Login)
   - **Worker Repair Queue**: `http://localhost:8000/worker.html` (Requires Worker Login)
   - **Administrator Command Center**: `http://localhost:8000/admin.html` (Requires Admin passcode: `admin123` or `cityadmin`)

---

## 📄 License & Attribution

Developed for **Smart City / Urban Infrastructure Maintenance Platform Hackathon 2026**.
