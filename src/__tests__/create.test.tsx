import { screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ImportService } from '../import/types';
import { createFakeService, SARAH } from '../test/fakes';
import { addFile, advance, client, csv, csvFile, HEADER, openAsSarah } from '../test/flows';
import { renderClientsPage } from '../test/render';

afterEach(() => {
  vi.useRealTimers();
});

async function reachConfirm(service: ImportService = createFakeService(), file: File = csv()) {
  const view = renderClientsPage({ service });
  await openAsSarah(view.user);
  await addFile(view.user, file);
  await view.user.click(screen.getByRole('button', { name: 'Continue' }));
  await advance(1700);
  await advance(2800);
  return view;
}

const startCreating = async (user: Awaited<ReturnType<typeof reachConfirm>>['user']) => {
  await user.click(screen.getByRole('button', { name: 'Finalize and Upload' }));
};

describe('confirming and creating', () => {
  it('shows a Review of every Client as a table, with the total and the Advisor', async () => {
    const file = csvFile([
      HEADER,
      client(1, 'Jane', 'Doe', 'jane@example.com'),
      client(2, 'Ann', 'Lee', 'ann@example.com'),
      client(3, 'Bob', 'Ray', 'bob@example.com'),
    ]);
    await reachConfirm(createFakeService(), file);
    expect(screen.getByText(/Step 4 of 5: Review/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Review the client profiles' })).toBeInTheDocument();
    expect(screen.getByText('Total records: 3')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toHaveTextContent('Sarah Brown');

    const table = screen.getByRole('table', { name: 'Clients to create' });
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((h) => h.textContent),
    ).toEqual(['#', 'Group #', 'Relationship to Client', 'First Name', 'Last Name', 'Email Address']);
    const rows = within(table).getAllByRole('row').slice(1);
    expect(
      rows.map((r) =>
        within(r)
          .getAllByRole('cell')
          .map((c) => c.textContent),
      ),
    ).toEqual([
      ['1', '1', '', 'Jane', 'Doe', 'jane@example.com'],
      ['2', '2', '', 'Ann', 'Lee', 'ann@example.com'],
      ['3', '3', '', 'Bob', 'Ray', 'bob@example.com'],
    ]);
  });

  it('numbers the Review table by Client, not by spreadsheet row', async () => {
    const file = csvFile([
      HEADER,
      client(1, 'Jane', 'Doe', 'jane@example.com'),
      '',
      client(2, 'Ann', 'Lee', 'ann@example.com'),
    ]);
    await reachConfirm(createFakeService(), file);
    const rows = within(screen.getByRole('table')).getAllByRole('row').slice(1);
    expect(rows.map((r) => within(r).getAllByRole('cell')[0].textContent)).toEqual(['1', '2']);
  });

  it('lists every Client, not just a preview', async () => {
    await reachConfirm(createFakeService(), csv('big.csv', 40));
    expect(screen.getByText('Total records: 40')).toBeInTheDocument();
    expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(41);
  });

  it('no longer asks to "Create N clients"', async () => {
    await reachConfirm();
    expect(screen.queryByText('Your file passed validation')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Create \d+ clients?$/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Finalize and Upload' })).toBeInTheDocument();
  });

  it('creates nothing when the admin cancels at the Review', async () => {
    const create = vi.fn(async () => ({ created: 3, failed: [] }));
    const { user } = await reachConfirm(createFakeService({ create }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(create).not.toHaveBeenCalled();
  });

  it('creates the Clients for the chosen Advisor once finalised', async () => {
    const create = vi.fn(async () => ({ created: 3, failed: [] }));
    const { user } = await reachConfirm(createFakeService({ create }));
    await startCreating(user);
    expect(create).toHaveBeenCalledWith(expect.any(File), SARAH, [
      expect.objectContaining({ kind: 'client', email: 'jane1@example.com' }),
      expect.objectContaining({ kind: 'client', email: 'jane2@example.com' }),
      expect.objectContaining({ kind: 'client', email: 'jane3@example.com' }),
    ]);
  });

  it('shows progress while creating and does not let the modal be closed', async () => {
    const { user } = await reachConfirm();
    await startCreating(user);
    await advance(1000);

    expect(screen.getByText(/Step 5 of 5: Finalize and upload \(\d+% complete\)/)).toBeInTheDocument();
    expect(screen.getByText('Creating clients…')).toBeInTheDocument();
    const close = screen.getByRole('button', { name: 'Close' });
    expect(close).toBeDisabled();
    expect(close).toHaveAttribute('title', 'Creating clients, please wait');

    await user.keyboard('{Escape}');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('shows Success with the number of Clients created', async () => {
    const { user } = await reachConfirm();
    await startCreating(user);
    await advance(3000);

    expect(screen.getByText('Success! Client import completed')).toBeInTheDocument();
    expect(screen.getByText(/A total of 3 clients have been successfully created/)).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).not.toHaveClass('danger');
  });

  it('returns to the Clients page when Done is chosen', async () => {
    const { user } = await reachConfirm();
    await startCreating(user);
    await advance(3000);
    await user.click(screen.getByRole('button', { name: 'Done' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create New Client' })).toBeInTheDocument();
  });

  it('resets to the very beginning with "Back to file upload"', async () => {
    const { user } = await reachConfirm();
    await startCreating(user);
    await advance(3000);
    await user.click(screen.getByRole('button', { name: 'Back to file upload' }));

    expect(screen.getByRole('heading', { name: 'Upload your Client File' })).toBeInTheDocument();
    expect(screen.queryByText(/added/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
  });

  it('closes with Escape on the first step, the Review and the result screens', async () => {
    const first = renderClientsPage();
    await openAsSarah(first.user);
    await first.user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    first.unmount();

    const confirm = await reachConfirm();
    await confirm.user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    confirm.unmount();

    const result = await reachConfirm();
    await startCreating(result.user);
    await advance(3000);
    await result.user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
