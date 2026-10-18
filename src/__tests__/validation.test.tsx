import { screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { RuleError } from '../import/types';
import { addFile, advance, csv, openAsSarah } from '../test/flows';
import { createFakeService } from '../test/fakes';
import { renderClientsPage } from '../test/render';

afterEach(() => {
  vi.useRealTimers();
});

const emailRows = Array.from({ length: 12 }, (_, i) => ({ row: i + 2, value: `bad${i}@` }));
const errors: RuleError[] = [
  { rule: 'Email must be a valid email address.', rows: emailRows },
  { rule: 'First name is required.', rows: [{ row: 20 }] },
];

async function reachValidationFailure() {
  const create = vi.fn(async () => ({ created: 0, failed: [] }));
  const service = createFakeService({ validate: async () => ({ ok: false, errors }), create });
  const view = renderClientsPage({ service });
  await openAsSarah(view.user);
  await addFile(view.user, csv());
  await view.user.click(screen.getByRole('button', { name: 'Continue' }));
  await advance(1700); // file format check
  await advance(2800); // external data validation
  return { ...view, create };
}

describe('Validation Failure', () => {
  it('shows each timed step with its label, a progress bar and a percentage', async () => {
    const { user } = renderClientsPage();
    await openAsSarah(user);
    await addFile(user, csv());
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await advance(750);
    expect(screen.getByText(/Step 2 of 5: File format check \(\d+% complete\)/)).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText('Checking the file format…')).toBeInTheDocument();

    await advance(1000);
    expect(screen.getByText(/Step 3 of 5: External data validation/)).toBeInTheDocument();
    expect(screen.getByText('Checking for conflicting data…')).toBeInTheDocument();
  });

  it('reports every problem grouped by rule, with the total and the offending values', async () => {
    await reachValidationFailure();
    expect(screen.getByText('Validation failed: 13 issues found in your file')).toBeInTheDocument();
    expect(screen.getByText('Total errors: 13')).toBeInTheDocument();
    expect(screen.getByText('Email must be a valid email address.')).toBeInTheDocument();
    expect(screen.getByText('First name is required.')).toBeInTheDocument();
    expect(screen.getByText('Row 2')).toBeInTheDocument();
    expect(screen.getByText(/bad0@/)).toBeInTheDocument();
  });

  it('shows ten rows per group and reveals the rest on request', async () => {
    const { user } = await reachValidationFailure();
    expect(screen.getByText('Row 11')).toBeInTheDocument();
    expect(screen.queryByText('Row 12')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Show 2 more rows' }));
    expect(screen.getByText('Row 12')).toBeInTheDocument();
    expect(screen.getByText('Row 13')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Show .* more/ })).not.toBeInTheDocument();
  });

  it('says to correct the rows and upload again, and that nothing was created', async () => {
    const { create } = await reachValidationFailure();
    expect(screen.getByText('Correct these rows in your file and upload it again. Nothing was created.')).toBeInTheDocument();
    expect(create).not.toHaveBeenCalled();
  });

  it('marks the progress bar as an error', async () => {
    await reachValidationFailure();
    expect(screen.getByRole('progressbar')).toHaveClass('danger');
  });

  it('returns to the very beginning with "Back to file upload"', async () => {
    const { user } = await reachValidationFailure();
    await user.click(screen.getByRole('button', { name: 'Back to file upload' }));

    expect(screen.getByRole('heading', { name: 'Upload your Client File' })).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.queryByText(/added/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
  });

  it('also clears an Advisor picked by hand when going back', async () => {
    const service = createFakeService({ validate: async () => ({ ok: false, errors }) });
    const { user } = renderClientsPage({ service });
    await user.click(screen.getByRole('button', { name: 'Client Import' }));
    await user.type(screen.getByLabelText('Advisor search'), 'valerie');
    await advance(300);
    await user.click(within(screen.getByRole('listbox', { name: 'Advisors' })).getByRole('option', { name: /Valerie Smith/ }));
    await addFile(user, csv());
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await advance(1700);
    await advance(2800);

    await user.click(screen.getByRole('button', { name: 'Back to file upload' }));
    expect(screen.getByLabelText('Advisor search')).toHaveValue('');
    expect(screen.queryByRole('button', { name: 'Clear advisor' })).not.toBeInTheDocument();
  });
});
