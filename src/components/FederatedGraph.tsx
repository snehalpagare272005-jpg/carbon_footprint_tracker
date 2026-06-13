import React, { useState, useEffect, useRef } from 'react';
import type { FederatedClientState } from '../types';
import { simulateFederatedRound, getClientLogs, TRUE_WEIGHTS } from '../utils/federatedSimulator';
import { Network, Server, Play, ChevronRight, Terminal, Sliders } from 'lucide-react';

interface FederatedGraphProps {
  userTelemetry: any;
  onWeightsUpdated: (newWeights: number[]) => void;
}

export const FederatedGraph: React.FC<FederatedGraphProps> = ({ userTelemetry, onWeightsUpdated }) => {
  const [round, setRound] = useState(0);
  const [globalLossHistory, setGlobalLossHistory] = useState<number[]>([0.72]);
  const [globalAccHistory, setGlobalAccHistory] = useState<number[]>([62.4]);
  const [currentWeights, setCurrentWeights] = useState<number[]>([0.9, 0.8, 0.9, 0.5, 1.8, 4.0, 1.5, 0.002, 1.8]);
  const [trainingState, setTrainingState] = useState<'idle' | 'downloading' | 'training' | 'uploading' | 'aggregating' | 'complete'>('idle');
  const [clientStates, setClientStates] = useState<FederatedClientState[]>([]);
  const [consoleLogs, setConsoleLogs] = useState<{ [key: string]: string[] }>({});
  const [activeConsole, setActiveConsole] = useState<string>('user_client');
  const logEndRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const clientKeys = ['client_1', 'client_2', 'client_3', 'client_4', 'user_client'];
  const clientNames = [
    'Smart Solar Home (Denver)',
    'Suburban Estate (Dallas)',
    'Urban Eco-Apartment (Seattle)',
    'Rural Homestead (Montana)',
    'User Node (Local Client)'
  ];

  // Initialize client states
  useEffect(() => {
    const res = simulateFederatedRound(0, userTelemetry, currentWeights);
    setClientStates(res.clientStates);
    
    // Initialize logs
    const initialLogs: { [key: string]: string[] } = {};
    clientKeys.forEach((key) => {
      initialLogs[key] = [
        `[SYSTEM] Federated Link Established with node ${key.toUpperCase()}.`,
        `[SYSTEM] Listening for Global Server sync beacons...`
      ];
    });
    setConsoleLogs(initialLogs);
  }, []);

  // Handle auto-scroll in logs
  useEffect(() => {
    if (logEndRefs.current[activeConsole]) {
      logEndRefs.current[activeConsole]?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [consoleLogs, activeConsole]);

  const runFederatedRound = () => {
    if (trainingState !== 'idle' && trainingState !== 'complete') return;
    
    setTrainingState('downloading');
    
    // Update logs
    setConsoleLogs(prev => {
      const updated = { ...prev };
      clientKeys.forEach((key) => {
        updated[key] = [
          ...updated[key],
          `[SYNC] --- Round ${round + 1} Started ---`,
          `[SYNC] Downloading Global Model weights from coordinator...`,
          `[SYNC] Global weights downloaded (Hash: 0x88f2b0ea...`
        ];
      });
      return updated;
    });

    // 1. Download Phase (2s)
    setTimeout(() => {
      setTrainingState('training');

      // Add local training logs progressively
      clientKeys.forEach((key, idx) => {
        const fullLogs = getClientLogs(clientNames[idx], round, clientStates.find(c => c.id === key)?.localTelemetry || userTelemetry);
        
        // Push training logs sequentially
        fullLogs.forEach((log, sIdx) => {
          setTimeout(() => {
            setConsoleLogs(prev => ({
              ...prev,
              [key]: [...prev[key], log]
            }));
          }, sIdx * 350);
        });
      });

      // 2. Training Phase (4s)
      setTimeout(() => {
        setTrainingState('uploading');

        setConsoleLogs(prev => {
          const updated = { ...prev };
          clientKeys.forEach(key => {
            updated[key] = [
              ...updated[key],
              `[UPLOAD] Encryption Complete. Homomorphic summation key applied.`,
              `[UPLOAD] Pushing weights to parameters aggregator (Port 8443)...`
            ];
          });
          return updated;
        });

        // 3. Upload Phase (2.5s)
        setTimeout(() => {
          setTrainingState('aggregating');

          // 4. Aggregation Phase (1.5s)
          setTimeout(() => {
            // Finalize results
            const result = simulateFederatedRound(round, userTelemetry, currentWeights);
            
            setRound(result.roundNumber);
            setGlobalLossHistory(prev => [...prev, result.globalLoss]);
            setGlobalAccHistory(prev => [...prev, result.globalAccuracy]);
            setCurrentWeights(result.globalWeights);
            setClientStates(result.clientStates);
            onWeightsUpdated(result.globalWeights);

            setConsoleLogs(prev => {
              const updated = { ...prev };
              clientKeys.forEach((key) => {
                updated[key] = [
                  ...updated[key],
                  `[FEDAVG] Aggregation complete on server. New Global Loss: ${result.globalLoss.toFixed(4)}`,
                  `[FEDAVG] Global model parameters successfully synced.`,
                  `[SYSTEM] Connection put on standby. Waiting next round.`
                ];
              });
              return updated;
            });

            setTrainingState('complete');
          }, 1500);

        }, 2500);

      }, 4000);

    }, 2000);
  };

  return (
    <div className="federated-container">
      {/* Network Visualizer Card */}
      <div className="glass-card network-graph-card">
        <div className="card-header border-bottom">
          <div className="header-title">
            <Network className="icon icon-cyan" />
            <h2>Federated Learning Framework Simulator</h2>
          </div>
          <div className="round-counter">
            Round: <span className="round-badge">{round}</span>
          </div>
        </div>

        <div className="card-body federated-body">
          {/* Animated SVG Network Graph */}
          <div className="network-visualizer">
            <svg viewBox="0 0 400 300" className="network-svg">
              {/* Grid background */}
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
                </pattern>
                <radialGradient id="server-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
                </radialGradient>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* Connections/Lines with active pulses */}
              {clientKeys.map((key, idx) => {
                const angle = (idx * 2 * Math.PI) / 5 - Math.PI / 2;
                const clientX = 200 + 120 * Math.cos(angle);
                const clientY = 150 + 90 * Math.sin(angle);
                
                // Determine pulse animation classes
                let pathClass = 'net-link';
                if (trainingState === 'downloading') pathClass = 'net-link dl-pulse';
                if (trainingState === 'uploading') pathClass = 'net-link ul-pulse';

                return (
                  <g key={key}>
                    <line 
                      x1="200" 
                      y1="150" 
                      x2={clientX} 
                      y2={clientY} 
                      className={pathClass} 
                    />
                    {/* Glowing packet particle */}
                    {trainingState === 'downloading' && (
                      <circle r="4" fill="#06B6D4" className="dl-particle">
                        <animateMotion 
                          path={`M 200 150 L ${clientX} ${clientY}`} 
                          dur="2s" 
                          repeatCount="indefinite" 
                        />
                      </circle>
                    )}
                    {trainingState === 'uploading' && (
                      <circle r="4" fill="#8B5CF6" className="ul-particle">
                        <animateMotion 
                          path={`M ${clientX} ${clientY} L 200 150`} 
                          dur="2.5s" 
                          repeatCount="indefinite" 
                        />
                      </circle>
                    )}
                  </g>
                );
              })}

              {/* Center Server Node */}
              <circle cx="200" cy="150" r="35" fill="url(#server-glow)" />
              <g className={`server-group ${trainingState === 'aggregating' ? 'aggregating-pulse' : ''}`}>
                <circle cx="200" cy="150" r="24" fill="#0B132B" stroke="#06B6D4" strokeWidth="2" />
                <Server className="icon-server" x="188" y="138" width="24" height="24" />
              </g>

              {/* Client Nodes */}
              {clientKeys.map((key, idx) => {
                const angle = (idx * 2 * Math.PI) / 5 - Math.PI / 2;
                const clientX = 200 + 120 * Math.cos(angle);
                const clientY = 150 + 90 * Math.sin(angle);
                const isUser = key === 'user_client';

                let circleStroke = '#4B5563';
                let circleFill = '#111827';
                let labelColor = '#9CA3AF';

                if (isUser) {
                  circleStroke = '#10B981';
                  circleFill = '#047857';
                  labelColor = '#34D399';
                } else if (trainingState === 'training') {
                  circleStroke = '#8B5CF6';
                  circleFill = '#311068';
                  labelColor = '#A78BFA';
                } else if (trainingState === 'complete') {
                  circleStroke = '#06B6D4';
                }

                return (
                  <g key={key} className="client-node-group">
                    <circle 
                      cx={clientX} 
                      cy={clientY} 
                      r="16" 
                      fill={circleFill} 
                      stroke={circleStroke} 
                      strokeWidth="2" 
                      className={trainingState === 'training' ? 'spinning-loader' : ''}
                    />
                    <text 
                      x={clientX} 
                      y={clientY - 22} 
                      textAnchor="middle" 
                      fontSize="9" 
                      fontWeight={isUser ? 'bold' : 'normal'}
                      fill={labelColor}
                      className="node-text"
                    >
                      {isUser ? 'LOCAL USER' : `Client ${idx + 1}`}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Overlay status text */}
            <div className="network-status-overlay">
              {trainingState === 'idle' && <span className="status-idle">Network Ready. Global Weights loaded.</span>}
              {trainingState === 'downloading' && <span className="status-dl">Step 1/4: Transferring global parameters...</span>}
              {trainingState === 'training' && <span className="status-train pulse-text">Step 2/4: Training on private local datasets...</span>}
              {trainingState === 'uploading' && <span className="status-ul">Step 3/4: Transmitting encrypted gradients...</span>}
              {trainingState === 'aggregating' && <span className="status-agg pulse-text">Step 4/4: Performing FedAvg parameter matching...</span>}
              {trainingState === 'complete' && <span className="status-complete">Training Complete! Parameters Synced.</span>}
            </div>
          </div>

          <div className="federated-ctrl-panel">
            <button 
              className={`btn-action btn-train ${trainingState !== 'idle' && trainingState !== 'complete' ? 'disabled' : ''}`}
              onClick={runFederatedRound}
              disabled={trainingState !== 'idle' && trainingState !== 'complete'}
            >
              <Play className="icon-sm" /> Run Federated Training Round
            </button>

            {/* Model Convergence Statistics */}
            <div className="convergence-stats">
              <div className="stat-box">
                <span className="stat-title">Aggregated Model Loss</span>
                <span className="stat-val text-purple">{globalLossHistory[globalLossHistory.length - 1].toFixed(4)}</span>
              </div>
              <div className="stat-box">
                <span className="stat-title">Model Accuracy</span>
                <span className="stat-val text-cyan">{globalAccHistory[globalAccHistory.length - 1].toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Terminal Log Consoles Card */}
      <div className="glass-card terminal-card">
        <div className="card-header border-bottom">
          <div className="header-title">
            <Terminal className="icon icon-purple" />
            <h2>Homomorphic Training Logs</h2>
          </div>
          
          {/* Select Node Console tabs */}
          <div className="console-tabs">
            {clientKeys.map((key, idx) => (
              <button
                key={key}
                className={`btn-tab-console ${activeConsole === key ? 'active' : ''}`}
                onClick={() => setActiveConsole(key)}
              >
                {key === 'user_client' ? 'User Device' : `Client ${idx + 1}`}
              </button>
            ))}
          </div>
        </div>

        <div className="console-body">
          <div className="console-lines">
            {consoleLogs[activeConsole]?.map((line, idx) => (
              <div key={idx} className="console-line">
                <ChevronRight className="line-arrow" />
                <span className="line-content">{line}</span>
              </div>
            ))}
            <div ref={el => { logEndRefs.current[activeConsole] = el; }} />
          </div>
        </div>
      </div>

      {/* Model Weights Parameters Matrix Card */}
      <div className="glass-card weights-card">
        <div className="card-header border-bottom">
          <div className="header-title">
            <Sliders className="icon icon-amber" />
            <h2>Aggregated Model Weights (Converging)</h2>
          </div>
        </div>
        <div className="card-body">
          <p className="weights-desc">
            Visualizing the convergence of the federated global model parameters towards the true carbon values as training rounds accumulate.
          </p>
          <div className="weights-grid">
            {[
              'Electricity (kWh)',
              'HVAC / AC (kWh)',
              'Other Elect. (kWh)',
              'Distance Commuted (km)',
              'Vehicle Fuel Type',
              'Meat Servings',
              'Dairy Servings',
              'Water Usage (L)',
              'Landfill Waste (kg)'
            ].map((weightName, idx) => {
              const currentVal = currentWeights[idx];
              const trueVal = TRUE_WEIGHTS[idx];
              
              // Compute difference and percentage error
              const diffPercent = Math.min(100, (Math.abs(currentVal - trueVal) / Math.max(0.0001, trueVal)) * 100);
              const isClose = diffPercent < 5;

              return (
                <div key={idx} className="weight-parameter-box">
                  <span className="wp-name">{weightName}</span>
                  <div className="wp-values">
                    <span className="wp-val-curr">Current: {currentVal.toFixed(4)}</span>
                    <span className="wp-val-true">Target: {trueVal.toFixed(4)}</span>
                  </div>
                  <div className="wp-progress-container">
                    <div 
                      className={`wp-progress-bar ${isClose ? 'converged' : ''}`}
                      style={{ width: `${Math.max(5, 100 - diffPercent)}%` }}
                    ></div>
                  </div>
                  <span className="wp-convergence-label">
                    {isClose ? 'Converged (95%+ Match)' : `Syncing (${(100 - diffPercent).toFixed(0)}% Match)`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
