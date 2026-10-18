import { useState } from 'react';
import { ClientImportModal } from './import/ClientImportModal';
import { ADVISORS } from './import/mockApi';
import type { Scenario } from './import/types';

type Role = 'admin' | 'other';

const SCENARIOS: { value: Scenario; label: string }[] = [
  { value: 'auto', label: 'By filename (bad… / partial… / else success)' },
  { value: 'success', label: 'Success' },
  { value: 'partial', label: 'Partial success' },
  { value: 'invalid', label: 'Validation failure' },
];

export function App() {
  const [open, setOpen] = useState(false);
  const [actingAs, setActingAs] = useState('me');
  const [role, setRole] = useState<Role>('admin');
  const [scenario, setScenario] = useState<Scenario>('auto');
  // Bumped on every open so the modal always starts from the beginning.
  const [session, setSession] = useState(0);

  const initialAdvisor = ADVISORS.find((a) => a.id === actingAs) ?? null;

  return (
    <>
      <header className="adx-nav">
        <strong className="logo">ADX</strong>
        <nav>
          <a href="#home">Home</a>
          <a href="#clients" className="current">
            Clients
          </a>
          <a href="#resources">Resources</a>
        </nav>
      </header>

      <div className="subbar">
        <div className="subbar-inner">
          <button type="button" className="pill">
            Create New Client
          </button>
          {role === 'admin' && (
            <button
              type="button"
              className="pill"
              onClick={() => {
                setSession((s) => s + 1);
                setOpen(true);
              }}
            >
              Client Import
            </button>
          )}
          <span className="spacer" />
          <button type="button" className="pill">
            View All Clients
          </button>
          <input className="client-search" placeholder="Client Name, Phone, or Email" aria-label="Client search" />
        </div>
      </div>

      <main className="page">
        <div className="acting">
          <label htmlFor="acting-as">Using ADX as</label>
          <select id="acting-as" value={actingAs} onChange={(e) => setActingAs(e.target.value)}>
            <option value="me">Me</option>
            {ADVISORS.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        <section className="card">
          <h2>My quotes &amp; bookings</h2>
          <p className="muted">Clients page placeholder. Open Client Import from the button above.</p>
        </section>
      </main>

      <aside className="dev-panel" aria-label="Prototype controls">
        <strong>Prototype controls</strong>
        <label>
          Role
          <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
            <option value="admin">Admin, TEN Operations</option>
            <option value="other">Any other role</option>
          </select>
        </label>
        <label>
          Next import result
          <select value={scenario} onChange={(e) => setScenario(e.target.value as Scenario)}>
            {SCENARIOS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <small>Type “error” in advisor search to see the lookup failure state.</small>
      </aside>

      {open && <ClientImportModal key={session} initialAdvisor={initialAdvisor} scenario={scenario} onClose={() => setOpen(false)} />}
    </>
  );
}
