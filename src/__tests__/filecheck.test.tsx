import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EMPTY_MESSAGE, MALFORMED_MESSAGE } from '../import/checks';
import { createFakeService } from '../test/fakes';
import { addFile, advance, csvFile, HEADER, openAsSarah } from '../test/flows';
import { renderClientsPage } from '../test/render';

afterEach(() => {
  vi.useRealTimers();
});

/** Uploads `file` for Sarah Brown and lets the File check finish. */
async function uploadAndCheck(file: File) {
  const create = vi.fn(async () => ({ created: 0, failed: [] }));
  const view = renderClientsPage({ service: createFakeService({ create }) });
  await openAsSarah(view.user);
  await addFile(view.user, file);
  await view.user.click(screen.getByRole('button', { name: 'Continue' }));
  await advance(1700);
  return { ...view, create };
}

function expectFileLevelFailure(message: string, create: ReturnType<typeof vi.fn>) {
  expect(screen.getByText(/Step 2 of 5: File check/)).toBeInTheDocument();
  expect(screen.getByRole('alert')).toHaveTextContent('Validation failed');
  expect(screen.getByText(message)).toBeInTheDocument();
  expect(screen.getByRole('progressbar')).toHaveClass('danger');
  expect(screen.getByText(/Nothing was created/)).toBeInTheDocument();
  expect(create).not.toHaveBeenCalled();
}

const COLUMNS_MESSAGE = 'The file must have exactly these columns: First Name, Last Name, Email Address.';
const JANE = 'Jane,Doe,jane@example.com';

const expectPassed = () => {
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(screen.getByText(/Step 3 of 5: Format check/)).toBeInTheDocument();
};

describe('File check: the file itself', () => {
  it('rejects a file whose columns are not the Import Template columns', async () => {
    const { create } = await uploadAndCheck(csvFile(['Name,Email', 'Jane Doe,jane@example.com']));
    expectFileLevelFailure(COLUMNS_MESSAGE, create);
  });

  it('rejects a file with an extra column', async () => {
    const { create } = await uploadAndCheck(csvFile([`${HEADER},Phone`, `${JANE},555`]));
    expectFileLevelFailure(COLUMNS_MESSAGE, create);
  });

  it('rejects a file with a missing column', async () => {
    const { create } = await uploadAndCheck(csvFile(['First Name,Last Name', 'Jane,Doe']));
    expectFileLevelFailure(COLUMNS_MESSAGE, create);
  });

  it('rejects the columns in the wrong order', async () => {
    const { create } = await uploadAndCheck(csvFile(['Last Name,First Name,Email Address', JANE]));
    expectFileLevelFailure(COLUMNS_MESSAGE, create);
  });

  it('rejects an empty file', async () => {
    const { create } = await uploadAndCheck(csvFile([]));
    expectFileLevelFailure(COLUMNS_MESSAGE, create);
  });

  it('rejects a file with only a header', async () => {
    const { create } = await uploadAndCheck(csvFile([HEADER]));
    expectFileLevelFailure(EMPTY_MESSAGE, create);
  });

  it('rejects a file with only blank rows below the header', async () => {
    const { create } = await uploadAndCheck(csvFile([HEADER, '', ',,', '  ,  ,  ']));
    expectFileLevelFailure(EMPTY_MESSAGE, create);
  });

  it('rejects a CSV with a quoted cell that is never closed', async () => {
    const { create } = await uploadAndCheck(csvFile([HEADER, 'Jane,"Doe,jane@example.com']));
    expectFileLevelFailure(MALFORMED_MESSAGE, create);
  });

  it('counts a file-level problem as one issue', async () => {
    await uploadAndCheck(csvFile(['Name,Email', 'Jane Doe,jane@example.com']));
    expect(screen.getByText('Validation failed: 1 issue found in your file')).toBeInTheDocument();
  });

  it('accepts the headers in any letter case', async () => {
    await uploadAndCheck(csvFile(['first name,LAST NAME,Email address', JANE]));
    expectPassed();
  });

  it('ignores blank rows', async () => {
    await uploadAndCheck(csvFile([HEADER, '', JANE, ',,', '']));
    expectPassed();
  });

  it('accepts quoted cells with commas, a byte-order mark and Windows line endings', async () => {
    const text = `\uFEFF${HEADER}\r\n"Doe, Jr",Jane,jane@example.com\r\n`;
    await uploadAndCheck(new File([text], 'clients.csv', { type: 'text/csv' }));
    expectPassed();
  });

  it('returns to the very beginning with "Back to file upload"', async () => {
    const { user } = await uploadAndCheck(csvFile(['Name,Email', 'Jane Doe,jane@example.com']));
    await user.click(screen.getByRole('button', { name: 'Back to file upload' }));
    expect(screen.getByRole('heading', { name: 'Upload your Client File' })).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
  });
});

