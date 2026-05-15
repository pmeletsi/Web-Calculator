import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/Login.jsx';
import CalculatorPage from './pages/Calculator.jsx';
import HistoryPage from './pages/History.jsx';

function RequireAuth({ user, children }) {
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

const App = () => {
  const [user, setUser] = useState(() => localStorage.getItem('user') || null);

  const handleLogin = (username) => {
    setUser(username);
    localStorage.setItem('user', username);
  };
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  // TODO(6.4): replace with API-backed history hook
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
      <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
      <Route
        path="/"
        element={
          <RequireAuth user={user}>
            <CalculatorPage user={user} history={history} setHistory={setHistory} onLogout={handleLogout} />
          </RequireAuth>
        }
      />
      <Route
        path="/history"
        element={
          <RequireAuth user={user}>
            <HistoryPage history={history} clearHistory={clearHistory} onLogout={handleLogout} />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
    </Routes>
  );
};

export default App;