import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; 
import { AuthContext } from "../utils/AuthContext";
import "./../styles/Login.css";

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false); 
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); 
  const [name, setName] = useState(""); 
  const navigate = useNavigate(); 
  const { setAuthData } = useContext(AuthContext);

  const toggleSignUp = () => {
    setIsSignUp((prev) => !prev);
    setEmail("");
    setPassword("");
    setName("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (isSignUp) {
      try {
        console.log("Signing up with:", { name, email, password });
  
        if (name && email && password) {
          
          const payload = { name, email, password };
  
          
          const response = await axios.post("http://127.0.0.1:8000/register", payload, {
            headers: {
              "Content-Type": "application/json", 
            },
          });
  
          console.log("Sign-up response:", response);
  
          alert("Registration successful! Please log in.");
          toggleSignUp(); 
        } else {
          alert("Please fill out all fields.");
        }
      } catch (error) {
        console.error("Sign-up error:", error.response?.data || error.message);
        alert(error.response?.data?.detail || "Sign-up failed.");
      }
    } else {
      try {
        console.log("Logging in with:", { email, password });
  
        if (email && password) {
          
          const formData = new URLSearchParams();
          formData.append("username", email); 
          formData.append("password", password);
  
          
          const response = await axios.post("http://127.0.0.1:8000/login", formData, {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded", 
            },
          });
  
          console.log("Login response:", response);

          const { access_token, Name } = response.data;
          setAuthData(access_token, Name);
          
          
  
          // alert("Login successful!");
          navigate("/home"); 
        } else {
          alert("Please enter both email and password.");
        }
      } catch (error) {
        console.error("Login error:", error.response?.data || error.message);
        alert("Invalid credentials or server error.");
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
                type="text"
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
