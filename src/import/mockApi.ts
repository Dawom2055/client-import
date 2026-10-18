import type { Advisor, Outcome, Scenario } from './types';

export const ADVISORS: Advisor[] = [
  { id: 'a1', name: 'Sarah Brown', email: 'sarah.brown@triparc.com', office: 'RETAIL - TTN' },
  { id: 'a2', name: 'Sarah Chen', email: 'sarah.chen@triparc.com', office: 'RETAIL - VAN' },
  { id: 'a3', name: 'Valerie Smith', email: 'val.smith@triparc.com', office: 'RETAIL - CAL' },
  { id: 'a4', name: 'Marcus Reid', email: 'marcus.reid@triparc.com', office: 'CORPORATE - TOR' },
];

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Typing "error" simulates a failed lookup so the Retry state can be previewed. */
export async function searchAdvisors(query: string): Promise<Advisor[]> {
  await wait(450);
  const q = query.trim().toLowerCase();
  if (q === 'error') throw new Error('Advisor lookup failed');
  return ADVISORS.filter((a) => a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q));
}

export const MAX_FILE_BYTES = 5 * 1024 * 1024;

export function checkFile(file: File): string | null {
  if (!file.name.toLowerCase().endsWith('.csv')) return 'Only .csv files can be imported.';
  if (file.size > MAX_FILE_BYTES) return 'The file is larger than 5 MB.';
  return null;
}

export async function countRows(file: File): Promise<number> {
  const text = await file.text();
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
  return Math.max(1, lines.length - 1);
}

const INVALID_EMAIL_ROWS = [3, 8, 12, 14, 15, 17, 19, 21, 23, 25, 27, 30];

/** Stand-in for the real validation and creation results. Placeholder rules only. */
export function resolveOutcome(file: File, rows: number, scenario: Scenario): Outcome {
  const name = file.name.toLowerCase();
  const kind =
    scenario !== 'auto'
      ? scenario
      : /bad|invalid/.test(name)
        ? 'invalid'
        : /partial/.test(name)
          ? 'partial'
          : 'success';

  if (kind === 'invalid') {
    return {
      kind,
      errors: [
        { rule: 'Email must be a valid email address.', rows: INVALID_EMAIL_ROWS.map((row) => ({ row, value: 'jane.doe@' })) },
        { rule: 'First name is required.', rows: [{ row: 9 }] },
        { rule: 'Last name is required.', rows: [{ row: 11 }, { row: 16 }] },
      ],
    };
  }
  if (kind === 'partial') {
    const failedCount = Math.min(3, rows);
    return {
      kind,
      total: rows,
      created: rows - failedCount,
      failed: Array.from({ length: failedCount }, (_, i) => ({
        row: 5 + i * 7,
        name: ['John Smith', 'Mary Jones', 'Wei Zhang'][i],
        reason: 'The Clients service could not create this profile.',
      })),
    };
  }
  return { kind: 'success', created: rows };
}
