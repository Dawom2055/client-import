import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ImportService } from '../import/types';
import { createFakeService, SARAH } from '../test/fakes';
import { addFile, advance, csv, openAsSarah } from '../test/flows';
import { renderClientsPage } from '../test/render';

afterEach(() => {
  vi.useRealTimers();
});

async function reachConfirm(service: ImportService = createFakeService()) {
  const view = renderClientsPage({ service });
  await openAsSarah(view.user);
  await addFile(view.user, csv());
  await view.user.click(screen.getByRole('button', { name: 'Continue' }));
  await advance(1700);
  await advance(2800);
  return view;
}

const startCreating = async (user: Awaited<ReturnType<typeof reachConfirm>>['user']) => {
  await user.click(screen.getByRole('button', { name: 'Create 3 clients' }));
};

describe('confirming and creating', () => {
  it('asks for confirmation, naming the number of Clients and the Advisor', async () => {
    await reachConfirm();
    expect(screen.getByText(/Step 4 of 5: Confirm/)).toBeInTheDocument();
    expect(screen.getByText('Your file passed validation')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toHaveTextContent('Create 3 clients for Sarah Brown?');
  });

  it('creates nothing when the admin cancels at the confirm step', async () => {
    const create = vi.fn(async () => ({ created: 3, failed: [] }));
    const { user } = await reachConfirm(createFakeService({ create }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(create).not.toHaveBeenCalled();
  });

  it('creates the Clients for the chosen Advisor once confirmed', async () => {
    const create = vi.fn(async () => ({ created: 3, failed: [] }));
    const { user } = await reachConfirm(createFakeService({ create }));
    await startCreating(user);
    expect(create).toHaveBeenCalledWith(expect.any(File), SARAH, 3);
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
    expect(screen.getByText(/A total of 3 clients and their companions have been successfully created/)).toBeInTheDocument();
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

  it('closes with Escape on the first step, the confirm step and the result screens', async () => {
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
