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

const getUserLikedPosts = async (likerId, token, query) => {
  try {
    const res = await apiCall(
      BASE_URL +
        "api/posts/liked/" +
        likerId +
        "?" +
        new URLSearchParams(query),
      {
        headers: {
          "x-access-token": token,
        },
      }
    );
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    return await res.json();
  } catch (err) {
    console.error("Error fetching user liked posts:", err);
    throw err;
  }
};

const getPosts = async (token, query) => {
  try {
    const res = await apiCall(
      BASE_URL + "api/posts?" + new URLSearchParams(query),
      {
        headers: {
          "x-access-token": token,
        },
      }
    );
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    return await res.json();
  } catch (err) {
    console.error("Error fetching posts:", err);
    throw err;
  }
};

const getPost = async (postId, token) => {
  try {
    const res = await apiCall(BASE_URL + "api/posts/" + postId, {
      headers: {
        "x-access-token": token,
      },
    });
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    return await res.json();
  } catch (err) {
    console.error("Error fetching post:", err);
    throw err;
  }
};

const getUserLikes = async (postId, anchor) => {
  try {
    const res = await apiCall(
      BASE_URL +
        "api/posts/like/" +
        postId +
        "/users?" +
        new URLSearchParams({
          anchor,
        })
    );
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    return await res.json();
  } catch (err) {
    console.error("Error fetching user likes:", err);
    throw err;
  }
};

const createPost = async (post, user) => {
  try {
    const res = await apiCall(BASE_URL + "api/posts", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "x-access-token": user.token,
      },
      body: JSON.stringify(post),
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
    }
    
    return await res.json();
  } catch (err) {
    console.error("Error creating post:", err);
    throw err;
  }
};

const updatePost = async (postId, user, data) => {
  try {
    const res = await apiCall(BASE_URL + "api/posts/" + postId, {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "x-access-token": user.token,
      },
      body: JSON.stringify(data),
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
    }
    
    return res.json();
  } catch (err) {
    console.error("Error updating post:", err);
    throw err;
  }
};

const deletePost = async (postId, user) => {
  try {
    const res = await apiCall(BASE_URL + "api/posts/" + postId, {
      method: "DELETE",
      headers: {
        "x-access-token": user.token,
      },
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
    }
    
    return res.json();
  } catch (err) {
    console.error("Error deleting post:", err);
    throw err;
  }
};

const getComments = async (params) => {
  try {
    const { id } = params;
    const res = await apiCall(BASE_URL + "api/comments/post/" + id);
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    return res.json();
  } catch (err) {
    console.error("Error fetching comments:", err);
    throw err;
  }
};

const getUserComments = async (params) => {
  try {
    const { id, query } = params;
    const res = await apiCall(
      BASE_URL + "api/comments/user/" + id + "?" + new URLSearchParams(query)
    );
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    return res.json();
  } catch (err) {
    console.error("Error fetching user comments:", err);
    throw err;
  }
};

const createComment = async (comment, params, user) => {
  try {
    const { id } = params;
    const res = await apiCall(BASE_URL + "api/comments/" + id, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "x-access-token": user.token,
      },
      body: JSON.stringify(comment),
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
    }
    
    return res.json();
  } catch (err) {
    console.error("Error creating comment:", err);
    throw err;
  }
};

const updateComment = async (commentId, user, data) => {
  try {
    const res = await apiCall(BASE_URL + "api/comments/" + commentId, {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "x-access-token": user.token,
      },
      body: JSON.stringify(data),
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
    }
    
    return res.json();
  } catch (err) {
    console.error("Error updating comment:", err);
    throw err;
  }
};

const deleteComment = async (commentId, user) => {
  try {
    const res = await apiCall(BASE_URL + "api/comments/" + commentId, {
      method: "DELETE",
      headers: {
        "x-access-token": user.token,
      },
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
    }
    
    return res.json();
  } catch (err) {
    console.error("Error deleting comment:", err);
    throw err;
  }
};

const likePost = async (postId, user) => {
  try {
    const res = await apiCall(BASE_URL + "api/posts/like/" + postId, {
      method: "POST",
      headers: {
        "x-access-token": user.token,
      },
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
    }
    
    return res.json();
  } catch (err) {
    console.error("Error liking post:", err);
    throw err;
  }
};

const unlikePost = async (postId, user) => {
  try {
    const res = await apiCall(BASE_URL + "api/posts/like/" + postId, {
      method: "DELETE",
      headers: {
        "x-access-token": user.token,
      },
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
    }
    
    return res.json();
  } catch (err) {
    console.error("Error unliking post:", err);
    throw err;
  }
};

export {
  getPost,
  createPost,
  updatePost,
  deletePost,
  getPosts,
  getUserComments,
  getUserLikedPosts,
  getComments,
  createComment,
  deleteComment,
  updateComment,
  likePost,
  unlikePost,
  getUserLikes,
};