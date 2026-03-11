import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { IoSend } from "react-icons/io5";
import "./Chat.css";
import notificationSound from "./assets/mixkit-software-interface-start-2574.wav";

const socket = io("https://chat-app-backend-1-11lo.onrender.com"); // Make sure backend URL matches

const audio = new Audio(notificationSound);

export default function Chat() {
  const [username, setUsername] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const messagesEndRef = useRef(null);

  // Login function
  const login = () => {
    if (username.trim() !== "") {
      socket.emit("join", username);
      setIsLoggedIn(true);
    }
  };

  // Send message function
  const sendMessage = () => {
    if (message.trim() !== "") {
      socket.emit("send_message", { username, message });
      setMessage("");
    }
  };

  // Socket listeners
  useEffect(() => {
    socket.on("message_history", (msgs) => setMessages(msgs));
    socket.on("receive_message", (msg) => {
      setMessages((prev) => [...prev, msg]);
      if (msg.username !== username) audio.play();
    });
    socket.on("online_users", (users) => setOnlineUsers(users));

    return () => {
      socket.off("message_history");
      socket.off("receive_message");
      socket.off("online_users");
    };
  }, [username]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!isLoggedIn) {
    return (
      <div className={`login-container ${darkMode ? "dark" : ""}`}>
        <h2>Enter Username</h2>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
        />
        <button onClick={login}>Join Chat</button>
        <button
          className="dark-toggle"
          onClick={() => setDarkMode((prev) => !prev)}
        >
          {darkMode ? "Light Mode" : "Dark Mode"}
        </button>
      </div>
    );
  }

  return (
    <div className={`chat-container ${darkMode ? "dark" : ""}`}>
      <div className="online-users">
        <h3>Online Users</h3>
        <ul>
          {onlineUsers.map((user, idx) => (
            <li key={idx}>{user}</li>
          ))}
        </ul>
        <button
          className="dark-toggle"
          onClick={() => setDarkMode((prev) => !prev)}
        >
          {darkMode ? "Light Mode" : "Dark Mode"}
        </button>
      </div>

      <div className="chat-box">
        <div className="messages">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`message ${msg.username === username ? "self" : "other"}`}
            >
              <strong className="username">{msg.username}</strong>
              <span className="time">{msg.time}</span>
              <p className="text">{msg.message}</p>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-box">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
          />
          <button onClick={sendMessage}>
            <IoSend size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
