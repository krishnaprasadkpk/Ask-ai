import React, { useState } from "react";
import "./../styles/Home.css";

const Home = () => {
  const [prompt, setPrompt] = useState("");
  const [characters, setCharacters] = useState([]);

  const handleGenerate = () => {
    // Placeholder logic for generating characters
    const newCharacter = {
      name: "John Doe",
      image: "https://via.placeholder.com/150", // Placeholder image
    };
    setCharacters((prev) => [...prev, newCharacter]);
  };

  return (
    <div className="home-container">
      <header className="header">
        <h1>Ask.AI</h1>
        <p>Generate characters from your imagination!</p>
      </header>
      <main>
        <div className="prompt-container">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your character prompt..."
          ></textarea>
          <button onClick={handleGenerate} className="btn-generate">
            Generate Character
          </button>
        </div>
        <div className="character-gallery">
          {characters.map((char, index) => (
            <div key={index} className="character-card">
              <img src={char.image} alt={char.name} />
              <p className="character-name">{char.name}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Home;
