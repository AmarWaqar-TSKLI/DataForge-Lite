
import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../context.jsx';
import ChartViewer from '../components/ChartViewer';
import DownloadButton from '../components/DownloadButton';
import API from '../api';

const chartTypes = [
  { value: 'bar', label: 'Bar' },
  { value: 'line', label: 'Line' },
  { value: 'pie', label: 'Pie' },
  { value: 'scatter', label: 'Scatter' },
  { value: 'histogram', label: 'Histogram' },
];

const Visualize = () => {
  const { datasetId, columns, preview } = useData();

  // Restore: get column types and unique counts from preview data
  const columnInfo = React.useMemo(() => {
    const info = {};
    if (!preview || preview.length === 0) return info;
    columns.forEach(col => {
      const values = preview.map(row => row[col]);
      const unique = new Set(values.filter(v => v !== null && v !== undefined && v !== ''));
      const firstNonNull = values.find(v => v !== null && v !== undefined && v !== '');
      let type = 'string';
      if (typeof firstNonNull === 'number') type = 'number';
      else if (!isNaN(Date.parse(firstNonNull))) type = 'date';
      info[col] = { type, uniqueCount: unique.size };
    });
    return info;
  }, [columns, preview]);
  const [type, setType] = useState('bar');
  const [x, setX] = useState('');
  const [y, setY] = useState('');
  const [agg, setAgg] = useState('sum');
  const [topN, setTopN] = useState(10);
  const [bins, setBins] = useState(10); // Add bins state for histogram
  const [chart, setChart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const chartRef = useRef();

  const handleRender = async () => {
    setError(null);
    // Frontend validation for bar/line/histogram
    if (["bar","line","histogram"].includes(type)) {
      if (x && columnInfo[x]?.type === 'number' && columnInfo[x].uniqueCount > 20) {
        setError('X axis should be a categorical or discrete field (not a numeric field with many unique values).');
        return;
      }
      if (y && columnInfo[y]?.type !== 'number') {
        setError('Y axis should be a numeric field for aggregation.');
        return;
      }
    }
    setLoading(true);
    try {
      const chart_spec = { type, x, y, agg, top_n: topN };
      if (type === 'histogram') chart_spec.bins = bins;
      const res = await API.post('/visualize', { dataset_id: datasetId, chart_spec });
      setChart(res.data.chart);
    } catch (e) {
      setError(e?.response?.data?.detail || 'Chart rendering failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] py-8 px-2 gap-8">
      <div className="w-full max-w-4xl bg-surface/90 rounded-2xl shadow-card border border-border p-8 flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <h3 className="text-3xl font-extrabold text-primary mb-2 tracking-tight drop-shadow">Visualization Dashboard</h3>
          <div className="flex flex-wrap gap-4 items-end">
            <label>
              <span className="block text-sm mb-1">Chart Type</span>
              <select value={type} onChange={e => setType(e.target.value)} className="bg-white text-black border border-border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary/60">
                {chartTypes.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </label>
            <label>
              <span className="block text-sm mb-1">X</span>
              <select value={x} onChange={e => setX(e.target.value)} className="bg-white text-black border border-border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary/60">
                <option value="">—</option>
                {columns.map(col => <option key={col} value={col}>{col}</option>)}
              </select>
            </label>
            <label>
              <span className="block text-sm mb-1">Y</span>
              <select value={y} onChange={e => setY(e.target.value)} className="bg-white text-black border border-border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary/60">
                <option value="">—</option>
                {columns.map(col => <option key={col} value={col}>{col}</option>)}
              </select>
            </label>
            <label>
              <span className="block text-sm mb-1">Aggregation</span>
              <select value={agg} onChange={e => setAgg(e.target.value)} className="bg-white text-black border border-border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary/60">
                <option value="sum">Sum</option>
                <option value="mean">Mean</option>
                <option value="count">Count</option>
                <option value="min">Min</option>
                <option value="max">Max</option>
                <option value="none">None</option>
              </select>
            </label>
            {type !== 'histogram' && (
              <label>
                <span className="block text-sm mb-1">Top N</span>
                <input type="number" min={1} max={100} value={topN} onChange={e => setTopN(Number(e.target.value))} className="bg-white text-black border border-border rounded px-2 py-1 w-16 focus:outline-none focus:ring-2 focus:ring-primary/60" />
              </label>
            )}
            {type === 'histogram' && (
              <label>
                <span className="block text-sm mb-1">Bins</span>
                <input type="number" min={2} max={50} value={bins} onChange={e => setBins(Number(e.target.value))} className="bg-white text-black border border-border rounded px-2 py-1 w-16 focus:outline-none focus:ring-2 focus:ring-primary/60" />
              </label>
            )}
            <button
              className="px-4 py-2 rounded-xl bg-primary text-white font-semibold shadow-button hover:bg-accent hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary/60"
              onClick={handleRender}
              disabled={loading || !type || !x}
            >
              {loading ? 'Rendering...' : 'Render Chart'}
            </button>
          </div>
          {error && <div className="text-error mt-2 font-semibold">{error}</div>}
          {/* Show field info for user guidance */}
          <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted">
            {columns.map(col => (
              <span key={col} className="bg-surface border border-border rounded px-2 py-1">
                <b>{col}</b>: {columnInfo[col]?.type || 'unknown'} | unique: {columnInfo[col]?.uniqueCount ?? '?'}
              </span>
            ))}
          </div>
        </div>
        {chart && (
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-primary mb-2 tracking-tight drop-shadow">Chart</h3>
            <div ref={chartRef} className="bg-background rounded-lg">
              <ChartViewer chart={chart} />
            </div>
            <DownloadButton chartRef={chartRef} chartData={chart} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Visualize;
