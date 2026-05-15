import { useState } from 'react';
import { Link } from 'react-router-dom';

const isValidExpression = (expr) => {
  return /^[0-9+\-*/%.x() ]+$/.test(expr);
};

const Calculator = ({ user, history, setHistory, onLogout }) => {
  const [input, setInput] = useState('');

  const handleClick = (value) => setInput((prev) => prev + value);
  const handleClear = () => setInput('');
  const handleDelete = () => setInput((prev) => prev.slice(0, -1));

  // TODO(6.3): replace eval with backend POST /api/calculations
  const handleCalculate = () => {
    if (!isValidExpression(input)) {
      setInput('Invalid');
      return;
    }

    try {
      const expression = input;
      const normalized = expression.replace(/x/g, '*');
      const result = eval(normalized).toString();

      setInput(result);

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
      setInput('Error');
    }
  };

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
          <Link to="/history">History</Link>
          <button className="btn control" onClick={onLogout}>
            Logout
          </button>
        </div>

     
        <div className="display">{input || '0'}</div>

        <div className="buttons">
          <button className="btn control" onClick={handleClear}>C</button>
          <button className="btn control" onClick={handleDelete}>DEL</button>
          <button className="btn operator" onClick={() => handleClick('%')}>%</button>
          <button className="btn operator" onClick={() => handleClick('/')}>/</button>

          <button className="btn" onClick={() => handleClick('7')}>7</button>
          <button className="btn" onClick={() => handleClick('8')}>8</button>
          <button className="btn" onClick={() => handleClick('9')}>9</button>
          <button className="btn operator" onClick={() => handleClick('x')}>x</button>

          <button className="btn" onClick={() => handleClick('4')}>4</button>
          <button className="btn" onClick={() => handleClick('5')}>5</button>
          <button className="btn" onClick={() => handleClick('6')}>6</button>
          <button className="btn operator" onClick={() => handleClick('-')}>-</button>

          <button className="btn" onClick={() => handleClick('1')}>1</button>
          <button className="btn" onClick={() => handleClick('2')}>2</button>
          <button className="btn" onClick={() => handleClick('3')}>3</button>
          <button className="btn operator" onClick={() => handleClick('+')}>+</button>

          <button className="btn zero" onClick={() => handleClick('0')}>0</button>
          <button className="btn" onClick={() => handleClick('.')}>.</button>
          <button className="btn equals" onClick={handleCalculate}>=</button>
        </div>

      </div>
    </div>
  );
};

export default Calculator;
