# FalconZ V1

**AI-Assisted Drone Engineering, Flight Diagnostics & Environmental Monitoring Platform**

FalconZ V1 is a professional engineering toolchain designed to help drone engineers architect custom multirotors, diagnose flight-log telemetry, configure PID loops, and manage ecological inspection workflows through a deterministic software layer augmented by a large language model (Gemini).

---

## 🌍 Live Demo
**[Launch FalconZ V1](https://falconz-version1.vercel.app/)** *(Replace with your exact Vercel/Render URL if different)*

## 🚀 Project Overview

FalconZ is built on the philosophy that AI should assist engineers, not replace engineering math. The core calculations (Thrust-to-Weight ratios, Hover Throttle, Battery Discharge limits, etc.) are purely deterministic. The AI (Falcon AI) provides contextual inference based solely on the active drone configuration and real flight-log data, with strict guardrails preventing hallucinated parameters.

## ✨ Features

- **Command Center Dashboard:** Unified overview tracking configuration completeness, hardware statuses, and environmental payload states.
- **Drone Manager:** Offline-first architecture (`localStorage`) capable of persisting multiple custom airframes locally without requiring a cloud database.
- **Deterministic Engineering Engine:** Derives dynamic outputs like AUW, Max Thrust, TWR, Hover Throttle, Battery Limits, and ESC Margins.
- **Flight Log Analyzer:** Fully native ArduPilot `.BIN` parser. Exposes real flight telemetry, calculates 0-100 algorithmic Health Scores, and visualizes Battery/Vibration graphs.
- **Falcon AI (Powered by Gemini):** Specialized generative AI deeply integrated into the state manager. Provides context-aware inferences based strictly on `[OBSERVED]`, `[CALCULATED]`, or `[USER PROVIDED]` sources.
- **Calibration & PID Tuning:** Custom arrays simulating real-world configuration matrices with preset locks.
- **GPS & Telemetry Tracker:** Offline map/radar simulating Live/Simulated telemetry coordinates.
- **Environmental Mission Workflow:** Orchestrates UNO Q payloads, MQ-135 sensors, Network Camera streaming (RTSP/HTTP), and sequential Water Sampling workflows.
- **Knowledge Base (RAG):** In-built contextual documentation grounded exclusively on factual aerodynamic/drone engineering theories.

---

## 📁 Folder Structure

```
falconz/
├── app/
│   ├── css/                # Custom cascading stylesheets (No frameworks)
│   ├── js/
│   │   ├── app.js          # Main entry & router orchestrator
│   │   ├── router.js       # SPA Route Handler
│   │   ├── store.js        # Global State / localStorage abstraction
│   │   ├── components/     # Reusable DOM components
│   │   ├── services/       # Engineering, GPS, Telemetry, Environment engines
│   │   └── views/          # Module Views (Dashboard, Drones, AI, PID, etc.)
│   └── index.html          # Unified SPA entry point
├── backend/                # Flask Blueprints for API extensions
├── knowledge/              # Grounded engineering documentation for RAG
├── .env                    # Secure Environment Variables (ignored by Git)
├── .gitignore              # Ignored files
├── flight_log_parser.py    # PyMavlink `.BIN` decoding script
├── render.yaml             # Render deployment configuration (Blueprint)
├── requirements.txt        # Python dependencies
└── server.py               # Flask application & API Gateway
```

---

## ⚙️ Installation & Running Locally

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/Falconz-version1.git
   cd Falconz-version1
   ```

2. **Set up Virtual Environment:**
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

3. **Configure Environment Variables:**
   ```bash
   cp .env.example .env
   ```
   Open `.env` and add your API Key:
   `GEMINI_API_KEY="your-actual-api-key"`

4. **Run the Server:**
   ```bash
   python3 server.py
   ```
   Navigate to [http://127.0.0.1:5001](http://127.0.0.1:5001)

---

## ☁️ Deployment

FalconZ V1 is fully prepared for cloud deployment on platforms like [Render](https://render.com) and [Vercel](https://vercel.com).

### Vercel Deployment Guide (Recommended)

1. Log into your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** and select **Project**.
3. Import your GitHub repository (`Falconz-version1`).
4. Vercel will automatically detect the `vercel.json` file.
5. Expand the **Environment Variables** section.
6. Add the following secret variable:
   - **Key:** `GEMINI_API_KEY`
   - **Value:** `<Your Google Gemini API Key>`
7. Click **Deploy**.

Vercel will use `@vercel/python` to build and serve the Flask backend serverlessly.

### Render Deployment Guide

1. Log into your Render dashboard.
2. Click **New +** and select **Blueprint**.
3. Connect your GitHub repository (`Falconz-version1`).
4. Render will automatically read the `render.yaml` configuration file and detect the Web Service.
5. In the Render Dashboard, go to your new Web Service -> **Environment**.
6. Add the following secret variable manually:
   - **Key:** `GEMINI_API_KEY`
   - **Value:** `<Your Google Gemini API Key>`
7. Save and Trigger Deploy.

Render will use `gunicorn server:app` to run the application in a production-ready environment without debug mode.

---

## 💻 Technologies Used

- **Frontend:** Vanilla JavaScript (ES6 Modules), HTML5, CSS3, Chart.js.
- **Backend:** Python 3.9+, Flask, Gunicorn.
- **Telemetry Parsing:** PyMavlink (DFReader).
- **AI Infrastructure:** Google GenAI SDK (Gemini Flash).

---

## 🖼 Screenshots Placeholder
*(Add images of the Command Center, Flight Log Analyzer, and Falcon AI here).*

---

## 🔮 Future Scope
- Live Serial/MAVLink hardware connections (WebSerial API).
- Cloud synchronization (PostgreSQL backend replacing localStorage).
- Live RTSP streaming multiplexing over WebRTC.

## 📄 License
MIT License
