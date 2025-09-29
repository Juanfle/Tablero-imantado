import './App.css';
import Tablero from './components/tablero';


function App() {
  return (
    <div style={{ maxWidth: 1100, margin: '30px auto', padding: '0 16px' }}>
    <h1 style={{ marginBottom: 6 }}>Tablero imantado de horarios 🧲📚</h1>
    <p style={{ marginTop: 0, color: '#6b7280' }}>
    Arrastrá un imán desde la bandeja y soltalo sobre una celda de la grilla.
    </p>
    <Tablero />
    </div>
  );
}


export default App;