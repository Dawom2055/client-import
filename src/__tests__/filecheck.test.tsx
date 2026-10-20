import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EMPTY_MESSAGE, MALFORMED_MESSAGE } from '../import/checks';
import { createFakeService } from '../test/fakes';
import { addFile, advance, client, csvFile, HEADER, openAsSarah, row, uploadAndCheck } from '../test/flows';
import { renderClientsPage } from '../test/render';

afterEach(() => {
  vi.useRealTimers();
});

/** Uploads `file` for Sarah Brown and lets the File check finish. */
const checkFile = (file: File) => uploadAndCheck(file, { fileCheckOnly: true });

function expectFileLevelFailure(message: string, create: ReturnType<typeof vi.fn>) {
  expect(screen.getByText(/Step 2 of 5: File check/)).toBeInTheDocument();
  expect(screen.getByRole('alert')).toHaveTextContent('Validation failed');
  expect(screen.getByText(message)).toBeInTheDocument();
  expect(screen.getByRole('progressbar')).toHaveClass('danger');
  expect(screen.getByText(/Nothing was created/)).toBeInTheDocument();
  expect(create).not.toHaveBeenCalled();
}

const COLUMNS_MESSAGE = `The file must have exactly these columns: ${HEADER.split(',').join(', ')}.`;
const JANE = client(1, 'Jane', 'Doe', 'jane@example.com');

const expectFileCheckPassed = () => {
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(screen.getByText(/Step 3 of 5: Format check/)).toBeInTheDocument();
};

describe('File check: the file itself', () => {
  it('rejects a file whose columns are not the Import Template columns', async () => {
    const { create } = await checkFile(csvFile(['Name,Email', 'Jane Doe,jane@example.com']));
    expectFileLevelFailure(COLUMNS_MESSAGE, create);
  });

  it('rejects a file with an extra column', async () => {
    const { create } = await checkFile(csvFile([`${HEADER},Phone`, `${JANE},555`]));
    expectFileLevelFailure(COLUMNS_MESSAGE, create);
  });

  it('rejects a file with a missing column', async () => {
    const { create } = await checkFile(csvFile(['First Name,Last Name', 'Jane,Doe']));
    expectFileLevelFailure(COLUMNS_MESSAGE, create);
  });

  it('rejects the columns in the wrong order', async () => {
    const { create } = await checkFile(
      csvFile([HEADER.replace('First Name*,Middle Name', 'Middle Name,First Name*'), JANE]),
    );
    expectFileLevelFailure(COLUMNS_MESSAGE, create);
  });

  it('rejects an empty file', async () => {
    const { create } = await checkFile(csvFile([]));
    expectFileLevelFailure(COLUMNS_MESSAGE, create);
  });

  it('rejects a file with only a header', async () => {
    const { create } = await checkFile(csvFile([HEADER]));
    expectFileLevelFailure(EMPTY_MESSAGE, create);
  });

  it('rejects a file with only blank rows below the header', async () => {
    const { create } = await checkFile(csvFile([HEADER, '', ',,', '  ,  ,  ']));
    expectFileLevelFailure(EMPTY_MESSAGE, create);
  });

  it('rejects a CSV with a quoted cell that is never closed', async () => {
    const { create } = await checkFile(csvFile([HEADER, 'Jane,"Doe,jane@example.com']));
    expectFileLevelFailure(MALFORMED_MESSAGE, create);
  });

  it('counts a file-level problem as one issue', async () => {
    await checkFile(csvFile(['Name,Email', 'Jane Doe,jane@example.com']));
    expect(screen.getByText('Validation failed: 1 issue found in your file')).toBeInTheDocument();
  });

  it('accepts the headers in any letter case', async () => {
    await checkFile(csvFile([HEADER.toLowerCase(), JANE]));
    expectFileCheckPassed();
  });

  it('accepts the headers without the required marker', async () => {
    await checkFile(csvFile([HEADER.replaceAll('*', ''), JANE]));
    expectFileCheckPassed();
  });

  it('accepts blank optional cells', async () => {
    await checkFile(
      csvFile([
        HEADER,
        row({
          'Group #': '1',
          'Profile Type': 'L',
          'First Name': 'Jane',
          'Last Name': 'Doe',
          'Email Address': 'jane@example.com',
        }),
      ]),
    );
    expectFileCheckPassed();
  });

  it('ignores blank rows', async () => {
    await checkFile(csvFile([HEADER, '', JANE, ',,', '']));
    expectFileCheckPassed();
  });

  it('rejects a row with text beyond the template columns, even when its own columns are blank', async () => {
    const extra = await checkFile(csvFile([HEADER, `${JANE},extra`]));
    expectFileLevelFailure(COLUMNS_MESSAGE, extra.create);
    extra.unmount();

    const blank = await checkFile(csvFile([HEADER, JANE, `${','.repeat(24)}notes`]));
    expectFileLevelFailure(COLUMNS_MESSAGE, blank.create);
  });

  it('accepts trailing empty cells, as spreadsheets save them', async () => {
    await checkFile(csvFile([`${HEADER},`, `${JANE},`]));
    expectFileCheckPassed();
  });

  it('rejects a file that cannot be read instead of waiting forever', async () => {
    const create = vi.fn(async () => ({ created: 0, failed: [] }));
    const validate = async () => {
      throw new Error('disk error');
    };
    const view = renderClientsPage({ service: createFakeService({ create, validate }) });
    await openAsSarah(view.user);
    await addFile(view.user, csvFile([HEADER, JANE]));
    await view.user.click(screen.getByRole('button', { name: 'Continue' }));
    await advance(1700);
    expectFileLevelFailure('The file could not be read.', create);
  });

  it('accepts quoted cells with commas, a byte-order mark and Windows line endings', async () => {
    const text = `\uFEFF${HEADER}\r\n${client(1, 'Doe, Jr', 'Jane', 'jane@example.com')}\r\n`;
    await checkFile(new File([text], 'clients.csv', { type: 'text/csv' }));
    expectFileCheckPassed();
  });

  it('returns to the very beginning with "Back to file upload"', async () => {
    const { user } = await checkFile(csvFile(['Name,Email', 'Jane Doe,jane@example.com']));
    await user.click(screen.getByRole('button', { name: 'Back to file upload' }));
    expect(screen.getByRole('heading', { name: 'Upload your Client File' })).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
  });
});

