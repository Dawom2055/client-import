import { useMemo, useRef, useState } from 'react';
import { ClientsPage, type Role } from './ClientsPage';
import { ADVISORS, createMockImportService } from './import/mockApi';
import type { Scenario } from './import/types';

const SCENARIOS: { value: Scenario; label: string }[] = [
  { value: 'auto', label: 'By filename (partial… / else success)' },
  { value: 'success', label: 'Success' },
  { value: 'partial', label: 'Partial success' },
];

export function App() {
  const [role, setRole] = useState<Role>('admin');
  const [scenario, setScenario] = useState<Scenario>('auto');
  const scenarioRef = useRef(scenario);
  scenarioRef.current = scenario;
  const service = useMemo(() => createMockImportService(() => scenarioRef.current), []);

  return (
    <>
      <ClientsPage role={role} service={service} advisors={ADVISORS} />

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
    </>
  );
}
