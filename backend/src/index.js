const express = require('express');
const session = require('express-session');
const passport = require('passport');
const SteamStrategy = require('passport-steam').Strategy;

const app = express();

app.use(
	session({
		secret: 'your secret',
		resave: false,
		saveUninitialized: false,
	})
);

app.use(passport.initialize());
app.use(passport.session());

passport.use(
	new SteamStrategy(
		{
			returnURL: 'http://localhost:5000/auth/steam/return',
			realm: 'http://localhost:5000/',
			apiKey: '34042001284764C5459C933A1457F0CF', // Substitua pelo valor da sua Steam API Key.
		},
		(identifier, profile, done) => {
			process.nextTick(() => {
				profile.identifier = identifier;
				return done(null, profile);
			});
		}
	)
);

passport.serializeUser((user, done) => {
	done(null, user);
});

passport.deserializeUser((obj, done) => {
	done(null, obj);
});

app.get(
	'/auth/steam',
	passport.authenticate('steam', { failureRedirect: '/' }),
	(req, res) => {
		res.redirect('/');
	}
);

app.get(
	'/auth/steam/return',
	passport.authenticate('steam', { failureRedirect: '/' }),
	(req, res) => {
		// Aqui, req.user contém o perfil do usuário autenticado.
		console.log(req.user);

		// Codificar os dados do usuário em um formato adequado para URL
		const userData = encodeURIComponent(JSON.stringify(req.user));

		// Redirecionar o usuário para o frontend, passando os dados do usuário como um parâmetro de URL
		res.redirect(`http://127.0.0.1:5173/auth/steam/return?user=${userData}`);
	}
);

app.listen(5000, () => {
	console.log('Aplicação ouvindo na porta 5000');
});
