import { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

function decodeJwtRole(token) {
    if (!token) return null;

    try {
        const payload = JSON.parse(
            atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
        );

        return (
            payload.role ??
            payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ??
            null
        );
    } catch {
        return null;
    }
}

export function AuthProvider({ children }) {
    const navigate = useNavigate();

    const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
    const [user, setUser] = useState(() => localStorage.getItem(USER_KEY));
    const [role, setRole] = useState(() =>
        decodeJwtRole(localStorage.getItem(TOKEN_KEY))
    );

    const login = (newToken, newUser) => {
        localStorage.setItem(TOKEN_KEY, newToken);
        localStorage.setItem(USER_KEY, newUser);

        setToken(newToken);
        setUser(newUser);
        setRole(decodeJwtRole(newToken));

        navigate('/', { replace: true });
    };

    const logout = () => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);

        setToken(null);
        setUser(null);
        setRole(null);

        navigate('/login', { replace: true });
    };

    const isAdmin = role === 'Admin';

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                role,
                isAdmin,
                login,
                logout
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);

    if (!ctx) {
        throw new Error('useAuth must be used inside <AuthProvider>');
    }

    return ctx;
}