import React from 'react';
import { useMatchmaking } from '../../contexts/MatchmakingContext';
import { GameType } from '../../enums/GameType';

import soloImg from '../../assets/imgs/br-solo.webp';
import duoImg from '../../assets/imgs/br-duo.webp';
import squadImg from '../../assets/imgs/br-squad.webp';

import * as S from './styles';
import { MatchStatus } from '../../enums/MatchStatus';
import { apiClient } from '../../services/api';

const matchmakings = [
	{
		type: 'Squad Matchmaking',
		total: 64,
		size: 4,
		img: squadImg,
		gameType: GameType.SQUAD,
	},
	{
		type: 'Duo Matchmaking',
		total: 64,
		size: 2,
		img: duoImg,
		gameType: GameType.DUO,
	},
	{
		type: 'Solo Matchmaking',
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
	} = useMatchmaking();

	const handleMatchmaking = async (gameType: GameType) => {
		if (isFindingMatch) {
			// Se já estiver buscando partida, cancela a fila
			await cancelMatchmaking(gameType);
		} else {
			// Se não estiver buscando partida, inicia a busca
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
						<button
							disabled={loading}
							onClick={() => handleMatchmaking(matchmaking.gameType)}
						>
							{loading
								? 'Loading...'
								: isFindingMatch
								? 'Cancelar Busca'
								: 'Buscar Partida'}
						</button>
					</S.MatchmakingInfo>
				</S.Card>
			))}
		</S.CardContainer>
	);
};
