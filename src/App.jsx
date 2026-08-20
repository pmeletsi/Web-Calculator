import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/Login.jsx';
import CalculatorPage from './pages/Calculator.jsx';
import HistoryPage from './pages/History.jsx';
import { useAuth } from './lib/AuthContext.jsx';

function RequireAuth({ children }) {
    const { user } = useAuth();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

function RequireAdmin({ children }) {
    const { user, isAdmin } = useAuth();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    return children;
}

const App = () => (
    <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
            path="/"
            element={
                <RequireAuth>
                    <CalculatorPage />
                </RequireAuth>
            }
        />

        <Route
            path="/history"
            element={
                <RequireAuth>
                    <HistoryPage />
                </RequireAuth>
            }
        />

        <Route
            path="/admin/users"
            element={
                <RequireAdmin>
                    <div>Coming soon - Admin Users</div>
                </RequireAdmin>
            }
        />

        <Route
            path="/admin/history"
            element={
                <RequireAdmin>
                    <div>Coming soon - Admin History</div>
                </RequireAdmin>
            }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
);

export default App;
