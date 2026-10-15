import React, { useState, useEffect } from "react";
import { socket } from "../socket";
import LobbyRoom from "./LobbyRoom";

const GAMES = [
  { id: "sc141", name: "Stronghold Crusader 1.41", icon: "🏰" },
  { id: "scextreme", name: "Stronghold Crusader Extreme", icon: "⚔️" },
  { id: "schd", name: "Stronghold Crusader HD", icon: "🛡️" },
  { id: "scde", name: "Stronghold Crusader Definitive Edition", icon: "👑" }
];

export default function Main({ user, onLogout }) {
  const [lobbies, setLobbies] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [inLobby, setInLobby] = useState(null);
  const [toast, setToast] = useState(null);

  const [newName, setNewName] = useState("lobby1");
  const [newGame, setNewGame] = useState(GAMES[0].id);
  const [newMax, setNewMax] = useState(4);
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    socket.on("connect", () => socket.emit("login", user.username));
    socket.on("lobbies", setLobbies);
    socket.on("online-users", setOnlineUsers);
    socket.on("lobby-joined", l => setInLobby(l));
    socket.on("error-msg", msg => showToast(msg, false));

    if (socket.connected) socket.emit("login", user.username);
    socket.emit("get-lobbies");

    return () => {
      socket.off("lobbies"); socket.off("online-users");
      socket.off("lobby-joined"); socket.off("error-msg");
    };
  }, [user.username]);

  const showToast = (msg, ok) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const createLobby = () => {
    socket.emit("create-lobby", { name: newName, game: newGame, maxPlayers: newMax, password: newPassword, username: user.username });
    setShowCreate(false);
  };

  const joinLobby = (id) => {
    const pwd = prompt("Inserisci password (lascia vuoto se pubblica):") || "";
    socket.emit("join-lobby", { lobbyId: id, username: user.username, password: pwd });
  };

  const getGameName = (id) => (GAMES.find(g => g.id === id) || GAMES[0]).name;

  if (inLobby) {
    return <LobbyRoom lobby={inLobby} user={user} onLeave={() => { socket.emit("leave-lobby", { lobbyId: inLobby.id, username: user.username }); setInLobby(null); }} />;
  }

  return (
    <div className="main-layout">
      {toast && <div className={"toast " + (toast.ok ? "success" : "")}>{toast.msg}</div>}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-user">
            <div className="sidebar-avatar">👤</div>
            <div>
              <div className="sidebar-username">{user.username}</div>
              <div className="sidebar-status">● Online</div>
            </div>
          </div>
        </div>
        <div className="sidebar-section">
          <div className="sidebar-title">UTENTI ONLINE ({onlineUsers.length})</div>
          {onlineUsers.map((u, i) => (
            <div key={i} className="friend-item">
              <div className="friend-dot" />
              <span>{u}</span>
            </div>
          ))}
        </div>
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={onLogout}>Logout</button>
        </div>
      </div>

      <div className="content">
        <div className="topbar">
          <div className="topbar-title">Lobby disponibili</div>
          <div className="topbar-actions">
            <button className="btn-secondary" onClick={() => socket.emit("get-lobbies")}>Aggiorna</button>
            <button className="btn-primary" onClick={() => setShowCreate(true)}>+ Crea Lobby</button>
          </div>
        </div>
        <div className="content-body">
          {lobbies.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🎮</div>
              <div>Nessuna lobby disponibile</div>
              <div style={{ marginTop: 8, fontSize: 12 }}>Crea la prima lobby per iniziare!</div>
            </div>
          ) : (
            <div className="lobby-grid">
              {lobbies.map(l => (
                <div key={l.id} className="lobby-card" onClick={() => joinLobby(l.id)}>
                  <div className="lobby-name">{l.name} {l.hasPassword && "🔒"}</div>
                  <div className="lobby-game">{getGameName(l.game)}</div>
                  <div className="lobby-meta">
                    <span>Host: {l.host}</span>
                    <span className="lobby-players">{l.players}/{l.maxPlayers}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">🎮 Crea Nuova Lobby</div>
            <label className="auth-label">GIOCO</label>
            <select className="auth-input" value={newGame} onChange={e => setNewGame(e.target.value)}>
              {GAMES.map(g => <option key={g.id} value={g.id}>{g.icon} {g.name}</option>)}
            </select>
            <label className="auth-label">NOME LOBBY</label>
            <input className="auth-input" value={newName} onChange={e => setNewName(e.target.value)} />
            <label className="auth-label">MAX GIOCATORI</label>
            <select className="auth-input" value={newMax} onChange={e => setNewMax(Number(e.target.value))}>
              {[2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <label className="auth-label">PASSWORD (OPZIONALE)</label>
            <input className="auth-input" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Lascia vuoto per lobby pubblica" />
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowCreate(false)}>Annulla</button>
              <button className="btn-primary" onClick={createLobby}>Crea</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
