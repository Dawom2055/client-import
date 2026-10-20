import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createFakeService } from '../test/fakes';
import { addFile, advance, client, csvFile, HEADER, openAsSarah } from '../test/flows';
import { renderClientsPage } from '../test/render';

afterEach(() => {
  vi.useRealTimers();
});

const NAME_RULE = (field: string) =>
  `${field} must be 50 characters or fewer and can only contain letters, spaces, and - ' . , characters.`;
const EMAIL_RULE = 'Email Address must be a valid email address of 254 characters or fewer.';
const JANE = client(1, 'Jane', 'Doe', 'jane@example.com');

/** Uploads `file` for Sarah Brown and lets both checks finish. */
async function uploadAndCheck(file: File) {
  const create = vi.fn(async () => ({ created: 0, failed: [] }));
  const view = renderClientsPage({ service: createFakeService({ create }) });
  await openAsSarah(view.user);
  await addFile(view.user, file);
  await view.user.click(screen.getByRole('button', { name: 'Continue' }));
  await advance(1700); // File check
  await advance(2800); // Format check
  return { ...view, create };
}

const expectPassed = () => {
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(screen.getByText(/Step 4 of 5/)).toBeInTheDocument();
};

describe('Format check: names', () => {
  it("reports a name with a character other than letters, spaces and - ' . ,", async () => {
    const { create } = await uploadAndCheck(
      csvFile([HEADER, JANE, client(2, 'J4ne', 'Doe', 'a@example.com'), client(3, 'Ann', 'Lee#', 'b@example.com')]),
    );
    expect(screen.getByText(/Step 3 of 5: Format check/)).toBeInTheDocument();
    expect(screen.getByText('Total errors: 2')).toBeInTheDocument();
    expect(screen.getByText(NAME_RULE('First Name'))).toBeInTheDocument();
    expect(screen.getByText('Row 3: “J4ne”')).toBeInTheDocument();
    expect(screen.getByText(NAME_RULE('Last Name'))).toBeInTheDocument();
    expect(screen.getByText('Row 4: “Lee#”')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveClass('danger');
    expect(screen.getByText(/Nothing was created/)).toBeInTheDocument();
    expect(create).not.toHaveBeenCalled();
  });

  it("accepts accented letters, spaces and - ' . ,", async () => {
    await uploadAndCheck(
      csvFile([
        HEADER,
        client(1, 'José Mary-Ann', "O'Brien Jr.", 'jose@example.com'),
        client(2, 'Zoë', 'Smith, III', 'zoe@example.com'),
      ]),
    );
    expectPassed();
  });

  it('accepts a name written with combining accents', async () => {
    await uploadAndCheck(csvFile([HEADER, client(1, 'Jose\u0301', 'Garci\u0301a', 'jose@example.com')]));
    expectPassed();
  });

  it('accepts a name of exactly 50 characters and reports one of 51', async () => {
    await uploadAndCheck(csvFile([HEADER, client(1, 'a'.repeat(50), 'Doe', 'fifty@example.com')]));
    expectPassed();
  });

  it('reports a name of 51 characters with the offending value', async () => {
    const long = 'a'.repeat(51);
    await uploadAndCheck(csvFile([HEADER, client(1, long, 'Doe', 'long@example.com')]));
    expect(screen.getByText(NAME_RULE('First Name'))).toBeInTheDocument();
    expect(screen.getByText(`Row 2: “${long}”`)).toBeInTheDocument();
  });
});

describe('Format check: Email Address', () => {
  it.each([
    'plainaddress',
    'jane@',
    '@example.com',
    'jane@example',
    'jane doe@example.com',
    'a@@example.com',
    'jane@exa_mple.com',
    'jane!@example.com',
  ])('reports %s as not a valid email address', async (email) => {
    await uploadAndCheck(csvFile([HEADER, client(1, 'Jane', 'Doe', email)]));
    expect(screen.getByText(EMAIL_RULE)).toBeInTheDocument();
    expect(screen.getByText(`Row 2: “${email}”`)).toBeInTheDocument();
  });

  it('accepts letters, digits and . _ % + - before the @ and . - in the domain', async () => {
    await uploadAndCheck(csvFile([HEADER, client(1, 'Jane', 'Doe', 'j.a_n%e+1-x@mail-box.example.co.uk')]));
    expectPassed();
  });

  it('accepts an email address of exactly 254 characters', async () => {
    const local = 'a'.repeat(64);
    const email = `${local}@${'b'.repeat(63)}.${'c'.repeat(63)}.${'d'.repeat(57)}.com`;
    expect(email).toHaveLength(254);
    await uploadAndCheck(csvFile([HEADER, client(1, 'Jane', 'Doe', email)]));
    expectPassed();
  });

  it('reports an email address over 254 characters', async () => {
    const long = `${'a'.repeat(250)}@example.com`;
    await uploadAndCheck(csvFile([HEADER, client(1, 'Jane', 'Doe', long)]));
    expect(screen.getByText(EMAIL_RULE)).toBeInTheDocument();
  });
});

describe('Format check: row numbers', () => {
  it('numbers rows like the spreadsheet, counting blank rows', async () => {
    await uploadAndCheck(csvFile([HEADER, JANE, '', client(2, 'Ann', 'Lee', 'bad-email')]));
    expect(screen.getByText('Row 4: “bad-email”')).toBeInTheDocument();
  });
});

describe('Format check: order', () => {
  it('never shows format errors when the File check fails', async () => {
    await uploadAndCheck(csvFile([HEADER, client(1, 'J4ne', 'Doe', ''), client(2, 'Ann', 'Lee', 'not-an-email')]));
    expect(screen.getByText(/Step 2 of 5: File check/)).toBeInTheDocument();
    expect(screen.getByText('Required fields missing')).toBeInTheDocument();
    expect(screen.queryByText(EMAIL_RULE)).not.toBeInTheDocument();
    expect(screen.queryByText(NAME_RULE('First Name'))).not.toBeInTheDocument();
  });

  it('shows the Format check only after the File check passes, with no "Fix:" lines', async () => {
    await uploadAndCheck(csvFile([HEADER, client(1, 'J4ne', 'Doe', 'not-an-email')]));
    expect(screen.getByText(/Step 3 of 5: Format check/)).toBeInTheDocument();
    expect(screen.queryByText(/Fix:/)).not.toBeInTheDocument();
    expect(screen.getByText('Total errors: 2')).toBeInTheDocument();
  });
});
