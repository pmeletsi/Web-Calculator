import { Link } from 'react-router-dom';

const History = ({ history, clearHistory, onLogout }) => {
  return (
    <div className="calculator-container">
      <div className="calculator">

        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 8,
          }}
        >
          <Link to="/">Calculator</Link>
          <button className="btn control" onClick={onLogout}>
            Logout
          </button>
        </div>

        {/* History Section */}
        <div className="history">
          <div className="history-header">
            <span>History</span>
            <button className="btn control" onClick={clearHistory}>
              Clear
            </button>
          </div>

          {history.length === 0 ? (
            <div className="history-empty">
              No calculations yet.
            </div>
          ) : (
            <ul className="history-list">
              {history.slice(0, 8).map((h, idx) => (
                <li key={idx} className="history-item">
                  <span className="history-exp">
                    {h.expression}
                  </span>
                  <span className="history-res">
                    = {h.result}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </div>
  );
};

export default History;