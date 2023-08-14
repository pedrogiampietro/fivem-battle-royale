import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export const useSocket = (onEvents: (socket: Socket) => void) => {
	const socketRef = useRef<Socket | null>(null);

	useEffect(() => {
		socketRef.current = io('http://localhost:5000', {
			withCredentials: true,
		});

		if (socketRef.current) {
			onEvents(socketRef.current);
		}

		return () => {
			if (socketRef.current) {
				socketRef.current.disconnect();
				socketRef.current = null;
			}
		};
	}, [onEvents]);

	return socketRef.current;
};
