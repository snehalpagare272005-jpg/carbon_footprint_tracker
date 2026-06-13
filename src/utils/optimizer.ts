import type { Recommendation, IoTTelemetry } from '../types';

export const BASE_RECOMMENDATIONS: Omit<Recommendation, 'matchScore' | 'whyRecommended' | 'adopted'>[] = [
  {
    id: 'led_bulbs',
    title: 'Switch to LED Lighting',
    description: 'Replace traditional incandescent bulbs with energy-efficient smart LED bulbs.',
    category: 'energy',
    co2Savings: 15, // kg CO2/month
    cost: 10, // upfront cost
    effort: 'low',
    impact: 'low'
  },
  {
    id: 'hvac_schedule',
    title: 'Smart Thermostat Schedule',
    description: 'Set HVAC system to Eco-Mode when away from home or sleeping.',
    category: 'energy',
    co2Savings: 45,
    cost: 0,
    effort: 'low',
    impact: 'medium'
  },
  {
    id: 'hvac_adjust',
    title: 'Moderate Thermostat by 2°C',
    description: 'Increase cooling temp by 2°C in summer, decrease heating by 2°C in winter.',
    category: 'energy',
    co2Savings: 60,
    cost: 0,
    effort: 'low',
    impact: 'medium'
  },
  {
    id: 'cold_water_wash',
    title: 'Wash Laundry in Cold Water',
    description: 'Run washing machine cycles on cold settings instead of warm/hot water.',
    category: 'energy',
    co2Savings: 12,
    cost: 0,
    effort: 'low',
    impact: 'low'
  },
  {
    id: 'smart_plug',
    title: 'Vampire Load Smart Plugs',
    description: 'Use smart plugs to auto-power down idle electronics (TVs, consoles, chargers) at night.',
    category: 'energy',
    co2Savings: 8,
    cost: 15,
    effort: 'low',
    impact: 'low'
  },
  {
    id: 'carpool',
    title: 'Carpool to Work (2x/week)',
    description: 'Share commute rides with colleagues or neighbors twice a week.',
    category: 'transport',
    co2Savings: 70,
    cost: -15, // Negative cost means savings on fuel
    effort: 'medium',
    impact: 'medium'
  },
  {
    id: 'public_transit',
    title: 'Take Public Transit for Commute',
    description: 'Replace private vehicle commute with metro, rail, or bus transit.',
    category: 'transport',
    co2Savings: 190,
    cost: 40, // monthly pass cost
    effort: 'high',
    impact: 'high'
  },
  {
    id: 'switch_to_ev',
    title: 'Transition to an Electric Vehicle',
    description: 'Upgrade your petrol/diesel car to a plug-in EV or hybrid.',
    category: 'transport',
    co2Savings: 240,
    cost: 250, // monthly finance differential
    effort: 'high',
    impact: 'high'
  },
  {
    id: 'meatless_monday',
    title: 'Meatless Monday Challenge',
    description: 'Eat entirely plant-based meals one day per week.',
    category: 'food',
    co2Savings: 20,
    cost: -8, // saves grocery money
    effort: 'low',
    impact: 'low'
  },
  {
    id: 'vegetarian_diet',
    title: 'Switch to a Vegetarian Diet',
    description: 'Eliminate meat intake entirely and adopt a plant-based dairy diet.',
    category: 'food',
    co2Savings: 90,
    cost: -25,
    effort: 'medium',
    impact: 'high'
  },
  {
    id: 'vegan_diet',
    title: 'Switch to a Vegan Diet',
    description: 'Adopt a fully plant-based lifestyle, eliminating meat and dairy.',
    category: 'food',
    co2Savings: 140,
    cost: -30,
    effort: 'high',
    impact: 'high'
  },
  {
    id: 'composting',
    title: 'Compost Organic Kitchen Waste',
    description: 'Compost food scraps to reduce landfill waste and methane output.',
    category: 'waste',
    co2Savings: 16,
    cost: 15, // upfront bin
    effort: 'medium',
    impact: 'low'
  },
  {
    id: 'shower_head',
    title: 'Install Low-Flow Showerheads',
    description: 'Restrict shower water flow rates to under 2 gallons per minute.',
    category: 'water',
    co2Savings: 10,
    cost: 15,
    effort: 'low',
    impact: 'low'
  },
  {
    id: 'shower_time',
    title: 'Reduce Shower by 3 Minutes',
    description: 'Shave 3 minutes off your average daily shower time.',
    category: 'water',
    co2Savings: 9,
    cost: 0,
    effort: 'low',
    impact: 'low'
  },
  {
    id: 'solar_panels',
    title: 'Install Home Rooftop Solar',
    description: 'Power your home with clean, self-generated rooftop solar energy.',
    category: 'energy',
    co2Savings: 320,
    cost: 120, // monthly finance lease
    effort: 'high',
    impact: 'high'
  }
];

