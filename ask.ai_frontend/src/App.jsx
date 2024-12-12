import React, { useState } from "react";
import Login from "./components/Login";
import Home from "./components/Home";
import Header from "./components/Header";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return <>{isLoggedIn ? <Home /> : <Login onLogin={() => setIsLoggedIn(true)} />}</>;
}

export default App;
