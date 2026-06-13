import { useState, useMemo } from 'react';
import type { IoTTelemetry } from './types';
import { getAverageTelemetry, telemetryToVector, predictCarbonFootprint } from './utils/predictionModel';
import { calculateSHAP } from './utils/shapSolver';
import { calculateLIME } from './utils/limeSolver';
import { IoTFeed } from './components/IoTFeed';
import { XAICharts } from './components/XAICharts';
import { FederatedGraph } from './components/FederatedGraph';
import { ForecastingChart } from './components/ForecastingChart';
import { RecommendationEngine } from './components/RecommendationEngine';
import { Gamification } from './components/Gamification';
import { BASE_RECOMMENDATIONS } from './utils/optimizer';
import { 
  Cpu, 
  Activity, 
  Calendar, 
  Leaf, 
  Network, 
  Award,
  Globe,
  Radio,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState<'iot' | 'xai' | 'forecast' | 'recommendations' | 'federated' | 'gamification'>('iot');
  const [telemetry, setTelemetry] = useState<IoTTelemetry>(getAverageTelemetry());
  const [adoptedIds, setAdoptedIds] = useState<string[]>([]);
  const [currentWeights, setCurrentWeights] = useState<number[]>([0.9, 0.8, 0.9, 0.5, 1.8, 4.0, 1.5, 0.002, 1.8]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Handle telemetry update from sliders
  const handleTelemetryChange = (newTelemetry: IoTTelemetry) => {
    setTelemetry(newTelemetry);
  };

  // Toggle adoption of recommendations
  const handleAdoptToggle = (id: string) => {
    setAdoptedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Bulk adopt recommendations from optimizer
  const handleBulkAdopt = (ids: string[]) => {
    setAdoptedIds(prev => {
      // union of prev and ids
      const next = new Set([...prev, ...ids]);
      return Array.from(next);
    });
  };

  // 1. Calculate live baseline prediction based on raw sliders
  const basePrediction = useMemo(() => {
    const vector = telemetryToVector(telemetry);
    const val = predictCarbonFootprint(vector);
    // Slightly adjust prediction based on weights convergence to show training impact
    const convergenceFactor = currentWeights.reduce((sum, w) => sum + w, 0) / 11.2;
    return val * Math.min(1.1, Math.max(0.9, convergenceFactor));
  }, [telemetry, currentWeights]);

  // 2. Compute customized recommendations list to extract carbon savings
  const customizedRecommendations = useMemo(() => {
    const recs = adoptedIds.map(id => {
      // Find base savings
      const list = recsList(telemetry);
      const match = list.find(r => r.id === id);
      return match ? match.co2Savings : 0;
    });
    return recs.reduce((sum, val) => sum + val, 0);
  }, [telemetry, adoptedIds]);

  // Helper to retrieve recommendation list with updated telemetry
  function recsList(tel: IoTTelemetry) {
    // For savings recalculations
    return BASE_RECOMMENDATIONS.map((r: any) => {
      let scale = 1.0;
      if (r.category === 'transport') {
        scale = tel.transport_dist_km === 0 ? 0 : Math.min(2.5, tel.transport_dist_km / 25);
      } else if (r.category === 'food') {
        scale = tel.diet_meat_servings === 0 ? 0 : Math.min(2.0, tel.diet_meat_servings / 1.5);
      } else if (r.category === 'energy') {
        const usage = tel.electricity_kwh + tel.appliance_ac_kwh + tel.appliance_other_kwh;
        scale = usage < 8 ? 0.5 : Math.min(2.0, usage / 23.0);
      } else if (r.category === 'water') {
        scale = Math.min(2.0, tel.water_liters / 150);
      } else if (r.category === 'waste') {
        scale = Math.min(2.0, tel.waste_kg / 1.2);
      }
      return { ...r, co2Savings: Math.round(r.co2Savings * scale) };
    });
  }

  // 3. Compute final adjusted prediction
  // Convert monthly adopted savings to daily offset: savings_kg / 30
  const adoptedSavingsDaily = customizedRecommendations / 30;
  const adjustedPrediction = Math.max(0.1, basePrediction - adoptedSavingsDaily);

  // 4. Calculate SHAP explanations in real-time
  const shapData = useMemo(() => {
    const X = telemetryToVector(telemetry);
    const B = telemetryToVector(getAverageTelemetry());
    return calculateSHAP(X, B);
  }, [telemetry]);

  // 5. Calculate LIME linear coefficients in real-time
  const limeData = useMemo(() => {
    const X = telemetryToVector(telemetry);
    return calculateLIME(X);
  }, [telemetry]);

  // Compute Green Score
  const greenScore = Math.max(0, Math.min(100, Math.round(100 - (adjustedPrediction - 5) * 4.0)));

  return (
    <div className={`app-shell ${theme}-theme ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Sidebar Navigation */}
      <aside className="app-sidebar">
        <div className="sidebar-header">
          <div className="logo-badge">
            <Globe className="logo-icon pulse-anim" />
          </div>
          {!sidebarCollapsed && <span className="sidebar-brand-name">EcoTrackAI+</span>}
          <button 
            className="btn-toggle-sidebar" 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {sidebarCollapsed ? <ChevronRight className="icon-sm" /> : <ChevronLeft className="icon-sm" />}
          </button>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`sidebar-nav-item ${activeTab === 'iot' ? 'active' : ''}`}
            onClick={() => setActiveTab('iot')}
          >
            <Cpu className="icon-sm" /> 
            {!sidebarCollapsed && <span>IoT Telemetry</span>}
          </button>

          <button 
            className={`sidebar-nav-item ${activeTab === 'xai' ? 'active' : ''}`}
            onClick={() => setActiveTab('xai')}
          >
            <Activity className="icon-sm" /> 
            {!sidebarCollapsed && <span>Explainable AI</span>}
          </button>

          <button 
            className={`sidebar-nav-item ${activeTab === 'forecast' ? 'active' : ''}`}
            onClick={() => setActiveTab('forecast')}
          >
            <Calendar className="icon-sm" /> 
            {!sidebarCollapsed && <span>Time Forecast</span>}
          </button>

          <button 
            className={`sidebar-nav-item ${activeTab === 'recommendations' ? 'active' : ''}`}
            onClick={() => setActiveTab('recommendations')}
          >
            <Leaf className="icon-sm" /> 
            {!sidebarCollapsed && <span>Recommendations</span>}
          </button>

          <button 
            className={`sidebar-nav-item ${activeTab === 'federated' ? 'active' : ''}`}
            onClick={() => setActiveTab('federated')}
          >
            <Network className="icon-sm" /> 
            {!sidebarCollapsed && <span>Federated Learn</span>}
          </button>

          <button 
            className={`sidebar-nav-item ${activeTab === 'gamification' ? 'active' : ''}`}
            onClick={() => setActiveTab('gamification')}
          >
            <Award className="icon-sm" /> 
            {!sidebarCollapsed && <span>Green Badges</span>}
          </button>
        </nav>
      </aside>

      {/* Main Content Wrapper */}
      <div className="main-container">
        {/* Header Banner */}
        <header className="app-header">
          <div className="header-left">
            <div className="brand-info">
              <h1>{activeTab === 'iot' && 'IoT Telemetry Node'}
                  {activeTab === 'xai' && 'Explainable AI Explanations'}
                  {activeTab === 'forecast' && 'AI Forecasting Engine'}
                  {activeTab === 'recommendations' && 'Mitigation Optimizer'}
                  {activeTab === 'federated' && 'Federated Node Console'}
                  {activeTab === 'gamification' && 'Achievements & Badges'}</h1>
              <span className="subtitle">Explainable AI & Federated Carbon Optimization Platform</span>
            </div>
          </div>
          
          <div className="header-right">
            {/* Theme Switcher Toggle */}
            <button 
              className="theme-toggle-btn"
              onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
              title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === 'dark' ? <Sun className="icon-sm" /> : <Moon className="icon-sm" />}
            </button>

            <div className="status-pill active">
              <Radio className="icon-sm pulse-anim text-green" />
              <span>Node #05 (Active)</span>
            </div>
            <div className="status-pill synced">
              <span>Server Synced</span>
            </div>
          </div>
        </header>

        {/* KPI Overview Cards */}
        <section className="kpi-panel">
          <div className="glass-card kpi-card border-purple">
            <span className="kpi-title">Daily Predicted Footprint</span>
            <span className="kpi-value text-purple">{adjustedPrediction.toFixed(2)} kg CO₂/d</span>
            <span className="kpi-subtitle">
              {adjustedPrediction <= 14.85 ? (
                <span className="text-green">↓ {( (1 - adjustedPrediction / 14.85) * 100 ).toFixed(0)}% below avg</span>
              ) : (
                <span className="text-red">↑ {( (adjustedPrediction / 14.85 - 1) * 100 ).toFixed(0)}% above avg</span>
              )}
            </span>
          </div>

          <div className="glass-card kpi-card border-green">
            <span className="kpi-title">Green Score</span>
            <span className={`kpi-value ${greenScore >= 80 ? 'text-green' : greenScore >= 50 ? 'text-cyan' : 'text-amber'}`}>
              {greenScore} / 100
            </span>
            <span className="kpi-subtitle">Environmental Health Index</span>
          </div>

          <div className="glass-card kpi-card border-cyan">
            <span className="kpi-title">Adopted Mitigation Offsets</span>
            <span className="kpi-value text-cyan">-{customizedRecommendations.toFixed(0)} kg CO₂/mo</span>
            <span className="kpi-subtitle">{adoptedIds.length} decarbonization actions active</span>
          </div>

          <div className="glass-card kpi-card border-amber">
            <span className="kpi-title">IoT Telemetry Feeds</span>
            <span className="kpi-value text-amber">5 / 5 Linked</span>
            <span className="kpi-subtitle">Smart meters transmitting</span>
          </div>
        </section>

        {/* Primary Dashboard Container */}
        <main className="dashboard-content">
          {activeTab === 'iot' && (
            <IoTFeed telemetry={telemetry} onChange={handleTelemetryChange} />
          )}
          {activeTab === 'xai' && (
            <XAICharts shapData={shapData} limeData={limeData} currentPrediction={adjustedPrediction} />
          )}
          {activeTab === 'forecast' && (
            <ForecastingChart currentPrediction={adjustedPrediction} />
          )}
          {activeTab === 'recommendations' && (
            <RecommendationEngine 
              telemetry={telemetry} 
              shapValues={shapData.shapValues} 
              adoptedIds={adoptedIds}
              onAdoptToggle={handleAdoptToggle} 
              onBulkAdopt={handleBulkAdopt}
            />
          )}
          {activeTab === 'federated' && (
            <FederatedGraph 
              userTelemetry={telemetry} 
              onWeightsUpdated={setCurrentWeights} 
            />
          )}
          {activeTab === 'gamification' && (
            <Gamification 
              currentPrediction={adjustedPrediction} 
              adoptedIds={adoptedIds}
              telemetry={telemetry}
            />
          )}
        </main>

        {/* Footer credits */}
        <footer className="app-footer">
          <p>© 2026 EcoTrackAI+ Research Consortium. All Data is homomorphically aggregated locally on client nodes.</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
