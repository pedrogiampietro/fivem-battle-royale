import express from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as SteamStrategy } from "passport-steam";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import { PrismaClient } from "@prisma/client";
import groupController from "./controllers/Group";
import matchMakingRoutes from "./routes/matchmaking.routes";

const prisma = new PrismaClient();
export const userSockets = new Map();
const app = express();
const server = http.createServer(app);
export const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  },
});

const corsOptions = {
  origin: "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
};

const sessionOptions = {
  secret: "your secret",
  resave: false,
  saveUninitialized: false,
};

const steamStrategy = new SteamStrategy(
  {
    returnURL: "http://localhost:5000/auth/steam/return",
    realm: "http://localhost:5000/",
    apiKey: "34042001284764C5459C933A1457F0CF",
  },
  (identifier, profile: any, done) => {
    process.nextTick(() => {
      profile.identifier = identifier;
      return done(null, profile);
    });
  }
);

passport.use(steamStrategy);
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj: any, done) => done(null, obj));

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session(sessionOptions));
app.use(passport.initialize());
app.use(passport.session());

app.use("/matchmaking", matchMakingRoutes);
app.use("/group", groupController);

app.get(
  "/auth/steam",
  passport.authenticate("steam", { failureRedirect: "/" }),
  (req, res) => {
    res.redirect("/");
  }
);

app.get(
  "/auth/steam/return",
  passport.authenticate("steam", { failureRedirect: "/" }),
  async (req, res) => {
    const user = await upsertUser(req.user);
    const userData = encodeURIComponent(JSON.stringify(user));
    res.redirect(`http://localhost:5173/auth/steam/return?user=${userData}`);
  }
);

io.on("connection", (socket) => {
  socket.on("register", (userId) => {
    userSockets.set(userId, socket.id);
  });

  socket.on("disconnect", () => {
    for (const [userId, socketId] of userSockets.entries()) {
      if (socketId === socket.id) {
        userSockets.delete(userId);
      }
    }
  });
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

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Aplicação ouvindo na porta ${PORT}`);
});
