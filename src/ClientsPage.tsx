import { useState } from 'react';
import { ClientImportModal } from './import/ClientImportModal';
import type { Advisor, ImportService } from './import/types';

export type Role = 'admin' | 'other';

interface Props {
  /** Only admins on the Operations team can use Client Import at the MVP. */
  role: Role;
  service: ImportService;
  /** Advisors the user can act as; used by "Using ADX as". */
  advisors: Advisor[];
}

export function ClientsPage({ role, service, advisors }: Props) {
  const [open, setOpen] = useState(false);
  const [actingAs, setActingAs] = useState('me');

  const initialAdvisor = advisors.find((a) => a.id === actingAs) ?? null;

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
            <button type="button" className="pill" onClick={() => setOpen(true)}>
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
            {advisors.map((a) => (
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

      {open && <ClientImportModal initialAdvisor={initialAdvisor} service={service} onClose={() => setOpen(false)} />}
    </>
  );
}
