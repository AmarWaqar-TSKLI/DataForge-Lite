import React, { useState } from 'react';
import API from '../api';
import { useData } from '../context.jsx';

const defaultStrategy = {
	drop_duplicates: true,
	numeric: 'median',
	categorical: 'mode',
	drop_columns: [],
};

const TransformPanel = () => {
	const { datasetId, columns, setPreview } = useData();
	const [strategy, setStrategy] = useState(defaultStrategy);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [stats, setStats] = useState(null);

	const handleChange = (field, value) => {
		setStrategy(s => ({ ...s, [field]: value }));
	};

	const handleColumnToggle = col => {
		setStrategy(s => ({
			...s,
			drop_columns: s.drop_columns.includes(col)
				? s.drop_columns.filter(c => c !== col)
				: [...s.drop_columns, col],
		}));
	};

	const handleApply = async () => {
		setError(null);
		setLoading(true);
		try {
			const req = {
				strategy: {
					drop_duplicates: strategy.drop_duplicates,
					numeric: strategy.numeric,
					categorical: strategy.categorical,
				},
			};
			if (strategy.drop_columns.length) {
				req.strategy.drop_columns = strategy.drop_columns;
			}
					 const res = await API.post(`/clean/${datasetId}`, req);
					 setPreview(res.data.preview);
					 setStats(res.data.stats);
		} catch (e) {
			setError(e?.response?.data?.detail || 'Cleaning failed.');
		} finally {
			setLoading(false);
		}
	};

       return (
	       <div className="bg-surface border border-border rounded-lg p-6 flex flex-col gap-4">
		       <h3 className="text-lg font-bold text-primary mb-2">Data Cleaning Options</h3>
		       <div className="flex flex-wrap gap-4 mb-2">
			       <label className="flex items-center gap-2">
				       <input type="checkbox" checked={strategy.drop_duplicates} onChange={e => handleChange('drop_duplicates', e.target.checked)} />
				       <span>Remove duplicates</span>
			       </label>
			       <label className="flex items-center gap-2">
				       <span>Fill numeric:</span>
				  <select value={strategy.numeric} onChange={e => handleChange('numeric', e.target.value)} className="bg-white text-black border border-border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary/60">
					  <option value="median">Median</option>
					  <option value="mean">Mean</option>
				  </select>
			       </label>
			       <label className="flex items-center gap-2">
				       <span>Fill categorical:</span>
				  <select value={strategy.categorical} onChange={e => handleChange('categorical', e.target.value)} className="bg-white text-black border border-border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary/60">
					  <option value="mode">Mode</option>
					  <option value="custom">Custom</option>
				  </select>
			       </label>
		       </div>
		       <div className="mb-2">
			       <span className="font-semibold">Drop columns:</span>
			  <div className="flex flex-wrap gap-2 mt-1">
				  {columns.map(col => (
					  <label
						  key={col}
						  className={`w-36 max-w-36 px-2 py-1 rounded border cursor-pointer transition-all flex items-center whitespace-nowrap overflow-hidden text-ellipsis ${strategy.drop_columns.includes(col) ? 'bg-error text-white border-error font-semibold shadow-button' : 'bg-background border-border text-text hover:bg-primary/10 hover:text-primary'}`}
						  title={col}
					  >
						  <input
							  type="checkbox"
							  checked={strategy.drop_columns.includes(col)}
							  onChange={() => handleColumnToggle(col)}
							  className="mr-1 shrink-0"
						  />
						  <span className="truncate block overflow-hidden text-ellipsis">{col}</span>
					  </label>
				  ))}
			  </div>
		       </div>
				       <button
					       className="px-4 py-2 rounded-xl bg-primary text-white font-semibold shadow-button hover:bg-accent hover:shadow-lg transition-all w-fit focus:outline-none focus:ring-2 focus:ring-primary/60"
					       onClick={handleApply}
					       disabled={loading || !datasetId}
				       >
					       {loading ? 'Applying...' : 'Apply Cleaning'}
				       </button>
		       {error && <div className="text-error mt-2">{error}</div>}
		       {stats && (
			       <div className="mt-4">
				       <div className="font-semibold mb-2 text-base">Summary Stats:</div>
				       <pre className="bg-background rounded p-3 text-sm overflow-x-auto max-h-64">{JSON.stringify(stats, null, 2)}</pre>
			       </div>
		       )}
	       </div>
       );
};

export default TransformPanel;
