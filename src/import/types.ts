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

export type Outcome =
  | { kind: 'success'; created: number }
  | { kind: 'partial'; total: number; created: number; failed: FailedRecord[] }
  | { kind: 'invalid'; errors: RuleError[] };

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
