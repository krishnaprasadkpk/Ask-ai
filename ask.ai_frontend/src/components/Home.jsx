import React, { useState, useContext, useEffect, useCallback } from "react";
import "./../styles/Home.css";
import { AuthContext } from "../utils/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import { MdAddCircleOutline } from "react-icons/md";
import ReactModal from "react-modal";
import { AiOutlineClose } from "react-icons/ai";
import { MdDeleteOutline } from "react-icons/md";


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
  const [selectedImage, setSelectedImage] = useState(null);

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
  };

  const handleDownloadImage = () => {
    if (selectedImage) {
      const link = document.createElement("a");
      link.href = selectedImage;
      const characterName = Object.keys(imageUrls).find(
        (name) => imageUrls[name] === selectedImage
      ) || "Character Name";
      
      link.download = `${characterName}.jpg`; 
      link.click();
    }
  };

  const fetchHistory = useCallback(async () => {
    try {
      const token = authState?.token;
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
    } catch (error) {
      console.error("Error fetching prompt history:", error);
    }
  }, [authState?.token]);
  useEffect(() => {
    // Fetch history when the component mounts
    fetchHistory();
  }, [fetchHistory]); 


  const handleGenerate = async () => {
    

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

      // const generatedCharacters = getResponse.data;

      // const newHistoryItem = {
      //   script_id: script_id,
      //   script: prompt,  // Make sure this matches your backend expected format
      //   characters: generatedCharacters.map(char => ({
      //     character_name: char.character_name,
      //     character_description: char.character_description,
      //     image_url: char.image_url
      //   })),
        
      // };
      
      
      

          // Update local history state
      // setHistory(prevHistory => [newHistoryItem, ...prevHistory]);
      

      
      await fetchHistory();
      // if (!history.includes(prompt)) {
      //   setHistory(prev => [prompt, ...prev]);
      // }
      
      
    } catch(error){
      console.error("Error generating characters or images:", error);
      // alert("Failed to generate characters. Please try again.");
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
      const updatedImageUrls = {};
      const updatedLoadingState = {};

      characters.forEach(char => {
        updatedLoadingState[char.character_name] = true;
      });
      
      for (let char of characters) {
        updatedLoadingState[char.character_name] = true;
        const fileId = getFileIdFromUrl(char.image_url);
        if (fileId) {
          const imageUrl = await fetchImage(fileId); 
          if (imageUrl) {
            updatedImageUrls[char.character_name] = imageUrl; 
          }
        }
        updatedLoadingState[char.character_name] = false;
      }
  
      setImageUrls(updatedImageUrls); 
      setLoadingState(updatedLoadingState);
    };
  
    if (characters.length > 0) {
      fetchImages();
    }
  }, [characters]); 
  


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

  //  extract file ID from Google Drive URL
  const getFileIdFromUrl = (url) => {
    const regex = /(?:\/d\/)(.*?)(?:\/|$)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const handleNewScript = () => {
    setPrompt(""); 
    setCharacters([]); 
  };

  const handleDeleteScript = async (scriptId, e) => {
    e.stopPropagation(); 
    
    try {
      const token = authState.token;
      if (!token) {
        console.error("Token not found");
        return;
      }

      // delete endpoint
      await axios.delete(`http://127.0.0.1:8000/delete-script/${scriptId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Update the history state after successful deletion
      setHistory(prevHistory => prevHistory.filter(item => item.script_id !== scriptId));

      
      if (prompt && characters.length > 0) {
        const currentScript = history.find(item => item.script === prompt);
        if (currentScript && currentScript.script_id === scriptId) {
          setPrompt("");
          setCharacters([]);
        }
      }
    } catch (error) {
      console.error("Error deleting script:", error);
      alert("Failed to delete script. Please try again.");
    }

  }


  return (
    <div className="home-container">
      {/* Top Navigation */}
      <div className="top-nav">
        <div className="logo">Ask.AI</div>
        <div className="user-section">
          <div className="profile-icon" onClick={toggleDropdown}>
            {authState.name ? authState.name.slice(0, 2).toUpperCase() : "GU"}
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
          <div className = "sidebar-header">
            <h3>My Stories</h3>
            <MdAddCircleOutline
                onClick={handleNewScript}
                style={{
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#1976d2", // Stylish color
                }}
                titleAccess="Create New Script"
            />
          </div>
          <ul>
            {history.slice().reverse().map((item, index) => (
              <li
                key={index}
                title={item.script} 
                onClick={() => handlePromptClick(item)}
              >
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.script.length > 30 ? item.script.slice(0, 30) + "..." : item.script}
                </span>
                <MdDeleteOutline
                  onClick={(e) => handleDeleteScript(item.script_id, e)}
                  style={{
                    cursor: 'pointer',
                    fontSize: '20px',
                    color: 'pink',
                    marginLeft: '8px',
                    opacity: 1,
                    transition: 'opacity 0.2s ease',
                  }}
                  className="delete-icon"
                  title="Delete script"
                />
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
              placeholder="Enter your Script..."
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
                        src={imageUrls[char.character_name]} 
                        alt={char.character_name}
                        className="character-image"
                        onClick={() => handleImageClick(imageUrls[char.character_name])}
                      />
                    )}
                    <p className="character-name">{char.character_name}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      <ReactModal
        isOpen={!!selectedImage}
        onRequestClose={handleCloseModal}
        contentLabel="Image Modal"
        className="image-modal"
        overlayClassName="image-modal-overlay"
        ariaHideApp={false}
      >
        <div className="modal-content">
          <AiOutlineClose 
            className="close-icon" 
            onClick={handleCloseModal} 
          />
          <img src={selectedImage} alt="Large view" className="large-image" />
          <p className="character-modal-name">
            {Object.keys(imageUrls).find(
              (name) => imageUrls[name] === selectedImage
            ) || "Character Name"}
          </p>
          <button onClick={handleDownloadImage} className="btn-download">
            Download
          </button>
          
        </div>
      </ReactModal>  

    </div>
  );
};


export default Home;
