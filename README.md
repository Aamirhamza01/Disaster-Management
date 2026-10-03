# AI Disaster Intelligence & Community Response System

An end-to-end, AI-powered early warning and disaster response orchestration platform built to empower State Disaster Management Authorities (SDMA), emergency response operators, and citizens during natural hazards (floods, earthquakes, cyclones, heatwaves, and landslides).

---

##  Architecture & Component Overview

```mermaid
graph TD
    subgraph Ingestion ["1. Multi-Source Ingestion Engine"]
        IMD["IMD Weather & Satellite Radar API"]
        CWC["CWC River Water Level Gauge Stream"]
        SACHET["NDMA SACHET CAP Alerts Feed"]
    end

    subgraph AIService ["2. AI Anomaly Engine (FastAPI)"]
        IngestEngine["Ingestion & Normalization Engine"]
        AnomalyDetector["Time-Series Anomaly Detection Algorithm"]
        RiskFusion["Hazard Risk Fusion & Rule Engine"]
    end

    subgraph BackendCore ["3. Core Orchestrator Backend (Node.js/Express)"]
        MongoDB[("MongoDB Database")]
        GeoEngine["Turf.js Geofencing & Spatial Buffer"]
        AlertRouter["Alert Routing & Retraction Engine"]
    end

    subgraph PresentationWeb ["4. SDMA & Operator Console (React/Vite)"]
        AIHub["AI Anomaly Hub & Telemetry Charts"]
        ApprovalQueue["SDMA Approval & Dissemination Queue"]
        EventEditor["Bilingual Alert Editor (EN/HI) & District Selector"]
        CitizenDashboard["Situational Awareness Dashboard"]
        SimulationLab["Disaster Simulation Lab"]
        ImpactIntel["Impact Intelligence & Estimation"]
        RecoveryTrack["Recovery Tracking"]
        CommandCenter["Emergency Command Center"]
    end

    subgraph CitizenDelivery ["5. Public Citizen Web Portal & Feeds"]
        CitizenWeb["Public Citizen Portal (React/Vite)<br/>• District Hazard Risk & GPS Location<br/>• 1-Tap Safety Check-In ('I'm Safe' / 'Need Help')<br/>• Field Incident Reporting<br/>• Emergency Shelters & Safety Guides"]
        CAPEndpoints["NDMA SACHET / CAP 1.2 Feeds<br/>(/api/feeds/cap.xml)"]
        BrowserAlerts["Web Browser Push Notifications"]
    end

    DataIngestion --> AIService
    AIService -->|AI Alert Proposals| BackendCore
    PresentationWeb <-->|REST API & Approvals| BackendCore
    BackendCore --> CitizenDelivery
```

---

## 📦 Project Structure

```
Disaster-Management/
├── backend/                  # Node.js + Express + Mongoose API
│   ├── src/
│   │   ├── models/           # Mongoose schemas (DisasterEvent, HazardReading, AiAlert, CitizenCheckIn, ...)
│   │   ├── routes/           # REST endpoints (events, aiAlerts, hazardReadings, citizens, capFeeds, ...)
│   │   ├── services/         # alertService (Turf.js geo-containment, retractions)
│   │   ├── middleware/       # JWT auth, role validation, rate limiters
│   │   └── server.js         # Entry point
│   ├── Dockerfile            # Container configuration
│   └── package.json
│
├── ai-service/               # Python 3.13 + FastAPI AI Anomaly Microservice
│   ├── ingestors/            # IMD, CWC river gauge, and SACHET ingestors
│   ├── models/               # Time-series anomaly detection & explainability
│   ├── engine/               # Rule-based risk fusion matrix
│   ├── main.py               # FastAPI server and background scheduler
│   └── requirements.txt
│
├── admin-web/                # React 19 + TypeScript + Vite Web Application
│   ├── src/
│   │   ├── pages/            # Operator Console (AI Hub, Command Center, Simulation, Recovery)
│   │   │   └── citizen/      # Public Citizen Web Portal (/citizen)
│   │   ├── components/       # Layouts, Citizen Layout, Maps, Charts
│   │   └── api/              # Typed Axios API client
│   └── public/
│       └── browser-alerts.html # Live CAP browser notification subscriber
│
└── docker-compose.yml        # Multi-service local & cloud orchestration
```

