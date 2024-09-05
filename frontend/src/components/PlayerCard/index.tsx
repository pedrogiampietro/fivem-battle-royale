import React from "react";
import { useMatchmaking } from "../../contexts/MatchmakingContext";
import { GameType } from "../../enums/GameType";

import soloImg from "../../assets/imgs/br-solo.webp";
import duoImg from "../../assets/imgs/br-duo.webp";
import squadImg from "../../assets/imgs/br-squad.webp";

import * as S from "./styles";
import { toast } from "../../lib/toast";

const matchmakings = [
  {
    type: "Squad Matchmaking",
    total: 64,
    size: 4,
    img: squadImg,
    gameType: GameType.SQUAD,
  },
  {
    type: "Duo Matchmaking",
    total: 64,
    size: 2,
    img: duoImg,
    gameType: GameType.DUO,
  },
  {
    type: "Solo Matchmaking",
    total: 64,
    size: 1,
    img: soloImg,
    gameType: GameType.SOLO,
  },
];

export const PlayerCard = () => {
  const {
    startMatchmaking,
    matchmakingCounters,
    isFindingMatch,
    cancelMatchmaking,
    loading,
    playerIsReady,
  } = useMatchmaking();

  const [currentFindingGameType, setCurrentFindingGameType] =
    React.useState<GameType | null>(null);

  const handleMatchmaking = async (gameType: GameType) => {
    if (!playerIsReady && gameType !== "SOLO") {
      toast.error("Você precisa estar pronto para buscar uma partida.");
      return;
    }

    if (isFindingMatch && currentFindingGameType === gameType) {
      setCurrentFindingGameType(null);
      await cancelMatchmaking(gameType);
    } else {
      setCurrentFindingGameType(gameType);
      await startMatchmaking(gameType);
    }
  };

  return (
    <S.CardContainer>
      {matchmakings.map((matchmaking, i) => (
        <S.Card key={i}>
          <S.CardImage src={matchmaking.img} alt={matchmaking.type} />
          <S.MatchmakingTitle>{matchmaking.type}</S.MatchmakingTitle>

          <S.MatchmakingInfo>
            <S.InfoPair>
              <S.InfoLabel>Total</S.InfoLabel>
              <S.InfoData>{matchmaking.total} Jogadores</S.InfoData>
            </S.InfoPair>
            <S.InfoPair>
              <S.InfoLabel>Jogadores na fila</S.InfoLabel>
              <S.InfoData>
                {matchmakingCounters[matchmaking.gameType]}
              </S.InfoData>
            </S.InfoPair>
            <S.InfoPair>
              <S.InfoLabel>Tamanho do time</S.InfoLabel>
              <S.InfoData>{matchmaking.size} Pessoas</S.InfoData>
            </S.InfoPair>
            <S.Button
              disabled={
                loading ||
                (isFindingMatch &&
                  currentFindingGameType !== matchmaking.gameType)
              }
              onClick={() => handleMatchmaking(matchmaking.gameType)}
            >
              {loading
                ? "Loading..."
                : isFindingMatch &&
                  currentFindingGameType === matchmaking.gameType
                ? "Cancelar Busca"
                : "Buscar Partida"}
            </S.Button>
          </S.MatchmakingInfo>
        </S.Card>
      ))}
    </S.CardContainer>
  );
};
