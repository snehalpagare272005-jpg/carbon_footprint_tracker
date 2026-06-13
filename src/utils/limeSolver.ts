import { predictCarbonFootprint } from './predictionModel';
import type { LimeExplanation } from '../types';

// Simple Box-Muller transform for normal distribution
function randomNormal(mean = 0, stdDev = 1): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const randStdNormal = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return mean + stdDev * randStdNormal;
}

const FEATURE_KEYS = [
  'electricity_kwh',
  'appliance_ac_kwh',
  'appliance_other_kwh',
  'transport_dist_km',
  'transport_fuel',
  'diet_meat_servings',
  'diet_dairy_servings',
  'water_liters',
  'waste_kg'
];

// Perturbation standard deviations based on reasonable feature ranges
const PERTURBATION_STDS = [
  3.0,   // electricity_kwh
  2.0,   // appliance_ac_kwh
  1.5,   // appliance_other_kwh
  10.0,  // transport_dist_km
  0.3,   // transport_fuel multiplier
  0.8,   // diet_meat_servings
  1.0,   // diet_dairy_servings
  40.0,  // water_liters
  0.5    // waste_kg
];

/**
 * Calculates LIME local explanation for a user vector X.
 * Generates perturbations, weights them by distance, and fits a local ridge regression.
 */
export function calculateLIME(X: number[]): LimeExplanation {
  const N = X.length;
  const numPerturbations = 200;
  const currentPrediction = predictCarbonFootprint(X);

  const perturbations: number[][] = [];
  const predictions: number[] = [];
  const weights: number[] = [];

  // 1. Generate Perturbations
  for (let i = 0; i < numPerturbations; i++) {
    const pert = new Array(N);
    let distSq = 0;

    for (let j = 0; j < N; j++) {
      // Perturb feature j
      const std = PERTURBATION_STDS[j];
      let val = X[j] + randomNormal(0, std);

      // Clip physically impossible values (except fuel multiplier, which we keep bounded)
      if (j === 4) {
        val = Math.max(0.15, Math.min(1.15, val));
      } else {
        val = Math.max(0, val);
      }
      pert[j] = val;

      // Distance calculation (normalized by the standard deviation of perturbation)
      const diff = (val - X[j]) / std;
      distSq += diff * diff;
    }

    perturbations.push(pert);
    predictions.push(predictCarbonFootprint(pert));

    // Distance weight using exponential kernel: exp(-d^2 / kernel_width)
    // kernel_width is chosen to cover standard distance ranges
    const kernelWidth = 4.0;
    weights.push(Math.exp(-distSq / kernelWidth));
  }

  // Normalize weights
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  const normWeights = weights.map(w => w / (totalWeight || 1));

  // 2. Fit Local Linear Model: DeltaY ~ w * DeltaX
  // DeltaY = prediction - currentPrediction
  // DeltaX = perturbation - X
  // Loss = Sum( W_i * (DeltaY_i - sum(w_j * DeltaX_i,j))^2 ) + lambda * sum(w_j^2)
  const coefs = new Array(N).fill(0);
  const lambda = 0.05; // Ridge penalty
  const epochs = 100;
  const lr = 0.01;

  // Gradient Descent for Ridge Regression
  for (let epoch = 0; epoch < epochs; epoch++) {
    const grads = new Array(N).fill(0);

    for (let i = 0; i < numPerturbations; i++) {
      const pert = perturbations[i];
      const weight = normWeights[i];
      const yTrueDiff = predictions[i] - currentPrediction;

      let yPredDiff = 0;
      for (let j = 0; j < N; j++) {
        yPredDiff += coefs[j] * (pert[j] - X[j]);
      }

      const error = yPredDiff - yTrueDiff;

      for (let j = 0; j < N; j++) {
        const xDiff = pert[j] - X[j];
        grads[j] += weight * error * xDiff;
      }
    }

    // Update weights with gradient and ridge penalty
    for (let j = 0; j < N; j++) {
      grads[j] += lambda * coefs[j];
      coefs[j] -= lr * grads[j];
    }
  }

  // 3. Compute R-squared to show local model goodness-of-fit
  let totalSS = 0;
  let residualSS = 0;
  const meanYDiff = predictions.reduce((sum, y, idx) => sum + normWeights[idx] * (y - currentPrediction), 0);

  for (let i = 0; i < numPerturbations; i++) {
    const pert = perturbations[i];
    const weight = normWeights[i];
    const yTrueDiff = predictions[i] - currentPrediction;

    let yPredDiff = 0;
    for (let j = 0; j < N; j++) {
      yPredDiff += coefs[j] * (pert[j] - X[j]);
    }

    totalSS += weight * Math.pow(yTrueDiff - meanYDiff, 2);
    residualSS += weight * Math.pow(yTrueDiff - yPredDiff, 2);
  }

  const r2 = totalSS > 0 ? 1 - residualSS / totalSS : 1.0;

  const coefficients: { [key: string]: number } = {};
  FEATURE_KEYS.forEach((name, index) => {
    coefficients[name] = coefs[index];
  });

  return {
    intercept: currentPrediction,
    coefficients,
    r2: Math.max(0, Math.min(1, r2))
  };
}
