import { useEffect, useRef, useState } from 'react';
import { AdvisorSearch } from './AdvisorSearch';
import { Dropzone } from './Dropzone';
import { countRows, resolveOutcome } from './mockApi';
import { ConfirmScreen, InvalidScreen, PartialScreen, RunningScreen, SuccessScreen } from './screens';
import type { Advisor, Outcome, Phase, Scenario } from './types';

interface Props {
  initialAdvisor: Advisor | null;
  scenario: Scenario;
  onClose: () => void;
}

const STEP: Record<Exclude<Phase, 'select'>, { n: number; label: string }> = {
  format: { n: 2, label: 'File format check' },
  external: { n: 3, label: 'External data validation' },
  confirm: { n: 4, label: 'Confirm' },
  create: { n: 5, label: 'Finalize and upload' },
  invalid: { n: 3, label: 'External data validation' },
  success: { n: 5, label: 'Finalize and upload' },
  partial: { n: 5, label: 'Finalize and upload' },
};

const RUN_MS: Partial<Record<Phase, number>> = { format: 1500, external: 2600, create: 2800 };
const RUN_TEXT: Partial<Record<Phase, string>> = {
  format: 'Checking the file format…',
  external: 'Checking for conflicting data…',
  create: 'Creating clients…',
};

const TEMPLATE = 'First name,Last name,Email\n';

function downloadTemplate() {
  const url = URL.createObjectURL(new Blob([TEMPLATE], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'client-import-template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export function ClientImportModal({ initialAdvisor, scenario, onClose }: Props) {
  const [phase, setPhase] = useState<Phase>('select');
  const [advisor, setAdvisor] = useState<Advisor | null>(initialAdvisor);
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState(0);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [pct, setPct] = useState(0);
  const dialog = useRef<HTMLDivElement>(null);

  const closable = phase !== 'create';
  const close = () => closable && onClose();

  // Reset to the very beginning, as "Back to file upload" does.
  const reset = () => {
    setPhase('select');
    setAdvisor(initialAdvisor);
    setFile(null);
    setRows(0);
    setOutcome(null);
  };

  useEffect(() => {
    dialog.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // Drives the three timed phases; each one advances when its bar fills.
  useEffect(() => {
    const duration = RUN_MS[phase];
    if (!duration) return;
    setPct(0);
    const start = Date.now();
    const id = setInterval(() => {
      const p = Math.min(100, Math.round(((Date.now() - start) / duration) * 100));
      setPct(p);
      if (p < 100) return;
      clearInterval(id);
      if (phase === 'format') setPhase('external');
      else if (phase === 'external') setPhase(outcome?.kind === 'invalid' ? 'invalid' : 'confirm');
      else setPhase(outcome?.kind === 'partial' ? 'partial' : 'success');
    }, 100);
    return () => clearInterval(id);
  }, [phase]);

  const start = async () => {
    if (!file) return;
    const n = await countRows(file);
    setRows(n);
    setOutcome(resolveOutcome(file, n, scenario));
    setPhase('format');
  };

  const step = phase === 'select' ? null : STEP[phase];
  const done = step ? step.n - 1 : 0;
  const fill =
    phase === 'success' || phase === 'partial'
      ? 100
      : phase === 'invalid' || phase === 'confirm'
        ? (done / 5) * 100
        : (done / 5) * 100 + pct / 5;
  const tone = phase === 'invalid' ? 'danger' : phase === 'partial' ? 'warn' : 'ok';

  return (
    <div className="overlay">
      <div ref={dialog} className="modal" role="dialog" aria-modal="true" aria-labelledby="ci-title" tabIndex={-1}>
        <header className="modal-head">
          <h2 id="ci-title">Client Import</h2>
          <button
            type="button"
            className="icon-btn"
            aria-label="Close"
            disabled={!closable}
            title={closable ? undefined : 'Creating clients, please wait'}
            onClick={close}
          >
            ✕
          </button>
        </header>

        {step && (
          <div className="stepper">
            <p className="step-label">
              Step {step.n} of 5: {step.label}
              {RUN_MS[phase] ? ` (${pct}% complete)` : ''}
            </p>
            <div
              className={`bar ${tone}`}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(fill)}
            >
              <div style={{ width: `${fill}%` }} />
            </div>
          </div>
        )}

        {phase === 'select' && (
          <>
            <h3 className="modal-title">Upload your Client File</h3>
            <p>Choose the advisor, download the template, and upload your file. Make sure the file includes all required fields before continuing.</p>
            <AdvisorSearch
              value={advisor}
              onChange={(a) => {
                setAdvisor(a);
                if (!a) setFile(null);
              }}
            />
            <div className="field">
              <span className="field-label">Clients</span>
              <p className="hint">Use the template for client names, contact details, and companions. One file covers both.</p>
              <button type="button" className="link-btn with-icon" onClick={downloadTemplate}>
                ⤓ Download Import Template
              </button>
            </div>
            <Dropzone disabled={!advisor} file={file} onFile={setFile} />
            <div className="actions">
              <button type="button" className="btn btn-text" onClick={onClose}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" disabled={!advisor || !file} onClick={start}>
                Continue
              </button>
            </div>
          </>
        )}

        {(phase === 'format' || phase === 'external' || phase === 'create') && <RunningScreen message={RUN_TEXT[phase]!} />}

        {phase === 'confirm' && advisor && (
          <ConfirmScreen rows={rows} advisorName={advisor.name} onCancel={onClose} onConfirm={() => setPhase('create')} />
        )}

        {phase === 'invalid' && outcome?.kind === 'invalid' && <InvalidScreen errors={outcome.errors} onBack={reset} />}
        {phase === 'success' && outcome?.kind === 'success' && (
          <SuccessScreen created={outcome.created} onBack={reset} onDone={onClose} />
        )}
        {phase === 'partial' && outcome?.kind === 'partial' && (
          <PartialScreen
            total={outcome.total}
            created={outcome.created}
            failed={outcome.failed}
            onBack={reset}
            onDone={onClose}
          />
        )}
      </div>
    </div>
  );
}
