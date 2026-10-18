export interface Advisor {
  id: string;
  name: string;
  email: string;
  office: string;
}

export interface RuleError {
  rule: string;
  /** `value` is the offending cell, shown in quotes; `detail` is plain text such as the missing column. */
  rows: { row: number; value?: string; detail?: string }[];
}

export interface FailedRecord {
  row: number;
  name: string;
  reason: string;
}

export interface ImportClient {
  firstName: string;
  lastName: string;
  email: string;
}

/** Which of the two checks failed: the File check (Step 2) or the Format check (Step 3). */
export type Check = 'file' | 'format';

export type ValidationResult = { ok: true; clients: ImportClient[] } | { ok: false; check: Check; errors: RuleError[] };

export interface CreateResult {
  created: number;
  failed: FailedRecord[];
}

/** Everything the Client Import UI needs from the outside world. */
export interface ImportService {
  searchAdvisors(query: string): Promise<Advisor[]>;
  /** Checks the whole Import File; nothing is created. */
  validate(file: File): Promise<ValidationResult>;
  create(file: File, advisor: Advisor, rows: number): Promise<CreateResult>;
}

export type Scenario = 'auto' | 'success' | 'partial';

export type Phase = 'select' | 'file' | 'format' | 'confirm' | 'create' | 'invalid' | 'success' | 'partial';
