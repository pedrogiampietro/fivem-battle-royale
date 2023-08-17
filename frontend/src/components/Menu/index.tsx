import React, { useState, useEffect } from 'react';
import {
	FaHome,
	FaLink,
	FaInbox,
	FaWpforms,
	FaShoppingBag,
} from 'react-icons/fa';

import { useGroupRequest } from '../../contexts/ManageInvitesContext';

import { FiLogOut, FiCheck, FiX } from 'react-icons/fi';
import * as S from './styles';

export const MenuContainer = ({ userData }: any) => {
	const {
		groupRequests,
		fetchGroupInvitesRequests,
		acceptGroupRequest,
		declineGroupRequest,
	} = useGroupRequest();

	useEffect(() => {
		fetchGroupInvitesRequests();
	}, [fetchGroupInvitesRequests]);

	function signOut() {
		localStorage.clear();
		window.location.reload();
	}

	useEffect(() => {
		console.log('Group Requests:', groupRequests);
		console.log('Number of group requests:', groupRequests.length);
	}, [groupRequests]);

	return (
		<>
			<S.MenuContainer>
				<S.MenuItem className='is-current' href='#home'>
					<FaHome />
				</S.MenuItem>
				<S.MenuItem href='#matchmaking'>
					<FaLink />
				</S.MenuItem>
				<S.MenuItem href='#inventario'>
					<FaInbox />
				</S.MenuItem>
				<S.MenuItem href='#aparencia'>
					<FaWpforms />
				</S.MenuItem>
				<S.MenuItem href='#loja'>
					<FaShoppingBag />
				</S.MenuItem>
			</S.MenuContainer>

			<S.AvatarCardContainer>
				<S.AvatarImage src={userData?.avatar} alt='User Avatar' />
				<S.AvatarName>{userData?.personaName}</S.AvatarName>
				<p>Steam ID: {userData?.steamId}</p>

				<S.LogoutButton onClick={() => signOut()}>
					<S.LogoutIconContainer>
						<FiLogOut size={24} color='#5e39cc' />
					</S.LogoutIconContainer>
				</S.LogoutButton>
			</S.AvatarCardContainer>

			<S.GroupRequestCard>
				{groupRequests.map((request: any) => (
					<S.GroupRequestItem key={request.inviteId}>
						<span>
							{request.inviterName} te convidou para o grupo:{' '}
							{request.groupName}.
						</span>
						<S.ActionButtons>
							<S.AcceptButton
								onClick={() => acceptGroupRequest(request.inviteId)}
							>
								<FiCheck />
							</S.AcceptButton>
							<S.RejectButton
								onClick={() => declineGroupRequest(request.inviteId)}
							>
								<FiX />
							</S.RejectButton>
						</S.ActionButtons>
					</S.GroupRequestItem>
				))}
			</S.GroupRequestCard>
		</>
	);
};
