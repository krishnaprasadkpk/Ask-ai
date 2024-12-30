import React, { useState } from "react";
import "./../styles/Home.css";

const Home = () => {
  const [prompt, setPrompt] = useState("");
  const [characters, setCharacters] = useState([]);
  const [history, setHistory] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState(null);

  const handleGenerate = () => {
    if (!prompt.trim()) {
      alert("Please enter a prompt!");
      return;
    }

    setCharacters([]);

    const newCharacter = {
      name: "Sara",
      image: "https://via.placeholder.com/150",
      description: "Sara is a brave girl.",
    };

    setCharacters([newCharacter]);
    setHistory((prev) => [prompt, ...prev]);
    setPrompt("");
  };

  const handlePromptClick = (selectedPrompt) => {
    setPrompt(selectedPrompt);
  };

  const toggleDropdown = () => {
    setShowDropdown((prev) => !prev);
  };

  const handleCharacterClick = (character) => {
    setSelectedCharacter(character);
  };

  const closeModal = () => {
    setSelectedCharacter(null);
  };

  return (
    <div className="home-container">
      <div className="top-nav">
        <div className="logo">Ask.AI</div>
        <div className="user-section">
          <div className="profile-icon" onClick={toggleDropdown}>
            AM
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

      <div className="main-content">
        <div className="sidebar">
          <h3>My Stories</h3>
          <ul>
            {history.map((item, index) => (
              <li
                key={index}
                title={item}
                onClick={() => handlePromptClick(item)}
              >
                {item.length > 30 ? item.slice(0, 30) + "..." : item}
              </li>
            ))}
          </ul>
        </div>

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
              <div
                key={index}
                className="character-card"
                onClick={() => handleCharacterClick(char)}
              >
                <div className="character-container">
                  <img src={char.image} alt={char.name} />
                  <p className="character-name">{char.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedCharacter && (
        <div className="modal">
        <div className="modal-content">
          <div className="modal-image">
            <img src={selectedCharacter.image} alt={selectedCharacter.name} />
          </div>
          <div className="modal-details">
            <div className="modal-header">
              <h2>{selectedCharacter.name}</h2>
              <span className="close-icon" onClick={closeModal}>
                &times;
              </span>
            </div>
            <div
              className={`modal-description ${
                selectedCharacter.editable ? "editable" : ""
              }`}
              contentEditable={selectedCharacter.editable || false}
              suppressContentEditableWarning={true}
            >
              {selectedCharacter.description}
            </div>
            <div className="modal-actions">
              <button
                className="btn-customize"
                onClick={() =>
                  setSelectedCharacter((prev) => ({
                    ...prev,
                    editable: true,
                  }))
                }
              >
                Customize
              </button>
              <button
                className="btn-submit"
                onClick={() => {
                  setSelectedCharacter((prev) => ({
                    ...prev,
                    editable: false,
                  }));
                  alert("Character submitted successfully!");
                }}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </div>
  );
};

export default Home;
