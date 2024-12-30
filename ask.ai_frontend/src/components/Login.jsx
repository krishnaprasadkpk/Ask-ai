import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./../styles/Login.css";

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false); // Toggle between login and sign-up
  const [email, setEmail] = useState(""); // Email state
  const [password, setPassword] = useState(""); // Password state
  const [name, setName] = useState(""); // Name state for sign-up
  const navigate = useNavigate(); // Navigation hook

  const toggleSignUp = () => {
    setIsSignUp((prev) => !prev);
    setEmail("");
    setPassword("");
    setName("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSignUp) {
      // Simple sign-up logic
      console.log("Account created with:", { name, email, password });
      toggleSignUp();
    } else {
      // Simple login logic
      console.log("Logging in with:", { email, password });
      if (email && password) {
        navigate("/home"); // Redirect to home page
      } else {
        alert("Please enter both email and password.");
      }
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Left Section */}
        <div className="login-welcome">
          <h1>Welcome to Ask.AI</h1>
          <p>Your gateway to imagination and character generation!</p>
        </div>

        {/* Right Section */}
        <div className="login-box">
          <h2>{isSignUp ? "Create Account" : "Log In"}</h2>
          <form onSubmit={handleSubmit}>
            {isSignUp && (
              <div className="form-group">
                <label>Name:</label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}
            <div className="form-group">
              <label>Email:</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Password:</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-login">
              {isSignUp ? "Sign Up" : "Log In"}
            </button>
          </form>

          {!isSignUp && (
            <div className="toggle-option">
               <p>
               Don't have an account?
               <span onClick={toggleSignUp} className="signup-link">
                Sign Up
               </span>
               </p>
            </div>
          )}     
        </div>
      </div>
    </div>
  );
};

export default Login;
