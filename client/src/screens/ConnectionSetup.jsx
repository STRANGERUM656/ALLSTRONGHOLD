import React, { useState } from "react";
import { setServerUrl, connectSocket, getServerUrl } from "../socket";

export default function ConnectionSetup({ onConnected }) {
  const [url, setUrl] = useState(getServerUrl());
  const [error, setError] = useState("");

  const connect = () => {
    if (!url.trim()) { setError("Inserisci l'indirizzo del server"); return; }
    let finalUrl = url.trim();
    if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) finalUrl = "http://" + finalUrl;
    if (!finalUrl.match(/:\d+$/)) finalUrl += ":3000";
    setServerUrl(finalUrl);
    connectSocket();
    onConnected();
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">🏰</div>
        <div className="auth-title">BradlyStronghold</div>
        <div className="auth-subtitle">Connettiti al server di gioco</div>
        {error && <div className="auth-error">{error}</div>}
        <label className="auth-label">INDIRIZZO SERVER</label>
        <input className="auth-input" value={url} onChange={e => setUrl(e.target.value)} placeholder="Es. 26.150.162.84:3000" />
        <button className="auth-button" onClick={connect}>Connetti</button>
        <div className="auth-link">Chiedi all'host il suo IP Radmin</div>
      </div>
    </div>
  );
}
