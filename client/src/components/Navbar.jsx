

import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/preview', label: 'Preview' },
  { to: '/transform', label: 'Transform' },
  { to: '/query', label: 'AI Query' },
  { to: '/visualize', label: 'Visualize' },
];

const Navbar = () => {
  const location = useLocation();
  return (
    <nav className="w-full bg-background/80 backdrop-blur border-b border-border shadow-card sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 text-2xl font-extrabold text-primary tracking-tight">
            <svg width="28" height="28" viewBox="0 0 256 228" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="128" cy="114" r="22" fill="#6366f1" />
              <ellipse cx="128" cy="114" rx="100" ry="40" stroke="#6366f1" strokeWidth="8" fill="none" />
            </svg>
            DataForge <span className="text-accent">Lite</span>
          </span>
        </div>
        <div className="flex gap-1 bg-surface/80 rounded-xl px-2 py-1 shadow-card">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-4 py-2 rounded-lg text-base font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary/60
                ${location.pathname === link.to
                  ? 'bg-primary text-white shadow-button'
                  : 'text-muted hover:bg-primary/10 hover:text-primary'}`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
