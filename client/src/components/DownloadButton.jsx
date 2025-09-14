
import React, { useRef } from 'react';
import API from '../api';
import { useData } from '../context.jsx';
import * as htmlToImage from 'html-to-image';

const DownloadButton = ({ chartRef, chartData }) => {
  const { datasetId } = useData();
  const [format, setFormat] = React.useState('csv');
  const [statsFormat, setStatsFormat] = React.useState('csv');
  const [downloading, setDownloading] = React.useState(false);
  const [downloadingStats, setDownloadingStats] = React.useState(false);
  const [error, setError] = React.useState(null);
  const handleStatsDownload = async () => {
    setError(null);
    setDownloadingStats(true);
    try {
      const res = await API.get(`/download_stats/${datasetId}?format=${statsFormat}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `dataforge_stats_${datasetId}.${statsFormat}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      setError('Stats download failed.');
    } finally {
      setDownloadingStats(false);
    }
  };

  const handleDownload = async () => {
    setError(null);
    setDownloading(true);
    try {
      const res = await API.get(`/download/${datasetId}?format=${format}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `dataforge_${datasetId}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      setError('Download failed.');
    } finally {
      setDownloading(false);
    }
  };

  const handleChartDownload = async () => {
    if (!chartRef?.current) return;
    setError(null);
    setDownloading(true);
    try {
      const dataUrl = await htmlToImage.toPng(chartRef.current);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.setAttribute('download', 'chart.png');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      setError('Chart export failed.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 mt-4">
      <div className="flex gap-2 items-center flex-wrap">
        <div className="flex gap-2 items-center">
          <select value={format} onChange={e => setFormat(e.target.value)} className="bg-white text-black border border-border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary/60">
            <option value="csv">CSV</option>
            <option value="xlsx">XLSX</option>
            <option value="json">JSON</option>
          </select>
          <button
            className="px-4 py-2 rounded-xl bg-primary text-white font-semibold shadow-button hover:bg-accent hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary/60"
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading ? 'Downloading...' : 'Download Data'}
          </button>
        </div>
        <div className="flex gap-2 items-center">
          <select value={statsFormat} onChange={e => setStatsFormat(e.target.value)} className="bg-white text-black border border-border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary/60">
            <option value="csv">CSV</option>
            <option value="xlsx">XLSX</option>
            <option value="json">JSON</option>
          </select>
          <button
            className="px-4 py-2 rounded-xl bg-secondary text-white font-semibold shadow-button hover:bg-accent hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-secondary/60"
            onClick={handleStatsDownload}
            disabled={downloadingStats}
          >
            {downloadingStats ? 'Downloading...' : 'Download Summary Stats'}
          </button>
        </div>
        {chartRef && (
          <button
            className="px-4 py-2 rounded-xl bg-surface border border-primary text-primary font-semibold shadow-button hover:bg-primary hover:text-white hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary/60"
            onClick={handleChartDownload}
            disabled={downloading}
          >
            {downloading ? 'Exporting...' : 'Export Chart PNG'}
          </button>
        )}
      </div>
      {error && <div className="text-error text-sm">{error}</div>}
    </div>
  );
};

export default DownloadButton;
