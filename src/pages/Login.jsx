import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = ({ onLogin }) => {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // TODO(6.2): replace with API call
  const users = [
    { username: 'evi', password: '1234' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();

    const validUser = users.find(
      (u) => u.username === username && u.password === password
    );

    if (validUser) {
      onLogin(username);
      navigate('/', { replace: true });
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="calculator-container">
      <div className="calculator">
        <h2 style={{ textAlign: 'center', marginBottom: 20 }}>
          Login
        </h2>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              width: '100%',
              padding: 10,
              marginBottom: 10,
              borderRadius: 8,
              border: '1px solid #ccc',
            }}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: 10,
              marginBottom: 10,
              borderRadius: 8,
              border: '1px solid #ccc',
            }}
          />

          <button
            type="submit"
            className="btn control"
            style={{ width: '100%' }}
          >
            Login
          </button>

          {error && (
            <div
              style={{
                color: 'red',
                marginTop: 10,
                textAlign: 'center',
              }}
            >
              {error}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Login;