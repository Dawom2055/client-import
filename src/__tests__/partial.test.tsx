import { screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createFakeService } from '../test/fakes';
import { addFile, advance, csv, openAsSarah } from '../test/flows';
import { renderClientsPage } from '../test/render';

afterEach(() => {
  vi.useRealTimers();
});

const failed = [
  { row: 5, name: 'John Smith', reason: 'The Clients service could not create this profile.' },
  { row: 12, name: 'Mary Jones', reason: 'Duplicate profile.' },
];

async function reachPartialSuccess() {
  const service = createFakeService({
    validate: async () => ({
      ok: true,
      clients: Array.from({ length: 5 }, (_, i) => ({
        firstName: 'Jane',
        lastName: 'Doe',
        email: `jane${i}@example.com`,
      })),
    }),
    create: async () => ({ created: 3, failed }),
  });
  const view = renderClientsPage({ service });
  await openAsSarah(view.user);
  await addFile(view.user, csv('partial.csv', 5));
  await view.user.click(screen.getByRole('button', { name: 'Continue' }));
  await advance(1700);
  await advance(2800);
  await view.user.click(screen.getByRole('button', { name: 'Finalize and Upload' }));
  await advance(3000);
  return view;
}

describe('Partial Success', () => {
  it('states the total, how many were created and how many failed', async () => {
    await reachPartialSuccess();
    expect(screen.getByText('Partial success! Some client profiles could not be created')).toBeInTheDocument();
    expect(
      screen.getByText('Out of 5 client profiles, 3 were successfully created. 2 failed due to system errors.'),
    ).toBeInTheDocument();
  });

  it('lists each failed row readably with its row number, name and reason', async () => {
    await reachPartialSuccess();
    const list = within(screen.getByRole('list'));
    expect(list.getAllByRole('listitem')).toHaveLength(2);
    expect(list.getByText('Row 5 · John Smith')).toBeInTheDocument();
    expect(list.getByText('The Clients service could not create this profile.')).toBeInTheDocument();
    expect(list.getByText('Row 12 · Mary Jones')).toBeInTheDocument();
    expect(list.getByText('Duplicate profile.')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).not.toHaveTextContent('{"');
  });

  it('says the created Clients were kept and offers a way to contact support', async () => {
    await reachPartialSuccess();
    expect(screen.getByText(/The created clients were kept/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'please contact support for assistance.' })).toBeInTheDocument();
  });

  it('marks the progress bar as a warning rather than an error', async () => {
    await reachPartialSuccess();
    expect(screen.getByRole('progressbar')).toHaveClass('warn');
    expect(screen.getByRole('progressbar')).not.toHaveClass('danger');
  });

  it('returns to the Clients page with Done', async () => {
    const { user } = await reachPartialSuccess();
    await user.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('resets to the very beginning with "Back to file upload"', async () => {
    const { user } = await reachPartialSuccess();
    await user.click(screen.getByRole('button', { name: 'Back to file upload' }));
    expect(screen.getByRole('heading', { name: 'Upload your Client File' })).toBeInTheDocument();
    expect(screen.queryByText(/added/)).not.toBeInTheDocument();
  });
});
