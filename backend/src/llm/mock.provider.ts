import type {
  AssessmentInput,
  LlmProvider,
  LlmResult,
} from './llm-provider.js';

interface Finding {
  passed: boolean;
  critical: boolean;
  weight: number;
  text: string;
}

interface Measurement {
  value: number;
  days?: number;
}

interface Match {
  value: number;
  start: number;
  end: number;
}

const MIN_PANEL_SIZE = 30;
// How far (in characters) a timepoint can be from a percentage to be paired.
const PAIRING_WINDOW = 40;

/**
 * Rule-based stand-in for the LLM so the app can run without an API key.
 * It only checks numbers it can read from the text, so it is far less
 * capable than a real model and is meant for demos and tests.
 */
export class MockProvider implements LlmProvider {
  readonly name = 'mock';
  readonly model = 'heuristic-v2';

  assess(input: AssessmentInput): Promise<LlmResult> {
    const findings = [
      ...checkEffect(input),
      checkSampleSize(input.sampleSize ?? readSampleSize(input.evidenceText)),
      checkControl(`${input.studyDesign ?? ''} ${input.evidenceText}`),
      checkSignificance(input.evidenceText),
    ].filter((f): f is Finding => f !== null);

    const score = clamp(
      50 + findings.reduce((sum, f) => sum + f.weight, 0),
      0,
      100,
    );
    const hasCriticalGap = findings.some((f) => f.critical && !f.passed);
    const justified = !hasCriticalGap && score >= 60;
    const confidenceScore = clamp(justified ? score : 100 - score, 55, 95);

    const conclusion = justified
      ? 'Overall the evidence appears to support the claim as worded.'
      : 'Overall the evidence does not support the claim as worded.';
    const reasoning = [...findings.map((f) => f.text), conclusion].join(' ');

    return Promise.resolve({
      verdict: { justified, confidenceScore, reasoning },
      raw: { findings, score },
    });
  }
}

function checkEffect(input: AssessmentInput): Finding[] {
  const claimedPct = findPercentages(input.claimText)[0]?.value;
  const claimedDays = findDurations(input.claimText)[0]?.value;
  const studyDays = input.studyDuration
    ? findDurations(input.studyDuration)[0]?.value
    : undefined;

  if (claimedPct === undefined) {
    return claimedDays === undefined
      ? []
      : [checkTimeframeOnly(claimedDays, input.evidenceText, studyDays)];
  }

  const measurements = readMeasurements(input.evidenceText, studyDays);
  if (!measurements.length) {
    return [
      fail(
        true,
        -30,
        `The claim states ${claimedPct}% but the study reports no quantified result.`,
      ),
    ];
  }

  const meeting = measurements.filter((m) => m.value >= claimedPct);
  if (!meeting.length) {
    const best = Math.max(...measurements.map((m) => m.value));
    return [
      fail(
        true,
        -30,
        `The study reports at most ${best}%, below the claimed ${claimedPct}%.`,
      ),
    ];
  }

  if (claimedDays === undefined) {
    const best = Math.max(...meeting.map((m) => m.value));
    return [
      pass(
        true,
        20,
        `The study reports up to ${best}%, which meets the claimed ${claimedPct}%.`,
      ),
    ];
  }

  const inTime = meeting.filter(
    (m) => m.days !== undefined && m.days <= claimedDays,
  );
  if (inTime.length) {
    const m = inTime[0];
    return [
      pass(
        true,
        30,
        `The study reports ${m.value}% at ${formatDays(m.days!)}, which meets the claimed ${claimedPct}% within ${formatDays(claimedDays)}.`,
      ),
    ];
  }

  const timed = meeting.filter((m) => m.days !== undefined);
  if (!timed.length) {
    return [
      pass(
        true,
        20,
        `The study reports ${meeting[0].value}%, which meets the claimed ${claimedPct}%.`,
      ),
      fail(
        false,
        -15,
        'It does not say when that result was measured, so the claimed timeframe is not confirmed.',
      ),
    ];
  }

  const first = timed.reduce((a, b) => (a.days! <= b.days! ? a : b));
  const early = measurements.find(
    (m) => m.days !== undefined && m.days <= claimedDays,
  );
  const earlyNote = early
    ? ` At ${formatDays(early.days!)} the result was ${early.value}%.`
    : '';
  return [
    fail(
      true,
      -30,
      `The claimed ${claimedPct}% is only reached at ${formatDays(first.days!)}, later than the claimed ${formatDays(claimedDays)}.${earlyNote}`,
    ),
  ];
}

