import React from 'react';
import ReactDOM from 'react-dom/client';

import { GlobalStyle } from './assets/globalStyles';
import MainRouter from './MainRouter';
import { MatchmakingProvider } from './contexts/MatchmakingContext';
import { Toaster } from 'react-hot-toast';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<React.StrictMode>
		<MatchmakingProvider>
			<GlobalStyle />
			<MainRouter />
			<Toaster
				gutter={8}
				toastOptions={{
					style: {
						background: '#5a5a5a',
						color: '#f5f5f5',
						borderRadius: '4px',
						border: '1px solid #4a4a4a',
						padding: '16px',
						fontSize: '14px',
					},
				}}
			/>
		</MatchmakingProvider>
	</React.StrictMode>
);
