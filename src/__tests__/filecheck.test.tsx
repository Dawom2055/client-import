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
