import { act, fireEvent, screen } from '@testing-library/react';
import { vi } from 'vitest';
import type { renderClientsPage } from './render';

type User = ReturnType<typeof renderClientsPage>['user'];

export const HEADER = 'First Name,Last Name,Email Address';

/** A CSV file with the given lines (header first), as an admin would save it from a spreadsheet. */
export const csvFile = (lines: string[], name = 'clients.csv') =>
  new File([lines.join('\n')], name, { type: 'text/csv' });

/** A valid Import File of `rows` Clients, each with its own Email. */
export const csv = (name = 'clients.csv', rows = 3) =>
  csvFile([HEADER, ...Array.from({ length: rows }, (_, i) => `Jane,Doe,jane${i + 1}@example.com`)], name);

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
