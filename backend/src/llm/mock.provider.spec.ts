import type { AssessmentInput } from './llm-provider.js';
import { MockProvider } from './mock.provider.js';

const base: AssessmentInput = {
  productName: 'Test Cream',
  claimType: 'EFFICACY',
  claimText: 'Reduces wrinkles by 20% in 4 weeks',
  studyDesign: 'Randomised, vehicle-controlled',
  sampleSize: 60,
  studyDuration: '4 weeks',
  evidenceText: 'Wrinkle depth reduced by 23% at 4 weeks (p<0.05).',
};

describe('MockProvider', () => {
  const provider = new MockProvider();

  it('justifies a claim backed by a strong study', async () => {
    const { verdict } = await provider.assess(base);
    expect(verdict.justified).toBe(true);
    expect(verdict.confidenceScore).toBeGreaterThanOrEqual(80);
    expect(verdict.reasoning).toContain('23% at 4 weeks');
  });

  it('rejects a claim when the measured effect is too small', async () => {
    const { verdict } = await provider.assess({
      ...base,
      evidenceText: 'Wrinkle depth reduced by 12% at 4 weeks (p<0.05).',
    });
    expect(verdict.justified).toBe(false);
    expect(verdict.reasoning).toContain('below the claimed 20%');
  });

  it('pairs each result with its own timepoint', async () => {
    const { verdict } = await provider.assess({
      ...base,
      studyDuration: '8 weeks',
      evidenceText:
        'Measured at D0, D28 and D56. Reduction vs baseline: 11% at 4 weeks and 21% at 8 weeks (p<0.05).',
    });
    expect(verdict.justified).toBe(false);
    expect(verdict.reasoning).toContain('only reached at 8 weeks');
    expect(verdict.reasoning).toContain('At 4 weeks the result was 11%');
  });

  it('handles the timepoint written before the result', async () => {
    const { verdict } = await provider.assess({
      ...base,
      studyDuration: '8 weeks',
      evidenceText: 'At week 4, wrinkles were reduced by 22%; at week 8, 30%.',
    });
    expect(verdict.justified).toBe(true);
    expect(verdict.reasoning).toContain('22% at 4 weeks');
  });

  it('dates an undated result to the end of the study', async () => {
    const { verdict } = await provider.assess({
      ...base,
      studyDuration: '12 weeks',
      evidenceText: 'Wrinkle depth reduced by 25% (p<0.05).',
    });
    expect(verdict.justified).toBe(false);
    expect(verdict.reasoning).toContain('only reached at 12 weeks');
  });

  it('rejects a quantified claim with no numbers in the evidence', async () => {
    const { verdict } = await provider.assess({
      ...base,
      evidenceText: 'Panelists said their skin looked smoother.',
    });
    expect(verdict.justified).toBe(false);
  });

  it('reads the panel size from the text when the field is empty', async () => {
    const { verdict } = await provider.assess({
      ...base,
      sampleSize: null,
      evidenceText: '12 volunteers. Wrinkle depth reduced by 21% at D28.',
    });
    expect(verdict.reasoning).toContain('panel of 12 subjects is small');
  });

  it('ignores confidence interval percentages', async () => {
    const { verdict } = await provider.assess({
      ...base,
      evidenceText: 'Wrinkle depth reduced by 10% at 4 weeks (95% CI 6-14).',
    });
    expect(verdict.justified).toBe(false);
  });

  it('checks timeframe-only claims', async () => {
    const { verdict } = await provider.assess({
      ...base,
      claimText: 'Visible results in 7 days',
      studyDuration: '28 days',
      evidenceText: 'Improvement in skin smoothness first observed at day 14.',
    });
    expect(verdict.justified).toBe(false);
    expect(verdict.reasoning).toContain('later than the claimed 1 week');
  });
});
