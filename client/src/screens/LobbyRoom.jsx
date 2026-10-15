import React, { useState, useEffect, useRef } from "react";
import { socket } from "../socket";

export default function LobbyRoom({ lobby: initialLobby, user, onLeave }) {
  const [lobby, setLobby] = useState(initialLobby);
  const [input, setInput] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    const onUpdate = (l) => setLobby(l);
    const onMsg = (m) => setLobby(prev => ({ ...prev, messages: [...(prev.messages || []), m] }));
    socket.on("lobby-update", onUpdate);
    socket.on("chat-message", onMsg);
    return () => { socket.off("lobby-update", onUpdate); socket.off("chat-message", onMsg); };
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [lobby.messages]);

  const send = () => {
    if (!input.trim()) return;
    socket.emit("chat-message", { lobbyId: lobby.id, username: user.username, text: input.trim() });
    setInput("");
  };

  const toggleReady = () => socket.emit("toggle-ready", { lobbyId: lobby.id, username: user.username });

  const me = (lobby.players || []).find(p => p.username === user.username);
  const isHost = lobby.host === user.username;

  return (
    <div className="main-layout">
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-title" style={{ fontSize: 14, color: "#4ade80", marginBottom: 8 }}>{lobby.name}</div>
          <div style={{ fontSize: 12, color: "#8b949e" }}>Host: {lobby.host}</div>
        </div>
        <div className="sidebar-section">
          <div className="sidebar-title">GIOCATORI ({lobby.players?.length || 0}/{lobby.maxPlayers})</div>
          {(lobby.players || []).map((p, i) => (
            <div key={i} className="player-row">
              <span>{p.username === user.username ? "👤 " + p.username + " (tu)" : p.username}</span>
              <span className={"ready-badge " + (p.ready ? "" : "not-ready-badge")}>{p.ready ? "PRONTO" : "NON PRONTO"}</span>
            </div>
          ))}
        </div>
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={onLeave}>Esci dalla lobby</button>
        </div>
      </div>
      <div className="content">
        <div className="topbar">
          <div className="topbar-title">Chat Lobby</div>
          <div className="topbar-actions">
            {!isHost && <button className="btn-primary" onClick={toggleReady}>{me?.ready ? "Non pronto" : "Sono pronto"}</button>}
            {isHost && <button className="btn-primary" onClick={() => alert("Avvia il gioco! (da implementare)")}>▶ Avvia Partita</button>}
          </div>
        </div>
        <div className="content-body" style={{ display: "flex", flexDirection: "column", padding: 0 }}>
          <div className="chat-messages">
            {(lobby.messages || []).map((m, i) => (
              <div key={i} className="chat-msg">
                <span className="chat-sender">{m.sender}:</span>
                <span>{m.text}</span>
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <div className="chat-input-row">
            <input className="chat-input" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Scrivi un messaggio..." />
            <button className="btn-primary" onClick={send}>Invia</button>
          </div>
        </div>
      </div>
    </div>
  );
}
