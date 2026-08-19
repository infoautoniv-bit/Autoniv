import { calculateCallCosts } from '../services/orchestrator/qaEvaluator.js';

describe('qaEvaluator & cost calculations', () => {
  it('calculates call costs accurately for typical durations', () => {
    const costs = calculateCallCosts({
      durationSeconds: 120, // 2 minutes
      promptTokens: 1000,
      completionTokens: 200,
      ttsCharacters: 500,
    });

    expect(costs.sttCost).toBeCloseTo(2 * 0.0043, 4);
    expect(costs.telephonyCost).toBeCloseTo(2 * 0.013, 4);
    expect(costs.ttsCost).toBeCloseTo(500 * 0.00003, 4);
    expect(costs.totalCost).toBeGreaterThan(0);
    expect(costs.totalCost).toBeCloseTo(costs.sttCost + costs.llmCost + costs.ttsCost + costs.telephonyCost, 3);
  });

  it('handles zero or minimal usage without error', () => {
    const costs = calculateCallCosts({});
    expect(costs.totalCost).toBe(0);
    expect(costs.sttCost).toBe(0);
    expect(costs.llmCost).toBe(0);
    expect(costs.ttsCost).toBe(0);
  });
});
