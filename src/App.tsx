import { useState } from "react";
import { ChessBoard } from "./components/ChessBoard";
import { PuzzleBoard } from "./components/PuzzleBoard";
import { OpeningExplorer } from "./components/OpeningExplorer";
import "./App.css";

function App() {
  const [activeTab, setActiveTab] = useState<"board" | "puzzles" | "openings">(
    "board",
  );

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">♟️ Chess Trainer</h1>
          <nav className="nav-buttons">
            <button
              onClick={() => setActiveTab("board")}
              className={`nav-btn ${activeTab === "board" ? "active" : ""}`}
            >
              Play
            </button>
            <button
              onClick={() => setActiveTab("puzzles")}
              className={`nav-btn ${activeTab === "puzzles" ? "active" : ""}`}
            >
              Puzzles
            </button>
            <button
              onClick={() => setActiveTab("openings")}
              className={`nav-btn ${activeTab === "openings" ? "active" : ""}`}
            >
              Openings
            </button>
          </nav>
        </div>
      </header>

      <main className="app-main">
        {activeTab === "board" && <ChessBoard />}
        {activeTab === "puzzles" && <PuzzleBoard />}
        {activeTab === "openings" && <OpeningExplorer />}
      </main>
    </div>
  );
}

export default App;
