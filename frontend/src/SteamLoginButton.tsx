import React from 'react';

const SteamLoginButton = () => {
	const redirectToSteamAuth = () => {
		const authUrl = `http://localhost:5000/auth/steam`;
		window.location.href = authUrl;
	};

	return <button onClick={redirectToSteamAuth}>Conectar com a Steam</button>;
};

export default SteamLoginButton;
