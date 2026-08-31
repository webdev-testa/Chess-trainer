import { useState, useEffect, useCallback, useRef } from "react";

export interface ExplorerMove {
  san: string;
  uci: string;
  white: number;
  draws: number;
  black: number;
  averageRating: number;
  totalGames: number;
  whiteWinPct: number;
  drawPct: number;
  blackWinPct: number;
}

export interface ExplorerGame {
  id: string;
  white: { name: string; rating: number };
  black: { name: string; rating: number };
  year: number;
  winner?: "white" | "black" | "draw";
}

export interface ExplorerData {
  opening: { eco: string; name: string } | null;
  moves: ExplorerMove[];
  topGames: ExplorerGame[];
  totalGames: number;
}

export function useLichessExplorer(fen: string) {
  const [data, setData] = useState<ExplorerData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setTokenState] = useState<string>(() => {
    return localStorage.getItem("lichess_api_token") || "";
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const saveToken = useCallback((newToken: string) => {
    setTokenState(newToken);
    if (newToken.trim()) {
      localStorage.setItem("lichess_api_token", newToken.trim());
    } else {
      localStorage.removeItem("lichess_api_token");
    }
  }, []);

  const fetchExplorerData = useCallback(
    async (fenString: string) => {
      if (!fenString) return;

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsLoading(true);
      setError(null);

      try {
        const headers: Record<string, string> = {
          Accept: "application/json",
        };
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const url = `https://explorer.lichess.ovh/masters?fen=${encodeURIComponent(
          fenString
        )}&topGames=5`;

        const res = await fetch(url, {
          headers,
          signal: controller.signal,
        });

        if (res.status === 401) {
          setError(
            "Lichess API requires an optional Personal Access Token for live master database queries."
          );
          setData(null);
          setIsLoading(false);
          return;
        }

        if (!res.ok) {
          throw new Error(`Explorer request returned status ${res.status}`);
        }

        const json = await res.json();

        // Process moves with calculated percentages
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const processedMoves: ExplorerMove[] = (json.moves || []).map((m: any) => {
          const total = (m.white || 0) + (m.draws || 0) + (m.black || 0);
          const safeTotal = total > 0 ? total : 1;
          return {
            san: m.san,
            uci: m.uci,
            white: m.white || 0,
            draws: m.draws || 0,
            black: m.black || 0,
            averageRating: m.averageRating || 2500,
            totalGames: total,
            whiteWinPct: Math.round(((m.white || 0) / safeTotal) * 100),
            drawPct: Math.round(((m.draws || 0) / safeTotal) * 100),
            blackWinPct: Math.round(((m.black || 0) / safeTotal) * 100),
          };
        });

        const totalPositionGames =
          (json.white || 0) + (json.draws || 0) + (json.black || 0);

        setData({
          opening: json.opening || null,
          moves: processedMoves,
          topGames: json.topGames || [],
          totalGames: totalPositionGames,
        });
      } catch (err: unknown) {
        if ((err as Error).name !== "AbortError") {
          setError(
            "Unable to connect to Lichess Opening Explorer. Check internet or add a token."
          );
          setData(null);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    fetchExplorerData(fen);
  }, [fen, fetchExplorerData]);

  return {
    data,
    isLoading,
    error,
    token,
    saveToken,
    refetch: () => fetchExplorerData(fen),
  };
}
