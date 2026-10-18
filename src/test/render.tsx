import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { ClientsPage, type Role } from '../ClientsPage';
import type { ImportService } from '../import/types';
import { createFakeService, FAKE_ADVISORS } from './fakes';

interface Options {
  role?: Role;
  service?: ImportService;
}

/** Renders the Clients page with fake timers so timed import steps can be advanced by hand. */
export function renderClientsPage({ role = 'admin', service = createFakeService() }: Options = {}) {
  vi.useFakeTimers({ shouldAdvanceTime: false });
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime, applyAccept: false });
  const view = render(<ClientsPage role={role} service={service} advisors={FAKE_ADVISORS} />);
  return { user, ...view };
}
