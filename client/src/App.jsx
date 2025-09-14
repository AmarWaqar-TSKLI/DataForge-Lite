import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Preview from './pages/Preview';
import Transform from './pages/Transform';
import Query from './pages/Query';
import Visualize from './pages/Visualize';
import { DataProvider } from './context.jsx';

const App = () => {
  return (
    <DataProvider>
      <Router>
        <div className="bg-background min-h-screen text-text">
          <Navbar />
          <main className="max-w-6xl mx-auto px-4 py-6">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/preview" element={<Preview />} />
              <Route path="/transform" element={<Transform />} />
              <Route path="/query" element={<Query />} />
              <Route path="/visualize" element={<Visualize />} />
            </Routes>
          </main>
        </div>
      </Router>
    </DataProvider>
  );
};

export default App;
