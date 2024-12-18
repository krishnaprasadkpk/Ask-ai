import React, { useState } from "react";
import "./../styles/Home.css";

const Home = () => {
  const [prompt, setPrompt] = useState("");
  const [characters, setCharacters] = useState([]);
  const [history, setHistory] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleGenerate = () => {
    // Validation to check if the prompt is empty or contains only whitespace
    if (!prompt.trim()) {
      alert("Please enter a prompt!");
      return;
    }

    setCharacters([]); // Reset the characters array

    // Placeholder logic for generating characters
    const newCharacter = {
      name: "Sara",
      image: "https://via.placeholder.com/150", // Placeholder image
    };

    setCharacters([newCharacter]); // Add new characters
    setHistory((prev) => [prompt, ...prev]);
    setPrompt(""); // Clear the prompt box after generating
  };

  const handlePromptClick = (selectedPrompt) => {
    setPrompt(selectedPrompt);
  };

  const toggleDropdown = () => {
    setShowDropdown((prev) => !prev);
  };


  return (
    <div className="home-container">
      {/* Top Navigation */}
      <div className="top-nav">
        <div className="logo">Ask.AI</div>
        <div className="user-section">
          <div className="profile-icon" onClick={toggleDropdown}>
            AM {/* Replace with dynamic initials */}
          </div>
          {showDropdown && (
            <div className="dropdown-menu">
              <ul>
                <li>Settings</li>
                <li>Upgrade Plan</li>
                <li>Log out</li>
              </ul>
            </div>
          )}
        </div>
      </div>


      {/* Main Content */}
      <div className="main-content">
        {/* Left Sidebar (Prompt History) */}
        <div className="sidebar">
          <h3>My Stories</h3>
          <ul>
            {history.map((item, index) => (
              <li
                key={index}
                title={item} // Shows full prompt on hover
                onClick={() => handlePromptClick(item)}
              >
                {item.length > 30 ? item.slice(0, 30) + "..." : item}
              </li>
            ))}
          </ul>
        </div>

        {/* Center Section */}
        <div className="center-content">
          <header className="header">
            <h1>Ask.AI</h1>
            <p>Generate characters from your imagination!</p>
          </header>
          <div className="prompt-container">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your prompt..."
            ></textarea>
            <button onClick={handleGenerate} className="btn-generate">
              Generate Characters
            </button>
          </div>
          <div className="character-gallery">
            {characters.map((char, index) => (
              <div key={index} className="character-card">
                 <div className="character-container">
                <img src={char.image} alt={char.name} />
                <p className="character-name">{char.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};


export default Home;
