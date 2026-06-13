import type { FederatedClientState, IoTTelemetry } from '../types';

// Standard background average weights for the global model
export const TRUE_WEIGHTS = [0.385, 0.423, 0.385, 0.18, 1.0, 2.2, 0.7, 0.00045, 0.85];

export const CLIENT_INITIAL_TELEMETRY: { [key: string]: IoTTelemetry } = {
  'client_1': {
    electricity_kwh: 4.5, // low electricity (solar panels)
    appliance_ac_kwh: 2.0,
    appliance_other_kwh: 3.0,
    transport_dist_km: 45.0, // high travel but EV
    transport_fuel_type: 'ev',
    diet_meat_servings: 0.5,
    diet_dairy_servings: 1.0,
    water_liters: 90,
    waste_kg: 0.5
  },
  'client_2': {
    electricity_kwh: 14.0,
    appliance_ac_kwh: 8.0,
    appliance_other_kwh: 6.0,
    transport_dist_km: 30.0,
    transport_fuel_type: 'petrol',
    diet_meat_servings: 2.0,
    diet_dairy_servings: 2.5,
    water_liters: 180,
    waste_kg: 1.5
  },
  'client_3': {
    electricity_kwh: 8.0,
    appliance_ac_kwh: 4.0,
    appliance_other_kwh: 4.5,
    transport_dist_km: 0.0, // public transport only
    transport_fuel_type: 'hybrid', // low impact
    diet_meat_servings: 1.2,
    diet_dairy_servings: 1.5,
    water_liters: 110,
    waste_kg: 0.8
  },
  'client_4': {
    electricity_kwh: 22.0, // rural farmhouse, high electric heating
    appliance_ac_kwh: 12.0,
    appliance_other_kwh: 8.0,
    transport_dist_km: 60.0, // high travel diesel
    transport_fuel_type: 'diesel',
    diet_meat_servings: 3.0, // high meat diet
    diet_dairy_servings: 3.5,
    water_liters: 300,
    waste_kg: 2.2
  }
};

export interface FederatedTrainingRoundResult {
  roundNumber: number;
  globalLoss: number;
  globalAccuracy: number;
  globalWeights: number[];
  clientStates: FederatedClientState[];
}

/**
 * Simulates a single federated learning round.
 * Takes the current round number and user's current telemetry,
 * performs simulated local SGD epochs on 5 clients, and aggregates with FedAvg.
 */
export function simulateFederatedRound(
  roundNumber: number,
  userTelemetry: IoTTelemetry,
  prevWeights: number[] = [0.9, 0.8, 0.9, 0.5, 1.8, 4.0, 1.5, 0.002, 1.8] // initial bad weights
): FederatedTrainingRoundResult {
  
  const clientNames = [
    'Smart Solar Home (Denver)',
    'Suburban Estate (Dallas)',
    'Urban Eco-Apartment (Seattle)',
    'Rural Homestead (Montana)',
    'User Node (Local Client)'
  ];

  const clientKeys = ['client_1', 'client_2', 'client_3', 'client_4', 'user_client'];
  
  // Assemble client telemetries
  const telemetries: { [key: string]: IoTTelemetry } = {
    ...CLIENT_INITIAL_TELEMETRY,
    'user_client': userTelemetry
  };

  // Simulate local training
  const clientStates: FederatedClientState[] = clientKeys.map((key, idx) => {
    const telemetry = telemetries[key];

    // Local loss is simulated to converge closer to 0 as rounds increase
    // User client and clients have slightly different final losses
    const baseVariance = Math.random() * 0.08;
    const initialLoss = 0.8 / (1 + roundNumber * 0.4) + baseVariance;
    const finalLoss = 0.15 / (1 + roundNumber * 0.45) + baseVariance * 0.2;
    
    // Create detailed training history
    const steps = 5;
    const lossHistory: number[] = [];
    for (let s = 0; s < steps; s++) {
      lossHistory.push(initialLoss - (initialLoss - finalLoss) * (s / (steps - 1)));
    }

    const accuracy = Math.min(0.99, 0.60 + (0.39) * (1 - Math.exp(-roundNumber * 0.7)) + Math.random() * 0.03);

    return {
      id: key,
      name: clientNames[idx],
      lossHistory,
      currentLoss: finalLoss,
      accuracy: accuracy * 100, // percentage
      status: 'Complete',
      localTelemetry: telemetry,
      progress: 100
    };
  });

  // Calculate aggregated global weights (FedAvg)
  // For simplicity, local models converge slowly towards the true weights
  const learningRate = 0.35; // speed of convergence
  const globalWeights = prevWeights.map((w, idx) => {
    const target = TRUE_WEIGHTS[idx];
    // Blend current weight with target weight
    const newVal = w + (target - w) * learningRate + (Math.random() - 0.5) * 0.02 * (1 / (roundNumber + 1));
    return newVal;
  });

  // Compute global loss and accuracy
  const globalLoss = clientStates.reduce((sum, c) => sum + c.currentLoss, 0) / clientStates.length;
  const globalAccuracy = clientStates.reduce((sum, c) => sum + c.accuracy, 0) / clientStates.length;

  return {
    roundNumber: roundNumber + 1,
    globalLoss,
    globalAccuracy,
    globalWeights,
    clientStates
  };
}

/**
 * Returns mock log lines during training to render in the client consoles
 */
export function getClientLogs(clientName: string, round: number, telemetry: IoTTelemetry): string[] {
  const datasetSize = Math.floor(100 + Math.random() * 50);
  const fuelType = telemetry.transport_fuel_type;
  
  return [
    `[INFO] Initializing Federated Client for ${clientName}...`,
    `[INFO] Dataset size: ${datasetSize} local IoT telemetry packets.`,
    `[INFO] Target: predictCarbonFootprint()`,
    `[INFO] Current Local Device Features: Electricity: ${telemetry.electricity_kwh}kWh, Transport: ${telemetry.transport_dist_km}km (${fuelType}).`,
    `[LOCAL TRAINING] Running local SGD optimization (Batch size: 16)...`,
    `Epoch 1/3 - Loss: ${(0.75 / (1 + round * 0.3)).toFixed(4)}`,
    `Epoch 2/3 - Loss: ${(0.45 / (1 + round * 0.35)).toFixed(4)}`,
    `Epoch 3/3 - Loss: ${(0.22 / (1 + round * 0.4)).toFixed(4)}`,
    `[SECURE AGG] Generating local weight differentials & clipping gradients.`,
    `[SECURE AGG] Generating homomorphic encryption shares (Paillier keys).`,
    `[UPLOAD] Local parameters uploaded to aggregation server successfully.`
  ];
}
