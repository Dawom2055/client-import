import { checkImportFile } from './checks';
import type { Advisor, ImportService, Scenario } from './types';

export const ADVISORS: Advisor[] = [
  { id: 'a1', name: 'Sarah Brown', email: 'sarah.brown@triparc.com', office: 'RETAIL - TTN' },
  { id: 'a2', name: 'Sarah Chen', email: 'sarah.chen@triparc.com', office: 'RETAIL - VAN' },
  { id: 'a3', name: 'Valerie Smith', email: 'val.smith@triparc.com', office: 'RETAIL - CAL' },
  { id: 'a4', name: 'Marcus Reid', email: 'marcus.reid@triparc.com', office: 'CORPORATE - TOR' },
];

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function pickScenario(file: File, scenario: Scenario): Exclude<Scenario, 'auto'> {
  if (scenario !== 'auto') return scenario;
  const name = file.name.toLowerCase();
  if (/partial/.test(name)) return 'partial';
  return 'success';
}

/**
 * Stand-in for the Clients service. Validation runs the real checks; creation is simulated.
 * Typing "error" as an advisor search simulates a failed lookup.
 */
export function createMockImportService(getScenario: () => Scenario): ImportService {
  return {
    async searchAdvisors(query) {
      await wait(450);
      const q = query.trim().toLowerCase();
      if (q === 'error') throw new Error('Advisor lookup failed');
      return ADVISORS.filter((a) => a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q));
    },

    async validate(file) {
      return checkImportFile(await file.text());
    },

    async create(file, _advisor, rows) {
      if (pickScenario(file, getScenario()) !== 'partial') return { created: rows, failed: [] };
      const failedCount = Math.min(3, rows);
      return {
        created: rows - failedCount,
        failed: Array.from({ length: failedCount }, (_, i) => ({
          row: 5 + i * 7,
          name: ['John Smith', 'Mary Jones', 'Wei Zhang'][i],
          reason: 'The Clients service could not create this profile.',
        })),
      };
    },
  };
}
