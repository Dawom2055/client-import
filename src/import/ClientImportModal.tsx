import { useEffect, useRef, useState } from 'react';
import { AdvisorSearch } from './AdvisorSearch';
import { Dropzone } from './Dropzone';
import { ConfirmScreen, InvalidScreen, PartialScreen, RunningScreen, SuccessScreen } from './screens';
import type { Advisor, Check, CreateResult, ImportService, Phase, RuleError, ValidationResult } from './types';

interface Props {
  initialAdvisor: Advisor | null;
  service: ImportService;
  onClose: () => void;
}

const STEP: Record<Exclude<Phase, 'select' | 'invalid'>, { n: number; label: string }> = {
  file: { n: 2, label: 'File check' },
  format: { n: 3, label: 'Format check' },
  confirm: { n: 4, label: 'Confirm' },
  create: { n: 5, label: 'Finalize and upload' },
  success: { n: 5, label: 'Finalize and upload' },
  partial: { n: 5, label: 'Finalize and upload' },
};

const CHECK_STEP = { file: STEP.file, format: STEP.format } satisfies Record<Check, unknown>;

const RUN_MS: Partial<Record<Phase, number>> = { file: 1500, format: 2600, create: 2800 };
const RUN_TEXT: Partial<Record<Phase, string>> = {
  file: 'Checking the file…',
  format: 'Checking the format…',
  create: 'Creating clients…',
};

const TEMPLATE = 'First Name,Last Name,Email Address\n';

function downloadTemplate() {
  const url = URL.createObjectURL(new Blob([TEMPLATE], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'client-import-template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export function ClientImportModal({ initialAdvisor, service, onClose }: Props) {
  const [phase, setPhase] = useState<Phase>('select');
  const [advisor, setAdvisor] = useState<Advisor | null>(initialAdvisor);
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState(0);
  const [errors, setErrors] = useState<RuleError[]>([]);
  const [failedCheck, setFailedCheck] = useState<Check>('file');
  const [result, setResult] = useState<CreateResult | null>(null);
  const [pct, setPct] = useState(0);
  const dialog = useRef<HTMLDivElement>(null);
  const validation = useRef<Promise<ValidationResult> | null>(null);
  const creation = useRef<Promise<CreateResult> | null>(null);

  const closable = phase !== 'create';
  const close = () => closable && onClose();

  // Reset to the very beginning, as "Back to file upload" does.
  const reset = () => {
    setPhase('select');
    setAdvisor(initialAdvisor);
    setFile(null);
    setRows(0);
    setErrors([]);
    setResult(null);
  };

  useEffect(() => {
    dialog.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // Drives the three timed phases. Each advances once its bar is full and the service has answered.
  useEffect(() => {
    const duration = RUN_MS[phase];
    if (!duration) return;
    let cancelled = false;
    setPct(0);
    const start = Date.now();
    const id = setInterval(async () => {
      const p = Math.min(100, Math.round(((Date.now() - start) / duration) * 100));
      setPct(p);
      if (p < 100) return;
      clearInterval(id);
      if (phase === 'file' || phase === 'format') {
        const outcome = await validation.current!;
        if (cancelled) return;
        if (!outcome.ok && outcome.check === phase) {
          setErrors(outcome.errors);
          setFailedCheck(phase);
          setPhase('invalid');
        } else if (phase === 'file') {
          setPhase('format');
        } else {
          setRows(outcome.ok ? outcome.clients.length : 0);
          setPhase('confirm');
        }
      } else {
        const outcome = await creation.current!;
        if (cancelled) return;
        setResult(outcome);
        setPhase(outcome.failed.length > 0 ? 'partial' : 'success');
      }
    }, 100);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [phase]);

  const start = () => {
    if (!file) return;
    validation.current = service.validate(file);
    setPhase('file');
  };

  const confirm = () => {
    if (!file || !advisor) return;
    creation.current = service.create(file, advisor, rows);
    setPhase('create');
  };

  const step = phase === 'select' ? null : phase === 'invalid' ? CHECK_STEP[failedCheck] : STEP[phase];
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
              aria-label="Import progress"
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
              onSearch={service.searchAdvisors}
              onChange={(a) => {
                setAdvisor(a);
                if (!a) setFile(null);
              }}
            />
            <div className="field">
              <span className="field-label">Clients</span>
              <p className="hint">Use the template for client names, contact details, and companions. One file covers both.</p>
              <button type="button" className="link-btn with-icon" onClick={downloadTemplate}>
                <span aria-hidden>⤓</span> Download Import Template
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

        {(phase === 'file' || phase === 'format' || phase === 'create') && <RunningScreen message={RUN_TEXT[phase]!} />}

        {phase === 'confirm' && advisor && (
          <ConfirmScreen rows={rows} advisorName={advisor.name} onCancel={onClose} onConfirm={confirm} />
        )}

        {phase === 'invalid' && <InvalidScreen errors={errors} onBack={reset} />}
        {phase === 'success' && result && <SuccessScreen created={result.created} onBack={reset} onDone={onClose} />}
        {phase === 'partial' && result && (
          <PartialScreen
            total={result.created + result.failed.length}
            created={result.created}
            failed={result.failed}
            onBack={reset}
            onDone={onClose}
          />
        )}
      </div>
    </div>
  );
}
