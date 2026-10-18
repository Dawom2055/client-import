import { useState } from 'react';
import type { FailedRecord, RuleError } from './types';

const PREVIEW_ROWS = 10;

export function RunningScreen({ message }: { message: string }) {
  return (
    <div className="status-line" role="status">
      <span className="spinner big" aria-hidden />
      <span>{message}</span>
    </div>
  );
}

export function ConfirmScreen({
  rows,
  advisorName,
  onCancel,
  onConfirm,
}: {
  rows: number;
  advisorName: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const noun = rows === 1 ? 'client' : 'clients';
  return (
    <>
      <div className="status-line ok">
        <span className="badge ok" aria-hidden>✓</span>
        <h3>Your file passed validation</h3>
      </div>
      <p>
        Create {rows} {noun} for <strong>{advisorName}</strong>?
      </p>
      <div className="actions">
        <button type="button" className="btn btn-text" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="btn btn-primary" onClick={onConfirm}>
          Create {rows} {noun}
        </button>
      </div>
    </>
  );
}

function ErrorGroup({ error }: { error: RuleError }) {
  const [all, setAll] = useState(false);
  const shown = all ? error.rows : error.rows.slice(0, PREVIEW_ROWS);
  const hidden = error.rows.length - shown.length;
  return (
    <div className="rule-error">
      <p className="rule">{error.rule}</p>
      <ul>
        {shown.map((r) => (
          <li key={r.row}>
            <em>Row {r.row}</em>
            {r.value ? <>: “{r.value}”</> : null}
          </li>
        ))}
      </ul>
      {hidden > 0 && (
        <button type="button" className="link-btn" onClick={() => setAll(true)}>
          Show {hidden} more {hidden === 1 ? 'row' : 'rows'}
        </button>
      )}
    </div>
  );
}

export function InvalidScreen({ errors, onBack }: { errors: RuleError[]; onBack: () => void }) {
  const total = errors.reduce((n, e) => n + e.rows.length, 0);
  return (
    <>
      <div className="status-line danger" role="alert">
        <span className="badge danger" aria-hidden>!</span>
        <h3>
          Validation failed: {total} {total === 1 ? 'issue' : 'issues'} found in your file
        </h3>
      </div>
      <div className="panel">
        <strong>Total errors: {total}</strong>
        {errors.map((e) => (
          <ErrorGroup key={e.rule} error={e} />
        ))}
      </div>
      <p>Correct these rows in your file and upload it again. Nothing was created.</p>
      <div className="actions">
        <button type="button" className="btn btn-primary" onClick={onBack}>
          Back to file upload
        </button>
      </div>
    </>
  );
}

export function SuccessScreen({ created, onBack, onDone }: { created: number; onBack: () => void; onDone: () => void }) {
  return (
    <>
      <div className="status-line ok">
        <span className="badge ok" aria-hidden>✓</span>
        <h3>Success! Client import completed</h3>
      </div>
      <p>
        A total of {created} {created === 1 ? 'client' : 'clients'} and their companions have been successfully created.
      </p>
      <div className="actions push-down">
        <button type="button" className="btn btn-text" onClick={onBack}>
          Back to file upload
        </button>
        <button type="button" className="btn btn-primary" onClick={onDone}>
          Done
        </button>
      </div>
    </>
  );
}

export function PartialScreen({
  total,
  created,
  failed,
  onBack,
  onDone,
}: {
  total: number;
  created: number;
  failed: FailedRecord[];
  onBack: () => void;
  onDone: () => void;
}) {
  return (
    <>
      <div className="status-line warn" role="alert">
        <span className="badge warn" aria-hidden>!</span>
        <h3>Partial success! Some client profiles could not be created</h3>
      </div>
      <p>
        Out of {total} client profiles, {created} were successfully created. {failed.length} failed due to system errors.
      </p>
      <div className="panel">
        <strong>Failed records</strong>
        <ol className="failed-list">
          {failed.map((f) => (
            <li key={f.row}>
              <span>
                Row {f.row} · {f.name}
              </span>
              <span className="reason">{f.reason}</span>
            </li>
          ))}
        </ol>
      </div>
      <p>
        The created clients were kept. Add the failed rows to a new file and try again. If the issue persists,{' '}
        <a href="#support" className="link-strong">
          please contact support for assistance.
        </a>
      </p>
      <div className="actions">
        <button type="button" className="btn btn-text" onClick={onBack}>
          Back to file upload
        </button>
        <button type="button" className="btn btn-primary" onClick={onDone}>
          Done
        </button>
      </div>
    </>
  );
}
