import { FIELDS, isMarkedRequired, isRequired } from './fields';
import type { ImportRow, RuleError, ValidationResult } from './types';

/** The Import Template's header row, with required columns marked `*`. */
export const HEADERS = FIELDS.map((f) => (isMarkedRequired(f) ? `${f.header}*` : f.header));
const EMAIL = FIELDS.findIndex((f) => f.key === 'email');

export const COLUMNS_MESSAGE = `The file must have exactly these columns: ${HEADERS.join(', ')}.`;
export const EMPTY_MESSAGE = 'The file has no Clients. Add at least one row below the header.';
export const REQUIRED_RULE = 'Required fields missing';
export const DUPLICATE_RULE = 'Duplicate Email Address';
export const GROUP_NUMBER_RULE = 'Group # must be a whole number of 1 or more.';
export const ONE_CLIENT_RULE = 'Each Group must have only one Client.';
export const NO_CLIENT_RULE =
  'Each Group must have a Client. Companions must share a Group # with one row that has no Relationship to Client.';
export const PROFILE_MATCH_RULE = 'Companions must have the same Profile Type as the Client in their Group.';
export const CORPORATE_REQUIRED_RULE = "Corporate Name is required when Profile Type is 'C' (Corporate).";
export const COMPANION_CORPORATE_RULE = 'Corporate Name must be blank for Companions.';
export const LEISURE_CORPORATE_RULE = "Corporate Name must be blank when Profile Type is 'L' (Leisure).";
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

interface Row {
  /** The spreadsheet row number, with the header as row 1. */
  row: number;
  cells: string[];
  record: ImportRow;
}

const isGroupNumber = (v: string) => /^[0-9]+$/.test(v) && Number(v) >= 1;

const profileType = (r: Row) => r.record.profileType.toUpperCase();
const hasProfileType = (r: Row) => profileType(r) === 'L' || profileType(r) === 'C';

/** Adds `item` to the list kept under `key`. */
function append<K, V>(map: Map<K, V[]>, key: K, item: V) {
  map.set(key, [...(map.get(key) ?? []), item]);
}

/**
 * The File check's rules across rows: every Group has exactly one Client row, a Companion shares its Client's
 * Profile Type, and only a Corporate Client row carries a Corporate Name. Every row of a failing Group is reported.
 *
 * A row with a bad Group # or Profile Type is reported for that alone: its Group, and its Corporate Name, are
 * checked once it is fixed. One clear message is easier to act on than several that share a cause.
 */
function crossRowCheck(rows: Row[]): RuleError[] {
  const groups = new Map<number, Row[]>();
  for (const r of rows) if (isGroupNumber(r.record.group)) append(groups, Number(r.record.group), r);
  const checkedGroups = [...groups].filter(([, members]) => members.every(hasProfileType));

  const offenders = (fails: (members: Row[]) => boolean) =>
    checkedGroups
      .filter(([, members]) => fails(members))
      .flatMap(([n, members]) => members.map(({ row }) => ({ row, detail: `Group ${n}` })))
      .sort((a, b) => a.row - b.row);
  const clientRowsOf = (members: Row[]) => members.filter((m) => m.record.kind === 'client');

  // Profile Types are compared only within a Group whose single Client row is known.
  const mismatched = checkedGroups
    .filter(([, members]) => clientRowsOf(members).length === 1)
    .flatMap(([, members]) => {
      const [groupClient] = clientRowsOf(members);
      return members.filter((m) => profileType(m) !== profileType(groupClient));
    })
    .sort((a, b) => a.row - b.row)
    .map(({ row, record }) => ({ row, value: record.profileType }));

  const checkable = rows.filter((r) => isGroupNumber(r.record.group) && hasProfileType(r));
  const checkableClients = checkable.filter((r) => r.record.kind === 'client');
  const withCorporateName = (r: Row) => r.record.corporateName !== '';
  const corporateNameOf = ({ row, record }: Row) => ({ row, value: record.corporateName });

  return [
    {
      rule: GROUP_NUMBER_RULE,
      rows: rows
        .filter(({ record }) => record.group !== '' && !isGroupNumber(record.group))
        .map(({ row, record }) => ({ row, value: record.group })),
    },
    { rule: ONE_CLIENT_RULE, rows: offenders((m) => clientRowsOf(m).length > 1) },
    { rule: NO_CLIENT_RULE, rows: offenders((m) => clientRowsOf(m).length === 0) },
    { rule: PROFILE_MATCH_RULE, rows: mismatched },
    {
      rule: CORPORATE_REQUIRED_RULE,
      rows: checkableClients.filter((r) => profileType(r) === 'C' && !withCorporateName(r)).map(({ row }) => ({ row })),
    },
    {
      rule: COMPANION_CORPORATE_RULE,
      rows: checkable.filter((r) => r.record.kind === 'companion' && withCorporateName(r)).map(corporateNameOf),
    },
    {
      rule: LEISURE_CORPORATE_RULE,
      rows: checkableClients.filter((r) => profileType(r) === 'L' && withCorporateName(r)).map(corporateNameOf),
    },
  ].filter((e) => e.rows.length > 0);
}

