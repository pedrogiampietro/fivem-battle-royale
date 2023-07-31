import React from 'react';
import {
	FaHome,
	FaLink,
	FaInbox,
	FaWpforms,
	FaShoppingBag,
} from 'react-icons/fa';

import { FiLogOut } from 'react-icons/fi';

import * as S from './styles';

export const MenuContainer = ({ userData }: any) => {
	// TODOO: criar contexto para compartilhar os dados do userData

	function signOut() {
		localStorage.clear();
		window.location.reload();
	}

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
		</>
	);
};
