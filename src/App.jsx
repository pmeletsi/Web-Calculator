import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/Login.jsx';
import CalculatorPage from './pages/Calculator.jsx';
import HistoryPage from './pages/History.jsx';
import { useAuth } from './lib/AuthContext.jsx';

function RequireAuth({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

const App = () => {
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('calc_history') || '[]'); }
    catch { return []; }
  });

  useEffect(() => {
    try { localStorage.setItem('calc_history', JSON.stringify(history)); } catch {}
  }, [history]);

  const clearHistory = () => setHistory([]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={(
        <RequireAuth>
          <CalculatorPage history={history} setHistory={setHistory} />
        </RequireAuth>
      )} />
      <Route path="/history" element={(
        <RequireAuth>
          <HistoryPage history={history} clearHistory={clearHistory} />
        </RequireAuth>
      )} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
