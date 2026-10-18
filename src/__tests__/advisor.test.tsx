import { act, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createFakeService, SARAH, VALERIE } from '../test/fakes';
import { renderClientsPage } from '../test/render';

afterEach(() => {
  vi.useRealTimers();
});

type User = ReturnType<typeof renderClientsPage>['user'];

const openImport = (user: User) => user.click(screen.getByRole('button', { name: 'Client Import' }));
const advisorField = () => screen.getByLabelText('Advisor search');
const results = () => within(screen.getByRole('listbox', { name: 'Advisors' }));
const settle = (ms = 300) => act(() => vi.advanceTimersByTimeAsync(ms));

async function searchFor(user: User, text: string) {
  await user.type(advisorField(), text);
  await settle();
}

describe('choosing an Advisor', () => {
  it('does not search until two characters are typed', async () => {
    const searchAdvisors = vi.fn(async () => [SARAH]);
    const { user } = renderClientsPage({ service: createFakeService({ searchAdvisors }) });
    await openImport(user);

    await searchFor(user, 's');
    expect(searchAdvisors).not.toHaveBeenCalled();

    await searchFor(user, 'a');
    expect(searchAdvisors).toHaveBeenCalledWith('sa');
  });

  it('searches straight away when Search is clicked', async () => {
    const searchAdvisors = vi.fn(async () => [SARAH]);
    const { user } = renderClientsPage({ service: createFakeService({ searchAdvisors }) });
    await openImport(user);

    await user.type(advisorField(), 'sa');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    expect(searchAdvisors).toHaveBeenCalledWith('sa');
  });

  it('shows name, email and office for each result', async () => {
    const { user } = renderClientsPage();
    await openImport(user);
    await searchFor(user, 'sarah');

    const option = results().getByRole('option', { name: /Sarah Brown/ });
    expect(option).toHaveTextContent('sarah.brown@example.com');
    expect(option).toHaveTextContent('RETAIL - TTN');
  });

  it('shows a loading indicator while advisors are being searched', async () => {
    let finish: (a: typeof SARAH[]) => void = () => {};
    const searchAdvisors = () => new Promise<typeof SARAH[]>((resolve) => (finish = resolve));
    const { user } = renderClientsPage({ service: createFakeService({ searchAdvisors }) });
    await openImport(user);
    await searchFor(user, 'sa');

    expect(screen.getByText('Searching advisors…')).toBeInTheDocument();
    await act(async () => finish([SARAH]));
    expect(screen.queryByText('Searching advisors…')).not.toBeInTheDocument();
  });

  it('says when no advisors match', async () => {
    const { user } = renderClientsPage();
    await openImport(user);
    await searchFor(user, 'zz');
    expect(screen.getByText('No advisors found')).toBeInTheDocument();
  });

  it('shows an error with Retry when the lookup fails, and recovers on retry', async () => {
    const searchAdvisors = vi
      .fn<() => Promise<(typeof SARAH)[]>>()
      .mockRejectedValueOnce(new Error('down'))
      .mockResolvedValue([SARAH]);
    const { user } = renderClientsPage({ service: createFakeService({ searchAdvisors }) });
    await openImport(user);
    await searchFor(user, 'sa');

    expect(screen.getByRole('alert')).toHaveTextContent('Couldn’t load advisors.');
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    await act(() => vi.advanceTimersByTimeAsync(0));
    expect(results().getByRole('option', { name: /Sarah Brown/ })).toBeInTheDocument();
  });

  it('lets the keyboard pick a result', async () => {
    const { user } = renderClientsPage();
    await openImport(user);
    await searchFor(user, 'a');
    await searchFor(user, 'r'); // "ar" matches Sarah only
    await user.keyboard('{ArrowDown}{Enter}');
    expect(screen.getByRole('button', { name: 'Clear advisor' })).toBeInTheDocument();
    expect(screen.getByText('Sarah Brown', { selector: 'strong' })).toBeInTheDocument();
  });

  it('lets the chosen Advisor be cleared and another picked', async () => {
    const { user } = renderClientsPage();
    await openImport(user);
    await searchFor(user, 'sarah');
    await user.click(results().getByRole('option', { name: /Sarah Brown/ }));

    await user.click(screen.getByRole('button', { name: 'Clear advisor' }));
    await searchFor(user, 'valerie');
    await user.click(results().getByRole('option', { name: /Valerie Smith/ }));

    expect(screen.getByText(VALERIE.name, { selector: 'strong' })).toBeInTheDocument();
    expect(screen.queryByText(SARAH.name, { selector: 'strong' })).not.toBeInTheDocument();
  });

  it('preselects the Advisor the admin is using ADX as, and lets them change it', async () => {
    const { user } = renderClientsPage();
    await user.selectOptions(screen.getByLabelText('Using ADX as'), 'Valerie Smith');
    await openImport(user);

    expect(screen.getByText(VALERIE.name, { selector: 'strong' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear advisor' }));
    await searchFor(user, 'sarah');
    await user.click(results().getByRole('option', { name: /Sarah Brown/ }));
    expect(screen.getByText(SARAH.name, { selector: 'strong' })).toBeInTheDocument();
  });

  it('keeps the upload area disabled, with an explanation, until an Advisor is chosen', async () => {
    const { user } = renderClientsPage();
    await openImport(user);
    expect(screen.getByText('File upload is disabled until an advisor is selected')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Browse files' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();

    await searchFor(user, 'sarah');
    await user.click(results().getByRole('option', { name: /Sarah Brown/ }));
    expect(screen.getByRole('button', { name: 'Browse files' })).toBeInTheDocument();
  });
});
