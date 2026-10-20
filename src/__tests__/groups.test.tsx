import { screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SARAH } from '../test/fakes';
import { client, expectReachedReview, uploadRows } from '../test/flows';

afterEach(() => {
  vi.useRealTimers();
});

/** A Companion row in `group`, linked to that Group's Client. */
const companion = (group: number, first: string, email: string, relationship = 'Spouse') =>
  client(group, first, 'Doe', email, { 'Relationship to Client': relationship });

const reviewRows = () =>
  within(screen.getByRole('table'))
    .getAllByRole('row')
    .slice(1)
    .map((r) =>
      within(r)
        .getAllByRole('cell')
        .map((c) => c.textContent),
    );

const GROUP_NUMBER_RULE = 'Group # must be a whole number of 1 or more.';
const ONE_CLIENT_RULE = 'Each Group must have only one Client.';
const NO_CLIENT_RULE =
  'Each Group must have a Client. Companions must share a Group # with one row that has no Relationship to Client.';
const RELATIONSHIP_RULE =
  'Relationship to Client must be one of: Spouse, Partner, Child, Parent, Sibling, Friend, Other.';

describe('Client rows and Companion rows', () => {
  it('creates a Client and its Companions from one Group, listing both in the Review', async () => {
    const { user, create } = await uploadRows([
      client(1, 'Jane', 'Doe', 'jane@example.com'),
      companion(1, 'John', 'john@example.com', 'Spouse'),
      companion(1, 'Amy', 'amy@example.com', 'Child'),
    ]);
    expectReachedReview();
    expect(screen.getByText('Total records: 3')).toBeInTheDocument();
    expect(
      within(screen.getByRole('table'))
        .getAllByRole('columnheader')
        .map((h) => h.textContent),
    ).toEqual(['#', 'Group #', 'Relationship to Client', 'Corporate Name', 'First Name', 'Last Name', 'Email Address']);
    expect(reviewRows()).toEqual([
      ['1', '1', '', '', 'Jane', 'Doe', 'jane@example.com'],
      ['2', '1', 'Spouse', '', 'John', 'Doe', 'john@example.com'],
      ['3', '1', 'Child', '', 'Amy', 'Doe', 'amy@example.com'],
    ]);

    await user.click(screen.getByRole('button', { name: 'Finalize and Upload' }));
    expect(create).toHaveBeenCalledWith(expect.any(File), SARAH, [
      expect.objectContaining({ kind: 'client', group: '1', firstName: 'Jane' }),
      expect.objectContaining({ kind: 'companion', group: '1', firstName: 'John', relationship: 'Spouse' }),
      expect.objectContaining({ kind: 'companion', group: '1', firstName: 'Amy', relationship: 'Child' }),
    ]);
  });

  it('accepts a Client on their own as a Group of one', async () => {
    await uploadRows([client(1, 'Jane', 'Doe', 'jane@example.com'), client(2, 'Bob', 'Ray', 'bob@example.com')]);
    expectReachedReview();
  });

  it("accepts a Group's rows anywhere in the file and Group numbers with gaps", async () => {
    await uploadRows([
      companion(7, 'John', 'john@example.com'),
      client(2, 'Bob', 'Ray', 'bob@example.com'),
      client(7, 'Jane', 'Doe', 'jane@example.com'),
      companion(2, 'Kim', 'kim@example.com', 'Friend'),
    ]);
    expectReachedReview();
  });

  it('accepts every Relationship to Client in any letter case', async () => {
    const relationships = ['spouse', 'PARTNER', 'Child', 'parent', 'Sibling', 'friend', 'Other'];
    await uploadRows([
      client(1, 'Jane', 'Doe', 'jane@example.com'),
      ...relationships.map((r, i) => companion(1, 'Kid', `kid${i}@example.com`, r)),
    ]);
    expectReachedReview();
  });

  it('reports a Relationship to Client that is not in the list', async () => {
    await uploadRows([
      client(1, 'Jane', 'Doe', 'jane@example.com'),
      companion(1, 'John', 'john@example.com', 'Husband'),
    ]);
    expect(screen.getByText(/Step 3 of 5: Format check/)).toBeInTheDocument();
    expect(screen.getByText(RELATIONSHIP_RULE)).toBeInTheDocument();
    expect(screen.getByText('Row 3: “Husband”')).toBeInTheDocument();
  });
});

describe('File check: Groups', () => {
  it.each(['abc', '0', '-1', '1.5'])('reports a Group # of %s', async (group) => {
    const { create } = await uploadRows([client(1, 'Jane', 'Doe', 'jane@example.com', { 'Group #': group })]);
    expect(screen.getByText(/Step 2 of 5: File check/)).toBeInTheDocument();
    expect(screen.getByText(GROUP_NUMBER_RULE)).toBeInTheDocument();
    expect(screen.getByText(`Row 2: “${group}”`)).toBeInTheDocument();
    expect(create).not.toHaveBeenCalled();
  });

  it('reports every row of a Group with two Clients', async () => {
    await uploadRows([
      client(1, 'Jane', 'Doe', 'jane@example.com'),
      client(2, 'Bob', 'Ray', 'bob@example.com'),
      client(1, 'Ann', 'Lee', 'ann@example.com'),
      companion(1, 'John', 'john@example.com'),
    ]);
    expect(screen.getByText(/Step 2 of 5: File check/)).toBeInTheDocument();
    expect(screen.getByText(ONE_CLIENT_RULE)).toBeInTheDocument();
    expect(screen.getByText('Total errors: 3')).toBeInTheDocument();
    expect(screen.getByText('Row 2: Group 1')).toBeInTheDocument();
    expect(screen.getByText('Row 4: Group 1')).toBeInTheDocument();
    expect(screen.getByText('Row 5: Group 1')).toBeInTheDocument();
    expect(screen.queryByText(/^Row 3:/)).not.toBeInTheDocument();
  });

  it('reports every row of a Group with Companions but no Client', async () => {
    await uploadRows([
      client(1, 'Jane', 'Doe', 'jane@example.com'),
      companion(2, 'John', 'john@example.com'),
      companion(2, 'Amy', 'amy@example.com', 'Child'),
    ]);
    expect(screen.getByText(NO_CLIENT_RULE)).toBeInTheDocument();
    expect(screen.getByText('Total errors: 2')).toBeInTheDocument();
    expect(screen.getByText('Row 3: Group 2')).toBeInTheDocument();
    expect(screen.getByText('Row 4: Group 2')).toBeInTheDocument();
  });

  it('treats Group numbers written differently, such as 01 and 1, as the same Group', async () => {
    await uploadRows([
      client(1, 'Jane', 'Doe', 'jane@example.com'),
      client(1, 'Ann', 'Lee', 'ann@example.com', { 'Group #': '01' }),
    ]);
    expect(screen.getByText(ONE_CLIENT_RULE)).toBeInTheDocument();
  });
});
