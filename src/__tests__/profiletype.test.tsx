import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createFakeService } from '../test/fakes';
import { addFile, advance, client, csvFile, HEADER, openAsSarah } from '../test/flows';
import { renderClientsPage } from '../test/render';

afterEach(() => {
  vi.useRealTimers();
});

/** Uploads `lines` for Sarah Brown and lets both checks finish. */
async function uploadAndCheck(lines: string[]) {
  const create = vi.fn(async () => ({ created: 0, failed: [] }));
  const view = renderClientsPage({ service: createFakeService({ create }) });
  await openAsSarah(view.user);
  await addFile(view.user, csvFile([HEADER, ...lines]));
  await view.user.click(screen.getByRole('button', { name: 'Continue' }));
  await advance(1700); // File check
  await advance(2800); // Format check
  return { ...view, create };
}

const expectPassed = () => {
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(screen.getByText(/Step 4 of 5/)).toBeInTheDocument();
};

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
    await uploadAndCheck([
      client(1, 'Jane', 'Doe', 'jane@example.com', { 'Profile Type': 'l' }),
      client(2, 'Bob', 'Ray', 'bob@example.com', { 'Profile Type': 'c', 'Corporate Name': 'Acme' }),
      companion(2, 'Kim', 'kim@example.com', 'C'),
    ]);
    expectPassed();
  });

  it('reports a Profile Type other than L or C', async () => {
    await uploadAndCheck([client(1, 'Jane', 'Doe', 'jane@example.com', { 'Profile Type': 'Leisure' })]);
    expect(screen.getByText(/Step 3 of 5: Format check/)).toBeInTheDocument();
    expect(screen.getByText(PROFILE_TYPE_RULE)).toBeInTheDocument();
    expect(screen.getByText('Row 2: “Leisure”')).toBeInTheDocument();
  });

  it("reports only the Companion rows whose Profile Type differs from their Client's", async () => {
    await uploadAndCheck([
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
    await uploadAndCheck([
      client(1, 'Jane', 'Doe', 'jane@example.com'),
      corporate(1, 'Ann', 'ann@example.com'),
      companion(1, 'John', 'john@example.com', 'C'),
    ]);
    expect(screen.getByText('Each Group must have only one Client.')).toBeInTheDocument();
    expect(screen.queryByText(MATCH_RULE)).not.toBeInTheDocument();
  });
});

describe('Corporate Name', () => {
  it('reports a Corporate Client row with no Corporate Name', async () => {
    const { create } = await uploadAndCheck([client(1, 'Jane', 'Doe', 'jane@example.com', { 'Profile Type': 'C' })]);
    expect(screen.getByText(/Step 2 of 5: File check/)).toBeInTheDocument();
    expect(screen.getByText(CORPORATE_REQUIRED_RULE)).toBeInTheDocument();
    expect(screen.getByText('Row 2')).toBeInTheDocument();
    expect(create).not.toHaveBeenCalled();
  });

  it("does not need a Corporate Name on a Corporate Client's Companions", async () => {
    await uploadAndCheck([corporate(1, 'Jane', 'jane@example.com'), companion(1, 'John', 'john@example.com', 'C')]);
    expectPassed();
  });

  it('reports a Companion row with a Corporate Name', async () => {
    await uploadAndCheck([
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
    await uploadAndCheck([client(1, 'Jane', 'Doe', 'jane@example.com', { 'Corporate Name': 'Acme' })]);
    expect(screen.getByText(LEISURE_CORPORATE_RULE)).toBeInTheDocument();
    expect(screen.getByText('Row 2: “Acme”')).toBeInTheDocument();
  });

  it('accepts a Corporate Name of 20 characters and reports one of 21', async () => {
    await uploadAndCheck([
      client(1, 'Jane', 'Doe', 'jane@example.com', { 'Profile Type': 'C', 'Corporate Name': 'A'.repeat(20) }),
    ]);
    expectPassed();
  });

  it.each(['A'.repeat(21), 'Acme 2000', 'Acme & Sons'])('reports a Corporate Name of %s', async (name) => {
    await uploadAndCheck([
      client(1, 'Jane', 'Doe', 'jane@example.com', { 'Profile Type': 'C', 'Corporate Name': name }),
    ]);
    expect(screen.getByText(/Step 3 of 5: Format check/)).toBeInTheDocument();
    expect(screen.getByText(CORPORATE_NAME_RULE)).toBeInTheDocument();
    expect(screen.getByText(`Row 2: “${name}”`)).toBeInTheDocument();
  });
});
