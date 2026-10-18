export interface Advisor {
  id: string;
  name: string;
  email: string;
  office: string;
}

export interface RuleError {
  rule: string;
  rows: { row: number; value?: string }[];
}

export interface FailedRecord {
  row: number;
  name: string;
  reason: string;
}

export type ValidationResult = { ok: true; rows: number } | { ok: false; errors: RuleError[] };

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

export type Scenario = 'auto' | 'success' | 'partial' | 'invalid';

export type Phase =
  | 'select'
  | 'format'
  | 'external'
  | 'confirm'
  | 'create'
  | 'invalid'
  | 'success'
  | 'partial';
