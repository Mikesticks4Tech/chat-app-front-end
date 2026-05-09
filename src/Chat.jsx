import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { IoSend } from "react-icons/io5";
import "./Chat.css";
import notificationSound from "./assets/mixkit-software-interface-start-2574.wav";

// online backend: https://chat-app-backend-1-11lo.onrender.com
const socket = io("https://chat-app-backend-1-11lo.onrender.com", {
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

const audio = new Audio(notificationSound);

export default function Chat() {
  const [username, setUsername] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [darkMode, setDarkMode] = useState(false);

  const messagesEndRef = useRef(null);

  // LOGIN
  const login = () => {
    if (username.trim()) {
      socket.emit("join", username);
      setIsLoggedIn(true);
    }
  };

  // SEND MESSAGE
  const sendMessage = () => {
    if (message.trim()) {
      socket.emit("send_message", {
        username,
        message,
      });

      setMessage("");
    }
  };

  // SOCKET CONNECTION DEBUGGING
  useEffect(() => {
    socket.on("connect", () => {
      console.log("Socket Connected:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("Socket Disconnected");
    });

    socket.on("connect_error", (err) => {
      console.log("Connection Error:", err.message);
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
    };
  }, []);

  // SOCKET EVENTS
  useEffect(() => {
    socket.on("message_history", (msgs) => {
      console.log("History Loaded:", msgs);
      setMessages(msgs);
    });

    socket.on("receive_message", (msg) => {
      console.log("New Message:", msg);

      setMessages((prev) => [...prev, msg]);

      if (msg.username !== username) {
        audio.play().catch(() => {});
      }
    });

    socket.on("online_users", (users) => {
      console.log("Online Users:", users);
      setOnlineUsers(users);
    });

    return () => {
      socket.off("message_history");
      socket.off("receive_message");
      socket.off("online_users");
    };
  }, [username]);

  // AUTO SCROLL
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // LOGIN SCREEN
  if (!isLoggedIn) {
    return (
      <div className={`login-container ${darkMode ? "dark" : ""}`}>
        <h2>Realtime Chat</h2>

        <input
          type="text"
          placeholder="Enter username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <button onClick={login}>Join Chat</button>

        <button className="dark-toggle" onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? "Light Mode" : "Dark Mode"}
        </button>
      </div>
    );
  }

  // CHAT UI
  return (
    <div className={`chat-container ${darkMode ? "dark" : ""}`}>
      <div className="online-users">
        <h3>Online Users</h3>

        <ul>
          {onlineUsers.map((user, index) => (
            <li key={index}>{user}</li>
          ))}
        </ul>

        <button className="dark-toggle" onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? "Light Mode" : "Dark Mode"}
        </button>
      </div>

      <div className="chat-box">
        <div className="messages">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`message ${
                msg.username === username ? "self" : "other"
              }`}
            >
              <strong className="username">{msg.username}</strong>

              <p className="text">{msg.message}</p>

              <span className="time">{msg.time}</span>
            </div>
          ))}

          <div ref={messagesEndRef}></div>
        </div>

        <div className="input-box">
          <input
            type="text"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />

          <button onClick={sendMessage}>
            <IoSend size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