function checkTimeframeOnly(
  claimedDays: number,
  evidence: string,
  studyDays: number | undefined,
): Finding {
  const days = findDurations(evidence).map((d) => d.value);
  if (studyDays) days.push(studyDays);

  if (!days.length) {
    return fail(
      false,
      -10,
      'The claim has a timeframe but the study does not state when results were measured.',
    );
  }

  const earliest = Math.min(...days);
  return earliest <= claimedDays
    ? pass(
        true,
        10,
        `Results were measured at ${formatDays(earliest)}, within the claimed ${formatDays(claimedDays)}.`,
      )
    : fail(
        true,
        -20,
        `The earliest reported result is at ${formatDays(earliest)}, later than the claimed ${formatDays(claimedDays)}.`,
      );
}

function checkSampleSize(size: number | undefined): Finding {
  if (!size) return fail(false, -5, 'The panel size is not stated.');

  return size >= MIN_PANEL_SIZE
    ? pass(false, 10, `The panel of ${size} subjects is adequate.`)
    : fail(
        false,
        -15,
        `The panel of ${size} subjects is small for a claim of this kind.`,
      );
}

function checkControl(text: string): Finding | null {
  if (!/placebo|vehicle|untreated|control|randomi[sz]ed/i.test(text)) {
    return null;
  }
  return pass(false, 5, 'The study includes a control or randomised design.');
}

function checkSignificance(text: string): Finding | null {
  if (!/p\s*[<≤]\s*0?\.0[0-5]|statistically significant/i.test(text)) {
    return null;
  }
  return pass(false, 5, 'The result is reported as statistically significant.');
}

/**
 * Pairs each percentage with the closest timepoint in the same clause, so
 * "11% at 4 weeks and 21% at 8 weeks" gives two separate measurements.
 * Percentages with no timepoint nearby are dated to the end of the study.
 */
function readMeasurements(text: string, studyDays?: number): Measurement[] {
  const measurements: Measurement[] = [];

  for (const clause of text.split(/;|\.(?!\d)|\n/)) {
    const percentages = findPercentages(clause);
    const durations = findDurations(clause);

    for (const pct of percentages) {
      let best: { days: number; distance: number } | undefined;

      for (const dur of durations) {
        const after = dur.start >= pct.end;
        const [from, to] = after ? [pct.end, dur.start] : [dur.end, pct.start];
        const between = clause.slice(from, to);
        if (between.includes('%')) continue;

        // "20% at 4 weeks" is more common than "4 weeks, 20%", so a timepoint
        // after the number wins a close tie.
        const distance = between.length - (after ? 3 : 0);
        if (distance <= PAIRING_WINDOW && (!best || distance < best.distance)) {
          best = { days: dur.value, distance };
        }
      }

      measurements.push({ value: pct.value, days: best?.days ?? studyDays });
    }
  }
  return measurements;
}

function findPercentages(text: string): Match[] {
  const matches: Match[] = [];
  for (const m of text.matchAll(
    /(\d+(?:\.\d+)?)\s*%(?!\s*(?:CI|confidence))/gi,
  )) {
    matches.push({
      value: Number(m[1]),
      start: m.index,
      end: m.index + m[0].length,
    });
  }
  return matches;
}

function findDurations(text: string): Match[] {
  const unitDays: Record<string, number> = { day: 1, week: 7, month: 30 };
  const matches: Match[] = [];
  const add = (days: number, index: number, length: number) => {
    // Day 0 is the baseline, not a result timepoint.
    if (days > 0)
      matches.push({ value: days, start: index, end: index + length });
  };

  for (const m of text.matchAll(/(\d+)\s*-?\s*(day|week|month)s?\b/gi)) {
    add(Number(m[1]) * unitDays[m[2].toLowerCase()], m.index, m[0].length);
  }
  for (const m of text.matchAll(/\b(day|week|month)\s+(\d+)\b/gi)) {
    add(Number(m[2]) * unitDays[m[1].toLowerCase()], m.index, m[0].length);
  }
  // Clinical shorthand such as "D28".
  for (const m of text.matchAll(/\bD(\d{1,3})\b/g)) {
    add(Number(m[1]), m.index, m[0].length);
  }
  return matches.sort((a, b) => a.start - b.start);
}

function readSampleSize(text: string): number | undefined {
  const match =
    /\bn\s*=\s*(\d+)/i.exec(text) ??
    /(\d+)\s+(?:subjects|participants|volunteers|women|men|panelists|panellists)\b/i.exec(
      text,
    );
  return match ? Number(match[1]) : undefined;
}

function formatDays(days: number): string {
  if (days % 7 === 0) return `${days / 7} week${days === 7 ? '' : 's'}`;
  return `${days} day${days === 1 ? '' : 's'}`;
}

function pass(critical: boolean, weight: number, text: string): Finding {
  return { passed: true, critical, weight, text };
}

function fail(critical: boolean, weight: number, text: string): Finding {
  return { passed: false, critical, weight, text };
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
