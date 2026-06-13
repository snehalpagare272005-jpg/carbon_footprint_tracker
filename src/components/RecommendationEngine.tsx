import React, { useState, useEffect } from 'react';
import type { Recommendation, IoTTelemetry } from '../types';
import { getCustomizedRecommendations, optimizeReduction } from '../utils/optimizer';
import { Leaf, Award, Sliders, Check, Sparkles, Gauge } from 'lucide-react';

interface RecommendationEngineProps {
  telemetry: IoTTelemetry;
  shapValues: { [key: string]: number };
  adoptedIds: string[];
  onAdoptToggle: (id: string) => void;
  onBulkAdopt: (ids: string[]) => void;
}

export const RecommendationEngine: React.FC<RecommendationEngineProps> = ({
  telemetry,
  shapValues,
  adoptedIds,
  onAdoptToggle,
  onBulkAdopt
}) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [targetReduction, setTargetReduction] = useState<number>(150); // kg/month
  const [optimizationResult, setOptimizationResult] = useState<any>(null);

  // Generate recommendations dynamically based on telemetry and SHAP
  useEffect(() => {
    const customized = getCustomizedRecommendations(telemetry, shapValues);
    // Sync adopted status
    const synced = customized.map(rec => ({
      ...rec,
      adopted: adoptedIds.includes(rec.id)
    }));
    setRecommendations(synced);
  }, [telemetry, shapValues, adoptedIds]);

  // Run optimizer
  const runOptimizer = () => {
    const res = optimizeReduction(targetReduction, recommendations);
    setOptimizationResult(res);
  };

  const applyOptimizerStrategy = () => {
    if (optimizationResult) {
      onBulkAdopt(optimizationResult.selectedIds);
    }
  };

  // Filter recommendations into rows
  const topMatches = [...recommendations]
    .filter(r => !r.adopted)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 6);

  const highImpact = [...recommendations]
    .filter(r => !r.adopted && r.impact === 'high')
    .sort((a, b) => b.co2Savings - a.co2Savings)
    .slice(0, 6);

  const lowHanging = [...recommendations]
    .filter(r => !r.adopted && r.effort === 'low' && r.impact !== 'low')
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 6);

  const getCategoryIcon = (cat: Recommendation['category']) => {
    switch (cat) {
      case 'energy': return <Sparkles className="icon-sm text-amber" />;
      case 'transport': return <Gauge className="icon-sm text-cyan" />;
      case 'food': return <Leaf className="icon-sm text-green" />;
      case 'water': return <Award className="icon-sm text-blue" />;
      case 'waste': return <Sliders className="icon-sm text-purple" />;
    }
  };

  const renderRow = (title: string, items: Recommendation[]) => {
    if (items.length === 0) return null;
    return (
      <div className="netflix-row">
        <h3 className="row-title">{title}</h3>
        <div className="netflix-slider">
          {items.map(item => (
            <div key={item.id} className="recommendation-card glass-card hover-lift">
              <div className="card-top">
                <span className="match-badge">{item.matchScore}% Match</span>
                <span className="cat-icon">{getCategoryIcon(item.category)}</span>
              </div>
              
              <h4 className="rec-title">{item.title}</h4>
              <p className="rec-desc">{item.description}</p>
              
              <div className="rec-insights">
                <span className="insight-pill savings">- {item.co2Savings} kg CO₂/mo</span>
                <span className="insight-pill cost">
                  {item.cost === 0 ? 'Free' : item.cost < 0 ? `Save $${Math.abs(item.cost)}/mo` : `$${item.cost} Cost`}
                </span>
              </div>

              <div className="rec-tags">
                <span className={`tag effort ${item.effort}`}>Effort: {item.effort.toUpperCase()}</span>
                <span className={`tag impact ${item.impact}`}>Impact: {item.impact.toUpperCase()}</span>
              </div>

              <div className="why-rec-text">
                <strong>Why:</strong> {item.whyRecommended}
              </div>

              <button 
                className={`btn-adopt ${item.adopted ? 'adopted' : ''}`}
                onClick={() => onAdoptToggle(item.id)}
              >
                {item.adopted ? (
                  <>
                    <Check className="icon-sm" /> ADOPTED
                  </>
                ) : (
                  'ADOPT ACTION'
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="rec-engine-container">
      {/* 1. Optimizer Console Card */}
      <div className="glass-card optimizer-card">
        <div className="card-header border-bottom">
          <div className="header-title">
            <Sliders className="icon icon-cyan" />
            <h2>AI Carbon Reduction Strategy Optimizer</h2>
          </div>
        </div>
        <div className="card-body">
          <p className="optimizer-desc">
            Input your desired carbon reduction target. The AI model solves a constraint optimization problem (Knapsack) 
            to select the combinations of actions that yield the lowest total cost and effort.
          </p>

          <div className="optimizer-interface">
            <div className="opt-slider-box">
              <div className="opt-slider-label">
                <span>Target CO₂ Reduction:</span>
                <span className="value-badge text-cyan">{targetReduction} kg CO₂ / month</span>
              </div>
              <input 
                type="range" 
                min="20" 
                max="600" 
                step="10" 
                value={targetReduction} 
                onChange={(e) => setTargetReduction(parseInt(e.target.value))}
              />
            </div>

            <button className="btn-action btn-optimize" onClick={runOptimizer}>
              <Sparkles className="icon-sm pulse-anim" /> Calculate Best Strategy
            </button>
          </div>

          {/* Solver Output */}
          {optimizationResult && (
            <div className="optimizer-output fade-in">
              <h3 className="opt-result-title">Optimal Decarbonization Plan Found!</h3>
              
              <div className="opt-stats-row">
                <div className="opt-stat">
                  <span className="title">Total CO₂ Reduction</span>
                  <span className="val text-green">-{optimizationResult.totalSavings} kg/mo</span>
                </div>
                <div className="opt-stat">
                  <span className="title">Net Monthly Cost</span>
                  <span className={`val ${optimizationResult.totalCost <= 0 ? 'text-green' : 'text-amber'}`}>
                    {optimizationResult.totalCost <= 0 ? `Saves $${Math.abs(optimizationResult.totalCost)}/mo` : `$${optimizationResult.totalCost}/mo`}
                  </span>
                </div>
                <div className="opt-stat">
                  <span className="title">Total Complexity Score</span>
                  <span className="val text-purple">{optimizationResult.totalEffortScore} (Low Effort)</span>
                </div>
              </div>

              <div className="selected-actions-list">
                <h4>Actions Selected by AI:</h4>
                <div className="selected-chips">
                  {optimizationResult.selectedIds.map((id: string) => {
                    const rec = recommendations.find(r => r.id === id);
                    return (
                      <div key={id} className="selected-chip">
                        <Check className="icon-sm text-green" />
                        <span>{rec?.title} (-{rec?.co2Savings} kg)</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button className="btn-action btn-apply-opt" onClick={applyOptimizerStrategy}>
                Adopt All {optimizationResult.selectedIds.length} Recommended Actions
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Netflix Slider Recommendations */}
      <div className="recommendations-sliders-list">
        {/* Adopted Actions Panel */}
        {adoptedIds.length > 0 && (
          <div className="glass-card adopted-panel">
            <h3>🌱 Currently Adopted Actions ({adoptedIds.length})</h3>
            <div className="adopted-chips">
              {adoptedIds.map(id => {
                const rec = recommendations.find(r => r.id === id);
                return (
                  <div key={id} className="adopted-chip">
                    <span className="ac-title">{rec?.title}</span>
                    <span className="ac-savings">-{rec?.co2Savings} kg/mo</span>
                    <button className="btn-remove-ac" onClick={() => onAdoptToggle(id)}>×</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {renderRow('Top Picks for Your Profile', topMatches)}
        {renderRow('High Impact Decarbonizers', highImpact)}
        {renderRow('Low Effort - High Output', lowHanging)}
      </div>
    </div>
  );
};
