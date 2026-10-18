import type { ImportClient, RuleError, ValidationResult } from './types';

export const HEADERS = ['First Name', 'Last Name', 'Email Address'];

export const COLUMNS_MESSAGE = `The file must have exactly these columns: ${HEADERS.join(', ')}.`;
export const EMPTY_MESSAGE = 'The file has no Clients. Add at least one row below the header.';
export const REQUIRED_RULE = 'Required fields missing';
export const DUPLICATE_RULE = 'Duplicate Email Address';
export const MAX_NAME = 50;
export const MAX_EMAIL = 254;
export const nameRule = (field: string) =>
  `${field} must be ${MAX_NAME} characters or fewer and can only contain letters, spaces, and - ' . , characters.`;
export const EMAIL_RULE = `Email Address must be a valid email address of ${MAX_EMAIL} characters or fewer.`;
export const UNREADABLE_MESSAGE = 'The file could not be read.';
export const MALFORMED_MESSAGE = 'The file is not a valid CSV.';

/** Splits CSV text into rows of cells. Returns null when a quoted cell is never closed. */
function parseCsv(text: string): string[][] | null {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  const source = text.replace(/^﻿/, '');

  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (quoted) {
      if (c === '"' && source[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') {
        quoted = false;
      } else {
        cell += c;
      }
    } else if (c === '"') {
      quoted = true;
    } else if (c === ',') {
      row.push(cell);
      cell = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && source[i + 1] === '\n') i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += c;
    }
  }
  if (quoted) return null;
  if (cell !== '' || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

const isBlank = (row: string[]) => row.every((cell) => cell.trim() === '');

/** Spreadsheets often save a trailing comma; empty cells after the last real one are not columns. */
const trimTrailingEmpty = (cells: string[]) => {
  let end = cells.length;
  while (end > 0 && cells[end - 1].trim() === '') end--;
  return cells.slice(0, end);
};

export const fileFailure = (rule: string): ValidationResult => ({ ok: false, check: 'file', errors: [{ rule, rows: [] }] });

const NAME_PATTERN = /^[\p{L} \-'.,]+$/u;
const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/;

/** The Format check: the content of each cell, run only once the File check has passed. */
function formatCheck(rows: { row: number; cells: string[] }[]): RuleError[] {
  const offenders = (cell: number, isValid: (value: string) => boolean) =>
    rows.filter(({ cells }) => !isValid(cells[cell])).map(({ row, cells }) => ({ row, value: cells[cell] }));
  const validName = (v: string) => v.length <= MAX_NAME && NAME_PATTERN.test(v);
  const validEmail = (v: string) => v.length <= MAX_EMAIL && EMAIL_PATTERN.test(v);

  return [
    { rule: nameRule(HEADERS[0]), rows: offenders(0, validName) },
    { rule: nameRule(HEADERS[1]), rows: offenders(1, validName) },
    { rule: EMAIL_RULE, rows: offenders(2, validEmail) },
  ].filter((e) => e.rows.length > 0);
}

/** Runs the File check, then the Format check, on the text of an Import File. Nothing is created. */
export function checkImportFile(text: string): ValidationResult {
  const parsed = parseCsv(text);
  if (!parsed) return fileFailure(MALFORMED_MESSAGE);

  const [rawHeader = [], ...body] = parsed;
  const header = trimTrailingEmpty(rawHeader);
  const matches =
    header.length === HEADERS.length && header.every((h, i) => h.trim().toLowerCase() === HEADERS[i].toLowerCase());
  if (!matches) return fileFailure(COLUMNS_MESSAGE);

  if (body.some((cells) => trimTrailingEmpty(cells).length > HEADERS.length)) return fileFailure(COLUMNS_MESSAGE);

  // Row numbers are the spreadsheet's, with the header as row 1; blank rows are skipped but still counted.
  const rows = body
    .map((cells, i) => ({ row: i + 2, cells: HEADERS.map((_, c) => (cells[c] ?? '').trim().normalize('NFC')), blank: isBlank(cells) }))
    .filter((r) => !r.blank);
  if (rows.length === 0) return fileFailure(EMPTY_MESSAGE);

  const missing = rows.flatMap(({ row, cells }) =>
    HEADERS.flatMap((column, c) => (cells[c] === '' ? [{ row, detail: column }] : [])),
  );

  // Emails match ignoring case and surrounding spaces; every row sharing one is reported.
  const seen = new Map<string, number>();
  for (const { cells } of rows) {
    const key = cells[2].toLowerCase();
    if (key) seen.set(key, (seen.get(key) ?? 0) + 1);
  }
  const duplicates = rows
    .filter(({ cells }) => (seen.get(cells[2].toLowerCase()) ?? 0) > 1)
    .map(({ row, cells }) => ({ row, value: cells[2] }));

  const errors: RuleError[] = [];
  if (missing.length > 0) errors.push({ rule: REQUIRED_RULE, rows: missing });
  if (duplicates.length > 0) errors.push({ rule: DUPLICATE_RULE, rows: duplicates });
  if (errors.length > 0) return { ok: false, check: 'file', errors };

  const formatErrors = formatCheck(rows);
  if (formatErrors.length > 0) return { ok: false, check: 'format', errors: formatErrors };

  const clients: ImportClient[] = rows.map(({ cells: [firstName, lastName, email] }) => ({ firstName, lastName, email }));
  return { ok: true, clients };
}
