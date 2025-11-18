import { io } from "socket.io-client";
import { BASE_URL } from "../config";
import { isLoggedIn } from "./authHelper";

export let socket;

export const initiateSocketConnection = () => {
  const user = isLoggedIn();

  // Close existing connection if it exists
  if (socket) {
    socket.disconnect();
  }

  socket = io(BASE_URL, {
    auth: {
      token: user && user.token,
    },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    randomizationFactor: 0.5,
    timeout: 20000,
  });
  
  // Add error handling
  socket.on('connect_error', (err) => {
    console.error('Socket connection error:', err);
  });
  
  socket.on('connect_timeout', (timeout) => {
    console.error('Socket connection timeout:', timeout);
  });
  
  socket.on('error', (err) => {
    console.error('Socket error:', err);
  });
  
  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
    // Try to reconnect if it's not a manual disconnect
    if (reason === 'io server disconnect') {
      // The disconnection was initiated by the server, you need to reconnect manually
      socket.connect();
    }
  });
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
