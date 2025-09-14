
import React, { useState } from 'react';
import FileUpload from '../components/FileUpload';
import { useData } from '../context.jsx';

const Home = () => {
  const [uploadResult, setUploadResult] = useState(null);
  const { setDatasetId, setColumns, setPreview } = useData();

  const handleUpload = (result) => {
    setUploadResult(result);
    setDatasetId(result.dataset_id);
    setColumns(result.columns || []);
    setPreview(result.preview || []);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] py-10 px-2 bg-background">
      <div className="w-full max-w-2xl bg-surface/90 rounded-2xl shadow-card border border-border p-8 flex flex-col items-center mb-10">
        <h1 className="text-4xl md:text-5xl font-extrabold text-primary mb-3 tracking-tight drop-shadow">Welcome to <span className="text-accent">DataForge Lite</span></h1>
        <p className="text-lg md:text-xl text-muted mb-6 font-medium">Smart Data Cleaning & Visualization Tool</p>
        <ul className="text-base text-muted mb-8 space-y-2 w-full max-w-md mx-auto text-left list-disc list-inside">
          <li>Upload CSV, Excel, or JSON files</li>
          <li>Clean missing/duplicate data automatically</li>
          <li>Get summary statistics and AI insights</li>
          <li>Generate beautiful charts and download results</li>
        </ul>
        <div className="w-full max-w-md mx-auto">
          <FileUpload onUpload={handleUpload} />
        </div>
      </div>
      {uploadResult && (
        <div className="w-full max-w-lg bg-surface/90 rounded-2xl shadow-card border border-success p-6 flex flex-col items-center animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <svg width="22" height="22" fill="none" stroke="#22c55e" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#22c55e" strokeWidth="2.2" fill="#22c55e22"/><path d="M7 13l3 3 7-7" stroke="#22c55e" strokeWidth="2.2"/></svg>
            <span className="text-success font-bold text-lg">Upload successful!</span>
          </div>
          <div className="text-sm text-muted mb-2">Dataset ID: <span className="text-text font-mono">{uploadResult.dataset_id}</span></div>
          <div className="flex gap-3 mt-3">
            <a href="/preview" className="px-5 py-2 rounded-xl bg-primary text-white font-semibold shadow-button hover:bg-accent hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary/60">Preview Data</a>
            <a href="/query" className="px-5 py-2 rounded-xl bg-surface border border-primary text-primary font-semibold shadow-button hover:bg-primary hover:text-white hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary/60">Ask AI</a>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
