import React, { useState, useEffect } from 'react';
import * as S from './styles';
import SteamLoginButton from './SteamLoginButton';

import { MenuContainer } from './components/Menu';
import { Group } from './components/Group';
import { PlayerCard } from './components/PlayerCard';
import { Inventory } from './components/Inventory';

import bannerImg from './assets/imgs/dash-hero-bg.png';

const LoadingMessage = () => <div>Carregando...</div>;

const App = () => {
	const [userData, setUserData] = useState(null);
	const [isLoading, setIsLoading] = useState(false);

	const handleSteamLoginSuccess = (data: any) => {
		setUserData(data);
		setIsLoading(false);
	};

	useEffect(() => {
		const getUser = localStorage.getItem('userData');

		if (getUser) {
			setUserData(JSON.parse(getUser));
		}
	}, []);

	return (
		<>
			<S.Banner background={bannerImg} />

			<S.CenteredContainer>
				<MenuContainer userData={userData} />

				{isLoading ? (
					<LoadingMessage />
				) : userData ? (
					<>
						<PlayerCard />
						<Group userData={userData} />
						<Inventory />
					</>
				) : (
					<SteamLoginButton onSuccess={handleSteamLoginSuccess} />
				)}
			</S.CenteredContainer>
		</>
	);
};

export default App;
