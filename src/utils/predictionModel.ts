import type { IoTTelemetry } from '../types';

export const FEATURE_METADATA: {
  [key: string]: { label: string; unit: string; category: 'energy' | 'transport' | 'food' | 'water' | 'waste'; defaultVal: number }
} = {
  electricity_kwh: { label: 'Electricity Consumption', unit: 'kWh/day', category: 'energy', defaultVal: 12 },
  appliance_ac_kwh: { label: 'AC & Space Heating', unit: 'kWh/day', category: 'energy', defaultVal: 6 },
  appliance_other_kwh: { label: 'Other Home Appliances', unit: 'kWh/day', category: 'energy', defaultVal: 5 },
  transport_dist_km: { label: 'Vehicle Distance', unit: 'km/day', category: 'transport', defaultVal: 25 },
  diet_meat_servings: { label: 'Meat Intake', unit: 'servings/day', category: 'food', defaultVal: 1.5 },
  diet_dairy_servings: { label: 'Dairy Intake', unit: 'servings/day', category: 'food', defaultVal: 2.0 },
  water_liters: { label: 'Water Usage', unit: 'L/day', category: 'water', defaultVal: 150 },
  waste_kg: { label: 'Landfill Waste', unit: 'kg/day', category: 'waste', defaultVal: 1.2 }
};

export const FUEL_MULTIPLIERS = {
  petrol: 1.0,
  diesel: 1.15,
  hybrid: 0.5,
  ev: 0.15
};

export const BASELINE_EMISSIONS = 14.85; // Global or regional average daily CO2 per capita in kg

/**
 * Returns emissions calculation based on a numeric array.
 * This function represents the "AI Model" that XAI will explain.
 * We add some realistic non-linearities and interactions.
 */
export function predictCarbonFootprint(features: number[]): number {
  const [
    electricity_kwh,
    appliance_ac_kwh,
    appliance_other_kwh,
    transport_dist_km,
    fuel_multiplier, // index 4: converted transport fuel type factor
    diet_meat_servings,
    diet_dairy_servings,
    water_liters,
    waste_kg
  ] = features;

  // 1. Core Linear Emissions
  const electricityEmissions = (electricity_kwh + appliance_ac_kwh * 1.15 + appliance_other_kwh) * 0.385; // 0.385 kg CO2 per kWh

  // Transport emissions depend on distance & fuel multiplier
  const transportEmissions = transport_dist_km * 0.18 * fuel_multiplier;

  // Food emissions
  const meatEmissions = diet_meat_servings * 2.2; // 2.2 kg CO2 per serving
  const dairyEmissions = diet_dairy_servings * 0.7; // 0.7 kg CO2 per serving

  // Water emissions
  const waterEmissions = water_liters * 0.00045; // 0.00045 kg CO2 per liter

  // Waste emissions
  const wasteEmissions = waste_kg * 0.85; // 0.85 kg CO2 per kg

  // 2. Non-linear Interaction Terms (AI complexity simulation)
  // - High electricity and high AC load triggers peak grid strain (higher carbon intensity)
  const acStrain = appliance_ac_kwh > 10 ? (appliance_ac_kwh - 10) * 0.08 : 0;

  // - High meat diet and high waste has a composting synergy effect (organic waste decomposition)
  const organicWasteInteraction = diet_meat_servings * waste_kg * 0.12;

  // - Ev charging interaction: if driving EV (fuel_multiplier = 0.15) and electricity is very low,
  // it means we charge elsewhere, but if electricity is high, we simulate home EV charging efficiency losses
  const evChargingInteraction = (fuel_multiplier === FUEL_MULTIPLIERS.ev && transport_dist_km > 30)
    ? (transport_dist_km / 30) * (electricity_kwh * 0.03)
    : 0;

  const total =
    electricityEmissions +
    transportEmissions +
    meatEmissions +
    dairyEmissions +
    waterEmissions +
    wasteEmissions +
    acStrain +
    organicWasteInteraction +
    evChargingInteraction;

  // Ensure emissions are non-negative
  return Math.max(0.05, total);
}

/**
 * Converts telemetry object to features vector.
 */
export function telemetryToVector(telemetry: IoTTelemetry): number[] {
  return [
    telemetry.electricity_kwh,
    telemetry.appliance_ac_kwh,
    telemetry.appliance_other_kwh,
    telemetry.transport_dist_km,
    FUEL_MULTIPLIERS[telemetry.transport_fuel_type],
    telemetry.diet_meat_servings,
    telemetry.diet_dairy_servings,
    telemetry.water_liters,
    telemetry.waste_kg
  ];
}

/**
 * Converts features vector back to telemetry object.
 */
export function vectorToTelemetry(vector: number[], _original: IoTTelemetry): IoTTelemetry {
  // Find fuel type closest to numerical multiplier
  let fuelType: IoTTelemetry['transport_fuel_type'] = 'petrol';
  const val = vector[4];
  let minDiff = Infinity;
  for (const [key, mult] of Object.entries(FUEL_MULTIPLIERS)) {
    const diff = Math.abs(mult - val);
    if (diff < minDiff) {
      minDiff = diff;
      fuelType = key as IoTTelemetry['transport_fuel_type'];
    }
  }

  return {
    electricity_kwh: Math.max(0, vector[0]),
    appliance_ac_kwh: Math.max(0, vector[1]),
    appliance_other_kwh: Math.max(0, vector[2]),
    transport_dist_km: Math.max(0, vector[3]),
    transport_fuel_type: fuelType,
    diet_meat_servings: Math.max(0, vector[5]),
    diet_dairy_servings: Math.max(0, vector[6]),
    water_liters: Math.max(0, vector[7]),
    waste_kg: Math.max(0, vector[8])
  };
}

/**
 * High-level function that runs the calculation directly on a telemetry object.
 */
export function calculateCarbonFootprint(telemetry: IoTTelemetry): number {
  const vec = telemetryToVector(telemetry);
  return predictCarbonFootprint(vec);
}

/**
 * Generates synthetic baseline/reference values representing the "average user".
 */
export function getAverageTelemetry(): IoTTelemetry {
  return {
    electricity_kwh: 12,
    appliance_ac_kwh: 6,
    appliance_other_kwh: 5,
    transport_dist_km: 25,
    transport_fuel_type: 'petrol',
    diet_meat_servings: 1.5,
    diet_dairy_servings: 2.0,
    water_liters: 150,
    waste_kg: 1.2
  };
}
