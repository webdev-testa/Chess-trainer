import { classifyPuzzle } from "./puzzleClassifier";
import type { Puzzle } from "../data/samplePuzzles";

// Capitalize theme names cleanly
function formatThemeName(theme: string): string {
  const t = theme.trim();
  if (!t) return "";
  if (/^mateIn\d+$/i.test(t)) return `Mate in ${t.replace(/\D/g, "")}`;
  return t.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()).trim();
}

export function parseLichessCsv(csvText: string, maxLimit = 5000): Puzzle[] {
  const lines = csvText.split(/\r?\n/);
  const puzzles: Puzzle[] = [];

  let startIndex = 0;
  if (lines[0] && lines[0].toLowerCase().includes("puzzleid")) {
    startIndex = 1;
  }

  for (let i = startIndex; i < lines.length && puzzles.length < maxLimit; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Lichess CSV schema:
    // 0: PuzzleId
    // 1: FEN
    // 2: Moves (space separated UCI)
    // 3: Rating
    // 4: RatingDeviation
    // 5: Popularity
    // 6: NbPlays
    // 7: Themes (space separated)
    // 8: GameUrl
    // 9: OpeningTags
    const cols = line.split(",");
    if (cols.length < 3) continue;

    const id = cols[0] || `puzzle-${puzzles.length + 1}`;
    const fen = cols[1];
    const movesStr = cols[2] || "";
    const moves = movesStr.trim().split(/\s+/).filter(Boolean);

    if (!fen || moves.length === 0) continue;

    const rating = parseInt(cols[3], 10) || 1500;
    const rawThemesStr = cols[7] || "";
    const rawThemes = rawThemesStr.trim().split(/\s+/).filter(Boolean);

    let themes = rawThemes.map(formatThemeName).filter(Boolean);
    const gameUrl = cols[8] || "";

    if (themes.length === 0) {
      const autoClassified = classifyPuzzle(fen, moves);
      themes = autoClassified.themes;
    }

    puzzles.push({
      id,
      fen,
      moves,
      rating,
      themes: themes.length > 0 ? themes : ["Tactics"],
      description: `Lichess Puzzle #${id}`,
      gameUrl: gameUrl || undefined,
    });
  }

  return puzzles;
}

export function parseJsonPuzzles(jsonText: string): Puzzle[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawArray: any[] = JSON.parse(jsonText);
  if (!Array.isArray(rawArray)) return [];

  return rawArray.map((item, idx) => {
    const id = item.id || `custom-${idx + 1}`;
    const fen = item.fen;
    const moves = Array.isArray(item.moves)
      ? item.moves
      : typeof item.moves === "string"
        ? item.moves.trim().split(/\s+/)
        : [];

    let themes: string[] = Array.isArray(item.themes)
      ? item.themes.map(formatThemeName)
      : [];
    let rating = typeof item.rating === "number" ? item.rating : 0;
    let description = item.description || "";

    if (themes.length === 0 || !rating) {
      const autoClassified = classifyPuzzle(fen, moves);
      if (themes.length === 0) themes = autoClassified.themes;
      if (!rating) rating = autoClassified.estimatedRating;
      if (!description) description = autoClassified.description;
    }

    return {
      id,
      fen,
      moves,
      rating: rating || 1500,
      themes: themes.length > 0 ? themes : ["Tactics"],
      description: description || `Custom Puzzle #${id}`,
      gameUrl: item.gameUrl,
    };
  });
}

// Universal parser auto-detecting format
export function parseUniversalPuzzleFile(fileContent: string, maxLimit = 5000): Puzzle[] {
  const content = fileContent.trim();
  if (!content) return [];

  if (content.startsWith("[") || content.startsWith("{")) {
    try {
      return parseJsonPuzzles(content);
    } catch {
      // fallback to CSV
    }
  }

  return parseLichessCsv(content, maxLimit);
}
