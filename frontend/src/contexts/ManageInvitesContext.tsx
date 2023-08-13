import React, {
	createContext,
	useContext,
	useState,
	useEffect,
	useCallback,
} from 'react';
import { apiClient } from '../services/api';

interface GroupRequest {
	id: string;
	senderName: string;
}

interface GroupRequestContextData {
	groupRequests: GroupRequest[];
	fetchGroupInvitesRequests: () => void;
	acceptGroupRequest: (requestId: string) => void;
	declineGroupRequest: (requestId: string) => void;
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

	useEffect(() => {
		const getUser = localStorage.getItem('userData');

		if (getUser) {
			setUserData(JSON.parse(getUser));
		}
	}, []);

	const fetchGroupInvitesRequests = useCallback(async () => {
		if (!userData) {
			throw new Error('You need to login before');
		}

		try {
			const response = await apiClient().get(`/group/invites/${userData.id}`);

			const data = JSON.parse(response.data);
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

	return (
		<GroupRequestContext.Provider
			value={{
				groupRequests,
				fetchGroupInvitesRequests,
				acceptGroupRequest,
				declineGroupRequest,
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
