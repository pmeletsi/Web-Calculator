import { useEffect, useState } from "react";
import HistoryButton from "./HistoryButton";
import Login from "./Login";

// Βοηθητική συνάρτηση validation για το expression
function isValidExpression(expr) {
  if (!expr || expr.trim() === "") return false; // κενό ή μόνο κενά
  if (/[+\-x/%\.]$/.test(expr)) return false; // μην τελειώνει με operator/τελεία
  if (/([+\-x/%]{2,})/.test(expr.replace(/--/g, ""))) return false; // δύο συνεχόμενα operators (όχι "--")
  if (/\.\./.test(expr)) return false; // διπλή τελεία
  if (/[^0-9+\-x/%\.\s]/.test(expr)) return false; // μη επιτρεπτοί χαρακτήρες
  // αποφυγή διαίρεσης με μηδέν
  const norm = expr.replace(/x/g, "*");
  try {
    if (/\/0(?![0-9\.])/.test(norm)) return false;
  } catch { return false; }
  return true;
}

const App = () => {
  // Διαχείριση logged in user
  const [user, setUser] = useState(() => {
    return localStorage.getItem("user") || null;
  });

  const handleLogin = (username) => {
    setUser(username);
    localStorage.setItem("user", username);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  const [input, setInput] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  // Load history from localStorage
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem("calc_history");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("calc_history", JSON.stringify(history));
    } catch {}
  }, [history]);

  //Handle Click
  const handleClick = (value) => {
    setInput((prev) => prev + value);
  };

  //Handle Clear
  const handleClear = () => {
    setInput("");
  };

  //Handle Delete
  const handleDelete = () => {
    setInput((prev) => prev.slice(0, -1));
  };

  //Handle Calculate (με validation!)
  const handleCalculate = () => {
    if (!isValidExpression(input)) {
      setInput("Invalid");
      return;
    }
    try {
      const expression = input;
      const normalized = expression.replace(/x/g, "*");
      const result = eval(normalized).toString();
      setInput(result);

      // Ιστορικό με username και timestamp
      setHistory((prev) => [
        {
          expression,
          result,
          createdAt: new Date().toISOString(),
          username: user,
        },
        ...prev,
      ]);
    } catch {
      setInput("Error");
    }
  };

  //Handle Clear history
  const handleClearHistory = () => setHistory([]);

  // Αν δεν έχει γίνει login, εμφανίζεται η φόρμα login
  if (!user) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        <Login onLogin={handleLogin} />
      </div>
    );
  }

  return (
    <div className="calculator-container">
      <div className="calculator">
        {/* Πάνω μπάρα με History αριστερά & Logout δεξιά */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 8
        }}>
          <HistoryButton onClick={() => setShowHistory(true)} />
          <button className="btn control" onClick={handleLogout}>Logout</button>
        </div>
        {/* Calculator ή History */}
        {!showHistory ? (
          <>
            <div className="display"> {input || "0"} </div>
            <div className="buttons">
              <button className="btn control" onClick={handleClear}>
                C
              </button>
              <button className="btn control" onClick={handleDelete}>
                DEL
              </button>
              <button className="btn operator" onClick={() => handleClick("%")}>
                %
              </button>
              <button className="btn operator" onClick={() => handleClick("/")}>
                /
              </button>

              <button className="btn" onClick={() => handleClick("7")}>
                7
              </button>
              <button className="btn" onClick={() => handleClick("8")}>
                8
              </button>
              <button className="btn" onClick={() => handleClick("9")}>
                9
              </button>
              <button className="btn operator" onClick={() => handleClick("x")}>
                x
              </button>

              <button className="btn" onClick={() => handleClick("4")}>
                4
              </button>
              <button className="btn" onClick={() => handleClick("5")}>
                5
              </button>
              <button className="btn" onClick={() => handleClick("6")}>
                6
              </button>
              <button className="btn operator" onClick={() => handleClick("-")}>
                -
              </button>

              <button className="btn" onClick={() => handleClick("1")}>
                1
              </button>
              <button className="btn" onClick={() => handleClick("2")}>
                2
              </button>
              <button className="btn" onClick={() => handleClick("3")}>
                3
              </button>
              <button className="btn operator" onClick={() => handleClick("+")}>
                +
              </button>

              <button className="btn zero" onClick={() => handleClick("0")}>
                0
              </button>
              <button className="btn" onClick={() => handleClick(".")}>
                .
              </button>
              <button
                className="btn equals"
                onClick={handleCalculate}
                disabled={!isValidExpression(input)}
              >
                =
              </button>
            </div>
          </>
        ) : (
          <div className="history">
            <div className="history-header">
              <span>History</span>
              <div>
                <button className="btn control" onClick={handleClearHistory}>
                  Clear
                </button>
                <button className="btn control" onClick={() => setShowHistory(false)} style={{ marginLeft: 8 }}>
                  Close
                </button>
              </div>
            </div>
            {history.length === 0 ? (
              <div className="history-empty">No calculations yet.</div>
            ) : (
              <ul className="history-list">
                {history.slice(0, 8).map((h, idx) => (
                  <li
                    key={idx}
                    className="history-item"
                    onClick={() => {
                      setInput(h.expression);
                      setShowHistory(false);
                    }}
                    title="Click to reuse"
                  >
                    <div>
                      <span className="history-exp">{h.expression}</span>
                      <span className="history-res">= {h.result}</span>
                    </div>
                    <div className="history-details" style={{
                      fontSize: "0.78em",
                      color: "#888",
                      paddingLeft: 2,
                      marginTop: 3
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
        )}
      </div>
    </div>
  );
};

export default App;