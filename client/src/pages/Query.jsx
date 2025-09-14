
import React, { useState } from 'react';
import AIChat from '../components/AIChat';
import ChartViewer from '../components/ChartViewer';
import API from '../api';
import { useData } from '../context.jsx';

const Query = () => {
  const { datasetId } = useData();
  const [chartSpec, setChartSpec] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChartSuggestion = async (spec) => {
    setChartSpec(spec);
    setLoading(true);
    setError(null);
    try {
      const res = await API.post('/visualize', { dataset_id: datasetId, chart_spec: spec });
      setChartData(res.data.chart);
    } catch (e) {
      setError(e?.response?.data?.detail || 'Chart rendering failed.');
    } finally {
      setLoading(false);
    }
  };

  if (!datasetId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] py-8 px-2">
        <div className="w-full max-w-xl bg-surface/90 rounded-2xl shadow-card border border-error p-8 flex flex-col items-center gap-4 animate-fade-in">
          <div className="text-error text-2xl font-extrabold mb-2">No dataset loaded</div>
          <div className="text-muted text-base">Please upload a file on the Home page before asking AI questions.</div>
          <a href="/" className="mt-2 px-5 py-2 rounded-xl bg-primary text-white font-semibold shadow-button hover:bg-accent hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary/60">Go to Home</a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] py-8 px-2">
      <div className="w-full max-w-3xl bg-surface/90 rounded-2xl shadow-card border border-border p-8 flex flex-col gap-8">
        <AIChat onChartSuggestion={handleChartSuggestion} />
        {loading && <div className="text-primary animate-pulse font-semibold">Rendering chart...</div>}
        {error && <div className="text-error font-semibold">{error}</div>}
        {chartData && (
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-primary mb-2 tracking-tight drop-shadow">AI-Suggested Chart</h3>
            <ChartViewer chart={chartData} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Query;
