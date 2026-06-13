import React, { useState, useEffect } from 'react';
import type { IoTTelemetry } from '../types';
import { FEATURE_METADATA } from '../utils/predictionModel';
import { Cpu, Radio, HardDrive, ShieldAlert } from 'lucide-react';

interface IoTFeedProps {
  telemetry: IoTTelemetry;
  onChange: (newTelemetry: IoTTelemetry) => void;
}

interface Packet {
  timestamp: string;
  sensorId: string;
  sensorName: string;
  value: string;
  status: 'active' | 'syncing' | 'alert';
}

export const IoTFeed: React.FC<IoTFeedProps> = ({ telemetry, onChange }) => {
  const [liveStreamEnabled, setLiveStreamEnabled] = useState(false);
  const [packets, setPackets] = useState<Packet[]>([]);

  // Generate initial simulated packets
  useEffect(() => {
    const initialPackets: Packet[] = [
      { timestamp: new Date().toLocaleTimeString(), sensorId: 'SM_ELEC_1082', sensorName: 'Smart Utility Meter', value: `${telemetry.electricity_kwh} kWh/d`, status: 'active' },
      { timestamp: new Date(Date.now() - 3000).toLocaleTimeString(), sensorId: 'PLG_AC_5098', sensorName: 'Smart HVAC Controller', value: `${telemetry.appliance_ac_kwh} kWh/d`, status: 'active' },
      { timestamp: new Date(Date.now() - 6000).toLocaleTimeString(), sensorId: 'OBD_GPS_0442', sensorName: 'OBD-II Telematics', value: `${telemetry.transport_dist_km} km (${telemetry.transport_fuel_type.toUpperCase()})`, status: 'active' },
      { timestamp: new Date(Date.now() - 9000).toLocaleTimeString(), sensorId: 'WTR_FLOW_209', sensorName: 'Main Line Flow Meter', value: `${telemetry.water_liters} L/d`, status: 'active' },
    ];
    setPackets(initialPackets);
  }, []);

  // Simulate incoming real-time IoT packet stream
  useEffect(() => {
    let timer: any;
    if (liveStreamEnabled) {
      timer = setInterval(() => {
        // Slightly perturb telemetry values to simulate live household dynamics
        const keys: (keyof IoTTelemetry)[] = ['electricity_kwh', 'appliance_ac_kwh', 'transport_dist_km', 'water_liters', 'waste_kg'];
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        
        let delta = 0;
        let sensorId = 'SM_ELEC_1082';
        let sensorName = 'Smart Utility Meter';
        let valString = '';

        const newTelemetry = { ...telemetry };

        if (randomKey === 'electricity_kwh') {
          delta = (Math.random() - 0.5) * 1.5;
          newTelemetry.electricity_kwh = Math.max(1, Math.min(40, parseFloat((telemetry.electricity_kwh + delta).toFixed(1))));
          sensorId = 'SM_ELEC_1082';
          sensorName = 'Smart Utility Meter';
          valString = `${newTelemetry.electricity_kwh} kWh/d`;
        } else if (randomKey === 'appliance_ac_kwh') {
          delta = (Math.random() - 0.5) * 1.0;
          newTelemetry.appliance_ac_kwh = Math.max(0, Math.min(25, parseFloat((telemetry.appliance_ac_kwh + delta).toFixed(1))));
          sensorId = 'PLG_AC_5098';
          sensorName = 'Smart HVAC Controller';
          valString = `${newTelemetry.appliance_ac_kwh} kWh/d`;
        } else if (randomKey === 'transport_dist_km') {
          delta = (Math.random() - 0.5) * 2.0;
          newTelemetry.transport_dist_km = Math.max(0, Math.min(120, parseFloat((telemetry.transport_dist_km + delta).toFixed(1))));
          sensorId = 'OBD_GPS_0442';
          sensorName = 'OBD-II Telematics';
          valString = `${newTelemetry.transport_dist_km} km`;
        } else if (randomKey === 'water_liters') {
          delta = Math.round((Math.random() - 0.5) * 15);
          newTelemetry.water_liters = Math.max(10, Math.min(500, telemetry.water_liters + delta));
          sensorId = 'WTR_FLOW_209';
          sensorName = 'Main Line Flow Meter';
          valString = `${newTelemetry.water_liters} L/d`;
        } else if (randomKey === 'waste_kg') {
          delta = (Math.random() - 0.5) * 0.15;
          newTelemetry.waste_kg = Math.max(0.1, Math.min(5, parseFloat((telemetry.waste_kg + delta).toFixed(2))));
          sensorId = 'WST_COMP_88';
          sensorName = 'Bin Weight Sensor';
          valString = `${newTelemetry.waste_kg} kg/d`;
        }

        onChange(newTelemetry);

        // Append new packet log
        const newPacket: Packet = {
          timestamp: new Date().toLocaleTimeString(),
          sensorId,
          sensorName,
          value: valString,
          status: Math.random() > 0.92 ? 'alert' : 'active'
        };

        setPackets(prev => [newPacket, ...prev.slice(0, 7)]);
      }, 2500);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [liveStreamEnabled, telemetry, onChange]);

  const handleSliderChange = (key: keyof IoTTelemetry, value: number) => {
    const newTelemetry = { ...telemetry, [key]: value };
    
    // If tweaking AC/appliances directly, check they are consistent with general electricity
    if (key === 'appliance_ac_kwh' && value > newTelemetry.electricity_kwh) {
      newTelemetry.electricity_kwh = parseFloat(value.toFixed(1));
    }
    
    onChange(newTelemetry);
  };

  const handleFuelChange = (type: IoTTelemetry['transport_fuel_type']) => {
    onChange({ ...telemetry, transport_fuel_type: type });
  };

  return (
    <div className="iot-container">
      {/* Control Panel */}
      <div className="glass-card iot-controls">
        <div className="card-header">
          <div className="header-title">
            <Cpu className="icon icon-cyan" />
            <h2>IoT Sensor Simulation Node</h2>
          </div>
          <button 
            className={`btn-stream ${liveStreamEnabled ? 'active' : ''}`}
            onClick={() => setLiveStreamEnabled(!liveStreamEnabled)}
          >
            <Radio className={`icon-sm ${liveStreamEnabled ? 'pulse-anim' : ''}`} />
            {liveStreamEnabled ? 'LIVE SIMULATOR ACTIVE' : 'ENABLE LIVE STREAM'}
          </button>
        </div>

        <div className="sliders-grid">
          {/* Energy Group */}
          <div className="slider-group">
            <h3>⚡ Energy & Appliances</h3>
            
            <div className="control-item">
              <div className="control-label">
                <span>{FEATURE_METADATA.electricity_kwh.label}</span>
                <span className="value-badge">{telemetry.electricity_kwh} {FEATURE_METADATA.electricity_kwh.unit}</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="40" 
                step="0.5" 
                value={telemetry.electricity_kwh} 
                onChange={(e) => handleSliderChange('electricity_kwh', parseFloat(e.target.value))}
              />
            </div>

            <div className="control-item">
              <div className="control-label">
                <span>{FEATURE_METADATA.appliance_ac_kwh.label}</span>
                <span className="value-badge">{telemetry.appliance_ac_kwh} {FEATURE_METADATA.appliance_ac_kwh.unit}</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="25" 
                step="0.5" 
                value={telemetry.appliance_ac_kwh} 
                onChange={(e) => handleSliderChange('appliance_ac_kwh', parseFloat(e.target.value))}
              />
            </div>

            <div className="control-item">
              <div className="control-label">
                <span>{FEATURE_METADATA.appliance_other_kwh.label}</span>
                <span className="value-badge">{telemetry.appliance_other_kwh} {FEATURE_METADATA.appliance_other_kwh.unit}</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="20" 
                step="0.5" 
                value={telemetry.appliance_other_kwh} 
                onChange={(e) => handleSliderChange('appliance_other_kwh', parseFloat(e.target.value))}
              />
            </div>
          </div>

          {/* Transport Group */}
          <div className="slider-group">
            <h3>🚗 Transportation Telematics</h3>
            
            <div className="control-item">
              <div className="control-label">
                <span>{FEATURE_METADATA.transport_dist_km.label}</span>
                <span className="value-badge">{telemetry.transport_dist_km} {FEATURE_METADATA.transport_dist_km.unit}</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="120" 
                step="1" 
                value={telemetry.transport_dist_km} 
                onChange={(e) => handleSliderChange('transport_dist_km', parseInt(e.target.value))}
              />
            </div>

            <div className="control-item">
              <label className="sub-label">Vehicle Fuel & Powertrain Type</label>
              <div className="toggle-buttons">
                {(['petrol', 'diesel', 'hybrid', 'ev'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={`btn-toggle ${telemetry.transport_fuel_type === type ? 'active' : ''}`}
                    onClick={() => handleFuelChange(type)}
                  >
                    {type.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Food Habits Group */}
          <div className="slider-group">
            <h3>🥩 Diet & Consumables</h3>
            
            <div className="control-item">
              <div className="control-label">
                <span>{FEATURE_METADATA.diet_meat_servings.label}</span>
                <span className="value-badge">{telemetry.diet_meat_servings} {FEATURE_METADATA.diet_meat_servings.unit}</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="5" 
                step="0.1" 
                value={telemetry.diet_meat_servings} 
                onChange={(e) => handleSliderChange('diet_meat_servings', parseFloat(e.target.value))}
              />
            </div>

            <div className="control-item">
              <div className="control-label">
                <span>{FEATURE_METADATA.diet_dairy_servings.label}</span>
                <span className="value-badge">{telemetry.diet_dairy_servings} {FEATURE_METADATA.diet_dairy_servings.unit}</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="5" 
                step="0.1" 
                value={telemetry.diet_dairy_servings} 
                onChange={(e) => handleSliderChange('diet_dairy_servings', parseFloat(e.target.value))}
              />
            </div>
          </div>

          {/* Resources & waste */}
          <div className="slider-group">
            <h3>💧 Water & Landfill Waste</h3>
            
            <div className="control-item">
              <div className="control-label">
                <span>{FEATURE_METADATA.water_liters.label}</span>
                <span className="value-badge">{telemetry.water_liters} {FEATURE_METADATA.water_liters.unit}</span>
              </div>
              <input 
                type="range" 
                min="10" 
                max="500" 
                step="10" 
                value={telemetry.water_liters} 
                onChange={(e) => handleSliderChange('water_liters', parseInt(e.target.value))}
              />
            </div>

            <div className="control-item">
              <div className="control-label">
                <span>{FEATURE_METADATA.waste_kg.label}</span>
                <span className="value-badge">{telemetry.waste_kg} {FEATURE_METADATA.waste_kg.unit}</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="5" 
                step="0.05" 
                value={telemetry.waste_kg} 
                onChange={(e) => handleSliderChange('waste_kg', parseFloat(e.target.value))}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stream Panel */}
      <div className="glass-card iot-packets">
        <div className="card-header border-bottom">
          <div className="header-title">
            <HardDrive className="icon icon-purple" />
            <h2>Live Telemetry Packet Log</h2>
          </div>
          <span className="stream-badge">
            <span className={`dot ${liveStreamEnabled ? 'blink' : ''}`}></span>
            {liveStreamEnabled ? 'RECEIVING STREAM' : 'PAUSED'}
          </span>
        </div>
        
        <div className="packet-list">
          {packets.length === 0 ? (
            <p className="no-data">Initializing sensor link...</p>
          ) : (
            packets.map((pkt, idx) => (
              <div key={idx} className={`packet-row ${pkt.status}`}>
                <span className="pkt-time">{pkt.timestamp}</span>
                <span className="pkt-id">{pkt.sensorId}</span>
                <span className="pkt-name">{pkt.sensorName}</span>
                <span className="pkt-val">{pkt.value}</span>
                <span className="pkt-status">
                  {pkt.status === 'alert' ? (
                    <ShieldAlert className="icon-sm icon-amber text-glow" />
                  ) : (
                    <span className="status-indicator">OK</span>
                  )}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
