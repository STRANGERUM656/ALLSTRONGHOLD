import React, { useState, useEffect } from "react";
import ConnectionSetup from "./screens/ConnectionSetup";
import Login from "./screens/Login";
import Register from "./screens/Register";
import Main from "./screens/Main";
import { socket, connectSocket } from "./socket";

export default function App() {
  const [screen, setScreen] = useState("connection");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("bs_user");
    const savedUrl = localStorage.getItem("bs_server_url");
    if (savedUrl) {
      connectSocket();
      if (saved) {
        setUser(JSON.parse(saved));
        setScreen("main");
      } else {
        setScreen("login");
      }
    }
  }, []);

  return (
    <div className="app">
      {screen === "connection" && <ConnectionSetup onConnected={() => setScreen("login")} />}
      {screen === "login" && <Login onLogin={(u) => { setUser(u); setScreen("main"); }} onRegister={() => setScreen("register")} />}
      {screen === "register" && <Register onRegister={(u) => { setUser(u); setScreen("main"); }} onBack={() => setScreen("login")} />}
      {screen === "main" && <Main user={user} onLogout={() => { setUser(null); localStorage.removeItem("bs_user"); setScreen("login"); }} />}
    </div>
  );
}
