import { BASE_URL } from "../config";
import { refreshAccessToken } from "../helpers/authHelper";

// Helper function to make API calls with automatic token refresh
const apiCall = async (url, options = {}) => {
  try {
    const response = await fetch(url, options);
    
    // If unauthorized, try to refresh token
    if (response.status === 401) {
      try {
        const newToken = await refreshAccessToken();
        
        // Retry the request with the new token
        const retryOptions = {
          ...options,
          headers: {
            ...options.headers,
            "x-access-token": newToken,
          },
        };
        
        return await fetch(url, retryOptions);
      } catch (refreshError) {
        // If refresh fails, redirect to login
        window.location.href = "/login";
        throw refreshError;
      }
    }
    
    return response;
  } catch (error) {
    console.error("API call failed:", error);
    throw error;
  }
};

const getConversations = async (user) => {
  try {
    const res = await apiCall(BASE_URL + "api/messages", {
      headers: {
        "x-access-token": user.token,
      },
    });
    return await res.json();
  } catch (err) {
    console.log(err);
  }
};

const getMessages = async (user, conversationId) => {
  try {
    const res = await apiCall(BASE_URL + "api/messages/" + conversationId, {
      headers: {
        "x-access-token": user.token,
      },
    });
    return await res.json();
  } catch (err) {
    console.log(err);
  }
};

const sendMessage = async (user, message, recipientId) => {
  try {
    const res = await apiCall(BASE_URL + "api/messages/" + recipientId, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "x-access-token": user.token,
      },
      body: JSON.stringify(message),
    });
    return await res.json();
  } catch (err) {
    console.log(err);
  }
};

export { getConversations, getMessages, sendMessage };