import React from 'react';
import ReactDOM from 'react-dom/client';

import { GlobalStyle } from './assets/globalStyles';
import MainRouter from './MainRouter';
import { MatchmakingProvider } from './contexts/MatchmakingContext';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<React.StrictMode>
		<MatchmakingProvider>
			<GlobalStyle />
			<MainRouter />
		</MatchmakingProvider>
	</React.StrictMode>
);
