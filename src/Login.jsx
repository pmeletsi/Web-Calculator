import React, { useState } from "react";

const users = [
  { username: "evi", password: "1234" },
  { username: "nik", password: "5678" },
];

const Login = ({ onLogin }) => {
  const [inputUser, setInputUser] = useState("");
  const [inputPass, setInputPass] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const found = users.find(
      u => u.username === inputUser && u.password === inputPass
    );
    if (found) {
      onLogin(inputUser);
    } else {
      setError("Invalid credentials!");
    }
  };

  return (
    <form className="login-form" onSubmit={handleSubmit} style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      gap: 16, padding: 32, background: "#fff", borderRadius: 12, boxShadow: "0 1px 10px #bfe2fade"
    }}>
      <h2>Login to Calculator</h2>
      <input
        type="text"
        placeholder="Username"
        value={inputUser}
        onChange={e => setInputUser(e.target.value)}
        autoFocus
      />
      <input
        type="password"
        placeholder="Password"
        value={inputPass}
        onChange={e => setInputPass(e.target.value)}
      />
      <button className="btn control" type="submit">Login</button>
      {error && <div style={{color:'red', marginTop: 8}}>{error}</div>}
    </form>
  );
};

export default Login;