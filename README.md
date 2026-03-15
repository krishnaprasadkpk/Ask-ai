# Ask-AI

An AI-powered platform that analyzes movie scripts and short stories to automatically generate character profiles and visuals. Upload a script, and Ask-AI extracts characters with their traits using the Gemini API and generates matching images using DALL·E.

---

## Features

- **Script & Story Upload** — Upload movie scripts or short stories in text format
- **AI Character Extraction** — Automatically identifies characters and extracts personality traits, descriptions, and roles using Google Gemini API
- **Visual Generation** — Generates character images based on extracted features using DALL·E API
- **User Authentication** — Secure login and signup with JWT-based authentication
- **Full Stack** — React.js frontend with a FastAPI backend

---

## Tech Stack

**Frontend**
- React.js
- JavaScript, CSS, HTML

**Backend**
- FastAPI (Python)
- MongoDB
- JWT Authentication

**AI / APIs**
- Google Gemini API — script analysis and character extraction
- DALL·E API — character image generation

---

## Project Structure

```
Ask-ai/
├── ask.ai_frontend/     # React.js frontend
│   └── src/
├── backend/             # FastAPI backend
│   ├── routes/
│   ├── models/
│   └── main.py
├── test.py
└── README.md
```

---

## Getting Started

### Prerequisites

- Python 3.9+
- Node.js 16+
- MongoDB
- Gemini API key
- OpenAI API key (for DALL·E)

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
```

Create a `.env` file in the `backend/` directory:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key
```

Run the backend:

```bash
uvicorn main:app --reload
```

### Frontend Setup

```bash
cd ask.ai_frontend
npm install
npm start
```

The app will run at `http://localhost:3000`

---

## How It Works

1. User signs up / logs in
2. Uploads a movie script or short story
3. Backend sends the script to **Gemini API** for NLP analysis
4. Gemini extracts character names, traits, and descriptions
5. Each character's description is sent to **DALL·E API** to generate a visual
6. Characters and their images are displayed on the frontend

---

## Author

**Krishnaprasad K**
- GitHub: [@krishnaprasadkpk](https://github.com/krishnaprasadkpk)
- LinkedIn: [linkedin.com/in/krishnaprasad-kpk](https://www.linkedin.com/in/krishnaprasad-kpk/)
- Email: krishnaprasadk815@gmail.com
