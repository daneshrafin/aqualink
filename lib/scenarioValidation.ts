import type {Community, Scenario} from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const numericFields = [
  ['people', 'Population', 0],
  ['dailySupplyLiters', 'Current daily supply (litres)', 0],
  ['storageLiters', 'Stored water (litres)', 0],
  ['repairCost', 'Repair cost', 0],
  ['repairDays', 'Repair duration (days)', 1],
  ['restoredLitersPerDay', 'Restored daily supply (litres)', 0],
  ['deliveryCostPerDay', 'Daily delivery cost', 0],
  ['deliveryLitersPerDay', 'Daily delivery volume (litres)', 0],
] as const;

/** Shared input contract for manual planning, CSV imports and the planning API. */
export function validateCommunities(value: unknown): asserts value is Community[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 6) {
    throw new Error('Use 1–6 communities.');
  }
  const ids = new Set<string>();
  for (let index = 0; index < value.length; index++) {
    const community: unknown = value[index];
    if (!isRecord(community)) {
      throw new Error(`Community ${index + 1}: enter a valid community record.`);
    }
    const {id, name} = community;
    if (typeof id !== 'string' || !id.trim() || id !== id.trim()) {
      throw new Error(`Community ${index + 1}: ID must be nonempty and have no surrounding spaces.`);
    }
    if (ids.has(id)) {
      throw new Error(`Duplicate community ID "${id}". Give each community a different ID.`);
    }
    ids.add(id);
    if (typeof name !== 'string' || !name.trim()) {
      throw new Error(`Community ${index + 1}: enter a community name.`);
    }
    for (const [key, label, minimum] of numericFields) {
      const input = community[key];
      if (typeof input !== 'number' || !Number.isSafeInteger(input) || input < minimum) {
        throw new Error(`${name}: ${label} must be a whole number of ${minimum} or more within the supported numeric range.`);
      }
    }
  }
}

export function validateScenario(value: unknown): asserts value is Scenario {
  if (!isRecord(value)) throw new Error('Enter a valid planning scenario.');
  const {budget, days, litersPerPersonPerDay, communities} = value;
  if (typeof budget !== 'number' || !Number.isSafeInteger(budget) || budget < 0) {
    throw new Error('Budget must be a nonnegative whole number within the supported numeric range.');
  }
  if (typeof days !== 'number' || !Number.isInteger(days) || days < 1 || days > 14) {
    throw new Error('Planning horizon must be a whole number from 1 to 14 days.');
  }
  if (typeof litersPerPersonPerDay !== 'number' || !Number.isFinite(litersPerPersonPerDay) || litersPerPersonPerDay <= 0) {
    throw new Error('Daily water requirement must be a finite number greater than zero.');
  }
  validateCommunities(communities);
  const totalDemand = communities.reduce((sum, community) => sum + community.people * litersPerPersonPerDay * days, 0);
  if (!Number.isFinite(totalDemand)) {
    throw new Error('The demand inputs are too large to calculate. Reduce the population or daily water requirement.');
  }
}
