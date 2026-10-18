import { act, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMockImportService } from '../import/mockApi';
import { renderClientsPage } from '../test/render';

afterEach(() => {
  vi.useRealTimers();
});

async function searchFor(text: string) {
  const view = renderClientsPage({ service: createMockImportService(() => 'auto') });
  await view.user.click(screen.getByRole('button', { name: 'Client Import' }));
  await view.user.type(screen.getByLabelText('Advisor search'), text);
  await act(() => vi.advanceTimersByTimeAsync(800));
  return { ...view, results: within(screen.getByRole('listbox', { name: 'Advisors' })) };
}

describe('Advisor search over the dummy Advisors', () => {
  it('finds at least twenty Advisors', async () => {
    const { results } = await searchFor('triparc');
    expect(results.getAllByRole('option').length).toBeGreaterThanOrEqual(20);
  });

  it('finds an Advisor by name', async () => {
    const { results } = await searchFor('priya');
    expect(results.getByRole('option', { name: /Priya Nair/ })).toBeInTheDocument();
  });

  it('finds an Advisor by email', async () => {
    const { results } = await searchFor('marcus.reid');
    expect(results.getByRole('option', { name: /Marcus Reid/ })).toBeInTheDocument();
  });

  it('shows name, email and office for each result', async () => {
    const { results } = await searchFor('priya');
    const option = results.getByRole('option', { name: /Priya Nair/ });
    expect(option).toHaveTextContent('priya.nair@triparc.com');
    expect(option).toHaveTextContent('RETAIL - MTL');
  });

  it('tells apart Advisors with similar names', async () => {
    const { results } = await searchFor('sarah');
    expect(results.getAllByRole('option').length).toBeGreaterThanOrEqual(2);
  });
});
