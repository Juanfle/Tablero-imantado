import './App.css';
import './index.css';
import Tablero from './components/tablero';
import { useEffect, useState } from 'react';

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = typeof localStorage !== 'undefined' ? (localStorage.getItem('theme') as 'light' | 'dark' | null) : null;
    if (saved === 'light' || saved === 'dark') return saved;
    const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');
    try { localStorage.setItem('theme', theme); } catch {}
  }, [theme]);

  // Header buttons will dispatch custom events handled inside the Tablero component
  const openExport = () => window.dispatchEvent(new CustomEvent('openExportTeachers'));
  const triggerPrintHorarios = () => window.dispatchEvent(new CustomEvent('triggerPrint'));
  const triggerPrintPartes = () => window.dispatchEvent(new CustomEvent('triggerPrintPartes'));
  const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));
  const [showPrintMenu, setShowPrintMenu] = useState(false);

  return (
  <div className="appWrapper">
  <header className="topHeader" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Horarios</h1>
            <p style={{ margin: 0, color: '#6b7280', fontSize: 12 }}>Planificador de horarios</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            aria-label="Tema"
            style={{
              width: 36,
              height: 36,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              lineHeight: 0,
            }}
          >
            {theme === 'dark' ? (
              // sun icon
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ display: 'block' }}>
                <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.4" />
                <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            ) : (
              // moon icon
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ display: 'block' }}>
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="1.4" fill="none" />
              </svg>
            )}
          </button>
          <button onClick={openExport} title="Gestionar docentes" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontSize: 14 }}>Gestionar docentes</span>
          </button>

          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowPrintMenu(v => !v)}
              title="Imprimir"
              aria-label="Imprimir"
              style={{
                width: 36,
                height: 36,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                lineHeight: 0,
              }}
            >
              {/* printer icon only */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ display: 'block' }}>
                <path d="M6 9V3h12v6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="6" y="14" width="12" height="8" rx="2" stroke="currentColor" strokeWidth="1.4" />
              </svg>
            </button>
            {showPrintMenu && (
              <div
                role="menu"
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: 6,
                  background: 'var(--menu-bg, #fff)',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  minWidth: 220,
                  zIndex: 150,
                  overflow: 'hidden',
                }}
                onMouseLeave={() => setShowPrintMenu(false)}
              >
                <button onClick={() => { setShowPrintMenu(false); triggerPrintHorarios(); }} style={{ width: '100%', textAlign: 'left', padding: '8px 10px', background: 'transparent' }}>
                  Imprimir horarios
                </button>
                <button onClick={() => { setShowPrintMenu(false); triggerPrintPartes(); }} style={{ width: '100%', textAlign: 'left', padding: '8px 10px', background: 'transparent', borderTop: '1px solid #e5e7eb' }}>
                  Imprimir partes diarios
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <Tablero />
    </div>
  );
}

export default App;