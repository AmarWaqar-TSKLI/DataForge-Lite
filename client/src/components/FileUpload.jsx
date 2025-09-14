
import React, { useRef, useState } from 'react';
import API from '../api';

const ACCEPTED = ['.csv', '.xlsx', '.json'];

const FileUpload = ({ onUpload }) => {
  const inputRef = useRef();
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFile = async (file) => {
    setError(null);
    if (!file) return;
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!ACCEPTED.includes(ext)) {
      setError('Only .csv, .xlsx, .json files are allowed.');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('File too large (max 20MB).');
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await API.post('/upload', fd);
      if (onUpload) onUpload(res.data);
    } catch (e) {
      setError(e?.response?.data?.detail || 'Upload failed.');
    } finally {
      setLoading(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const onChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      <div
        className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center transition-all duration-200 shadow-card bg-surface/80 hover:shadow-lg cursor-pointer relative
          ${dragActive ? 'border-primary bg-primary/10' : 'border-border bg-background/80'}`}
        onDragOver={e => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={e => { e.preventDefault(); setDragActive(false); }}
        onDrop={onDrop}
        onClick={() => !loading && inputRef.current?.click()}
        style={{ cursor: loading ? 'not-allowed' : 'pointer', minHeight: 200 }}
        tabIndex={0}
        role="button"
        aria-label="Upload file"
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(',')}
          className="hidden"
          onChange={onChange}
          disabled={loading}
        />
        <div className="flex flex-col items-center gap-3">
          <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 8v8m0 0-3-3m3 3 3-3"/></svg>
          </span>
          <span className="text-lg font-bold text-primary">Upload your data file</span>
          <span className="text-sm text-muted">CSV, Excel, or JSON (max 20MB)</span>
          <span className="text-xs text-muted">Drag & drop or click to select</span>
        </div>
        {loading && <div className="absolute bottom-4 text-primary animate-pulse font-semibold">Uploading...</div>}
        {error && <div className="absolute bottom-4 text-error text-sm font-semibold">{error}</div>}
      </div>
    </div>
  );
};

export default FileUpload;
