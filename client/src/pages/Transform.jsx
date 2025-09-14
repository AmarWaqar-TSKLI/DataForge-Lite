
import React from 'react';
import TransformPanel from '../components/TransformPanel';
import DataTable from '../components/DataTable';
import DownloadButton from '../components/DownloadButton';
import { useData } from '../context.jsx';

const Transform = () => {
  const { preview } = useData();
  const [previewColumns, setPreviewColumns] = React.useState(preview && preview.length > 0 ? Object.keys(preview[0]) : []);
  React.useEffect(() => {
    if (preview && preview.length > 0) {
      setPreviewColumns(Object.keys(preview[0]));
    }
  }, [preview]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] py-8 px-2 gap-8">
      <div className="w-full max-w-4xl bg-surface/90 rounded-2xl shadow-card border border-border p-8 flex flex-col gap-8">
        <TransformPanel />
        <div>
          <h3 className="text-2xl font-extrabold text-primary mb-2 tracking-tight drop-shadow">Cleaned Data Preview</h3>
          <div className="w-full overflow-x-auto">
            <DataTable rows={preview} columns={previewColumns} pageSize={10} />
          </div>
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between mt-2">
            <DownloadButton />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Transform;
