import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createFakeService } from '../test/fakes';
import { addFile, advance, client, type Column, csvFile, HEADER, openAsSarah } from '../test/flows';
import { renderClientsPage } from '../test/render';

afterEach(() => {
  vi.useRealTimers();
});

/** The admin's date while these tests run: 20 October 2026, local time. */
const TODAY = new Date(2026, 9, 20, 9, 30);

/** Uploads one Client row with `cells` filled in for Sarah Brown, and lets both checks finish. */
async function checkRow(cells: Partial<Record<Column, string>>) {
  const view = renderClientsPage({ service: createFakeService() });
  vi.setSystemTime(TODAY);
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

describe('dates', () => {
  const BIRTH_FORMAT_RULE = 'Date of Birth must be a real date in MM/DD/YYYY format.';
  const EXPIRY_FORMAT_RULE = 'Passport Expiry Date must be a real date in MM/DD/YYYY format.';

  it.each(['10/20/2026', '02/29/2024', '1/5/1990', '12/31/1950'])('accepts a Date of Birth of %s', async (date) => {
    await checkRow({ 'Date of Birth': date });
    expectPassed();
  });

  it('reports a Date of Birth after today', async () => {
    await checkRow({ 'Date of Birth': '10/21/2026' });
    expectReported('Date of Birth cannot be a future date.', '10/21/2026');
  });

  it.each(['02/30/1990', '02/29/2023', '13/01/1990', '1990-02-01', '01/02/90', 'tomorrow'])(
    'reports a Date of Birth of %s as not a real MM/DD/YYYY date',
    async (date) => {
      await checkRow({ 'Date of Birth': date });
      expectReported(BIRTH_FORMAT_RULE, date);
    },
  );

  it.each(['10/20/2026', '01/01/2035'])('accepts a Passport Expiry Date of %s', async (date) => {
    await checkRow({ 'Passport Expiry Date': date });
    expectPassed();
  });

  it('reports a Passport Expiry Date before today', async () => {
    await checkRow({ 'Passport Expiry Date': '10/19/2026' });
    expectReported("Passport Expiry Date cannot be before today's date.", '10/19/2026');
  });

  it('reports a Passport Expiry Date that is not a real MM/DD/YYYY date', async () => {
    await checkRow({ 'Passport Expiry Date': '2030-01-01' });
    expectReported(EXPIRY_FORMAT_RULE, '2030-01-01');
  });
});

describe('countries', () => {
  const countryFields: [Column, string][] = [
    ['Nationality', 'Nationality must match one of the valid dropdown options exactly.'],
    ['Country', 'Country must match one of the valid dropdown options exactly.'],
    ['Passport Issuing Country', 'Passport Issuing Country must match one of the valid dropdown options exactly.'],
  ];

  it.each(countryFields)('accepts a %s by name or two-letter code, in any letter case', async (column) => {
    for (const value of ['Canada', 'united states', 'US', 'gb', 'Côte d’Ivoire', "Cote d'Ivoire"]) {
      const { unmount } = await checkRow({ [column]: value });
      expectPassed();
      unmount();
    }
  });

  it.each(countryFields)('reports a %s that is not a country', async (column, rule) => {
    await checkRow({ [column]: 'Narnia' });
    expectReported(rule, 'Narnia');
  });
});

describe('State/Province', () => {
  const STATE_RULE = 'State must match one of the valid dropdown options.';

  it.each([
    ['US', 'NY'],
    ['United States', 'new york'],
    ['us', 'District of Columbia'],
    ['CA', 'ON'],
    ['Canada', 'Quebec'],
  ])('accepts a %s state or province of %s', async (country, state) => {
    await checkRow({ Country: country, 'State/Province': state });
    expectPassed();
  });

  it.each([
    ['US', 'Ontario'],
    ['Canada', 'NY'],
    ['US', 'Nowhere'],
  ])('reports a %s state or province of %s', async (country, state) => {
    await checkRow({ Country: country, 'State/Province': state });
    expectReported(STATE_RULE, state);
  });

  it('does not check the State/Province of another country, or of a row with no Country', async () => {
    const other = await checkRow({ Country: 'France', 'State/Province': 'Île-de-France' });
    expectPassed();
    other.unmount();

    await checkRow({ 'State/Province': 'Anywhere' });
    expectPassed();
  });
});

describe('Zip/Postal Code', () => {
  const ZIP_RULE =
    'Zip Code must match the required format for the selected country (e.g., 12345 or 12345-6789 for US, A1A 1A1 for Canada).';

  it.each([
    ['US', '12345'],
    ['United States', '12345-6789'],
    ['CA', 'K1A 0B1'],
    ['Canada', 'k1a 0b1'],
    ['France', '75001'],
    ['', 'anything'],
  ])('accepts a %s code of %s', async (country, zip) => {
    await checkRow({ Country: country, 'Zip/Postal Code': zip });
    expectPassed();
  });

  it.each([
    ['US', '1234'],
    ['US', '12345-678'],
    ['US', 'ABCDE'],
    ['CA', 'K1A0B1'],
    ['Canada', '12345'],
  ])('reports a %s code of %s', async (country, zip) => {
    await checkRow({ Country: country, 'Zip/Postal Code': zip });
    expectReported(ZIP_RULE, zip);
  });
});

describe('address and passport lengths', () => {
  const cases: [Column, number, string][] = [
    ['Address Line 1', 80, 'Address 1 cannot exceed 80 characters.'],
    ['Address Line 2', 80, 'Address Line 2 cannot exceed 80 characters.'],
    ['City', 80, 'City cannot exceed 80 characters.'],
    ['Passport Number', 15, 'Passport Number cannot exceed 15 characters.'],
  ];

  it.each(cases)('accepts a %s of exactly %i characters of any kind', async (column, max) => {
    await checkRow({ [column]: '#@/'.padEnd(max, 'x') });
    expectPassed();
  });

  it.each(cases)('reports a %s over %i characters', async (column, max, rule) => {
    const long = 'x'.repeat(max + 1);
    await checkRow({ [column]: long });
    expectReported(rule, long);
  });
});
