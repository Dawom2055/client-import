import { useEffect, useId, useRef, useState } from 'react';
import type { Advisor } from './types';

interface Props {
  value: Advisor | null;
  onChange: (advisor: Advisor | null) => void;
  onSearch: (query: string) => Promise<Advisor[]>;
}

type Status = 'idle' | 'loading' | 'ready' | 'error';
const MIN_CHARS = 2;

export function AdvisorSearch({ value, onChange, onSearch }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Advisor[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const requestId = useRef(0);
  const listId = useId();

  const run = async (q: string) => {
    if (q.trim().length < MIN_CHARS) {
      setStatus('idle');
      setOpen(false);
      return;
    }
    const id = ++requestId.current;
    setStatus('loading');
    setOpen(true);
    try {
      const found = await onSearch(q);
      if (id !== requestId.current) return;
      setResults(found);
      setActive(0);
      setStatus('ready');
    } catch {
      if (id !== requestId.current) return;
      setStatus('error');
    }
  };

  useEffect(() => {
    if (value) return;
    const t = setTimeout(() => run(query), 250);
    return () => clearTimeout(t);
  }, [query, value]);

  const pick = (advisor: Advisor) => {
    onChange(advisor);
    setOpen(false);
    setQuery('');
  };

  const clear = () => {
    onChange(null);
    setResults([]);
    setStatus('idle');
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' && results.length) {
      e.preventDefault();
      setActive((i) => (i + 1) % results.length);
    } else if (e.key === 'ArrowUp' && results.length) {
      e.preventDefault();
      setActive((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (open && status === 'ready' && results[active]) pick(results[active]);
      else run(query);
    } else if (e.key === 'Escape' && open) {
      e.stopPropagation();
      setOpen(false);
    }
  };

  return (
    <div className="field">
      <label className="field-label" htmlFor="advisor-search">
        Advisor search
      </label>
      <div className="search-row">
        <div className={`search-box${value ? ' has-value' : ''}`}>
          {value ? (
            <>
              <span className="avatar">{value.name[0]}</span>
              <span className="chip-text">
                <strong>{value.name}</strong>
                <small>{value.office}</small>
              </span>
              <button type="button" className="icon-btn" aria-label="Clear advisor" onClick={clear}>
                ✕
              </button>
            </>
          ) : (
            <>
              <span className="search-icon" aria-hidden>
                ⌕
              </span>
              <input
                id="advisor-search"
                role="combobox"
                aria-expanded={open}
                aria-controls={listId}
                aria-activedescendant={open && status === 'ready' && results[active] ? `${listId}-${active}` : undefined}
                autoComplete="off"
                placeholder="Enter advisor name"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
              />
            </>
          )}
        </div>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!!value || query.trim().length < MIN_CHARS}
          onClick={() => run(query)}
        >
          Search
        </button>
      </div>
      <p className="hint">Required. Start typing to select the advisor who will own these imported records.</p>

      {open && !value && (
        <div className="dropdown" id={listId} role="listbox" aria-label="Advisors">
          {status === 'loading' && (
            <div className="dropdown-note" role="status">
              <span className="spinner" aria-hidden /> Searching advisors…
            </div>
          )}
          {status === 'error' && (
            <div className="dropdown-note error" role="alert">
              Couldn’t load advisors.
              <button type="button" className="link-btn" onClick={() => run(query)}>
                Retry
              </button>
            </div>
          )}
          {status === 'ready' && results.length === 0 && <div className="dropdown-note">No advisors found</div>}
          {status === 'ready' &&
            results.map((a, i) => (
              <div
                key={a.id}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                className={`option${i === active ? ' active' : ''}`}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(a);
                }}
              >
                <span className="avatar">{a.name[0]}</span>
                <div>
                  <strong>{a.name}</strong>
                  <div className="option-meta">{a.email}</div>
                  <div className="option-meta">{a.office}</div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
