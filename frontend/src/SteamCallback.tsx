import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const SteamCallback: React.FC = () => {
	const navigate = useNavigate();
	const location = useLocation();

	useEffect(() => {
		const params = new URLSearchParams(location.search);
		const user = params.get('user');
		const userData = JSON.parse(decodeURIComponent(user || ''));

		// Store user data in local storage or context
		localStorage.setItem('userData', JSON.stringify(userData));

		// Redirecione para a página principal após processar os dados do usuário
		navigate('/');
	}, [navigate, location]);

	return null;
};

export default SteamCallback;
