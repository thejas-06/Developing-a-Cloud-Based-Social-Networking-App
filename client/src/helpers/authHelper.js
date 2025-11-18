import { initiateSocketConnection } from "./socketHelper";

const isLoggedIn = () => {
  return JSON.parse(localStorage.getItem("user"));
};

const loginUser = (user) => {
  localStorage.setItem("user", JSON.stringify(user));
  initiateSocketConnection();
};

const logoutUser = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  
  // Call logout endpoint to revoke refresh token
  if (user && user.refreshToken) {
    fetch("/api/users/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken: user.refreshToken }),
    });
  }
  
  localStorage.removeItem("user");
  initiateSocketConnection();
};

// Function to refresh access token
const refreshAccessToken = async () => {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    
    if (!user || !user.refreshToken) {
      throw new Error("No refresh token available");
    }
    
    const response = await fetch("/api/users/refresh-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken: user.refreshToken }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.token) {
      // Update user object with new token
      const updatedUser = { ...user, token: data.token };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      return data.token;
    } else {
      throw new Error("Failed to refresh token");
    }
  } catch (error) {
    console.error("Error refreshing token:", error);
    logoutUser();
    throw error;
  }
};

export { loginUser, isLoggedIn, logoutUser, refreshAccessToken };