import React, { useState, useContext, useEffect } from "react";
import "./../styles/Home.css";
import { AuthContext } from "../utils/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';






const Home = () => {
  const { authState, logout } = useContext(AuthContext)
  const [prompt, setPrompt] = useState("");
  const [characters, setCharacters] = useState([]);
  const [history, setHistory] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const [imageUrls, setImageUrls] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingState, setLoadingState] = useState({});

  const fetchHistory  = async () => {
    try{
      const token = authState.token;
      if (!token) {
        console.error("Token not found");
        return;
      }
      const response = await axios.get("http://127.0.0.1:8000/fetch-history", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setHistory(response.data);
    }catch (error) {
      console.error("Error fetching prompt history:", error);
    }
  };
  useEffect(() => {
    // Fetch history when the component mounts
    fetchHistory();
  }, []); 


  const handleGenerate = async () => {
    // Validation to check if the prompt is empty or contains only whitespace

    if (!prompt.trim()) {
      alert("Please enter a prompt!");
      return;
    }

    setCharacters([]); // Reset the characters array
    setLoading(true);
    
    // Placeholder logic for generating characters
    // const newCharacter = {
    //   name: "Sara",
    //   image: "https://via.placeholder.com/150", // Placeholder image
    // };
    
    try{
      const token = authState.token;
      if(!token){
        console.error("Token not found");
        
        setLoading(false);
        return;
      } // or sessionStorage.getItem('token')

      const postResponse = await axios.post(
        "http://127.0.0.1:8000/generate-characters",
        {prompt: prompt},
        {
          headers:{
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const {script_id} = postResponse.data;
      if (!script_id) {
        alert("Failed to generate script ID.");
        
        setLoading(false);
        return;
      }
      console.log("scriptid:",script_id)
      
      // const imageData = { script_id }
      await axios.post(`http://127.0.0.1:8000/generate-image/${script_id}`,
        {},
        {
          headers:{
            Authorization: `Bearer ${token}`,
          },
        }
      );
      

      // if (imageResponse.data.generated_images) {
      //   setCharacters(imageResponse.data.generated_images);
      // }
      const getResponse = await axios.get(
        `http://127.0.0.1:8000/generated_characters/${script_id}`
      );
      setCharacters(getResponse.data);
      
      if (!history.some(item => item.prompt === prompt)) {
        const newHistoryItem = {
          prompt: prompt,
          characters: getResponse.data,
          generated_time: new Date().toISOString(),
        };
        console.log(newHistoryItem);
        // Save the history to the backend
        await axios.post(
          "http://127.0.0.1:8000/save-prompt",
          newHistoryItem,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // Update local history state
        setHistory(prev => [newHistoryItem, ...prev]);
      }

      
      setPrompt("");
      // if (!history.includes(prompt)) {
      //   setHistory(prev => [prompt, ...prev]);
      // }
      
      
    } catch(error){
      console.error("Error generating characters or images:", error);
      alert("Failed to generate characters. Please try again.");
    } finally {
      
      setLoading(false);
    }

    
    
  };

  const fetchImage = async (fileId) => {
    try {
      const response = await axios.get(`http://127.0.0.1:8000/fetch-image/${fileId}`, {
        responseType: 'blob',
      });

      // Create an object URL for the image blob and return it
      return URL.createObjectURL(response.data);
    } catch (error) {
      console.error("Error fetching image:", error);
      return null;
    }
  };

  useEffect(() => {
    const fetchImages = async () => {
      const updatedImageUrls = {}; // Store the image URLs for each character
      const updatedLoadingState = {};
      
      for (let char of characters) {
        updatedLoadingState[char.character_name] = true;
        const fileId = getFileIdFromUrl(char.image_url);
        if (fileId) {
          const imageUrl = await fetchImage(fileId); // Call fetchImage for each character
          if (imageUrl) {
            updatedImageUrls[char.character_name] = imageUrl; // Store it in the updatedImageUrls object
          }
        }
        updatedLoadingState[char.character_name] = false;
      }
  
      setImageUrls(updatedImageUrls); // Update state once all images are fetched
      setLoadingState(updatedLoadingState);
    };
  
    if (characters.length > 0) {
      fetchImages();
    }
  }, [characters]); // Re-run this when characters change
  


  const handlePromptClick = (selectedItem) => {
    setPrompt(selectedItem.script);
    setCharacters(selectedItem.characters)
  };

  const toggleDropdown = () => {
    setShowDropdown((prev) => !prev);
  };


  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Helper function to extract file ID from Google Drive URL
  const getFileIdFromUrl = (url) => {
    const regex = /(?:\/d\/)(.*?)(?:\/|$)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  


  return (
    <div className="home-container">
      {/* Top Navigation */}
      <div className="top-nav">
        <div className="logo">Ask.AI</div>
        <div className="user-section">
          <div className="profile-icon" onClick={toggleDropdown}>
            {authState.name ? authState.name.slice(0, 2).toUpperCase() : "AM"}
          </div>
          {showDropdown && (
            <div className="dropdown-menu">
              <ul>
                <li>{authState.name || "Guest"}</li>
                <li onClick={handleLogout}>Log out</li>
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
                title={item.script} // Shows full prompt on hover
                onClick={() => handlePromptClick(item)}
              >
                {item.script.length > 30 ? item.script.slice(0, 30) + "..." : item}
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

          {loading && (
            <div className="progress-container">
              <Box sx={{ display: 'flex' }} className="centered-progress">
                <CircularProgress size={40} color="secondary" />
              </Box>
            </div>
          )}

          <div className="character-gallery">
            {characters.length > 0 &&
              characters.map((char, index) => (
                <div key={index} className="character-card">
                  <div className="character-container">
                    {loadingState[char.character_name] ? (
                      <CircularProgress size={40} color="secondary" />
                    ) : (
                      <img
                        src={imageUrls[char.character_name]} // Use the fetched image URL
                        alt={char.character_name}
                        className="character-image"
                      />
                    )}
                    <p className="character-name">{char.character_name}</p>
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
