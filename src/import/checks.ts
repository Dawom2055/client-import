import { FIELDS } from './fields';
import type { ImportClient, RuleError, ValidationResult } from './types';

export const HEADERS = FIELDS.map((f) => f.header);
const EMAIL = FIELDS.findIndex((f) => f.key === 'email');

export const COLUMNS_MESSAGE = `The file must have exactly these columns: ${HEADERS.join(', ')}.`;
export const EMPTY_MESSAGE = 'The file has no Clients. Add at least one row below the header.';
export const REQUIRED_RULE = 'Required fields missing';
export const DUPLICATE_RULE = 'Duplicate Email Address';
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

export const fileFailure = (rule: string): ValidationResult => ({
  ok: false,
  check: 'file',
  errors: [{ rule, rows: [] }],
});

/** The Format check: the content of each filled-in cell, run only once the File check has passed. */
function formatCheck(rows: { row: number; cells: string[] }[]): RuleError[] {
  return FIELDS.map((field, c) => ({
    rule: field.message,
    rows: rows
      .filter(({ cells }) => cells[c] !== '' && !field.isValid(cells[c]))
      .map(({ row, cells }) => ({ row, value: cells[c] })),
  })).filter((e) => e.rows.length > 0);
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
    .map((cells, i) => ({
      row: i + 2,
      cells: HEADERS.map((_, c) => (cells[c] ?? '').trim().normalize('NFC')),
      blank: isBlank(cells),
    }))
    .filter((r) => !r.blank);
  if (rows.length === 0) return fileFailure(EMPTY_MESSAGE);

  const missing = rows.flatMap(({ row, cells }) =>
    FIELDS.flatMap((field, c) => (field.required && cells[c] === '' ? [{ row, detail: field.header }] : [])),
  );

  // Emails match ignoring case and surrounding spaces; every row sharing one is reported.
  const seen = new Map<string, number>();
  for (const { cells } of rows) {
    const key = cells[EMAIL].toLowerCase();
    if (key) seen.set(key, (seen.get(key) ?? 0) + 1);
  }
  const duplicates = rows
    .filter(({ cells }) => (seen.get(cells[EMAIL].toLowerCase()) ?? 0) > 1)
    .map(({ row, cells }) => ({ row, value: cells[EMAIL] }));

  const errors: RuleError[] = [];
  if (missing.length > 0) errors.push({ rule: REQUIRED_RULE, rows: missing });
  if (duplicates.length > 0) errors.push({ rule: DUPLICATE_RULE, rows: duplicates });
  if (errors.length > 0) return { ok: false, check: 'file', errors };

  const formatErrors = formatCheck(rows);
  if (formatErrors.length > 0) return { ok: false, check: 'format', errors: formatErrors };

  const clients = rows.map(
    ({ cells }) => Object.fromEntries(FIELDS.map((field, c) => [field.key, cells[c]])) as ImportClient,
  );
  return { ok: true, clients };
}
