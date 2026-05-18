# Visual AI Workflow Orchestrator 🌐🧠🔊

A premium, interactive visual AI workflow orchestration platform built with **React Flow** on the frontend and **FastAPI** on the backend. This application allows users to visually compose, validate, and execute complex multi-stage AI workflows (including LLMs, custom dynamic templates, conditional branching logic, external APIs, and Text-to-Speech synthesis).

---

## 🚀 Quick Start Guide

### 📋 Prerequisites
Make sure you have the following installed on your system:
* **Node.js** (v16.0.0 or higher) & **npm**
* **Python** (v3.9 or higher) & **pip**

---

### 📥 1. Setup the Backend (FastAPI)

The backend handles the graph validation (DAG check via Kahn's algorithm), sequential orchestrations, API calls, and speech generations.

1. Open a new terminal window and navigate to the `backend` folder:
   ```bash
   cd backend
   ```

2. Install the required Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
   *Note: If a `requirements.txt` file is not present, you can install the core modules directly:*
   ```bash
   pip install fastapi uvicorn openai google-generativeai httpx python-dotenv
   ```

3. **Configure Environment Keys (Optional but recommended for AI features)**:
   Create a `.env` file inside the `backend/` directory and add your API keys:
   ```env
   OPENAI_API_KEY=your-openai-api-key-here
   GEMINI_API_KEY=your-gemini-api-key-here
   ```
   *If no API keys are provided, the workflow engine will automatically use mock fallbacks to simulate AI responses and voice generation without failing.*

4. Launch the FastAPI server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   The backend will be live at `http://localhost:8000`.

---

### 🎨 2. Setup the Frontend (React Flow)

The frontend manages the drag-and-drop canvas, interactive state tracking, and live processing animations.

1. Open a second terminal window and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```

2. Install the Node packages:
   ```bash
   npm install
   ```

3. Start the React development server:
   ```bash
   npm start
   ```
   The application will automatically compile and open in your default browser at `http://localhost:3000`.

---

## 🛠️ How to Test & Demo the App

1. **Create Nodes**: Drag nodes from the top panel (e.g., *Input*, *Text*, *LLM*, *Speech*, *Output*) onto the canvas.
2. **Configure Fields**:
   * Double click / select a node to focus it.
   * Write template prompts. In the **Text Node**, typing `{{my_variable}}` will instantly spawn a Left connection handle dynamically on render!
3. **Connect Nodes**: Connect the Right handles (sources) of upstream nodes to the Left handles (targets) of downstream nodes.
4. **Load Pre-built Template**:
   * Click **Creator Template** in the bottom panel to instantly load a fully configured pipeline converting a *"Rough Idea"* into a *"YouTube Video Script"* written by GPT-4o, converted into an *"Audible AI Voiceover"*, and delivered to the *"Output Node"*.
5. **Run the Pipeline**:
   * Click **Run Pipeline** in the bottom panel.
   * The backend validates the graph (preventing cycles/loops).
   * Watch the real-time visual highlight engine glow blue while processing and turn green when complete.
   * Press **Play** on the integrated audio player inside the Speech/Output node to hear your real-time generated AI audio clip!
6. **Export & Import**: Save your custom canvas workflows to `.json` files via **Export** and reload them instantly via **Import**.
