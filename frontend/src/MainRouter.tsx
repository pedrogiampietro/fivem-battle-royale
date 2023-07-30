import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import App from './App';
import SteamCallback from './SteamCallback';

const MainRouter: React.FC = () => {
	return (
		<BrowserRouter>
			<Routes>
				<Route path='/steam-callback' element={<SteamCallback />} />
				<Route path='/auth/steam/return' element={<SteamCallback />} />
				<Route path='/' element={<App />} />
			</Routes>
		</BrowserRouter>
	);
};

export default MainRouter;
