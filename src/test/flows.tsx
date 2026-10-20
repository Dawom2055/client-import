import { act, fireEvent, screen } from '@testing-library/react';
import { vi } from 'vitest';
import type { renderClientsPage } from './render';

type User = ReturnType<typeof renderClientsPage>['user'];

export const COLUMNS = [
  'Group #',
  'Relationship to Client',
  'Profile Type',
  'Title',
  'Corporate Name',
  'First Name',
  'Middle Name',
  'Last Name',
  'Gender',
  'Date of Birth',
  'Nationality',
  'Email Description',
  'Email Address',
  'Phone Description',
  'Primary Phone Number',
  'Address Line 1',
  'Address Line 2',
  'City',
  'State/Province',
  'Zip/Postal Code',
  'Country',
  'Passport Number',
  'Passport Issuing Country',
  'Passport Expiry Date',
] as const;

export type Column = (typeof COLUMNS)[number];

/** The Import Template's header row, with required columns marked `*`. */
export const HEADER =
  'Group #*,Relationship to Client,Profile Type*,Title,Corporate Name,First Name*,Middle Name,Last Name*,Gender,' +
  'Date of Birth,Nationality,Email Description,Email Address*,Phone Description,Primary Phone Number,' +
  'Address Line 1,Address Line 2,City,State/Province,Zip/Postal Code,Country,Passport Number,' +
  'Passport Issuing Country,Passport Expiry Date';

const quote = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

/** One CSV line with the given cells filled in and every other column blank. */
export const row = (values: Partial<Record<Column, string>>) => COLUMNS.map((c) => quote(values[c] ?? '')).join(',');

/** A Client row in its own Group, Leisure unless `more` says otherwise. */
export const client = (
  group: number,
  first: string,
  last: string,
  email: string,
  more: Partial<Record<Column, string>> = {},
) =>
  row({
    'Group #': String(group),
    'Profile Type': 'L',
    'First Name': first,
    'Last Name': last,
    'Email Address': email,
    ...more,
  });

/** A CSV file with the given lines (header first), as an admin would save it from a spreadsheet. */
export const csvFile = (lines: string[], name = 'clients.csv') =>
  new File([lines.join('\n')], name, { type: 'text/csv' });

/** A valid Import File of `rows` Clients, each in its own Group with its own Email. */
export const csv = (name = 'clients.csv', rows = 3) =>
  csvFile(
    [HEADER, ...Array.from({ length: rows }, (_, i) => client(i + 1, 'Jane', 'Doe', `jane${i + 1}@example.com`))],
    name,
  );

/** Stubs the browser download so a test can read what "Download Import Template" would save. */
export function captureDownload() {
  let blob: Blob | undefined;
  URL.createObjectURL = (b: Blob | MediaSource) => {
    blob = b as Blob;
    return 'blob:template';
  };
  URL.revokeObjectURL = () => {};
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  return { text: () => blob!.text() };
}

/** Opens Client Import with Sarah Brown already chosen, via "Using ADX as". */
export async function openAsSarah(user: User) {
  await user.selectOptions(screen.getByLabelText('Using ADX as'), 'Sarah Brown');
  await user.click(screen.getByRole('button', { name: 'Client Import' }));
}

export const fileInput = () => document.querySelector<HTMLInputElement>('input[type="file"]')!;

export const addFile = (user: User, file: File) => user.upload(fileInput(), file);

export const dropFile = (file: File) =>
  fireEvent.drop(screen.getByText('Drag and drop your CSV file here').parentElement!, {
    dataTransfer: { files: [file] },
  });

/** Lets timers and pending promises run, wrapped in act. */
export const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));
