import React, {
	createContext,
	useContext,
	useState,
	useEffect,
	useCallback,
	useRef,
} from 'react';
import { apiClient } from '../services/api';
import { Socket, io } from 'socket.io-client';

interface GroupRequest {
	id: string;
	senderName: string;
}

interface GroupRequestContextData {
	groupRequests: GroupRequest[];
	fetchGroupInvitesRequests: () => void;
	acceptGroupRequest: (requestId: string) => void;
	declineGroupRequest: (requestId: string) => void;
	invites: any;
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
	const [invites, setInvites] = useState<Array<any>>([]);
	const socketRef = useRef<Socket | null>(null);

	useEffect(() => {
		const getUser = localStorage.getItem('userData');

		if (getUser) {
			setUserData(JSON.parse(getUser));
		}
	}, []);

	useEffect(() => {
		if (userData) {
			fetchGroupInvitesRequests();
		}
	}, [userData]);

	const fetchGroupInvitesRequests = useCallback(async () => {
		if (!userData) {
			return;
		}

		try {
			const response = await apiClient().get(`/group/invites/${userData.id}`);
			const data = JSON.parse(response.data);
			console.log('Fetched group invites:', data);
			setGroupRequests(data);
		} catch (error) {
			console.error('Failed to fetch group requests:', error);
		}
	}, [userData]);

	const acceptGroupRequest = useCallback(
		async (requestId: string) => {
			try {
				await apiClient().put(`/group/invite/accept/${requestId}`);
				fetchGroupInvitesRequests();
			} catch (error) {
				console.error('Failed to accept group request:', error);
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
				console.error('Failed to decline group request:', error);
			}
		},
		[fetchGroupInvitesRequests]
	);

	const handleSocketEvents = useCallback(
		(socket: Socket) => {
			socket.on('connect', async function () {
				if (userData) {
					socket.emit('register', userData?.id); // Registra o ID do usuário no servidor

					socket.on('invite', (data) => {
						console.log('Received invite event:', data);
					});
				}
			});
		},
		[userData]
	);

	useEffect(() => {
		console.log('Establishing socket connection.');

		// Estabelecendo conexão com o socket
		socketRef.current = io('http://localhost:5000', {
			withCredentials: true,
		});

		// Ouvindo eventos
		handleSocketEvents(socketRef.current);

		// Limpando o socket na desmontagem
		return () => {
			console.log('Disconnecting socket.');
			if (socketRef.current) {
				socketRef.current.disconnect();
				socketRef.current = null;
			}
		};
	}, [handleSocketEvents]);

	return (
		<GroupRequestContext.Provider
			value={{
				groupRequests,
				fetchGroupInvitesRequests,
				acceptGroupRequest,
				declineGroupRequest,
				invites,
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
			'useGroupRequest must be used within a GroupRequestProvider'
		);
	}
	return context;
}
