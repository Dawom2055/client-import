import { act, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderClientsPage } from '../test/render';

afterEach(() => {
  vi.useRealTimers();
});

const openImport = (user: ReturnType<typeof renderClientsPage>['user']) =>
  user.click(screen.getByRole('button', { name: 'Client Import' }));

describe('opening Client Import', () => {
  it('shows the Client Import button to an admin on the Operations team', () => {
    renderClientsPage({ role: 'admin' });
    expect(screen.getByRole('button', { name: 'Client Import' })).toBeInTheDocument();
  });

  it('hides the Client Import button from any other role', () => {
    renderClientsPage({ role: 'other' });
    expect(screen.queryByRole('button', { name: 'Client Import' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create New Client' })).toBeInTheDocument();
  });

  it('opens the modal at the first step', async () => {
    const { user } = renderClientsPage();
    await openImport(user);
    expect(screen.getByRole('dialog', { name: 'Client Import' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Upload your Client File' })).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('closes with Cancel', async () => {
    const { user } = renderClientsPage();
    await openImport(user);
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('starts clean each time it is opened', async () => {
    const { user } = renderClientsPage();
    await openImport(user);
    await user.type(screen.getByLabelText('Advisor search'), 'sar');
    await act(() => vi.advanceTimersByTimeAsync(300));
    await user.click(within(screen.getByRole('listbox', { name: 'Advisors' })).getByRole('option', { name: /Sarah Brown/ }));
    expect(screen.getByRole('button', { name: 'Clear advisor' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await openImport(user);

    expect(screen.queryByRole('button', { name: 'Clear advisor' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Advisor search')).toHaveValue('');
  });
});
