import { predictCarbonFootprint } from './predictionModel';
import type { ShapValues } from '../types';

// Precompute factorials for speed
const factorials: number[] = [];
function factorial(n: number): number {
  if (n <= 1) return 1;
  if (factorials[n]) return factorials[n];
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  factorials[n] = res;
  return res;
}

/**
 * Calculates the exact SHAP (Shapley Additive exPlanations) values for a user vector X
 * relative to a background baseline vector B.
 */
export function calculateSHAP(X: number[], B: number[]): { shapValues: ShapValues; baseValue: number; predictionValue: number } {
  const N = X.length;
  const numSubsets = 1 << N; // 2^9 = 512 for 9 features

  // 1. Evaluate model for all subsets
  const subsetOutputs = new Float32Array(numSubsets);
  const tempVec = new Array(N);

  for (let mask = 0; mask < numSubsets; mask++) {
    for (let j = 0; j < N; j++) {
      if ((mask & (1 << j)) !== 0) {
        tempVec[j] = X[j];
      } else {
        tempVec[j] = B[j];
      }
    }
    subsetOutputs[mask] = predictCarbonFootprint(tempVec);
  }

  const baseValue = subsetOutputs[0]; // All features at baseline
  const predictionValue = subsetOutputs[numSubsets - 1]; // All features at user input

  // Feature names map
  const featureNames = [
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

  const shapValues: ShapValues = {};
  featureNames.forEach(name => {
    shapValues[name] = 0;
  });

  // Helper to count active bits (cardinality of S)
  function countSetBits(n: number): number {
    let count = 0;
    while (n > 0) {
      n &= n - 1;
      count++;
    }
    return count;
  }

  // 2. Compute Shapley values
  for (let i = 0; i < N; i++) {
    let phi_i = 0;
    const bit_i = 1 << i;

    for (let mask = 0; mask < numSubsets; mask++) {
      // We want subsets S that DO NOT contain feature i (i-th bit is 0)
      if ((mask & bit_i) === 0) {
        const sizeS = countSetBits(mask);
        const withI = mask | bit_i;

        // Weight = |S|! * (N - |S| - 1)! / N!
        const w = (factorial(sizeS) * factorial(N - sizeS - 1)) / factorial(N);
        const marginalContribution = subsetOutputs[withI] - subsetOutputs[mask];
        phi_i += w * marginalContribution;
      }
    }

    shapValues[featureNames[i]] = phi_i;
  }

  return {
    shapValues,
    baseValue,
    predictionValue
  };
}
