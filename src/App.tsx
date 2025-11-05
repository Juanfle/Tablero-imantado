import './App.css';
import './index.css';
import Tablero from './components/tablero';

function App() {
  // Header buttons will dispatch custom events handled inside the Tablero component
  const openExport = () => window.dispatchEvent(new CustomEvent('openExportTeachers'));
  const triggerPrint = () => window.dispatchEvent(new CustomEvent('triggerPrint'));

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
          <button onClick={openExport} title="Gestionar docentes" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontSize: 14 }}>Gestionar docentes</span>
          </button>

          <button
            onClick={triggerPrint}
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
        </div>
      </header>

      <Tablero />
    </div>
  );
}

export default App;