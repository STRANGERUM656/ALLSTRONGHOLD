import { GAMES } from '../games';
import React, { useState, useEffect } from "react";
import { socket } from "../socket";
import LobbyRoom from "./LobbyRoom";

export default function Main({ user, onLogout }) {
  const [lobbies, setLobbies] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showHost, setShowHost] = useState(false);
  const [inLobby, setInLobby] = useState(null);
  const [toast, setToast] = useState(null);
  const [hostInfo, setHostInfo] = useState({
    radminIP: localStorage.getItem("bs_radmin_ip") || "26.150.162.84",
    port: 3000,
    running: false
  });

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
    socket.emit("create-lobby", {
      name: newName, game: newGame, maxPlayers: newMax,
      password: newPassword, username: user.username
    });
    setShowCreate(false);
  };

  const joinLobby = (id) => {
    const pwd = prompt("Inserisci password (lascia vuoto se pubblica):") || "";
    socket.emit("join-lobby", { lobbyId: id, username: user.username, password: pwd });
  };

  const getGameName = (id) => (GAMES.find(g => g.id === id) || GAMES[0]).name;

  const saveRadminIP = () => {
    localStorage.setItem("bs_radmin_ip", hostInfo.radminIP);
    showToast("IP Radmin salvato!", true);
    setShowHost(false);
  };

  const copyIP = () => {
    const text = hostInfo.radminIP + ":" + hostInfo.port;
    navigator.clipboard.writeText(text);
    showToast("IP copiato: " + text, true);
  };

  if (inLobby) {
    return <LobbyRoom
      lobby={inLobby}
      user={user}
      onLeave={() => {
        socket.emit("leave-lobby", { lobbyId: inLobby.id, username: user.username });
        setInLobby(null);
      }}
    />;
  }

  return (
    <div className="main-layout">
      {toast && <div className={"toast " + (toast.ok ? "success" : "")}>{toast.msg}</div>}

      <div className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-user">
            <div className="sidebar-avatar">ÃƒÂ°Ã…Â¸Ã¢â‚¬ËœÃ‚Â¤</div>
            <div>
              <div className="sidebar-username">{user.username}</div>
              <div className="sidebar-status">ÃƒÂ¢Ã¢â‚¬â€Ã‚Â Online</div>
            </div>
          </div>
        </div>

        <div className="sidebar-section" style={{ padding: "12px 20px" }}>
          <button
            className="btn-primary"
            style={{ width: "100%", marginBottom: 8 }}
            onClick={() => setShowHost(true)}
          >
            ÃƒÂ°Ã…Â¸Ã¢â‚¬â€œÃ‚Â¥ÃƒÂ¯Ã‚Â¸Ã‚Â HOST (Radmin VPN)
          </button>
          <div style={{ fontSize: 11, color: "#8b949e", textAlign: "center" }}>
            {hostInfo.radminIP}:{hostInfo.port}
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
              <div className="empty-icon">ÃƒÂ°Ã…Â¸Ã…Â½Ã‚Â®</div>
              <div>Nessuna lobby disponibile</div>
              <div style={{ marginTop: 8, fontSize: 12 }}>Crea la prima lobby per iniziare!</div>
            </div>
          ) : (
            <div className="lobby-grid">
              {lobbies.map(l => (
                <div key={l.id} className="lobby-card" onClick={() => joinLobby(l.id)}>
                  <div className="lobby-name">{l.name} {l.hasPassword && "ÃƒÂ°Ã…Â¸Ã¢â‚¬ÂÃ¢â‚¬â„¢"}</div>
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

      {/* Modale Crea Lobby */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">ÃƒÂ°Ã…Â¸Ã…Â½Ã‚Â® Crea Nuova Lobby</div>
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
            <input className="auth-input" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Lascia vuoto per pubblica" />
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowCreate(false)}>Annulla</button>
              <button className="btn-primary" onClick={createLobby}>Crea</button>
            </div>
          </div>
        </div>
      )}

      {/* Modale HOST */}
      {showHost && (
        <div className="modal-overlay" onClick={() => setShowHost(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">ÃƒÂ°Ã…Â¸Ã¢â‚¬â€œÃ‚Â¥ÃƒÂ¯Ã‚Â¸Ã‚Â Impostazioni HOST</div>
            <div style={{ fontSize: 13, color: "#8b949e", marginBottom: 16 }}>
              Per hostare partite tramite Radmin VPN, assicurati di avere Radmin VPN connesso.
            </div>

            <label className="auth-label">IL TUO IP RADMIN</label>
            <input
              className="auth-input"
              value={hostInfo.radminIP}
              onChange={e => setHostInfo({ ...hostInfo, radminIP: e.target.value })}
              placeholder="es. 26.150.162.84"
            />

            <label className="auth-label">PORTA</label>
            <input
              className="auth-input"
              type="number"
              value={hostInfo.port}
              onChange={e => setHostInfo({ ...hostInfo, port: Number(e.target.value) })}
            />

            <div style={{ background: "#0d1117", padding: 12, borderRadius: 8, marginTop: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "#8b949e", marginBottom: 6 }}>CONDIVIDI QUESTO CON I TUOI AMICI:</div>
              <div style={{ fontSize: 16, color: "#4ade80", fontWeight: 600, fontFamily: "monospace" }}>
                {hostInfo.radminIP}:{hostInfo.port}
              </div>
              <button
                className="btn-secondary"
                style={{ width: "100%", marginTop: 10, padding: "6px" }}
                onClick={copyIP}
              >
                ÃƒÂ°Ã…Â¸Ã¢â‚¬Å“Ã¢â‚¬Â¹ Copia IP
              </button>
            </div>

            <div style={{ background: "#1e3a5f", padding: 12, borderRadius: 8, fontSize: 12, lineHeight: 1.6 }}>
              <b>ÃƒÂ°Ã…Â¸Ã¢â‚¬Å“Ã…â€™ Come hostare:</b><br />
              1. Apri Radmin VPN e connettiti alla tua rete<br />
              2. Apri un'altra finestra PowerShell e avvia il server:<br />
              <code style={{ background: "#0d1117", padding: "2px 6px", borderRadius: 4, display: "inline-block", marginTop: 4 }}>
                cd BradlyStronghold\server<br />node index.js
              </code><br />
              3. Comunica il tuo IP Radmin agli amici<br />
              4. I tuoi amici aprono l'app, si registrano, entrano nella tua lobby
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowHost(false)}>Chiudi</button>
              <button className="btn-primary" onClick={saveRadminIP}>Salva IP</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}