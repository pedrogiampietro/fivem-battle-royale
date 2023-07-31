import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as SteamStrategy } from 'passport-steam';
import cors from 'cors';
import http from 'http';
import { Server, Socket } from 'socket.io';

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

import matchMakingController from './controllers/Matchmaking';

const app = express();

app.use(
	cors({
		origin: 'http://127.0.0.1:5173', // Reflete o domínio do cliente
		credentials: true,
		methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
		allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept'],
	})
);

const server = http.createServer(app);

export const io = new Server(server, {
	cors: {
		origin: 'http://127.0.0.1:5173', // Reflete o domínio do cliente
		methods: ['GET', 'POST'],
		credentials: true,
	},
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(
	session({
		secret: 'your secret',
		resave: false,
		saveUninitialized: false,
	})
);

app.use(passport.initialize());
app.use(passport.session());

app.use('/matchmaking', matchMakingController);

passport.use(
	new SteamStrategy(
		{
			returnURL: 'http://localhost:5000/auth/steam/return',
			realm: 'http://localhost:5000/',
			apiKey: '34042001284764C5459C933A1457F0CF', // Substitua pelo valor da sua Steam API Key.
		},
		(identifier: any, profile: any, done: any) => {
			process.nextTick(() => {
				profile.identifier = identifier;
				return done(null, profile);
			});
		}
	)
);

passport.serializeUser((user: Express.User, done) => {
	done(null, user);
});

passport.deserializeUser((obj: any, done: any) => {
	done(null, obj);
});

async function upsertUser(profile: any) {
	const { steamid, personaname, avatar, realname } = profile._json;
	const user = await prisma.user.upsert({
		where: { steamId: steamid },
		update: { personaName: personaname, avatar, realName: realname },
		create: {
			steamId: steamid,
			personaName: personaname,
			avatar,
			realName: realname,
		},
	});
	return user;
}

app.get(
	'/auth/steam',
	passport.authenticate('steam', { failureRedirect: '/' }),
	(req: express.Request, res: express.Response) => {
		res.redirect('/');
	}
);

app.get(
	'/auth/steam/return',
	passport.authenticate('steam', { failureRedirect: '/' }),
	async (req: express.Request, res: express.Response) => {
		// Aqui, req.user contém o perfil do usuário autenticado.
		console.log(req.user);

		// Criar um novo usuário no banco de dados
		const user = await upsertUser(req.user);

		// Codificar os dados do usuário em um formato adequado para URL
		const userData = encodeURIComponent(JSON.stringify(user));

		// Redirecionar o usuário para o frontend, passando os dados do usuário como um parâmetro de URL
		res.redirect(`http://127.0.0.1:5173/auth/steam/return?user=${userData}`);
	}
);

io.on('connection', (socket: Socket) => {
	console.log('a user connected');

	socket.on('disconnect', () => {
		console.log('user disconnected');
	});

	// outros manipuladores de eventos de socket vão aqui
});

server.listen(5000, () => {
	console.log('Aplicação ouvindo na porta 5000');
});
