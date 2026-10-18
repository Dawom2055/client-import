import { act, fireEvent, screen } from '@testing-library/react';
import { vi } from 'vitest';
import type { renderClientsPage } from './render';

type User = ReturnType<typeof renderClientsPage>['user'];

export const csv = (name = 'clients.csv', rows = 3) =>
  new File(['First name,Last name,Email\n' + 'Jane,Doe,jane@example.com\n'.repeat(rows)], name, { type: 'text/csv' });

/** Opens Client Import with Sarah Brown already chosen, via "Using ADX as". */
export async function openAsSarah(user: User) {
  await user.selectOptions(screen.getByLabelText('Using ADX as'), 'Sarah Brown');
  await user.click(screen.getByRole('button', { name: 'Client Import' }));
}

export const fileInput = () => document.querySelector<HTMLInputElement>('input[type="file"]')!;

export const addFile = (user: User, file: File) => user.upload(fileInput(), file);

export const dropFile = (file: File) =>
  fireEvent.drop(screen.getByText('Drag and drop your CSV file here').parentElement!, { dataTransfer: { files: [file] } });

/** Lets timers and pending promises run, wrapped in act. */
export const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));
