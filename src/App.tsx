import { useState, lazy, Suspense } from "react";
import "./App.css";

const ChessBoard = lazy(() =>
  import("./components/ChessBoard").then((m) => ({ default: m.ChessBoard }))
);
const PuzzleBoard = lazy(() =>
  import("./components/PuzzleBoard").then((m) => ({ default: m.PuzzleBoard }))
);
const OpeningExplorer = lazy(() =>
  import("./components/OpeningExplorer").then((m) => ({
    default: m.OpeningExplorer,
  }))
);

function TabLoader() {
  return (
    <div
      className="flex flex-1 items-center justify-center p-12 text-slate-300"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        <span className="text-sm font-medium">Loading view...</span>
      </div>
    </div>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState<"board" | "puzzles" | "openings">(
    "board",
  );

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">♟️ Chess Trainer</h1>
          <nav
            className="nav-buttons"
            role="tablist"
            aria-label="Application Tabs"
          >
            <button
              id="tab-board"
              role="tab"
              aria-selected={activeTab === "board"}
              aria-controls="panel-board"
              tabIndex={activeTab === "board" ? 0 : -1}
              onClick={() => setActiveTab("board")}
              className={`nav-btn ${activeTab === "board" ? "active" : ""}`}
            >
              Play
            </button>
            <button
              id="tab-puzzles"
              role="tab"
              aria-selected={activeTab === "puzzles"}
              aria-controls="panel-puzzles"
              tabIndex={activeTab === "puzzles" ? 0 : -1}
              onClick={() => setActiveTab("puzzles")}
              className={`nav-btn ${activeTab === "puzzles" ? "active" : ""}`}
            >
              Puzzles
            </button>
            <button
              id="tab-openings"
              role="tab"
              aria-selected={activeTab === "openings"}
              aria-controls="panel-openings"
              tabIndex={activeTab === "openings" ? 0 : -1}
              onClick={() => setActiveTab("openings")}
              className={`nav-btn ${activeTab === "openings" ? "active" : ""}`}
            >
              Openings
            </button>
          </nav>
        </div>
      </header>

      <main className="app-main">
        <Suspense fallback={<TabLoader />}>
          <div
            id="panel-board"
            role="tabpanel"
            tabIndex={0}
            aria-labelledby="tab-board"
            className={`tab-panel ${activeTab === "board" ? "active" : "hidden"}`}
          >
            {activeTab === "board" && <ChessBoard />}
          </div>
          <div
            id="panel-puzzles"
            role="tabpanel"
            tabIndex={0}
            aria-labelledby="tab-puzzles"
            className={`tab-panel ${activeTab === "puzzles" ? "active" : "hidden"}`}
          >
            {activeTab === "puzzles" && <PuzzleBoard />}
          </div>
          <div
            id="panel-openings"
            role="tabpanel"
            tabIndex={0}
            aria-labelledby="tab-openings"
            className={`tab-panel ${activeTab === "openings" ? "active" : "hidden"}`}
          >
            {activeTab === "openings" && <OpeningExplorer />}
          </div>
        </Suspense>
      </main>
    </div>
  );
}

export default App;