const EFFORT_VALUES = {
  low: 1,
  medium: 3,
  high: 5
};

/**
 * Customizes recommendation savings and matches based on the user's current IoT telemetry.
 */
export function getCustomizedRecommendations(telemetry: IoTTelemetry, shapValues: { [key: string]: number }): Recommendation[] {
  // Compute total shap contributions for categories to target suggestions
  const energySHAP = (shapValues['electricity_kwh'] || 0) + (shapValues['appliance_ac_kwh'] || 0) + (shapValues['appliance_other_kwh'] || 0);
  const transportSHAP = (shapValues['transport_dist_km'] || 0) + (shapValues['transport_fuel'] || 0);
  const foodSHAP = (shapValues['diet_meat_servings'] || 0) + (shapValues['diet_dairy_servings'] || 0);
  const waterSHAP = shapValues['water_liters'] || 0;
  const wasteSHAP = shapValues['waste_kg'] || 0;

  const totalSHAP = Math.max(0.1, Math.abs(energySHAP) + Math.abs(transportSHAP) + Math.abs(foodSHAP) + Math.abs(waterSHAP) + Math.abs(wasteSHAP));

  return BASE_RECOMMENDATIONS.map(rec => {
    let scale = 1.0;
    let whyRecommended = '';

    // Adjust savings and descriptions dynamically
    if (rec.category === 'transport') {
      if (telemetry.transport_dist_km === 0) {
        scale = 0;
        whyRecommended = 'Not applicable since your vehicle travel is already 0 km.';
      } else {
        const ratio = telemetry.transport_dist_km / 25; // baseline travel is 25km
        scale = Math.min(2.5, ratio);
        
        if (telemetry.transport_fuel_type === 'ev' && rec.id === 'switch_to_ev') {
          scale = 0;
          whyRecommended = 'You are already driving an electric vehicle!';
        } else if (telemetry.transport_fuel_type === 'ev') {
          scale *= 0.2; // EVs already save massive emissions, carpooling saves less net carbon
          whyRecommended = 'Recommended for traffic reduction; carbon savings scaled down because you drive an EV.';
        } else {
          whyRecommended = `High match because vehicle emissions represent ${( (transportSHAP / totalSHAP) * 100 ).toFixed(0)}% of your carbon footprint.`;
        }
      }
    } else if (rec.category === 'food') {
      if (telemetry.diet_meat_servings === 0) {
        if (rec.id === 'meatless_monday' || rec.id === 'vegetarian_diet') {
          scale = 0;
          whyRecommended = 'You are already meat-free!';
        } else if (telemetry.diet_dairy_servings === 0 && rec.id === 'vegan_diet') {
          scale = 0;
          whyRecommended = 'You are already practicing a fully vegan diet!';
        } else {
          scale = 1.0;
          whyRecommended = 'Switching to vegan will help eliminate your dairy carbon contributions.';
        }
      } else {
        const meatRatio = telemetry.diet_meat_servings / 1.5; // average meat is 1.5 servings
        scale = Math.min(2.0, meatRatio);
        whyRecommended = `High priority suggestion as food intake accounts for ${( (foodSHAP / totalSHAP) * 100 ).toFixed(0)}% of your emissions.`;
      }
    } else if (rec.category === 'energy') {
      const energyUsage = telemetry.electricity_kwh + telemetry.appliance_ac_kwh + telemetry.appliance_other_kwh;
      if (energyUsage < 8) {
        scale = 0.5; // already very low
        whyRecommended = 'Your electrical usage is extremely low. Small adjustments show incremental improvements.';
      } else {
        scale = Math.min(2.0, energyUsage / 23.0); // baseline total electricity is ~23kWh
        whyRecommended = `Optimized for you because heating and appliances comprise ${( (energySHAP / totalSHAP) * 100 ).toFixed(0)}% of your footprint.`;
      }
    } else if (rec.category === 'water') {
      const waterRatio = telemetry.water_liters / 150; // baseline 150L
      scale = Math.min(2.0, waterRatio);
      whyRecommended = `Water usage contributes ${( (waterSHAP / totalSHAP) * 100 ).toFixed(0)}% of emissions. Saving water also saves grid pump power.`;
    } else if (rec.category === 'waste') {
      const wasteRatio = telemetry.waste_kg / 1.2; // baseline 1.2kg
      scale = Math.min(2.0, wasteRatio);
      whyRecommended = `Waste decomposition adds ${( (wasteSHAP / totalSHAP) * 100 ).toFixed(0)}% to your footprint. Composting stops landfill methane.`;
    }

    const co2Savings = Math.round(rec.co2Savings * scale);

    // Compute personalized match score (0-100)
    let categoryWeight = 0;
    if (rec.category === 'energy') categoryWeight = energySHAP;
    else if (rec.category === 'transport') categoryWeight = transportSHAP;
    else if (rec.category === 'food') categoryWeight = foodSHAP;
    else if (rec.category === 'water') categoryWeight = waterSHAP;
    else if (rec.category === 'waste') categoryWeight = wasteSHAP;

    const baseScore = 60;
    const categoryFactor = (categoryWeight / totalSHAP) * 40;
    const effortPenalty = rec.effort === 'low' ? 0 : rec.effort === 'medium' ? 10 : 20;
    const matchScore = Math.max(10, Math.min(99, Math.round(baseScore + categoryFactor - effortPenalty)));

    return {
      ...rec,
      co2Savings,
      matchScore: scale === 0 ? 0 : matchScore,
      whyRecommended: whyRecommended || 'Personalized reduction recommendation.',
      adopted: false
    };
  }).filter(rec => rec.co2Savings > 0); // exclude non-applicable recommendations
}

