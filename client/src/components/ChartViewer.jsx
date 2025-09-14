

import React from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter
} from 'recharts';

// Modern, accessible color palette
const COLORS = [
  '#2563eb', // blue-600
  '#f59e42', // orange-400
  '#22c55e', // green-500
  '#e11d48', // rose-600
  '#a21caf', // purple-700
  '#fbbf24', // yellow-400
  '#0ea5e9', // sky-500
  '#f472b6', // pink-400
  '#38bdf8', // blue-400
  '#10b981', // emerald-500
];

function getChartDescription(type, meta, labels, datasets) {
  if (!meta) return '';
  const { x, y, agg } = meta;
  let desc = '';
  if (type === 'bar' || type === 'line' || type === 'histogram') {
    if (x && y && agg && agg !== 'none') {
      desc = `${agg.charAt(0).toUpperCase() + agg.slice(1)} of ${y} by ${x} (${type} chart)`;
    } else if (x && !y) {
      desc = `Count of ${x} (${type} chart)`;
    } else if (y && !x) {
      desc = `Count of ${y} (${type} chart)`;
    } else if (type === 'histogram' && x) {
      desc = `Distribution of ${x} (histogram)`;
    }
  } else if (type === 'pie') {
    if (x && !y) desc = `Distribution of ${x} (pie chart)`;
    else if (x && y && agg && agg !== 'none') desc = `${agg.charAt(0).toUpperCase() + agg.slice(1)} of ${y} by ${x} (pie chart)`;
    else desc = 'Pie chart';
  } else if (type === 'scatter') {
    if (x && y) desc = `Scatter plot of ${y} vs ${x}`;
    else desc = 'Scatter plot';
  }
  return desc;
}

function getChartWarning(type, meta) {
  const { x, y, agg } = meta || {};
  if (type === 'pie') {
    if (!x) return 'Pie chart requires a categorical field for X.';
    if (agg === 'none' && y) return 'Pie chart does not support "none" aggregation with Y.';
  }
  if ((type === 'bar' || type === 'line') && (!x || !y)) {
    return 'Bar/Line chart requires both X (group) and Y (value) fields.';
  }
  if (type === 'scatter' && (!x || !y)) {
    return 'Scatter plot requires both X and Y fields.';
  }
  return null;
}


import { useState } from 'react';

const ChartViewer = ({ chart }) => {
  const [error, setError] = useState(null);
  if (!chart) return null;
  try {
    const { type, labels, datasets, meta } = chart;
    // Defensive: handle missing/empty data
    if (!labels || !datasets || !Array.isArray(labels) || !Array.isArray(datasets) || labels.length === 0 || datasets.length === 0) {
      return <div className="text-error">No data to display for this chart.</div>;
    }
    // Defensive: histogram must have numeric bins and counts
    if (type === 'histogram' && (!datasets[0].data || datasets[0].data.length === 0)) {
      return <div className="text-error">No data to display for this histogram.</div>;
    }
    const data = labels.map((label, i) => {
      const row = { name: label };
      datasets.forEach(ds => {
        if (Array.isArray(ds.data)) row[ds.label] = ds.data[i];
        else row[ds.label] = ds.data;
      });
      return row;
    });
    const desc = getChartDescription(type, meta, labels, datasets);
    const warning = getChartWarning(type, meta);
    return (
      <div className="flex flex-col gap-2">
        {desc && <div className="text-base font-semibold text-primary mb-1">{desc}</div>}
        {warning && <div className="text-error font-semibold mb-2">{warning}</div>}
        {type === 'bar' || type === 'histogram' ? (
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={data} className="bg-background rounded-lg">
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="name" stroke="#f4f4f5" />
              <YAxis stroke="#f4f4f5" />
              <Tooltip
                wrapperClassName="!bg-surface !text-text"
                formatter={(value, name) =>
                  value === null || value === undefined || value === ''
                    ? 'No data'
                    : value
                }
                labelFormatter={label => label || ''}
              />
              <Legend />
              {datasets.map((ds, idx) => (
                <Bar key={ds.label} dataKey={ds.label} fill={COLORS[idx % COLORS.length]} radius={[6, 6, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        ) : type === 'line' ? (
          <ResponsiveContainer width="100%" height={340}>
            <LineChart data={data} className="bg-background rounded-lg">
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="name" stroke="#f4f4f5" />
              <YAxis stroke="#f4f4f5" />
              <Tooltip wrapperClassName="!bg-surface !text-text" />
              <Legend />
              {datasets.map((ds, idx) => (
                <Line key={ds.label} dataKey={ds.label} stroke={COLORS[idx % COLORS.length]} dot strokeWidth={3} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : type === 'pie' ? (
          <ResponsiveContainer width="100%" height={340}>
            <PieChart className="bg-background rounded-lg">
              <Pie data={labels.map((label, i) => ({ name: label, value: datasets[0].data[i] }))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label>
                {labels.map((_, idx) => (
                  <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip wrapperClassName="!bg-surface !text-text" />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : type === 'scatter' ? (
          <ResponsiveContainer width="100%" height={340}>
            <ScatterChart className="bg-background rounded-lg">
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="x" stroke="#f4f4f5" />
              <YAxis dataKey="y" stroke="#f4f4f5" />
              <Tooltip wrapperClassName="!bg-surface !text-text" />
              <Legend />
              <Scatter name={datasets[0].label} data={datasets[0].data.map(([x, y]) => ({ x, y }))} fill={COLORS[0]} />
            </ScatterChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-error">Unsupported chart type</div>
        )}
      </div>
    );
  } catch (err) {
    // Defensive: catch any rendering error and show message
    return <div className="text-error">Chart rendering error: {err.message}</div>;
  }
};

export default ChartViewer;
