import { checkImportFile } from '../import/checks';
import type { Advisor, ImportService } from '../import/types';

export const SARAH: Advisor = {
  id: 's1',
  name: 'Sarah Brown',
  email: 'sarah.brown@example.com',
  office: 'RETAIL - TTN',
};
export const VALERIE: Advisor = {
  id: 'v1',
  name: 'Valerie Smith',
  email: 'val.smith@example.com',
  office: 'RETAIL - CAL',
};
export const FAKE_ADVISORS = [SARAH, VALERIE];

/** A fake import service where everything succeeds unless a test overrides a method. */
export function createFakeService(overrides: Partial<ImportService> = {}): ImportService {
  return {
    searchAdvisors: async (query) =>
      FAKE_ADVISORS.filter((a) => a.name.toLowerCase().includes(query.trim().toLowerCase())),
    validate: async (file) => checkImportFile(await file.text()),
    create: async (_file, _advisor, rows) => ({ created: rows, failed: [] }),
    ...overrides,
  };
}
