import React, { useState, useEffect } from 'react';
import * as S from './styles';
import { FaPlus, FaCheck } from 'react-icons/fa';
import { useMatchmaking } from '../../contexts/MatchmakingContext';
import { GameType } from '../../enums/GameType';

export const Group = ({ userData }: any) => {
	const [expandedCard, setExpandedCard] = useState<number | null>(null);
	const [playerReady, setPlayerReady] = useState(false);
	const { setMatchmakingStatus } = useMatchmaking();

	const handleToggleCard = (cardIndex: number) => {
		setExpandedCard((prevExpandedCard) =>
			prevExpandedCard === cardIndex ? null : cardIndex
		);
	};

	useEffect(() => {
		setMatchmakingStatus(playerReady);
	}, [playerReady, setMatchmakingStatus]);

	const isOwner = true;

	return (
		<>
			<S.GroupSection>
				<header>
					<strong>GRUPO</strong>
				</header>
				<S.InnerGroupSection>
					<S.PlayerBox>
						<div style={{ display: 'flex', alignItems: 'center' }}>
							<S.Avatar src={userData?.avatar} alt='user avatar' />
							<strong>Você</strong>
							{isOwner && <S.CrownIcon />}
						</div>
						<S.StatusButton
							playerReady={playerReady}
							onClick={() => setPlayerReady(!playerReady)}
						>
							{playerReady && <FaCheck />}
							PRONTO
						</S.StatusButton>
					</S.PlayerBox>
					{[1, 2, 3].map((cardIndex) => (
						<div key={cardIndex}>
							<S.AddPlayerBox
								onClick={() => handleToggleCard(cardIndex)}
								data-index={cardIndex}
							>
								<S.InviteIcon>
									<FaPlus size={20} />
								</S.InviteIcon>
							</S.AddPlayerBox>
							{expandedCard === cardIndex && (
								<S.CollapseWrapper isOpen={expandedCard === cardIndex}>
									<S.SearchPlayersContent>
										<S.HeaderContent>
											<strong>CONVIDAR</strong>
										</S.HeaderContent>
										<S.DescriptionText>
											chame jogadores para o seu grupo.
										</S.DescriptionText>
										<S.SearchBox>
											<S.SearchInput
												type='search'
												placeholder='Procurar jogador'
											/>
											<S.SearchIcon />
										</S.SearchBox>
										<S.FriendsSection>
											<S.NoResultText>Não há resultados</S.NoResultText>
										</S.FriendsSection>
									</S.SearchPlayersContent>
								</S.CollapseWrapper>
							)}
						</div>
					))}
				</S.InnerGroupSection>
			</S.GroupSection>
		</>
	);
};