describe('File check: required fields', () => {
  it('reports a blank required field with its row and column', async () => {
    const { create } = await uploadAndCheck(
      csvFile([HEADER, JANE, 'Jane,Doe,', ',Smith,smith@example.com', 'Ann,,ann@example.com']),
    );
    expect(screen.getByText(/Step 2 of 5: File check/)).toBeInTheDocument();
    expect(screen.getByText('Validation failed: 3 issues found in your file')).toBeInTheDocument();
    expect(screen.getByText('Total errors: 3')).toBeInTheDocument();
    expect(screen.getByText('Required fields missing')).toBeInTheDocument();
    expect(screen.getByText('Row 3: Email Address')).toBeInTheDocument();
    expect(screen.getByText('Row 4: First Name')).toBeInTheDocument();
    expect(screen.getByText('Row 5: Last Name')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveClass('danger');
    expect(create).not.toHaveBeenCalled();
  });
});

describe('File check: duplicate Emails', () => {
  it('reports every row that shares an Email, ignoring case and surrounding spaces', async () => {
    const { create } = await uploadAndCheck(
      csvFile([
        HEADER,
        'Jane,Doe,jane@example.com',
        'Ann,Lee,ann@example.com',
        'Janet,Dow,  JANE@Example.com ',
        'Bob,Ray,bob@example.com',
        'Jan,Dee,jane@example.com',
      ]),
    );
    expect(screen.getByText(/Step 2 of 5: File check/)).toBeInTheDocument();
    expect(screen.getByText('Total errors: 3')).toBeInTheDocument();
    expect(screen.getByText('Duplicate Email Address')).toBeInTheDocument();
    expect(screen.getByText('Row 2: “jane@example.com”')).toBeInTheDocument();
    expect(screen.getByText('Row 4: “JANE@Example.com”')).toBeInTheDocument();
    expect(screen.getByText('Row 6: “jane@example.com”')).toBeInTheDocument();
    expect(screen.queryByText(/ann@example.com/)).not.toBeInTheDocument();
    expect(create).not.toHaveBeenCalled();
  });

  it('accepts two different people with the same name but different Emails', async () => {
    await uploadAndCheck(csvFile([HEADER, 'Jane,Doe,jane1@example.com', 'Jane,Doe,jane2@example.com']));
    expectPassed();
  });

  it('reports required fields and duplicates together in one File check', async () => {
    await uploadAndCheck(csvFile([HEADER, JANE, JANE, 'Ann,Lee,']));
    expect(screen.getByText('Total errors: 3')).toBeInTheDocument();
    expect(screen.getByText('Required fields missing')).toBeInTheDocument();
    expect(screen.getByText('Duplicate Email Address')).toBeInTheDocument();
  });

  it('counts blank rows in the row numbers', async () => {
    await uploadAndCheck(csvFile([HEADER, JANE, '', ',,', JANE]));
    expect(screen.getByText('Row 2: “jane@example.com”')).toBeInTheDocument();
    expect(screen.getByText('Row 5: “jane@example.com”')).toBeInTheDocument();
  });
});

describe('File check: the error screen', () => {
  const twelveDuplicates = () => csvFile([HEADER, ...Array.from({ length: 12 }, () => JANE)]);

  it('shows ten rows per group and reveals the rest on request', async () => {
    const { user } = await uploadAndCheck(twelveDuplicates());
    expect(screen.getByText('Total errors: 12')).toBeInTheDocument();
    expect(screen.getByText(/^Row 11:/)).toBeInTheDocument();
    expect(screen.queryByText(/^Row 12:/)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Show 2 more rows' }));
    expect(screen.getByText(/^Row 13:/)).toBeInTheDocument();
  });

  it('gives one generic instruction and no per-rule "Fix:" lines', async () => {
    await uploadAndCheck(csvFile([HEADER, JANE, JANE, 'Ann,Lee,']));
    expect(screen.queryByText(/Fix:/)).not.toBeInTheDocument();
    expect(screen.getAllByText(/upload it again/)).toHaveLength(1);
    expect(screen.getByText(/Nothing was created/)).toBeInTheDocument();
  });
});
