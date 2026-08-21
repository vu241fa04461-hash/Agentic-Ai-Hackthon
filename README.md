# 🛣️ Autonomous Urban Pothole, Structural Defect & Micro-Flooding Lifecycle Engine

> **Domain**: Smart City / Urban Infrastructure / GIS / Computer Vision  
> **Repository**: [Agentic-Ai-Hackthon](https://github.com/vu241fa04461-hash/Agentic-Ai-Hackthon.git)

---

## 📌 Project Overview

Urban road and drainage maintenance is traditionally **reactive**, relying on delayed manual complaints. Waterlogging traps in surface road cracks, accelerating sub-base layer erosion and forming deep craters under heavy traffic.

This platform bridges citizens, computer vision, and municipal engineers into an **autonomous visual and geospatial lifecycle engine**. It detects road defects, estimates crater depth ($cm$) and surface area ($m^2$), correlates micro-flooding hotspots, suppresses duplicate complaints, and orders municipal work-order repair squads from **Highest to Lowest Urgency ($100 \rightarrow 0$)**.

---

## 🚀 Key Features

| Feature | Description | Implementation Details |
| :--- | :--- | :--- |
| **📸 Direct Camera & Photo Intake** | 1-Step file dropzone, native mobile capture (`capture="environment"`), and WebRTC live viewfinder stream | `getUserMedia` API & HTML5 File API |
| **🧠 AI Defect Segmentation** | In-browser pixel sampling analyzing brightness contrast pit cavities & depth estimation | HTML5 Canvas API (`getImageData`) |
| **🛰️ Binary EXIF GPS & GIS Engine** | Extracts camera coordinates directly from JPEG binary tags down to sub-meter precision | ES6 Binary JPEG Parser (`parseExifGPS`) & Leaflet.js |
| **🌊 Micro-Flooding Correlation** | Analyzes blue-channel water reflection dominance to flag active waterpooling hazards | CartoDB Dark, Esri Satellite & Esri Terrain Tiles |
| **⚠️ Duplicate Complaint Filter** | Auto-detects duplicate reports within $20\text{m}$ spatial proximity, merging redundant tickets | Spatial proximity algorithm ($\le 0.0003^\circ$) |
| **👑 Urgency Priority Scoring** | Ranks work orders dynamically from **Highest ($100$) to Lowest ($0$) Urgency** | Priority calculation engine |
| **🔒 Passcode Admin Command Center** | Secure portal restricted to higher municipal authorities to dispatch squads & solve tickets | Passcode gate (`admin123`) & CSV exporter |

---

## 📂 Repository Structure

```
roadmind-ai/
├── README.md           # Project Documentation & Architectural Guide
├── .gitignore          # Git ignore rules
├── index.html          # Public Citizen Vision AI Defect Portal (Entrypoint)
├── Untitled-1.html      # Public Citizen Portal (Alias)
├── admin.html          # Secure Administrator Command Portal (Passcode: admin123)
├── css/
│   ├── citizen.css     # External CSS for Citizen Portal
│   └── admin.css       # External CSS for Administrator Portal
├── js/
│   ├── citizen.js      # External JS (WebRTC Camera, EXIF Reader, AI Segmentation, Duplicate Filter)
│   └── admin.js        # External JS (Passcode Auth, Urgency Sorting Queue, Work-Order Resolver)
└── lib/                # Cross-platform Mobile Application source files (Flutter/Dart)
```

---

## 🛠️ Tech Stack & Tools

- **Frontend HUD**: Pure HTML5, CSS3 Custom Properties, Plus Jakarta Sans & JetBrains Mono fonts.
- **Computer Vision Engine**: Pure JavaScript HTML5 Canvas API pixel luminance sampling.
- **GIS Telemetry & Mapping**: Leaflet.js, Esri World Imagery (Satellite), Esri World Topo Map (Terrain), CartoDB Dark Matter.
- **Geocoding & Location**: ES6 Binary JPEG EXIF Reader (`parseExifGPS`), OpenStreetMap Nominatim Reverse Geocoder.
- **Media Stream**: WebRTC Media Capture and Streams API.

---

## ⚡ Quick Start & Running Locally

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/vu241fa04461-hash/Agentic-Ai-Hackthon.git
   cd Agentic-Ai-Hackthon
   ```

2. **Launch Local Server**:
   ```bash
   python -m http.server 8000
   ```

3. **Open in Web Browser**:
   - **Public Citizen Portal**: `http://localhost:8000/index.html`
   - **Administrator Command Portal**: `http://localhost:8000/admin.html` *(Passcode: `admin123`)*

---

## 🔒 Security & Role Separation

- **Citizen View** (`index.html`): Public photo upload, WebRTC camera viewfinder, AI road state diagnosis, instant ticket creation, zero administrative controls.
- **Higher Authority View** (`admin.html`): Passcode-protected (`admin123`), work order dispatching (`Dispatch Repair Squad`), status resolvers (`Mark Issue Solved`), and CSV data exporter.

---

## 📄 License & Attribution

Developed for **Smart City / Urban Infrastructure Maintenance Platform Hackathon 2026**.
