# 🌿 EcoTrackAI+ — Explainable AI Carbon Footprint Optimizer

<div align="center">

![EcoTrackAI+ Banner](https://img.shields.io/badge/EcoTrackAI+-Carbon%20Intelligence%20Platform-06b6d4?style=for-the-badge&logo=leaf&logoColor=white)

[![Live Demo](https://img.shields.io/badge/🚀%20Live%20Demo-Netlify-00C7B7?style=for-the-badge&logo=netlify&logoColor=white)](https://agent-6a2cf9ab88b83f5e890--regal-cuchufli-dbabf8.netlify.app/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)

**[🌐 View Live Demo →](https://agent-6a2cf9ab88b83f5e890--regal-cuchufli-dbabf8.netlify.app/)**

</div>

---

## 📖 About the Project

**EcoTrackAI+** is an enterprise-grade, AI-powered carbon footprint tracking and optimization platform. It combines real-time IoT telemetry simulation, Explainable AI (XAI), Federated Learning, and time-series forecasting into a single, beautiful dashboard — helping individuals and households understand, visualize, and reduce their daily carbon emissions.

The platform is built around the principle of **Responsible AI** — every prediction the AI makes is fully explained to the user using SHAP and LIME, two leading model interpretability frameworks. No black boxes, full transparency.

---

## 🚀 Live Demo

> **[https://agent-6a2cf9ab88b83f5e890--regal-cuchufli-dbabf8.netlify.app/](https://agent-6a2cf9ab88b83f5e890--regal-cuchufli-dbabf8.netlify.app/)**

---

## ✨ Key Features

### 🔌 IoT Telemetry Simulation
- Real-time sensor data stream from simulated smart home devices (Smart Meter, HVAC Controller, OBD-II Telematics, Flow Meter, Bin Weight Sensor)
- Adjustable sliders for energy, transport, diet, water, and waste
- **Quick Lifestyle Presets** — instantly load Eco-Conscious, Average Citizen, or High Footprint profiles
- Live packet log with sensor IDs and timestamps

### 🧠 Explainable AI (XAI)
- **SHAP Waterfall Charts** — visualizes how each feature (electricity, meat servings, commute, etc.) contributes positively or negatively to the carbon prediction
- **LIME Linear Surrogate** — an interactive playground showing local linear approximations of the AI model around the current input
- Helps users understand *why* the AI predicts what it does — not just *what* it predicts

### 📈 AI Time-Series Forecasting
- 30-day historical carbon data + 30-day projection with uncertainty bands
- **Three scenario modes:**
  - 📊 Business As Usual (BAU)
  - 🌱 Eco-Action Plan
  - ⚡ Aggressive Decarbonization Strategy
- Powered by a simulated Bi-LSTM + GRU forecasting model

### 💡 Mitigation Recommendation Engine
- Personalized carbon reduction actions ranked by **AI match score** (based on SHAP feature importance)
- **Knapsack constraint optimizer** — given a CO₂ reduction target, the AI selects the optimal combination of actions
- **Search & Category Filters** — quickly find actions by keyword or category (Energy, Transport, Food, Water, Waste)
- Track adopted actions and see live monthly savings

### 🌐 Federated Learning Simulator
- Visual network graph showing 5 client nodes + global aggregation server
- Simulates the full **FedAvg** training protocol: download → local training → encrypted upload → aggregation
- Live training log console per node
- Tracks model weight convergence toward true carbon coefficients across rounds

### 🏆 Gamification & Leaderboard
- **Environmental Green Score** (0–100) with animated SVG gauge
- Sustainability achievement **badges** unlocked by real user actions
- **Federated Leaderboard** comparing your score against peer households

---

## 🛠️ Tech Stack

| Category | Technology |
|---|---|
| **Frontend Framework** | React 18 + TypeScript |
| **Build Tool** | Vite 6 |
| **Styling** | Vanilla CSS (Dark/Light Glassmorphism Theme) |
| **Icons** | Lucide React |
| **AI Modules** | Custom TypeScript (SHAP, LIME, FedAvg, Knapsack Optimizer) |
| **Charts** | Pure SVG (no external chart library) |
| **Deployment** | Netlify / GitHub Pages |

---

## 🏃 Running Locally

```bash
# Clone the repository
git clone https://github.com/snehalpagare272005-jpg/carbon_footprint_tracker.git

# Navigate to project
cd carbon_footprint_tracker

# Install dependencies
npm install

# Start development server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 📦 Build for Production

```bash
npm run build
```

The production-ready files will be in the `dist/` folder.

---

## 📁 Project Structure

```
src/
├── components/
│   ├── IoTFeed.tsx          # Real-time sensor simulation & sliders
│   ├── XAICharts.tsx        # SHAP waterfall & LIME charts
│   ├── ForecastingChart.tsx # Time-series carbon forecast
│   ├── RecommendationEngine.tsx  # AI optimizer & action cards
│   ├── FederatedGraph.tsx   # FL network simulator & training logs
│   └── Gamification.tsx     # Score gauge, badges & leaderboard
├── utils/
│   ├── predictionModel.ts   # Carbon footprint ML model
│   ├── shapSolver.ts        # SHAP value calculator
│   ├── limeSolver.ts        # LIME surrogate model
│   ├── optimizer.ts         # Knapsack constraint optimizer
│   └── federatedSimulator.ts # FedAvg simulation engine
├── App.tsx                  # Main shell: sidebar, theme, KPI panel
├── App.css                  # Full design system (dark + light themes)
└── types.ts                 # Shared TypeScript interfaces
```

---

## 🎨 UI Highlights

- **Dark Aurora** theme with neon glassmorphism panels
- **Light Frosted** theme for accessibility
- Collapsible sidebar navigation
- Animated SVG charts and network graphs
- Micro-animations on hover, sliders, and gauge transitions
- Fully responsive layout (desktop + mobile)

---

## 📄 License

MIT License — feel free to use, modify, and distribute.

---

<div align="center">
Made with 💚 for a greener planet · <a href="https://agent-6a2cf9ab88b83f5e890--regal-cuchufli-dbabf8.netlify.app/">Live Demo</a>
</div>
