import { screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { client, expectReachedReview, uploadRows } from '../test/flows';

afterEach(() => {
  vi.useRealTimers();
});

/** A Corporate Client row for Acme in `group`. */
const corporate = (group: number, first: string, email: string) =>
  client(group, first, 'Doe', email, { 'Profile Type': 'C', 'Corporate Name': 'Acme' });

/** A Spouse Companion row in `group` with the given Profile Type. */
const companion = (group: number, first: string, email: string, profileType: string) =>
  client(group, first, 'Doe', email, { 'Relationship to Client': 'Spouse', 'Profile Type': profileType });

const PROFILE_TYPE_RULE = "Profile Type must be either 'L' (Leisure) or 'C' (Corporate).";
const MATCH_RULE = 'Companions must have the same Profile Type as the Client in their Group.';
const CORPORATE_REQUIRED_RULE = "Corporate Name is required when Profile Type is 'C' (Corporate).";
const COMPANION_CORPORATE_RULE = 'Corporate Name must be blank for Companions.';
const LEISURE_CORPORATE_RULE = "Corporate Name must be blank when Profile Type is 'L' (Leisure).";
const CORPORATE_NAME_RULE =
  "Corporate name must be 20 characters or fewer and can only contain letters, spaces, and - ' . , characters.";

describe('Profile Type', () => {
  it('accepts L and C in any letter case', async () => {
    await uploadRows([
      client(1, 'Jane', 'Doe', 'jane@example.com', { 'Profile Type': 'l' }),
      client(2, 'Bob', 'Ray', 'bob@example.com', { 'Profile Type': 'c', 'Corporate Name': 'Acme' }),
      companion(2, 'Kim', 'kim@example.com', 'C'),
    ]);
    expectReachedReview();
  });

  it('reports a Profile Type other than L or C', async () => {
    await uploadRows([client(1, 'Jane', 'Doe', 'jane@example.com', { 'Profile Type': 'Leisure' })]);
    expect(screen.getByText(/Step 3 of 5: Format check/)).toBeInTheDocument();
    expect(screen.getByText(PROFILE_TYPE_RULE)).toBeInTheDocument();
    expect(screen.getByText('Row 2: “Leisure”')).toBeInTheDocument();
  });

  it("reports only the Companion rows whose Profile Type differs from their Client's", async () => {
    await uploadRows([
      corporate(1, 'Jane', 'jane@example.com'),
      companion(1, 'John', 'john@example.com', 'L'),
      companion(1, 'Amy', 'amy@example.com', 'c'),
    ]);
    expect(screen.getByText(/Step 2 of 5: File check/)).toBeInTheDocument();
    expect(screen.getByText(MATCH_RULE)).toBeInTheDocument();
    expect(screen.getByText('Total errors: 1')).toBeInTheDocument();
    expect(screen.getByText('Row 3: “L”')).toBeInTheDocument();
  });

  it('does not compare Profile Types in a Group that has no single Client', async () => {
    await uploadRows([
      client(1, 'Jane', 'Doe', 'jane@example.com'),
      corporate(1, 'Ann', 'ann@example.com'),
      companion(1, 'John', 'john@example.com', 'C'),
    ]);
    expect(screen.getByText('Each Group must have only one Client.')).toBeInTheDocument();
    expect(screen.queryByText(MATCH_RULE)).not.toBeInTheDocument();
  });
});

describe('one clear message for a bad Profile Type or Group #', () => {
  it('reports only the Profile Type when a bad one makes a Group look like it has two Clients', async () => {
    await uploadRows([
      client(1, 'Jane', 'Doe', 'jane@example.com'),
      client(1, 'Ann', 'Lee', 'ann@example.com', { 'Profile Type': 'X' }),
    ]);
    expect(screen.getByText(/Step 3 of 5: Format check/)).toBeInTheDocument();
    expect(screen.getByText(PROFILE_TYPE_RULE)).toBeInTheDocument();
    expect(screen.getByText('Total errors: 1')).toBeInTheDocument();
  });

  it("reports only the Profile Type when the Group's only Client has a bad one", async () => {
    await uploadRows([
      client(1, 'Jane', 'Doe', 'jane@example.com', { 'Profile Type': 'X' }),
      companion(1, 'John', 'john@example.com', 'L'),
    ]);
    expect(screen.getByText(/Step 3 of 5: Format check/)).toBeInTheDocument();
    expect(screen.getByText(PROFILE_TYPE_RULE)).toBeInTheDocument();
    expect(screen.getByText('Total errors: 1')).toBeInTheDocument();
  });

  it('reports only the missing Profile Type, not the Group, when it is blank', async () => {
    await uploadRows([
      client(1, 'Jane', 'Doe', 'jane@example.com'),
      client(1, 'Ann', 'Lee', 'ann@example.com', { 'Profile Type': '' }),
    ]);
    expect(screen.getByText('Required fields missing')).toBeInTheDocument();
    expect(screen.getByText('Total errors: 1')).toBeInTheDocument();
  });

  it('does not check the Corporate Name of a row whose Group # is not valid', async () => {
    await uploadRows([client(1, 'Jane', 'Doe', 'jane@example.com', { 'Group #': 'abc', 'Corporate Name': 'Acme' })]);
    expect(screen.getByText('Group # must be a whole number of 1 or more.')).toBeInTheDocument();
    expect(screen.queryByText(LEISURE_CORPORATE_RULE)).not.toBeInTheDocument();
    expect(screen.getByText('Total errors: 1')).toBeInTheDocument();
  });

  it('does not check the Corporate Name of a row whose Profile Type is not valid', async () => {
    await uploadRows([
      client(1, 'Jane', 'Doe', 'jane@example.com', { 'Profile Type': 'X', 'Corporate Name': 'Acme' }),
      client(1, 'John', 'Doe', 'john@example.com', {
        'Relationship to Client': 'Spouse',
        'Profile Type': 'X',
        'Corporate Name': 'Acme',
      }),
    ]);
    expect(screen.queryByText(COMPANION_CORPORATE_RULE)).not.toBeInTheDocument();
    expect(screen.queryByText(LEISURE_CORPORATE_RULE)).not.toBeInTheDocument();
  });
});

describe('Corporate Name', () => {
  it('reports a Corporate Client row with no Corporate Name', async () => {
    const { create } = await uploadRows([client(1, 'Jane', 'Doe', 'jane@example.com', { 'Profile Type': 'C' })]);
    expect(screen.getByText(/Step 2 of 5: File check/)).toBeInTheDocument();
    expect(screen.getByText(CORPORATE_REQUIRED_RULE)).toBeInTheDocument();
    expect(screen.getByText('Row 2')).toBeInTheDocument();
    expect(create).not.toHaveBeenCalled();
  });

  it('accepts a Corporate Client row with only a Corporate Name, showing it in the Review', async () => {
    await uploadRows([
      client(1, '', '', 'acme@example.com', { 'Profile Type': 'C', 'Corporate Name': 'Acme' }),
      companion(1, 'John', 'john@example.com', 'C'),
    ]);
    expectReachedReview();
    const [first] = within(screen.getByRole('table')).getAllByRole('row').slice(1);
    expect(
      within(first)
        .getAllByRole('cell')
        .map((c) => c.textContent),
    ).toEqual(['1', '1', '', 'Acme', '', '', 'acme@example.com']);
  });

  it("still requires First Name and Last Name on a Corporate Client's Companions", async () => {
    await uploadRows([
      corporate(1, 'Jane', 'jane@example.com'),
      client(1, '', '', 'john@example.com', { 'Relationship to Client': 'Spouse', 'Profile Type': 'C' }),
    ]);
    expect(screen.getByText('Required fields missing')).toBeInTheDocument();
    expect(screen.getByText('Row 3: First Name')).toBeInTheDocument();
    expect(screen.getByText('Row 3: Last Name')).toBeInTheDocument();
  });

  it('reports only the missing Corporate Name when a Corporate Client row has no names either', async () => {
    await uploadRows([client(1, '', '', 'acme@example.com', { 'Profile Type': 'C' })]);
    expect(screen.getByText(CORPORATE_REQUIRED_RULE)).toBeInTheDocument();
    expect(screen.queryByText('Required fields missing')).not.toBeInTheDocument();
    expect(screen.getByText('Total errors: 1')).toBeInTheDocument();
  });

  it('still requires First Name and Last Name on a Leisure Client row', async () => {
    await uploadRows([client(1, '', '', 'jane@example.com')]);
    expect(screen.getByText('Row 2: First Name')).toBeInTheDocument();
    expect(screen.getByText('Row 2: Last Name')).toBeInTheDocument();
  });

  it("does not need a Corporate Name on a Corporate Client's Companions", async () => {
    await uploadRows([corporate(1, 'Jane', 'jane@example.com'), companion(1, 'John', 'john@example.com', 'C')]);
    expectReachedReview();
  });

  it('reports a Companion row with a Corporate Name', async () => {
    await uploadRows([
      corporate(1, 'Jane', 'jane@example.com'),
      client(1, 'John', 'Doe', 'john@example.com', {
        'Relationship to Client': 'Spouse',
        'Profile Type': 'C',
        'Corporate Name': 'Acme',
      }),
    ]);
    expect(screen.getByText(COMPANION_CORPORATE_RULE)).toBeInTheDocument();
    expect(screen.getByText('Row 3: “Acme”')).toBeInTheDocument();
  });

  it('reports a Leisure Client row with a Corporate Name', async () => {
    await uploadRows([client(1, 'Jane', 'Doe', 'jane@example.com', { 'Corporate Name': 'Acme' })]);
    expect(screen.getByText(LEISURE_CORPORATE_RULE)).toBeInTheDocument();
    expect(screen.getByText('Row 2: “Acme”')).toBeInTheDocument();
  });

  it('accepts a Corporate Name of 20 characters and reports one of 21', async () => {
    await uploadRows([
      client(1, 'Jane', 'Doe', 'jane@example.com', { 'Profile Type': 'C', 'Corporate Name': 'A'.repeat(20) }),
    ]);
    expectReachedReview();
  });

  it.each(['A'.repeat(21), 'Acme 2000', 'Acme & Sons'])('reports a Corporate Name of %s', async (name) => {
    await uploadRows([client(1, 'Jane', 'Doe', 'jane@example.com', { 'Profile Type': 'C', 'Corporate Name': name })]);
    expect(screen.getByText(/Step 3 of 5: Format check/)).toBeInTheDocument();
    expect(screen.getByText(CORPORATE_NAME_RULE)).toBeInTheDocument();
    expect(screen.getByText(`Row 2: “${name}”`)).toBeInTheDocument();
  });
});
