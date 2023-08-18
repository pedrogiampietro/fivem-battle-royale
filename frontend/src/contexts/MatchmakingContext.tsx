import React, {
  createContext,
  useState,
  useCallback,
  useEffect,
  useContext,
  useRef,
} from "react";
import { apiClient } from "../services/api";
import { GameType } from "../enums/GameType";
import { Socket, io } from "socket.io-client";

interface MatchmakingContextData {
  match: any;
  matchmakingCounters: { SOLO: number; DUO: number; SQUAD: number };
  startMatchmaking: (gameType: GameType) => Promise<void>;
  isFindingMatch: boolean;
  setIsFindingMatch: any;
  cancelMatchmaking: any;
  loading: any;
  playerIsReady: any;
  setPlayerIsReady: any;
}

interface PropsI {
  children: React.ReactNode;
}

const MatchmakingContext = createContext<MatchmakingContextData>(
  {} as MatchmakingContextData
);

export const MatchmakingProvider: React.FC<PropsI> = ({ children }) => {
  const [isFindingMatch, setIsFindingMatch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [match, setMatch] = useState<any>(null);
  const [matchmakingCounters, setMatchmakingCounters] = useState({
    SOLO: 0,
    DUO: 0,
    SQUAD: 0,
  });
  const [playerIsReady, setPlayerIsReady] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const startMatchmaking = async (gameType: GameType) => {
    const user = JSON.parse(localStorage.getItem("userData") || "{}");

    if (!user.id) {
      throw new Error("You need to login before starting matchmaking");
    }

    setLoading(true);

    let playersToMatchmake: any[] = [];

    if (gameType === GameType.SOLO) {
      playersToMatchmake.push(user);
    } else {
      playersToMatchmake = await getGroupPlayers();
    }

    try {
      const response = await apiClient().post(
        "/matchmaking/addPlayerToMatchmaking",
        {
          players: playersToMatchmake,
          gameType,
        }
      );

      if (response.data && !response.data.error) {
        setIsFindingMatch(true);
      } else {
        // Tratar erro aqui, se necessário
      }
    } catch (err: any) {
    } finally {
      setLoading(false);
    }
  };

  const getGroupPlayers = async () => {
    const user = JSON.parse(localStorage.getItem("userData") || "{}");

    try {
      const response = await apiClient().get(`/group/groupOfUser/${user.id}`);
      const data = JSON.parse(response.data);
      return data.group.players;
    } catch (error) {
      console.error("Failed to fetch group players:", error);
      return [];
    }
  };

  const cancelMatchmaking = async (gameType: any) => {
    const user = JSON.parse(localStorage.getItem("userData") || "{}");

    if (!user.id)
      throw new Error("You need to login before starting matchmaking");

    setLoading(true); // Inicia o loading
    try {
      // Lógica para cancelar o matchmaking
      // Chama a API do servidor para remover o jogador do matchmaking
      const response = await apiClient().post(
        "/matchmaking/cancelMatchmaking",
        {
          userId: user.id,
          gameType,
        }
      );

      if (response.data && !response.data.error) {
        setIsFindingMatch(false);
      } else {
        // Tratar erro aqui, se necessário.
      }
    } catch (err: any) {
      // Tratar erros de rede ou outros erros aqui
    } finally {
      setLoading(false); // Finaliza o loading
    }
  };

  const handleSocketEvents = useCallback((socket: Socket) => {
    socket.on("game-started", (data) => console.log("Game started:", data));
    socket.on("player-added", (data) =>
      console.log("A player has been added to the match:", data)
    );
    socket.on("player-left", (data) =>
      console.log("A player has left the match:", data)
    );

    socket.on("matchmakingCountersChanged", (data) => {
      console.log("Received matchmakingCountersChanged event:", data);

      // Atualiza os contadores corretamente para cada tipo de jogo
      setMatchmakingCounters((prevCounters) => ({
        SOLO: data.SOLO !== undefined ? data.SOLO : prevCounters.SOLO,
        DUO: data.DUO !== undefined ? data.DUO : prevCounters.DUO,
        SQUAD: data.SQUAD !== undefined ? data.SQUAD : prevCounters.SQUAD,
      }));
    });
  }, []);

  useEffect(() => {
    console.log("Establishing socket connection.");

    socketRef.current = io("http://localhost:5000", {
      withCredentials: true,
    });

    handleSocketEvents(socketRef.current);

    if (match) {
      socketRef.current.emit("game-started", match.id);
      console.log("Emitting game-started with match id:", match.id);
    }

    return () => {
      console.log("Disconnecting socket.");
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [match, handleSocketEvents]);

  return (
    <MatchmakingContext.Provider
      value={{
        match,
        matchmakingCounters,
        startMatchmaking,
        isFindingMatch,
        setIsFindingMatch,
        cancelMatchmaking,
        loading,
        playerIsReady,
        setPlayerIsReady,
      }}
    >
      {children}
    </MatchmakingContext.Provider>
  );
};

export function useMatchmaking(): MatchmakingContextData {
  const context = useContext(MatchmakingContext);
  if (!context)
    throw new Error("useMatchmaking must be used within a MatchmakingProvider");
  return context;
}
