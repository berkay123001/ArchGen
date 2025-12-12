
# ArchGen AI - System Architect Simulator

ArchGen AI is an interactive, AI-powered software architecture design tool. It leverages **Google Gemini 3.0 Pro** and **Gemini 2.5 Flash** models to help developers visualize, analyze, and learn about distributed systems, microservices, and cloud infrastructure.

![ArchGen Dashboard](https://via.placeholder.com/1200x600?text=ArchGen+AI+Dashboard)

## 🚀 Features

### 1. 🏗️ AI-Powered Design Canvas
- **Text-to-Architecture:** Describe your project (e.g., "A scalable video streaming platform like Netflix") and the AI generates a complete, layered system diagram.
- **Visual Editing:** Drag & drop nodes, create connections manually, and delete components.
- **Traffic Simulation:** Visualize data flow with animated packets traversing your system to understand bottlenecks.

### 2. 🧠 AI Architect Chat
- **Context-Aware:** Chat with an AI "Senior Architect" that understands your current diagram.
- **Live Modifications:** Ask the AI to "Add a Redis cache" or "Replace SQL with NoSQL," and watch the diagram update instantly.
- **Highlighting:** The AI highlights relevant nodes while explaining concepts.

### 3. 🔍 System Review & Critique
- **Deep Analysis:** The AI acts as an auditor, identifying single points of failure (SPOF), security risks, and scalability issues.
- **Scoring:** Get a 0-100 score on Scalability, Availability, Complexity, Cost, and Security.
- **Auto-Improvement:** One-click optimization where the AI refactors your system to fix identified flaws (e.g., adding Load Balancers or Replicas) using a "Pragmatic Professional" approach.

### 4. 🎮 Game Mode (Challenge & Tutorial)
- **Junior Architect Challenge:** The AI generates a "broken" system scenario (e.g., "Database is crashing under load"). Your mission is to fix it.
- **Tutorial Mode:** Guided step-by-step interactive lessons on system design patterns.
- **Validation:** Submit your solution and get instant AI grading and feedback.

### 5. 👁️ Vision Studio
- **Diagram Analysis:** Upload a screenshot or photo of a whiteboard diagram. The AI analyzes the image and explains the architecture.
- **Image Generation:** Generate conceptual architectural visualizations using Gemini's image generation capabilities.

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript
- **Styling:** Tailwind CSS
- **AI Models:** Google Gemini 2.5 Flash (Latency-sensitive tasks), Gemini 3.0 Pro (Complex reasoning), Gemini 3.0 Pro Image (Vision).
- **Library:** `@google/genai` SDK

## 📦 Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/archgen-ai.git
    cd archgen-ai
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Setup:**
    Create a `.env` file in the root directory. You must obtain an API key from [Google AI Studio](https://aistudio.google.com/).
    
    ```env
    API_KEY=your_google_gemini_api_key_here
    ```

    > **⚠️ Security Warning:** Never commit your `.env` file or hardcode your API key in the source code.

4.  **Run the application:**
    ```bash
    npm start
    ```

## 🛡️ License

This project is licensed under the MIT License.
