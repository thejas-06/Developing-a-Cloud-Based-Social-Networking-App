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

const signup = async (user) => {
  try {
    const res = await apiCall(BASE_URL + "api/users/register", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(user),
    });
    return await res.json();
  } catch (err) {
    console.log(err);
    return { error: err.message };
  }
};

const login = async (user) => {
  try {
    const res = await apiCall(BASE_URL + "api/users/login", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(user),
    });
    return await res.json();
  } catch (err) {
    console.log(err);
    return { error: err.message };
  }
};

const getUser = async (params) => {
  try {
    const res = await apiCall(BASE_URL + "api/users/" + params.id);
    return res.json();
  } catch (err) {
    console.log(err);
    return { error: err.message };
  }
};

const getRandomUsers = async (query) => {
  try {
    const res = await apiCall(
      BASE_URL + "api/users/random?" + new URLSearchParams(query)
    );
    return res.json();
  } catch (err) {
    console.log(err);
    return { error: err.message };
  }
};

const updateUser = async (user, data) => {
  try {
    const res = await apiCall(BASE_URL + "api/users/" + user._id, {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "x-access-token": user.token,
      },
      body: JSON.stringify(data),
    });
    return res.json();
  } catch (err) {
    console.log(err);
    return { error: err.message };
  }
};

export { signup, login, getUser, getRandomUsers, updateUser };