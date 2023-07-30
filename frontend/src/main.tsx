import React from 'react';
import ReactDOM from 'react-dom/client';

import { GlobalStyle } from './assets/globalStyles';
import MainRouter from './MainRouter';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<React.StrictMode>
		<GlobalStyle />
		<MainRouter />
	</React.StrictMode>
);
