


// ============ GIOCHI SUPPORTATI ============
const SUPPORTED_GAMES = [
  { id: "stronghold-11", name: "Stronghold 1.1" },
  { id: "stronghold-13", name: "Stronghold Crusader 1.3" },
  { id: "stronghold-14", name: "Stronghold Crusader 1.4" },
  { id: "stronghold-hd", name: "Stronghold HD" }
];

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

const PORT = process.env.PORT || 3000;
const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// --- Storage in memoria ---
const users = {};      // username -> { id, username, password, avatar, friends: [] }
const lobbies = {};    // lobbyId -> { id, name, game, host, players: [], maxPlayers, password, messages: [] }
const onlineUsers = {}; // socketId -> username

// --- REST API ---
app.get("/", (req, res) => res.json({ status: "ok", users: Object.keys(users).length, lobbies: Object.keys(lobbies).length }));

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Campi mancanti" });
  if (users[username]) return res.status(400).json({ error: "Username giÃƒÆ’Ã‚Â  esistente" });
  const hash = await bcrypt.hash(password, 10);
  users[username] = { id: uuidv4(), username, password: hash, avatar: "ÃƒÂ°Ã…Â¸Ã¢â‚¬ËœÃ‚Â¤", friends: [], createdAt: Date.now() };
  res.json({ ok: true, user: { id: users[username].id, username } });
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = users[username];
  if (!user) return res.status(400).json({ error: "Utente non trovato" });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(400).json({ error: "Password errata" });
  res.json({ ok: true, user: { id: user.id, username: user.username, avatar: user.avatar, friends: user.friends } });
});

// --- Socket.IO ---
io.on("connection", (socket) => {
  console.log("Connesso:", socket.id);

  socket.on("login", (username) => {
    onlineUsers[socket.id] = username;
    socket.join("global");
    io.emit("online-users", Object.values(onlineUsers));
  });

  socket.on("get-lobbies", () => {
    socket.emit("lobbies", Object.values(lobbies).map(l => ({
      id: l.id, name: l.name, game: l.game, host: l.host,
      players: l.players.length, maxPlayers: l.maxPlayers, hasPassword: !!l.password
    })));
  });

  socket.on("create-lobby", (data) => {
    const id = uuidv4().slice(0, 8);
    lobbies[id] = {
      id, name: data.name, game: data.game, host: data.username,
      players: [{ username: data.username, ready: true }],
      maxPlayers: data.maxPlayers, password: data.password || null,
      messages: [], createdAt: Date.now()
    };
    socket.join("lobby-" + id);
    io.to("global").emit("lobbies", Object.values(lobbies).map(l => ({
      id: l.id, name: l.name, game: l.game, host: l.host,
      players: l.players.length, maxPlayers: l.maxPlayers, hasPassword: !!l.password
    })));
    socket.emit("lobby-joined", lobbies[id]);
  });

  socket.on("join-lobby", (data) => {
    const lobby = lobbies[data.lobbyId];
    if (!lobby) return socket.emit("error-msg", "Lobby non trovata");
    if (lobby.password && lobby.password !== data.password) return socket.emit("error-msg", "Password errata");
    if (lobby.players.length >= lobby.maxPlayers) return socket.emit("error-msg", "Lobby piena");
    lobby.players.push({ username: data.username, ready: false });
    socket.join("lobby-" + data.lobbyId);
    io.to("lobby-" + data.lobbyId).emit("lobby-update", lobby);
    socket.emit("lobby-joined", lobby);
  });

  socket.on("leave-lobby", (data) => {
    const lobby = lobbies[data.lobbyId];
    if (!lobby) return;
    lobby.players = lobby.players.filter(p => p.username !== data.username);
    socket.leave("lobby-" + data.lobbyId);
    if (lobby.players.length === 0) delete lobbies[data.lobbyId];
    else io.to("lobby-" + data.lobbyId).emit("lobby-update", lobby);
    io.to("global").emit("lobbies", Object.values(lobbies).map(l => ({
      id: l.id, name: l.name, game: l.game, host: l.host,
      players: l.players.length, maxPlayers: l.maxPlayers, hasPassword: !!l.password
    })));
  });

  socket.on("chat-message", (data) => {
    const lobby = lobbies[data.lobbyId];
    if (!lobby) return;
    const msg = { sender: data.username, text: data.text, time: Date.now() };
    lobby.messages.push(msg);
    io.to("lobby-" + data.lobbyId).emit("chat-message", msg);
  });

  socket.on("toggle-ready", (data) => {
    const lobby = lobbies[data.lobbyId];
    if (!lobby) return;
    const p = lobby.players.find(p => p.username === data.username);
    if (p) p.ready = !p.ready;
    io.to("lobby-" + data.lobbyId).emit("lobby-update", lobby);
  });

  socket.on("add-friend", (data) => {
    const user = users[data.username];
    if (!user) return socket.emit("error-msg", "Utente non trovato");
    if (!user.friends.includes(data.friendName)) user.friends.push(data.friendName);
    socket.emit("friends-update", user.friends);
  });

  socket.on("disconnect", () => {
    const username = onlineUsers[socket.id];
    delete onlineUsers[socket.id];
    // Rimuovi da tutte le lobby
    Object.values(lobbies).forEach(lobby => {
      const before = lobby.players.length;
      lobby.players = lobby.players.filter(p => p.username !== username);
      if (lobby.players.length !== before) {
        if (lobby.players.length === 0) delete lobbies[lobby.id];
        else io.to("lobby-" + lobby.id).emit("lobby-update", lobby);
      }
    });
    io.emit("online-users", Object.values(onlineUsers));
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("============================================");
  console.log("  BRADLYSTRONGHOLD SERVER v2.0.0");
  console.log("  http://0.0.0.0:" + PORT);
  console.log("============================================");
});
