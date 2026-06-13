import React, { useState } from 'react';
import type { ShapValues, LimeExplanation } from '../types';
import { FEATURE_METADATA } from '../utils/predictionModel';
import { Activity, AlertCircle, Sparkles } from 'lucide-react';

interface XAIChartsProps {
  shapData: {
    shapValues: ShapValues;
    baseValue: number;
    predictionValue: number;
  };
  limeData: LimeExplanation;
  currentPrediction: number;
}

export const XAICharts: React.FC<XAIChartsProps> = ({ shapData, limeData, currentPrediction }) => {
  const [activeTab, setActiveTab] = useState<'shap' | 'lime'>('shap');
  const [limePerturbation, setLimePerturbation] = useState<{ [key: string]: number }>({
    electricity_kwh: 0,
    appliance_ac_kwh: 0,
    transport_dist_km: 0,
    diet_meat_servings: 0
  });

  const { shapValues, baseValue, predictionValue } = shapData;

  // 1. Prepare SHAP items sorted by absolute contribution
  const shapItems = Object.entries(shapValues)
    .map(([key, val]) => {
      const metadata = FEATURE_METADATA[key] || { label: key === 'transport_fuel' ? 'Vehicle Fuel Type' : key, unit: '' };
      return {
        key,
        label: metadata.label,
        value: val,
        abs: Math.abs(val)
      };
    })
    .sort((a, b) => b.abs - a.abs);

  // Compute positions for SHAP waterfall
  let runningSum = baseValue;
  const waterfallSteps = shapItems.map(item => {
    const start = runningSum;
    runningSum += item.value;
    return {
      ...item,
      start,
      end: runningSum
    };
  });

  // 2. Prepare LIME items sorted by coefficient impact
  const limeItems = Object.entries(limeData.coefficients)
    .map(([key, val]) => {
      const metadata = FEATURE_METADATA[key] || { label: key === 'transport_fuel' ? 'Vehicle Fuel Type' : key, unit: '' };
      return {
        key,
        label: metadata.label,
        value: val,
        unit: metadata.unit
      };
    })
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

  // Compute LIME perturbed prediction
  let limeDiff = 0;
  Object.entries(limePerturbation).forEach(([key, delta]) => {
    const coef = limeData.coefficients[key] || 0;
    limeDiff += coef * delta;
  });
  const limeApprox = Math.max(0, currentPrediction + limeDiff);

  return (
    <div className="glass-card xai-card">
      <div className="card-header border-bottom">
        <div className="header-title">
          <Activity className="icon icon-emerald" />
          <h2>Explainable AI (XAI) Dashboard</h2>
        </div>
        <div className="tab-buttons">
          <button 
            className={`btn-tab ${activeTab === 'shap' ? 'active' : ''}`}
            onClick={() => setActiveTab('shap')}
          >
            SHAP (Global/Local Contribution)
          </button>
          <button 
            className={`btn-tab ${activeTab === 'lime' ? 'active' : ''}`}
            onClick={() => setActiveTab('lime')}
          >
            LIME (Local Linear Surrogates)
          </button>
        </div>
      </div>

      <div className="card-body">
        {activeTab === 'shap' ? (
          <div className="shap-panel">
            <div className="xai-intro">
              <Sparkles className="icon-sm icon-cyan" />
              <p>
                <strong>SHAP (SHapley Additive exPlanations)</strong> values explain how each feature contributes relative to the average user baseline (<strong>{baseValue.toFixed(2)} kg CO₂/day</strong>) to arrive at your current prediction (<strong>{predictionValue.toFixed(2)} kg CO₂/day</strong>).
              </p>
            </div>

            {/* SVG Waterfall Chart */}
            <div className="chart-container">
              <h3 className="chart-title">SHAP Local Waterfall Explanations (kg CO₂/day)</h3>
              
              <div className="waterfall-layout">
                {/* Baseline bar */}
                <div className="waterfall-row base-row">
                  <div className="row-label">Base Average User</div>
                  <div className="row-track">
                    <div 
                      className="waterfall-bar base-bar"
                      style={{ 
                        left: '0%', 
                        width: `${Math.min(90, (baseValue / 30) * 100)}%` 
                      }}
                    >
                      <span className="bar-label">{baseValue.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Steps */}
                {waterfallSteps.map((step, idx) => {
                  const isPositive = step.value > 0;
                  const scale = 30; // max value to fit chart width
                  
                  // Calculate left and width percentages
                  const leftVal = Math.min(step.start, step.end);
                  const widthVal = Math.abs(step.value);
                  
                  const leftPercent = `${(leftVal / scale) * 90}%`;
                  const widthPercent = `${(widthVal / scale) * 90}%`;

                  return (
                    <div key={idx} className="waterfall-row">
                      <div className="row-label">{step.label}</div>
                      <div className="row-track">
                        <div 
                          className={`waterfall-bar ${isPositive ? 'positive-bar' : 'negative-bar'}`}
                          style={{ 
                            left: leftPercent, 
                            width: widthPercent 
                          }}
                        >
                          <span className="bar-label">
                            {isPositive ? '+' : ''}{step.value.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Final Prediction bar */}
                <div className="waterfall-row prediction-row">
                  <div className="row-label">Your Predicted Footprint</div>
                  <div className="row-track">
                    <div 
                      className="waterfall-bar final-bar"
                      style={{ 
                        left: '0%', 
                        width: `${Math.min(90, (predictionValue / 30) * 100)}%` 
                      }}
                    >
                      <span className="bar-label">{predictionValue.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Explanations summary */}
            <div className="shap-summary">
              <h4>Key Insight:</h4>
              {shapItems[0].value > 0.5 ? (
                <p>
                  Your footprint is primarily driven upwards by your <strong>{shapItems[0].label}</strong>, which adds <strong>+{shapItems[0].value.toFixed(2)} kg CO₂/day</strong>. Reducing this source offers the highest decarbonization impact.
                </p>
              ) : (
                <p>
                  Your habits are highly efficient! Your emissions are well-regulated. Continue maintaining low consumption.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="lime-panel">
            <div className="xai-intro">
              <AlertCircle className="icon-sm icon-emerald" />
              <p>
                <strong>LIME</strong> fits a local linear regression model in the neighborhood of your current activities. 
                Fit quality: <span className="r2-badge">R² = {limeData.r2.toFixed(3)}</span>.
                The coefficients show the change in CO₂ per unit change of each feature.
              </p>
            </div>

            <div className="lime-grid">
              {/* Coefficient Chart */}
              <div className="chart-container">
                <h3 className="chart-title">Local Slopes (Slope Coefficient: kg CO₂ / Feature Unit)</h3>
                
                <div className="lime-chart">
                  {limeItems.map((item, idx) => {
                    const maxVal = 2.5; // for scaling bars
                    const scalePercent = Math.min(100, (Math.abs(item.value) / maxVal) * 100);
                    const isPositive = item.value > 0;

                    return (
                      <div key={idx} className="lime-row">
                        <div className="lime-label-col">
                          <span>{item.label}</span>
                          <span className="lime-unit">({item.unit || 'factor'})</span>
                        </div>
                        
                        <div className="lime-bar-col">
                          <div className="lime-bar-track">
                            <div className="lime-center-axis"></div>
                            <div 
                              className={`lime-bar ${isPositive ? 'pos' : 'neg'}`}
                              style={{
                                width: `${scalePercent}%`,
                                left: isPositive ? '50%' : 'auto',
                                right: !isPositive ? '50%' : 'auto'
                              }}
                            >
                              <span className="lime-val-text">
                                {isPositive ? '+' : ''}{item.value.toFixed(3)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* LIME Local Simulator */}
              <div className="lime-playground">
                <h3>🧪 LIME Local Decarbonization Playground</h3>
                <p className="playground-desc">
                  Simulate local adjustments ($\Delta X$) to see how well the LIME linear surrogate approximates the complex AI model.
                </p>

                <div className="playground-sliders">
                  <div className="pg-slider-item">
                    <div className="pg-label">
                      <span>Change Electricity</span>
                      <span className={`pg-val ${limePerturbation.electricity_kwh >= 0 ? 'pos' : 'neg'}`}>
                        {limePerturbation.electricity_kwh >= 0 ? '+' : ''}{limePerturbation.electricity_kwh} kWh
                      </span>
                    </div>
                    <input 
                      type="range" 
                      min="-10" 
                      max="10" 
                      step="1"
                      value={limePerturbation.electricity_kwh}
                      onChange={(e) => setLimePerturbation({ ...limePerturbation, electricity_kwh: parseInt(e.target.value) })}
                    />
                  </div>

                  <div className="pg-slider-item">
                    <div className="pg-label">
                      <span>Change HVAC Load</span>
                      <span className={`pg-val ${limePerturbation.appliance_ac_kwh >= 0 ? 'pos' : 'neg'}`}>
                        {limePerturbation.appliance_ac_kwh >= 0 ? '+' : ''}{limePerturbation.appliance_ac_kwh} kWh
                      </span>
                    </div>
                    <input 
                      type="range" 
                      min="-6" 
                      max="6" 
                      step="1"
                      value={limePerturbation.appliance_ac_kwh}
                      onChange={(e) => setLimePerturbation({ ...limePerturbation, appliance_ac_kwh: parseInt(e.target.value) })}
                    />
                  </div>

                  <div className="pg-slider-item">
                    <div className="pg-label">
                      <span>Change Vehicle Travel</span>
                      <span className={`pg-val ${limePerturbation.transport_dist_km >= 0 ? 'pos' : 'neg'}`}>
                        {limePerturbation.transport_dist_km >= 0 ? '+' : ''}{limePerturbation.transport_dist_km} km
                      </span>
                    </div>
                    <input 
                      type="range" 
                      min="-20" 
                      max="20" 
                      step="2"
                      value={limePerturbation.transport_dist_km}
                      onChange={(e) => setLimePerturbation({ ...limePerturbation, transport_dist_km: parseInt(e.target.value) })}
                    />
                  </div>

                  <div className="pg-slider-item">
                    <div className="pg-label">
                      <span>Change Meat Intake</span>
                      <span className={`pg-val ${limePerturbation.diet_meat_servings >= 0 ? 'pos' : 'neg'}`}>
                        {limePerturbation.diet_meat_servings >= 0 ? '+' : ''}{limePerturbation.diet_meat_servings} servings
                      </span>
                    </div>
                    <input 
                      type="range" 
                      min="-1.5" 
                      max="1.5" 
                      step="0.1"
                      value={limePerturbation.diet_meat_servings}
                      onChange={(e) => setLimePerturbation({ ...limePerturbation, diet_meat_servings: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>

                {/* Side-by-side Predictions */}
                <div className="playground-output">
                  <div className="pg-pred-box">
                    <span className="box-title">LIME Linear Approximation</span>
                    <span className="box-value text-cyan">{limeApprox.toFixed(2)} kg CO₂/d</span>
                    <span className="box-sub">Formula: $f(X) + w^T \Delta X$</span>
                  </div>
                  <div className="pg-pred-box">
                    <span className="box-title">Actual AI Output (Non-linear)</span>
                    <span className="box-value text-purple">{currentPrediction.toFixed(2)} kg CO₂/d</span>
                    <span className="box-sub">Original predictions recalculating</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
