import { useRef, useState } from 'react';
import { checkFile } from './fileRules';

interface Props {
  disabled: boolean;
  file: File | null;
  onFile: (file: File | null) => void;
}

export function Dropzone({ disabled, file, onFile }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accept = (f: File | undefined) => {
    if (!f) return;
    const problem = checkFile(f);
    setError(problem);
    onFile(problem ? null : f);
  };

  if (disabled) {
    return (
      <div className="dropzone disabled">
        <span className="dz-icon" aria-hidden>⇪</span>
        <strong>File upload is disabled until an advisor is selected</strong>
        <p>Choose an advisor from the Advisor search field above to enable the upload area and continue with your client file.</p>
      </div>
    );
  }

  return (
    <div
      className={`dropzone${dragging ? ' dragging' : ''}${file ? ' added' : ''}${error ? ' invalid' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        accept(e.dataTransfer.files[0]);
      }}
    >
      <input
        ref={input}
        type="file"
        accept=".csv,text/csv"
        hidden
        onChange={(e) => {
          accept(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      <span className="dz-icon" aria-hidden>⇪</span>
      {file ? (
        <>
          <strong>{file.name} added</strong>
          <p>Ready to import</p>
          <button type="button" className="btn btn-outline" onClick={() => input.current?.click()}>
            Replace file
          </button>
        </>
      ) : (
        <>
          <strong>Drag and drop your CSV file here</strong>
          <p>or</p>
          <button type="button" className="btn btn-outline" onClick={() => input.current?.click()}>
            Browse files
          </button>
        </>
      )}
      {error && (
        <p className="dz-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
