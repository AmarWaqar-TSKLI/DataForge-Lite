import React, { createContext, useContext, useState, useEffect } from 'react';

const DataContext = createContext();

const LS_KEY = 'dataforge-lite-state';

function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveState(state) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch {}
}

export const DataProvider = ({ children }) => {
  const [datasetId, setDatasetId] = useState(() => loadState().datasetId || null);
  const [columns, setColumns] = useState(() => loadState().columns || []);
  const [preview, setPreview] = useState(() => loadState().preview || []);

  useEffect(() => {
    saveState({ datasetId, columns, preview });
  }, [datasetId, columns, preview]);

  return (
    <DataContext.Provider value={{ datasetId, setDatasetId, columns, setColumns, preview, setPreview }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
