import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { addFile, csv, dropFile, openAsSarah } from '../test/flows';
import { renderClientsPage } from '../test/render';

afterEach(() => {
  vi.useRealTimers();
});

describe('adding a file', () => {
  it('offers a single Import Template for Clients and Companions', async () => {
    const { user } = renderClientsPage();
    await openAsSarah(user);
    expect(screen.getAllByRole('button', { name: /Download .*Template/ })).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Download Import Template' })).toBeInTheDocument();
    expect(screen.queryByText(/companion template/i)).not.toBeInTheDocument();
  });

  it('accepts a CSV chosen with browse and shows its name and "Ready to import"', async () => {
    const { user } = renderClientsPage();
    await openAsSarah(user);
    await addFile(user, csv('group-tour.csv'));
    expect(screen.getByText('group-tour.csv added')).toBeInTheDocument();
    expect(screen.getByText('Ready to import')).toBeInTheDocument();
  });

  it('accepts a CSV dropped onto the upload area', async () => {
    const { user } = renderClientsPage();
    await openAsSarah(user);
    dropFile(csv('dropped.csv'));
    expect(await screen.findByText('dropped.csv added')).toBeInTheDocument();
  });

  it('refuses a file that is not a .csv with an inline message', async () => {
    const { user } = renderClientsPage();
    await openAsSarah(user);
    await addFile(user, new File(['x'], 'clients.xlsx'));
    expect(screen.getByRole('alert')).toHaveTextContent('Only .csv files can be imported.');
    expect(screen.queryByText(/added/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
  });

  it('refuses a file over 5 MB with an inline message', async () => {
    const { user } = renderClientsPage();
    await openAsSarah(user);
    const big = new File([new ArrayBuffer(5 * 1024 * 1024 + 1)], 'big.csv', { type: 'text/csv' });
    await addFile(user, big);
    expect(screen.getByRole('alert')).toHaveTextContent('The file is larger than 5 MB.');
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
  });

  it('replaces the file when Replace file is used', async () => {
    const { user } = renderClientsPage();
    await openAsSarah(user);
    await addFile(user, csv('first.csv'));
    await user.click(screen.getByRole('button', { name: 'Replace file' }));
    await addFile(user, csv('second.csv'));
    expect(screen.getByText('second.csv added')).toBeInTheDocument();
    expect(screen.queryByText('first.csv added')).not.toBeInTheDocument();
  });

  it('enables Continue only when both an Advisor and a file are present', async () => {
    const { user } = renderClientsPage();
    await openAsSarah(user);
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
    await addFile(user, csv());
    expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: 'Clear advisor' }));
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
  });
});
