export interface IoTTelemetry {
  electricity_kwh: number;
  appliance_ac_kwh: number;
  appliance_other_kwh: number;
  transport_dist_km: number;
  transport_fuel_type: 'petrol' | 'diesel' | 'hybrid' | 'ev';
  diet_meat_servings: number;
  diet_dairy_servings: number;
  water_liters: number;
  waste_kg: number;
}

export interface ShapValues {
  [key: string]: number;
}

export interface LimeExplanation {
  intercept: number;
  coefficients: { [key: string]: number };
  r2: number;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  category: 'transport' | 'energy' | 'food' | 'water' | 'waste';
  co2Savings: number; // kg CO2 / month
  cost: number; // monthly or upfront cost
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  adopted: boolean;
  matchScore: number;
  whyRecommended: string;
}

export interface FederatedClientState {
  id: string;
  name: string;
  lossHistory: number[];
  currentLoss: number;
  accuracy: number;
  status: 'Idle' | 'Downloading' | 'Training' | 'Uploading' | 'Complete';
  localTelemetry: IoTTelemetry;
  progress: number;
}

export interface ForecastData {
  date: string;
  historical: number | null;
  projected: number | null;
  lowerBound: number | null;
  upperBound: number | null;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  greenScore: number;
  co2PerDay: number;
  isCurrentUser: boolean;
}
