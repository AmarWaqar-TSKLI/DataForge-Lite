import React, { useMemo, useState } from 'react';

const getType = val => {
	if (val === null || val === undefined) return 'null';
	if (typeof val === 'number') return 'number';
	if (typeof val === 'boolean') return 'bool';
	if (!isNaN(Date.parse(val))) return 'date';
	return 'string';
};

const DataTable = ({ rows = [], columns = [], pageSize = 10 }) => {
	const [page, setPage] = useState(0);
	const totalPages = Math.ceil(rows.length / pageSize);
	const pagedRows = useMemo(() => rows.slice(page * pageSize, (page + 1) * pageSize), [rows, page, pageSize]);

	// Compute null counts and types
	const nullCounts = useMemo(() => {
		const counts = {};
		columns.forEach(col => {
			counts[col] = rows.filter(r => r[col] === null || r[col] === undefined || r[col] === '').length;
		});
		return counts;
	}, [rows, columns]);

	const types = useMemo(() => {
		const t = {};
		columns.forEach(col => {
			const firstNonNull = rows.find(r => r[col] !== null && r[col] !== undefined && r[col] !== '');
			t[col] = getType(firstNonNull ? firstNonNull[col] : null);
		});
		return t;
	}, [rows, columns]);

       return (
	       <div className="relative rounded-lg border border-border bg-surface">
		       <div className="overflow-x-auto">
			       <table className="min-w-full text-sm">
				       <thead>
					       <tr className="bg-background">
						       {columns.map(col => (
							       <th key={col} className="px-3 py-2 font-semibold text-left text-text border-b border-border whitespace-nowrap">
								       {col}
								       <div className="text-xs text-muted font-normal">
									       {types[col]} | nulls: {nullCounts[col]}
								       </div>
							       </th>
						       ))}
					       </tr>
				       </thead>
				       <tbody>
					       {pagedRows.length === 0 ? (
						       <tr><td colSpan={columns.length} className="text-center text-muted py-8">No data</td></tr>
					       ) : (
						       pagedRows.map((row, i) => (
							       <tr key={i} className="hover:bg-background/60">
								       {columns.map(col => (
									       <td key={col} className="px-3 py-2 border-b border-border text-text whitespace-nowrap">
										       {row[col] === null || row[col] === undefined || row[col] === '' ? <span className="text-error">—</span> : String(row[col])}
									       </td>
								       ))}
							       </tr>
						       ))
					       )}
				       </tbody>
			       </table>
		       </div>
		       {totalPages > 1 && (
			       <div className="sticky right-0 bottom-0 z-10 bg-surface/95 flex justify-end items-center gap-2 p-2 border-t border-border" style={{ minWidth: 220 }}>
					       <button
						       className="px-2 py-1 rounded-lg bg-surface border border-border text-muted font-semibold shadow-button hover:bg-primary/10 hover:text-primary transition-all disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary/60"
						       onClick={() => setPage(p => Math.max(0, p - 1))}
						       disabled={page === 0}
					       >Prev</button>
				       <span className="text-xs text-muted">Page {page + 1} of {totalPages}</span>
					       <button
						       className="px-2 py-1 rounded-lg bg-surface border border-border text-muted font-semibold shadow-button hover:bg-primary/10 hover:text-primary transition-all disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary/60"
						       onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
						       disabled={page === totalPages - 1}
					       >Next</button>
			       </div>
		       )}
	       </div>
       );
};

export default DataTable;
