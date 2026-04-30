import { useEffect, useState } from "react";
import HistoryButton from "./HistoryButton";

const App = () => {
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

  //Handle Calculate 
  const handleCalculate = () => {
    try {
      const expression = input;

      // Support "x" button for multiplication
      const normalized = expression.replace(/x/g, "*");

      const result = eval(normalized).toString();
      setInput(result);

      // History
      setHistory((prev) => [
        { expression, result, createdAt: new Date().toISOString() }, ...prev,
      ]);
    } catch {
      setInput("Error");
    }
  };

  //Handle Clear history
  const handleClearHistory = () => setHistory([]);


  return (
    <div className="calculator-container">
      <div className="calculator">
        {/* Οταν showHistory=false, να είναι το calculator */}
        {!showHistory ? (
          <>
            <div className = "display"> {input || "0"} </div>
            <div style = {{display: "flex", justifyContent: "flex-end", marginBottom: 8}}>
              <HistoryButton onClick={() => setShowHistory(true)} />
            </div>

            <div className="buttons">
              <button className="btn control" onClick = {handleClear}>
                C
              </button>
              <button className="btn control" onClick = {handleDelete}>
                DEL
              </button>
              <button className="btn operator" onClick = {() => handleClick("%")}>
                %
              </button>
              <button className="btn operator" onClick = {() => handleClick("/")}>
                /
              </button>

              <button className="btn" onClick = {() => handleClick("7")}>
                7
              </button>
              <button className="btn" onClick = {() => handleClick("8")}>
                8
              </button>
              <button className="btn" onClick = {() => handleClick("9")}>
                9
              </button>
              <button className="btn operator" onClick={() => handleClick("x")}>
                x
              </button>

              <button className="btn" onClick = {() => handleClick("4")}>
                4
              </button>
              <button className="btn" onClick = {() => handleClick("5")}>
                5
              </button>
              <button className="btn" onClick = {() => handleClick("6")}>
                6
              </button>
              <button className="btn operator" onClick = {() => handleClick("-")}>
                -
              </button>

              <button className="btn" onClick = {() => handleClick("1")}>
                1
              </button>
              <button className="btn" onClick = {() => handleClick("2")}>
                2
              </button>
              <button className="btn" onClick = {() => handleClick("3")}>
                3
              </button>
              <button className="btn operator" onClick = {() => handleClick("+")}>
                +
              </button>

              <button className="btn zero" onClick = {() => handleClick("0")}>
                0
              </button>
              <button className="btn" onClick = {() => handleClick(".")}>
                .
              </button>
              <button className="btn equals" onClick = {handleCalculate}>
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
                <button className="btn control" onClick={() => setShowHistory(false)} style={{marginLeft: 8}}>
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
                    <span className="history-exp">{h.expression}</span>
                    <span className="history-res">= {h.result}</span>
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