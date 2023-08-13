import React, { useState, useEffect } from 'react';
import * as S from './styles';
import { FaPlus, FaCheck } from 'react-icons/fa';
import { useMatchmaking } from '../../contexts/MatchmakingContext';
import { apiClient } from '../../services/api';

export const Group = ({ userData }: any) => {
	const [expandedCard, setExpandedCard] = useState<number | null>(null);
	const { playerIsReady, setPlayerIsReady } = useMatchmaking();
	const [friendList, setFriendList] = useState<string[]>([]);
	const [searchValue, setSearchValue] = useState('');
	const [groupPlayers, setGroupPlayers] = useState<any[]>([]);

	const isOwner = true;

	const handleToggleCard = (cardIndex: number) => {
		setExpandedCard((prevExpandedCard) =>
			prevExpandedCard === cardIndex ? null : cardIndex
		);
	};

	useEffect(() => {
		const fetchGroups = async () => {
			try {
				const response = await apiClient().get(
					`/group/groupOfUser/${userData.id}`
				);

				const data = JSON.parse(response.data);

				setGroupPlayers(data.group.players);
			} catch (error) {
				console.error('Failed to fetch groups:', error);
			}
		};

		fetchGroups();
	}, [userData.id]);

	const handleInviteFriend = async (friendName: string) => {
		try {
			const response = await apiClient().get(
				`/group/users/search?username=${friendName}`
			);

			const parsedResponse =
				typeof response.data === 'string'
					? JSON.parse(response.data)
					: response.data;

			if (!parsedResponse || !parsedResponse.users) {
				console.warn('Unexpected response:', parsedResponse);
				return;
			}

			const friendData = parsedResponse.users && parsedResponse.users[0];

			if (!friendData) {
				console.warn('No friend data found in response:', parsedResponse);
				return;
			}

			const inviteResponse = await apiClient().post('/group/invite', {
				inviterUserId: userData.id,
				invitedUserId: friendData.id,
			});

			if (inviteResponse.data && inviteResponse.data.message) {
				alert(inviteResponse.data.message);
				// Se você quiser armazenar o groupId em algum lugar no front-end:
				// setCurrentGroup(inviteResponse.data.groupId);
			} else {
				console.warn('Failed to send invite:', inviteResponse);
			}
		} catch (error) {
			console.error('Failed to send invite:', error);
		}
	};

	const fetchFriends = async (query: string) => {
		try {
			const response = await apiClient().get(
				`/group/users/search?username=${query}`
			);
			const parse = JSON.parse(response.data);
			const data = parse.users;
			if (data && Array.isArray(data)) {
				const names = data.map((user: any) => user.personaName);
				setFriendList(names);
			} else {
				setFriendList([]);
			}
		} catch (error) {
			console.error('Failed to fetch friends:', error);
		}
	};

	useEffect(() => {
		if (searchValue.trim()) {
			fetchFriends(searchValue);
		} else {
			setFriendList([]);
		}
	}, [searchValue]);

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchValue(e.target.value);
	};

	return (
		<>
			<S.GroupSection>
				<header>
					<strong>GRUPO</strong>
				</header>
				<S.InnerGroupSection>
					{/* Renderizar os jogadores do grupo */}
					{groupPlayers.map((player, index) => (
						<S.PlayerBox key={player.id}>
							<div style={{ display: 'flex', alignItems: 'center' }}>
								<S.Avatar src={player.avatar} alt='player avatar' />
								<strong>
									{player.name === userData.name ? 'Você' : player.name}
								</strong>
								{player.owner && <S.CrownIcon />}
							</div>
							{/* Mostrar botão PRONTO apenas para o jogador atual */}
							{player.name === userData.name && (
								<S.StatusButton
									playerReady={playerIsReady}
									onClick={() => {
										setPlayerIsReady(!playerIsReady);
									}}
								>
									{playerIsReady && <FaCheck />}
									PRONTO
								</S.StatusButton>
							)}
						</S.PlayerBox>
					))}

					{/* Renderizar as caixas de convite, se houver espaço no grupo */}
					{[...Array(4 - groupPlayers.length)].map((_, index) => (
						<div key={`invite-${index}`}>
							<S.AddPlayerBox
								onClick={() => handleToggleCard(index)}
								data-index={index}
							>
								<S.InviteIcon>
									<FaPlus size={20} />
								</S.InviteIcon>
							</S.AddPlayerBox>
							{expandedCard === index && (
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
												value={searchValue}
												onChange={handleSearchChange}
												type='search'
												placeholder='Procurar jogador'
											/>
											<S.SearchIcon />
										</S.SearchBox>
										<S.FriendsSection>
											{friendList.length > 0 ? (
												friendList.map((friend) => (
													<S.Friend key={friend}>
														{friend}
														<S.InviteButton
															onClick={() => handleInviteFriend(friend)}
														>
															Invite
														</S.InviteButton>
													</S.Friend>
												))
											) : (
												<S.NoResultText>Não há resultados</S.NoResultText>
											)}
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
