import React from "react";
import "./../styles/Login.css";

const Login = ({ onLogin }) => {
  const handleLogin = (e) => {
    e.preventDefault();
    onLogin(); // Placeholder for login logic
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-welcome">
          <h1>Welcome to Ask.AI</h1>
          <p>Your gateway to character creation from text!</p>
        </div>
        <div className="login-box">
          <h2>Log In</h2>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Username</label>
              <input type="text" placeholder="Enter your username" required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" placeholder="Enter your password" required />
            </div>
            <div className="form-options">
              <label>
                <input type="checkbox" /> Remember Me
              </label>
            </div>
            <button type="submit" className="btn-login">
              Log In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