describe('File check: required fields', () => {
  it('reports a blank required field with its row and column', async () => {
    const { create } = await checkFile(
      csvFile([
        HEADER,
        JANE,
        client(2, 'Jane', 'Doe', ''),
        client(3, '', 'Smith', 'smith@example.com'),
        client(4, 'Ann', '', 'ann@example.com'),
        client(5, 'Bob', 'Ray', 'bob@example.com', { 'Group #': '' }),
        client(6, 'Cy', 'Ng', 'cy@example.com', { 'Profile Type': '' }),
      ]),
    );
    expect(screen.getByText(/Step 2 of 5: File check/)).toBeInTheDocument();
    expect(screen.getByText('Validation failed: 5 issues found in your file')).toBeInTheDocument();
    expect(screen.getByText('Total errors: 5')).toBeInTheDocument();
    expect(screen.getByText('Required fields missing')).toBeInTheDocument();
    expect(screen.getByText('Row 3: Email Address')).toBeInTheDocument();
    expect(screen.getByText('Row 4: First Name')).toBeInTheDocument();
    expect(screen.getByText('Row 5: Last Name')).toBeInTheDocument();
    expect(screen.getByText('Row 6: Group #')).toBeInTheDocument();
    expect(screen.getByText('Row 7: Profile Type')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveClass('danger');
    expect(create).not.toHaveBeenCalled();
  });
});

describe('File check: duplicate Emails', () => {
  it('reports every row that shares an Email, ignoring case and surrounding spaces', async () => {
    const { create } = await checkFile(
      csvFile([
        HEADER,
        client(1, 'Jane', 'Doe', 'jane@example.com'),
        client(2, 'Ann', 'Lee', 'ann@example.com'),
        client(3, 'Janet', 'Dow', '  JANE@Example.com '),
        client(4, 'Bob', 'Ray', 'bob@example.com'),
        client(5, 'Jan', 'Dee', 'jane@example.com'),
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
    await checkFile(
      csvFile([HEADER, client(1, 'Jane', 'Doe', 'jane1@example.com'), client(2, 'Jane', 'Doe', 'jane2@example.com')]),
    );
    expectFileCheckPassed();
  });

  it('reports required fields and duplicates together in one File check', async () => {
    await checkFile(csvFile([HEADER, JANE, client(2, 'Jane', 'Doe', 'jane@example.com'), client(3, 'Ann', 'Lee', '')]));
    expect(screen.getByText('Total errors: 3')).toBeInTheDocument();
    expect(screen.getByText('Required fields missing')).toBeInTheDocument();
    expect(screen.getByText('Duplicate Email Address')).toBeInTheDocument();
  });

  it('counts blank rows in the row numbers', async () => {
    await checkFile(csvFile([HEADER, JANE, '', ',,', client(2, 'Jane', 'Doe', 'jane@example.com')]));
    expect(screen.getByText('Row 2: “jane@example.com”')).toBeInTheDocument();
    expect(screen.getByText('Row 5: “jane@example.com”')).toBeInTheDocument();
  });
});

describe('File check: the error screen', () => {
  const twelveDuplicates = () =>
    csvFile([HEADER, ...Array.from({ length: 12 }, (_, i) => client(i + 1, 'Jane', 'Doe', 'jane@example.com'))]);

  it('shows ten rows per group and reveals the rest on request', async () => {
    const { user } = await checkFile(twelveDuplicates());
    expect(screen.getByText('Total errors: 12')).toBeInTheDocument();
    expect(screen.getByText(/^Row 11:/)).toBeInTheDocument();
    expect(screen.queryByText(/^Row 12:/)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Show 2 more rows' }));
    expect(screen.getByText(/^Row 13:/)).toBeInTheDocument();
  });

  it('gives one generic instruction and no per-rule "Fix:" lines', async () => {
    await checkFile(csvFile([HEADER, JANE, client(2, 'Jane', 'Doe', 'jane@example.com'), client(3, 'Ann', 'Lee', '')]));
    expect(screen.queryByText(/Fix:/)).not.toBeInTheDocument();
    expect(screen.getAllByText(/upload it again/)).toHaveLength(1);
    expect(screen.getByText(/Nothing was created/)).toBeInTheDocument();
  });
});
