import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createFakeService } from '../test/fakes';
import { addFile, advance, client, type Column, csvFile, HEADER, openAsSarah } from '../test/flows';
import { renderClientsPage } from '../test/render';

afterEach(() => {
  vi.useRealTimers();
});

/** Uploads one Client row with `cells` filled in for Sarah Brown, and lets both checks finish. */
async function checkRow(cells: Partial<Record<Column, string>>) {
  const view = renderClientsPage({ service: createFakeService() });
  await openAsSarah(view.user);
  await addFile(view.user, csvFile([HEADER, client(1, 'Jane', 'Doe', 'jane@example.com', cells)]));
  await view.user.click(screen.getByRole('button', { name: 'Continue' }));
  await advance(1700); // File check
  await advance(2800); // Format check
  return view;
}

const expectPassed = () => {
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(screen.getByText(/Step 4 of 5/)).toBeInTheDocument();
};

const expectReported = (rule: string, value: string) => {
  expect(screen.getByText(/Step 3 of 5: Format check/)).toBeInTheDocument();
  expect(screen.getByText(rule)).toBeInTheDocument();
  expect(screen.getByText(`Row 2: “${value}”`)).toBeInTheDocument();
};

describe('pick lists', () => {
  const cases: [Column, string[], string, string][] = [
    [
      'Title',
      ['Mr.', 'mr', 'MRS.', 'Mrs', 'ms.', 'Dr', 'Mstr', 'miss'],
      'Sir',
      'Title must be one of: Mr., Mrs., Ms., Dr., Mstr, or Miss',
    ],
    ['Gender', ['M', 'f'], 'Male', "Gender must be either 'M' (Male) or 'F' (Female)."],
    ['Email Description', ['Personal', 'WORK'], 'Home', "Email Description must be either 'Personal' or 'Work'."],
    ['Phone Description', ['home', 'Work', 'CELL'], 'Mobile', "Phone Description must be 'Home', 'Work', or 'Cell'."],
  ];

  it.each(cases)('accepts every %s option in any letter case', async (column, good) => {
    for (const value of good) {
      const { unmount } = await checkRow({ [column]: value });
      expectPassed();
      unmount();
    }
  });

  it.each(cases)('reports a %s that is not an option', async (column, _good, bad, rule) => {
    await checkRow({ [column]: bad });
    expectReported(rule, bad);
  });

  it('accepts a Phone Description with no Primary Phone Number', async () => {
    await checkRow({ 'Phone Description': 'Cell' });
    expectPassed();
  });
});

describe('Primary Phone Number', () => {
  const PHONE_RULE = 'Phone Number must contain 10 to 15 digits, numbers only.';

  it.each(['5551234567', '123456789012345'])('accepts %s', async (phone) => {
    await checkRow({ 'Primary Phone Number': phone });
    expectPassed();
  });

  it.each(['555123456', '1234567890123456', '555-123-4567', '(555) 1234567', '+15551234567'])(
    'reports %s',
    async (phone) => {
      await checkRow({ 'Primary Phone Number': phone });
      expectReported(PHONE_RULE, phone);
    },
  );
});
