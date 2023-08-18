import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";

import { apiClient } from "../services/api";
import { Socket, io } from "socket.io-client";

interface GroupRequest {
  id: string;
  senderName: string;
}

interface GroupRequestContextData {
  groupRequests: GroupRequest[];
  fetchGroupInvitesRequests: () => void;
  acceptGroupRequest: (requestId: string) => void;
  declineGroupRequest: (requestId: string) => void;
  groupPlayers: any;
  group: any;
  isOwner: any;
}

interface PropsI {
  children: React.ReactNode;
}

const GroupRequestContext = createContext<GroupRequestContextData>(
  {} as GroupRequestContextData
);

export const GroupRequestProvider: React.FC<PropsI> = ({ children }) => {
  const [groupRequests, setGroupRequests] = useState<GroupRequest[]>([]);
  const [userData, setUserData] = useState<any>(null);
  const [groupPlayers, setGroupPlayers] = useState([]);
  const [group, setGroup] = useState([]);
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const getUser = localStorage.getItem("userData");

    if (getUser) {
      setUserData(JSON.parse(getUser));
    }
  }, []);

  useEffect(() => {
    if (userData) {
      fetchGroupInvitesRequests();
    }
  }, [userData]);

  const fetchGroups = async () => {
    try {
      const response = await apiClient().get(
        `/group/groupOfUser/${userData.id}`
      );

      const data = JSON.parse(response.data);

      setGroup(data.group);

      const ownerPlayer = data.group.players.find(
        (player: any) => player.owner
      );

      if (ownerPlayer && ownerPlayer.id === userData.id) {
        setIsOwner(true);
      } else {
        setIsOwner(false);
      }

      setGroupPlayers(data.group.players);
    } catch (error) {
      console.error("Failed to fetch groups:", error);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [userData]);

  const fetchGroupInvitesRequests = useCallback(async () => {
    if (!userData) {
      console.log("No user data found");
      return;
    }

    try {
      const response = await apiClient().get(`/group/invites/${userData.id}`);
      const apiInvites = JSON.parse(response.data);

      setGroupRequests(apiInvites);
    } catch (error) {
      console.error("Failed to fetch group requests:", error);
    }
  }, [userData]);

  const acceptGroupRequest = useCallback(
    async (requestId: string) => {
      try {
        await apiClient().put(`/group/invite/accept/${requestId}`);
        fetchGroupInvitesRequests();
      } catch (error) {
        console.error("Failed to accept group request:", error);
      }
    },
    [fetchGroupInvitesRequests]
  );

  const declineGroupRequest = useCallback(
    async (requestId: string) => {
      try {
        await apiClient().put(`/group/invite/decline/${requestId}`);
        fetchGroupInvitesRequests();
      } catch (error) {
        console.error("Failed to decline group request:", error);
      }
    },
    [fetchGroupInvitesRequests]
  );

  const handleSelfRemoval = (groupId: null) => {
    setGroupPlayers([]);
    setGroup([]);
    setIsOwner(false);

    window.location.href = "/";
  };

  const handleSocketEvents = useCallback(
    (socket: Socket) => {
      socket.on("connect", async function () {
        if (userData) {
          socket.emit("register", userData?.id);

          socket.on("invite", (data) => {
            const newInvite = data.message;
            setGroupRequests((prevInvites) => [...prevInvites, newInvite]);
          });

          socket.on("playerJoined", (data) => {
            setGroupPlayers(data.message.groupMembers);
          });

          socket.on("playerLeft", (data) => {
            setGroupPlayers(data.message.groupMembers);

            if (data.message.userId === userData.id) {
              handleSelfRemoval(data.message.groupId);
            }
          });
        }
      });
    },
    [userData]
  );

  useEffect(() => {
    console.log("Establishing socket connection.");

    socketRef.current = io("http://localhost:5000", {
      withCredentials: true,
    });

    handleSocketEvents(socketRef.current);

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [handleSocketEvents, userData, groupPlayers]);

  return (
    <GroupRequestContext.Provider
      value={{
        groupRequests,
        fetchGroupInvitesRequests,
        acceptGroupRequest,
        declineGroupRequest,
        groupPlayers,
        group,
        isOwner,
      }}
    >
      {children}
    </GroupRequestContext.Provider>
  );
};

export function useGroupRequest(): GroupRequestContextData {
  const context = useContext(GroupRequestContext);
  if (!context) {
    throw new Error(
      "useGroupRequest must be used within a GroupRequestProvider"
    );
  }
  return context;
}
