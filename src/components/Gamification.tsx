import React from 'react';
import type { LeaderboardEntry } from '../types';
import { Award, Zap, Heart, Shield, Droplet, Trash, Check, Trophy } from 'lucide-react';

interface GamificationProps {
  currentPrediction: number;
  adoptedIds: string[];
  telemetry: any;
}

export const Gamification: React.FC<GamificationProps> = ({ currentPrediction, adoptedIds, telemetry }) => {
  
  // Calculate Green Score: 100 is excellent, 0 is high emissions
  // Baseline average emissions ~ 14.85kg gives score ~ 50.
  // 5kg or less gives 100. 30kg or more gives 0.
  const greenScore = Math.max(0, Math.min(100, Math.round(100 - (currentPrediction - 5) * 4.0)));

  // Define Badge definitions and evaluation logic
  const BADGES = [
    {
      id: 'vampire_slayer',
      name: 'Vampire Slayer',
      desc: 'Adopted vampire load smart plugs.',
      icon: <Zap className="icon-sm" />,
      color: 'amber',
      unlocked: adoptedIds.includes('smart_plug')
    },
    {
      id: 'solar_pioneer',
      name: 'Solar Pioneer',
      desc: 'Installed rooftop solar panel systems.',
      icon: <Trophy className="icon-sm" />,
      color: 'cyan',
      unlocked: adoptedIds.includes('solar_panels') || telemetry.electricity_kwh < 5.0
    },
    {
      id: 'transit_hero',
      name: 'Transit Hero',
      desc: 'Adopts low-emission transit systems.',
      icon: <Shield className="icon-sm" />,
      color: 'purple',
      unlocked: adoptedIds.includes('public_transit') || telemetry.transport_fuel_type === 'ev' || telemetry.transport_dist_km === 0
    },
    {
      id: 'water_guardian',
      name: 'Water Guardian',
      desc: 'Maintains daily water under 100 Liters.',
      icon: <Droplet className="icon-sm" />,
      color: 'blue',
      unlocked: telemetry.water_liters <= 100 || adoptedIds.includes('shower_head')
    },
    {
      id: 'zero_waste',
      name: 'Zero Waste Hero',
      desc: 'Generates landfill waste under 0.8 kg.',
      icon: <Trash className="icon-sm" />,
      color: 'green',
      unlocked: telemetry.waste_kg <= 0.8 || adoptedIds.includes('composting')
    },
    {
      id: 'diet_specialist',
      name: 'Eco Diet Specialist',
      desc: 'Maintains meat intake under 0.5 servings.',
      icon: <Heart className="icon-sm" />,
      color: 'rose',
      unlocked: telemetry.diet_meat_servings <= 0.5 || adoptedIds.includes('vegan_diet') || adoptedIds.includes('vegetarian_diet')
    }
  ];

  const unlockedCount = BADGES.filter(b => b.unlocked).length;

  // Assemble real-time leaderboard entries
  const peers: Omit<LeaderboardEntry, 'rank'>[] = [
    { name: 'Smart Solar Home (Denver)', greenScore: 94, co2PerDay: 4.5, isCurrentUser: false },
    { name: 'Urban Eco-Apartment (Seattle)', greenScore: 84, co2PerDay: 8.2, isCurrentUser: false },
    { name: 'Suburban Estate (Dallas)', greenScore: 52, co2PerDay: 16.8, isCurrentUser: false },
    { name: 'Rural Homestead (Montana)', greenScore: 28, co2PerDay: 26.5, isCurrentUser: false }
  ];

  // Insert user and sort
  const allEntries: LeaderboardEntry[] = [
    ...peers,
    { name: 'User Node (Local Client)', greenScore, co2PerDay: currentPrediction, isCurrentUser: true }
  ]
    .sort((a, b) => b.greenScore - a.greenScore)
    .map((entry, idx) => ({
      ...entry,
      rank: idx + 1
    }));

  // Circle progress calculation for gauge
  const radius = 60;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (greenScore / 100) * circumference;

  const getScoreColorClass = (score: number) => {
    if (score >= 80) return 'text-green border-green';
    if (score >= 50) return 'text-cyan border-cyan';
    if (score >= 30) return 'text-amber border-amber';
    return 'text-red border-red';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return 'url(#gauge-green)';
    if (score >= 50) return 'url(#gauge-cyan)';
    if (score >= 30) return 'url(#gauge-amber)';
    return 'url(#gauge-red)';
  };

  return (
    <div className="gamification-container">
      {/* 1. Green Score Gauge Card */}
      <div className="glass-card score-card">
        <div className="card-header border-bottom">
          <div className="header-title">
            <Award className="icon icon-green" />
            <h2>Environmental Green Score</h2>
          </div>
        </div>
        <div className="card-body gauge-body">
          <div className="gauge-container">
            <svg width="150" height="150" className="gauge-svg">
              <defs>
                <linearGradient id="gauge-green" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
                <linearGradient id="gauge-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="100%" stopColor="#0891b2" />
                </linearGradient>
                <linearGradient id="gauge-amber" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
                <linearGradient id="gauge-red" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f87171" />
                  <stop offset="100%" stopColor="#dc2626" />
                </linearGradient>
                <filter id="gauge-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              {/* Background circle */}
              <circle
                cx="75"
                cy="75"
                r={radius}
                fill="transparent"
                stroke="var(--border-color)"
                strokeWidth={strokeWidth}
              />
              {/* Foregound animated circle */}
              <circle
                cx="75"
                cy="75"
                r={radius}
                fill="transparent"
                stroke={getScoreGradient(greenScore)}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="gauge-circle"
                filter="url(#gauge-glow)"
              />
            </svg>
            <div className="gauge-overlay">
              <span className="gauge-val">{greenScore}</span>
              <span className="gauge-lbl">Score</span>
            </div>
          </div>

          <div className="score-summary">
            <h3>Rating: {greenScore >= 80 ? 'Decarbonizer Pro' : greenScore >= 50 ? 'Active Conservator' : 'Carbon Intensive'}</h3>
            <p>
              Your Green Score is calculated relative to carbon prediction guidelines. Adopting recommendations raises your rating.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Achievements Badges Card */}
      <div className="glass-card badges-card">
        <div className="card-header border-bottom">
          <div className="header-title">
            <Award className="icon icon-purple" />
            <h2>Sustainablity Badges ({unlockedCount}/{BADGES.length})</h2>
          </div>
        </div>
        <div className="card-body">
          <div className="badges-grid">
            {BADGES.map(badge => (
              <div 
                key={badge.id} 
                className={`badge-box ${badge.unlocked ? 'unlocked' : 'locked'} border-${badge.color}`}
              >
                <div className={`badge-icon-wrap bg-${badge.color}`}>
                  {badge.icon}
                  {badge.unlocked && (
                    <div className="unlocked-checkmark">
                      <Check className="check-svg" />
                    </div>
                  )}
                </div>
                <span className="badge-name">{badge.name}</span>
                <span className="badge-desc">{badge.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Leaderboard Card */}
      <div className="glass-card leaderboard-card">
        <div className="card-header border-bottom">
          <div className="header-title">
            <Trophy className="icon icon-amber" />
            <h2>Federated Leaderboard</h2>
          </div>
        </div>
        <div className="card-body p-0">
          <div className="leaderboard-list">
            {allEntries.map(entry => (
              <div 
                key={entry.name} 
                className={`leaderboard-row ${entry.isCurrentUser ? 'current-user-row' : ''}`}
              >
                <div className="rank-col">
                  {entry.rank === 1 ? (
                    <span className="rank-gold">🏆 1</span>
                  ) : (
                    <span>Rank {entry.rank}</span>
                  )}
                </div>
                <div className="name-col font-bold">
                  {entry.name} {entry.isCurrentUser && <span className="current-badge">YOU</span>}
                </div>
                <div className="score-col">
                  <span className={`score-val ${getScoreColorClass(entry.greenScore)}`}>
                    {entry.greenScore} pts
                  </span>
                </div>
                <div className="co2-col text-grey">
                  {entry.co2PerDay.toFixed(1)} kg CO₂/d
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
