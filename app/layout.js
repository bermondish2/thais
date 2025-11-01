// app/layout.js
'use client';

import './(styles)/globals.css';
import SWRegister from './sw-register';

export const metadata = {
  title: 'Thais — Nutrition Coach',
  description: 'Thais with an Apple-like, modern design.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="container">
          <header className="header">
            <div className="brand">
              <div className="logo">T</div>
              <div>
                <div className="title">Thais</div>
                <p className="subtitle">A clean, Apple-like nutrition coach</p>
              </div>
            </div>
          </header>

          <nav className="nav">
            <a href="/">Search</a>
            <a href="/recipes">Recipe analysis</a>
            <a href="/scan">Scan barcode</a>
          </nav>

          <SWRegister />
          {children}

          <div className="footer">
            <p>For education only. Not medical advice. © {new Date().getFullYear()}</p>
          </div>
        </div>
      </body>
    </html>
  );
}
