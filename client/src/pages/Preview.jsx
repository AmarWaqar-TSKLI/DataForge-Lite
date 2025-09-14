
import React from 'react';
import { useData } from '../context.jsx';
import DataTable from '../components/DataTable';
import DownloadButton from '../components/DownloadButton';

const Preview = () => {
  const { preview, columns, datasetId } = useData();
  // Only show columns present in preview data (after transform)
  const previewColumns = React.useMemo(() => (preview && preview.length > 0 ? Object.keys(preview[0]) : []), [preview]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] py-8 px-2">
      <div className="w-full max-w-4xl bg-surface/90 rounded-2xl shadow-card border border-border p-8 flex flex-col gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-primary mb-2 tracking-tight drop-shadow">Dataset Preview</h2>
          <div className="text-sm text-muted mb-4">Dataset ID: <span className="text-text font-mono">{datasetId || '—'}</span></div>
        </div>
        <div className="w-full overflow-x-auto">
          <DataTable rows={preview} columns={previewColumns} pageSize={10} />
        </div>
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mt-2">
          <DownloadButton />
        </div>
        {!preview?.length && (
          <div className="text-error mt-4 text-center font-semibold">No preview data available. Please upload a file on the Home page.</div>
        )}
      </div>
    </div>
  );
};

export default Preview;
