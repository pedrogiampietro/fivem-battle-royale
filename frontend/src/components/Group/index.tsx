import React, { useState, useEffect, useRef } from "react";
import * as S from "./styles";
import { FaPlus, FaCheck } from "react-icons/fa";
import { useMatchmaking } from "../../contexts/MatchmakingContext";
import { useGroupRequest } from "../../contexts/ManageInvitesContext";
import { apiClient } from "../../services/api";

export const Group = ({ userData }: any) => {
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const { playerIsReady, setPlayerIsReady } = useMatchmaking();
  const [friendList, setFriendList] = useState<string[]>([]);
  const [searchValue, setSearchValue] = useState("");

  const { groupPlayers, isOwner, group } = useGroupRequest();

  const handleToggleCard = (cardIndex: number) => {
    setExpandedCard((prevExpandedCard) =>
      prevExpandedCard === cardIndex ? null : cardIndex
    );
  };

  const handleInviteFriend = async (friendName: string) => {
    try {
      const response = await apiClient().get(
        `/group/users/search?username=${friendName}`
      );

      const parsedResponse =
        typeof response.data === "string"
          ? JSON.parse(response.data)
          : response.data;

      if (!parsedResponse || !parsedResponse.users) {
        console.warn("Unexpected response:", parsedResponse);
        return;
      }

      const friendData = parsedResponse.users && parsedResponse.users[0];

      if (!friendData) {
        console.warn("No friend data found in response:", parsedResponse);
        return;
      }

      apiClient()
        .post("/group/invite", {
          inviterUserId: userData.id,
          invitedUserId: friendData.id,
        })
        .then((_) => {})
        .catch((error) => {
          console.error("Error sending invite:", error);
        });
    } catch (error) {
      console.error("Failed to send invite:", error);
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
      console.error("Failed to fetch friends:", error);
    }
  };

  const handleRemovePlayer = async (playerId: string, groupId: string) => {
    try {
      const response = await apiClient().delete(`/group/removeFromGroup`, {
        data: {
          userId: playerId,
          groupId: groupId,
        },
      });

      if (response.data && response.data.message) {
        alert(response.data.message);
      } else {
        console.warn("Failed to remove player:", response);
      }
    } catch (error) {
      console.error("Failed to remove player:", error);
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
          {groupPlayers.map((player: any) => (
            <S.PlayerBox key={player.id}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <S.Avatar src={player.avatar} alt="player avatar" />
                <strong>
                  {player.name === userData.name ? "Você" : player.name}{" "}
                </strong>
                {player.owner && <S.CrownIcon />}
              </div>
              {player.name === userData.name && (
                <S.StatusButton
                  $playerReady={playerIsReady}
                  onClick={() => {
                    setPlayerIsReady(!playerIsReady);
                  }}
                >
                  {playerIsReady && <FaCheck />}
                  PRONTO
                </S.StatusButton>
              )}
              {isOwner && !player.owner && (
                <S.RemoveButton
                  onClick={() => handleRemovePlayer(player.id, group?.id)}
                >
                  REMOVER
                </S.RemoveButton>
              )}
            </S.PlayerBox>
          ))}

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
                <S.CollapseWrapper $isOpen={expandedCard === index}>
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
                        type="search"
                        placeholder="Procurar jogador"
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