/** The Format check: the content of each filled-in cell, run only once the File check has passed. */
function formatCheck(rows: Row[]): RuleError[] {
  // One error per message, in column order; a field with two messages (such as a date) can give two errors.
  const byMessage = new Map<string, RuleError['rows']>();
  FIELDS.forEach((field, c) => {
    for (const { row, cells, record } of rows) {
      if (cells[c] === '') continue;
      const message = field.problem(cells[c], record);
      if (message) append(byMessage, message, { row, value: cells[c] });
    }
  });
  return [...byMessage].map(([rule, offenders]) => ({ rule, rows: offenders }));
}

function toRecord(cells: string[]): ImportRow {
  const values = Object.fromEntries(FIELDS.map((field, c) => [field.key, cells[c]])) as Omit<ImportRow, 'kind'>;
  return { ...values, kind: values.relationship === '' ? 'client' : 'companion' };
}

/** Runs the File check, then the Format check, on the text of an Import File. Nothing is created. */
export function checkImportFile(text: string): ValidationResult {
  const parsed = parseCsv(text);
  if (!parsed) return fileFailure(MALFORMED_MESSAGE);

  const [rawHeader = [], ...body] = parsed;
  const header = trimTrailingEmpty(rawHeader);
  const matches =
    header.length === FIELDS.length &&
    header.every((h, i) => h.trim().replace(/\*$/, '').trimEnd().toLowerCase() === FIELDS[i].header.toLowerCase());
  if (!matches) return fileFailure(COLUMNS_MESSAGE);

  if (body.some((cells) => trimTrailingEmpty(cells).length > HEADERS.length)) return fileFailure(COLUMNS_MESSAGE);

  // Row numbers are the spreadsheet's, with the header as row 1; blank rows are skipped but still counted.
  const rows: Row[] = body.flatMap((raw, i) => {
    if (isBlank(raw)) return [];
    const cells = FIELDS.map((_, c) => (raw[c] ?? '').trim().normalize('NFC'));
    return [{ row: i + 2, cells, record: toRecord(cells) }];
  });
  if (rows.length === 0) return fileFailure(EMPTY_MESSAGE);

  const missing = rows.flatMap(({ row, cells, record }) =>
    FIELDS.flatMap((field, c) => (cells[c] === '' && isRequired(field, record) ? [{ row, detail: field.header }] : [])),
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
  errors.push(...crossRowCheck(rows));
  if (errors.length > 0) return { ok: false, check: 'file', errors };

  const formatErrors = formatCheck(rows);
  if (formatErrors.length > 0) return { ok: false, check: 'format', errors: formatErrors };

  return { ok: true, rows: rows.map(({ record }) => record) };
}
