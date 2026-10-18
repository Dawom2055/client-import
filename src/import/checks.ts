import type { ImportClient, RuleError, ValidationResult } from './types';

export const HEADERS = ['First Name', 'Last Name', 'Email Address'];

export const COLUMNS_MESSAGE = `The file must have exactly these columns: ${HEADERS.join(', ')}.`;
export const EMPTY_MESSAGE = 'The file has no Clients. Add at least one row below the header.';
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

const fileFailure = (rule: string): ValidationResult => ({ ok: false, check: 'file', errors: [{ rule, rows: [] }] });

/** Runs the File check on the text of an Import File. Nothing is created. */
export function checkImportFile(text: string): ValidationResult {
  const parsed = parseCsv(text);
  if (!parsed) return fileFailure(MALFORMED_MESSAGE);

  const [header = [], ...body] = parsed;
  const matches =
    header.length === HEADERS.length && header.every((h, i) => h.trim().toLowerCase() === HEADERS[i].toLowerCase());
  if (!matches) return fileFailure(COLUMNS_MESSAGE);

  const clients: ImportClient[] = body
    .filter((row) => !isBlank(row))
    .map(([firstName, lastName, email]) => ({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim() }));
  if (clients.length === 0) return fileFailure(EMPTY_MESSAGE);

  return { ok: true, clients };
}

export type { RuleError };
