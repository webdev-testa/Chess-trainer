# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Chess players of all skill levels (Beginners to Club & Tournament Players) training their tactical pattern recognition, exploring master opening repertoires, and analyzing board positions with Stockfish engine assistance.

## Product Purpose

Provide a comprehensive, zero-friction, and distraction-free training hub for chess improvement. Success means players can seamlessly practice tactics with immediate feedback, study opening variations with grandmaster win-rate statistics, and analyze positions without mandatory logins, paywalls, or cluttered interfaces.

## Positioning

A unified, privacy-focused chess training suite combining:
1. **Universal Master Opening Explorer**: Live ECO recognition and grandmaster candidate move statistics from Move 1 for all openings, paired with deep sub-variation repertoires (Caro-Kann & Queen's Gambit).
2. **Multi-Source Tactical Puzzle Engine**: Instant online pool querying, official Lichess Daily puzzles, offline curated collections, user CSV/JSON dataset importing (4M+ database support), and an automated rule-based tactical theme classifier.
3. **Integrated Stockfish Engine**: Real-time evaluation and recommended best moves across all views.

## Operating Context

- **Environment**: Desktop and tablet web browsers (modern Chromium, Firefox, Safari).
- **Workflows**: Daily puzzle warm-up, targeted tactical theme drills (Forks, Pins, Skewers, Mates), opening preparation and variation memorization, custom game/position analysis.
- **Connectivity**: Hybrid online/offline with seamless fallback to local curated collections and IndexedDB when network requests fail.

## Capabilities and Constraints

- **Confirmed Capabilities**:
  - Interactive board with legal move validation and piece drag-and-drop (`chess.js` + `react-chessboard`).
  - Stockfish web worker integration with live evaluation bar (`+X.X` / `-X.X` / `M#`) and best-move hints.
  - Universal opening identification with FEN-keyed master database and Lichess Explorer API integration.
  - Multi-tier tactical puzzles with 2-level hint assistance (square highlight & directional arrows) and step-by-step walkthroughs.
  - Universal file uploader supporting Lichess Open Database CSVs and custom JSON datasets with client-side IndexedDB persistence.
  - Automated tactical theme classifier (Forks, Pins, Skewers, Discovered Attacks, Smothered Mates, Back Rank Mates, Greek Gift).
  - Live streak and accuracy statistics tracked in `localStorage`.
- **Durable Constraints**:
  - Focus on deep curated sub-variations for Caro-Kann Defense and Queen's Gambit while supporting universal exploration from Move 1.
  - Zero required backend accounts or server-side user data storage; everything persists client-side.
  - Strict performance budget with Web Workers for Stockfish and asynchronous dataset parsing to prevent UI thread blocking.

## Brand Commitments

- **Name**: Chess Trainer (♟️ Chess Trainer).
- **Tone**: Focused, elegant, high-contrast, modern dark mode with clear tactile affordances and grandmaster-grade typography.
- **Visual Commitments**: Dark slate canvas (`#0f172a`), deep surface cards (`#1e293b`), vibrant blue primary accent (`#2563eb`), clear chess piece contrast, and smooth board animations.

## Evidence on Hand

- Verified opening trees and sub-variation JSON definitions in [`src/data/openings.json`](src/data/openings.json) and [`src/data/openingTree.ts`](src/data/openingTree.ts).
- Curated offline tactical puzzles in [`src/data/samplePuzzles.ts`](src/data/samplePuzzles.ts).
- Client-side Stockfish web worker in [`public/stockfish.js`](public/stockfish.js).
- Live Lichess Explorer and Daily Puzzle API integrations.

## Product Principles

1. **Immediate Action Over Ceremony**: No splash screens, onboarding barriers, or login walls; users can make a move, solve a puzzle, or explore an opening within 1 second of opening the app.
2. **Offline Resilience First**: Every feature works offline with rich curated fallbacks and local storage persistence.
3. **Tactical & Strategic Clarity**: Every evaluation, move statistic, hint, and opening line must be legible, unambiguous, and accessible.
4. **Universal Freedom with Structured Depth**: Support free exploration of any legal position from Move 1 while providing deep, structured repertoire mastery for core openings.

## Accessibility & Inclusion

- Full keyboard navigation for move stepping (Left/Right arrows, Space for auto-play, 'F' for flip board).
- High-contrast visual cues (minimum 4.5:1 text contrast on dark surfaces).
- Screen-reader friendly ARIA live regions for turn status, check/checkmate, move notation, and puzzle solve/failure states.
- Support for `prefers-reduced-motion` across board animations.
