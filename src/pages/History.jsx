import { Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext.jsx';

const HistoryPage = ({ history, clearHistory }) => {
  const { logout } = useAuth();

  return (
    <div className="calculator-container">
      <div className="calculator">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 8,
        }}>
          <Link to="/" className="btn control" style={{ textDecoration: 'none' }}>Calculator</Link>
          <button className="btn control" onClick={logout}>Logout</button>
        </div>
        <div className="history">
          <div className="history-header">
            <span>History</span>
            <button className="btn control" onClick={clearHistory}>
              Clear
            </button>
          </div>
          {history.length === 0 ? (
            <div className="history-empty">No calculations yet.</div>
          ) : (
            <ul className="history-list">
              {history.slice(0, 8).map((h, idx) => (
                <li key={idx} className="history-item" title="Calculation history item">
                  <div>
                    <span className="history-exp">{h.expression}</span>
                    <span className="history-res">= {h.result}</span>
                  </div>
                  <div className="history-details" style={{
                    fontSize: '0.78em',
                    color: '#888',
                    paddingLeft: 2,
                    marginTop: 3,
                  }}>
                    {h.username
                      ? <>by <b>{h.username}</b>  {new Date(h.createdAt).toLocaleString()}</>
                      : <> {new Date(h.createdAt).toLocaleString()}</>
                    }
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;