/**
 * Solves a constraint optimization problem using an exact search over all subsets of actions.
 * Objective: Minimize total cost & effort
 * Subject to: Total CO2 savings >= targetSavings
 */
export function optimizeReduction(
  targetSavings: number, // in kg CO2/month
  recommendations: Recommendation[]
): { selectedIds: string[]; totalSavings: number; totalCost: number; totalEffortScore: number } {
  
  const applicable = recommendations.filter(r => r.co2Savings > 0);
  const n = applicable.length;
  
  let bestSelection: string[] = [];
  let bestScore = Infinity;
  let bestSavings = 0;
  let bestCost = 0;
  let bestEffortVal = 0;
  
  let fallbackSelection: string[] = [];
  let maxSavingsFallback = 0;
  let fallbackCost = 0;
  let fallbackEffortVal = 0;

  const totalStates = 1 << n; // 2^n states

  for (let mask = 0; mask < totalStates; mask++) {
    let currentSavings = 0;
    let currentCost = 0;
    let currentEffortScore = 0;
    const currentSelection: string[] = [];

    for (let j = 0; j < n; j++) {
      if ((mask & (1 << j)) !== 0) {
        const item = applicable[j];
        currentSavings += item.co2Savings;
        currentCost += item.cost;
        currentEffortScore += EFFORT_VALUES[item.effort];
        currentSelection.push(item.id);
      }
    }

    // Check feasibility: meets target carbon reduction
    if (currentSavings >= targetSavings) {
      // Objective score to minimize: effort * 2 + cost * 0.05
      // We scale cost and effort so they are comparable
      const score = currentEffortScore * 2.0 + currentCost * 0.05;
      
      if (score < bestScore) {
        bestScore = score;
        bestSelection = [...currentSelection];
        bestSavings = currentSavings;
        bestCost = currentCost;
        bestEffortVal = currentEffortScore;
      }
    }

    // Keep track of the maximum savings combination in case target is unachievable
    if (currentSavings > maxSavingsFallback) {
      maxSavingsFallback = currentSavings;
      fallbackSelection = [...currentSelection];
      fallbackCost = currentCost;
      fallbackEffortVal = currentEffortScore;
    }
  }

  // If no combination satisfies the target, return the fallback (selects all/most savings)
  if (bestSelection.length === 0 && targetSavings > 0) {
    return {
      selectedIds: fallbackSelection,
      totalSavings: maxSavingsFallback,
      totalCost: fallbackCost,
      totalEffortScore: fallbackEffortVal
    };
  }

  return {
    selectedIds: bestSelection,
    totalSavings: bestSavings,
    totalCost: bestCost,
    totalEffortScore: bestEffortVal
  };
}