---

## 🚨 Indian Hazard Taxonomy & Severity Standards

The system adheres to Indian Disaster Management Authority standards:

### Hazard Categories
- **Meteorological / Hydrological**: Flood, Flash Flood, Heavy Rainfall, Urban Waterlogging, Cyclone, Heatwave, Coldwave, Drought.
- **Geological**: Earthquake, Landslide, Tsunami.
- **Industrial / Technological**: Chemical Spill, Fire, Gas Leakage.

### Severity Matrix
| Severity | NDMA Color | Criteria | Action |
| :--- | :--- | :--- | :--- |
| **Advisory** | 🟡 Yellow | Early warning, monitor updates | Standard bulletin notice |
| **Watch** | 🟠 Orange | Significant risk expected, prepare | High priority notification |
| **Warning** | 🔴 Red | High danger to life/property | Urgent citizen alert chime |
| **Emergency** | 🟣 Dark Red | Imminent catastrophe / evacuation | Full alert modal + continuous siren |

---

## 🔄 SDMA Event Approval Lifecycle

1. **AI Discovery or Researcher Draft**:
   - The AI Anomaly service detects abnormal rainfall/river surge &rarr; creates an `AiAlert` in `pending_review`.
   - Researchers inspect telemetry and click **"Promote to Disaster Event"** (creates a `draft` or `pending_approval` event).
2. **SDMA Operator Review**:
   - SDMA officers review the target district, polygon geofence, and bilingual advisories (English & Hindi).
   - Upon clicking **Approve & Dispatch**, status updates to `published`.
3. **Instant Dissemination**:
   - Turf.js computes points-in-polygon for registered citizens in the targeted district/coordinates.
   - OASIS CAP 1.2 XML/JSON feeds are updated dynamically at `/api/feeds/cap.xml`.
4. **Citizen Situational Awareness**:
   - Citizens visit `/citizen/check-in` and tap **"I am Safe"** or **"Need Help"**.
   - Responses stream into the **Situational Awareness Dashboard** for disaster response team coordination.

---

## 🛠️ Quick Start & Running All Services At Once

You can run the entire stack at once using any of the following methods:

### Option A: Unified Terminal (Single Command)
Run from the root directory to launch the Backend, AI Engine, and Web Application simultaneously:
```bash
npm start
```

### Option B: 1-Click Multi-Window Startup (Windows Recommended)
Spawns each service in its own dedicated, labeled terminal window so you can view individual logs:
- **PowerShell**:
  ```powershell
  .\start-all.ps1
  ```
- **Command Prompt / File Explorer**:
  Double-click `start-all.bat` or run:
  ```cmd
  start-all.bat
  ```


---

### Accessing the Web Portals
- **Public Citizen Safety Portal**: `http://localhost:5173/citizen`
- **Operator Emergency Command Center**: `http://localhost:5173/dashboard`

---

### Individual Service Manual Commands (Optional)
| Component | Directory | Command | Port |
| :--- | :--- | :--- | :--- |
| **Cloud Backend API** | `cd backend` | `npm run dev` | `http://localhost:5000` |
| **AI Anomaly Microservice** | `cd ai-service` | `python main.py` | `http://localhost:8000` |
| **Web Application (Citizen & Admin)** | `cd admin-web` | `npm run dev` | `http://localhost:5173` |


---

## 📜 OASIS CAP 1.2 Feed Integration
- **XML Feed**: `GET http://localhost:5000/api/feeds/cap.xml`
- **JSON Feed**: `GET http://localhost:5000/api/feeds/cap.json`
- **Live Browser Subscriber**: Open `http://localhost:5173/browser-alerts.html` to receive real-time web notifications.
