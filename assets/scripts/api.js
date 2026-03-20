/**
 * API Service Layer
 * Centralized API communication for Roompal frontend
 */

console.log('✅ api.js script loaded!');

// Detect environment and set base URL
const getBaseURL = () => {
  // Check if we're in production (GitHub Pages)
  if (window.location.hostname === 'dev-sayo.github.io' || window.location.hostname.includes('github.io')) {
    return 'https://roompal-wrgn.onrender.com/api';
  }
  // Development/localhost
  return 'http://localhost:5002/api';
};

const API_CONFIG = {
  baseURL: getBaseURL(),
  timeout: 30000, // 30 seconds
};

/**
 * Get authentication token from localStorage
 * @returns {string|null} - Access token or null
 */
const getAuthToken = () => {
  try {
    return localStorage.getItem('accessToken');
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error getting auth token:', error);
    }
    return null;
  }
};

/**
 * Get refresh token from localStorage
 * @returns {string|null} - Refresh token or null
 */
const getRefreshToken = () => {
  try {
    return localStorage.getItem('refreshToken');
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error getting refresh token:', error);
    }
    return null;
  }
};

/**
 * Store tokens in localStorage
 * @param {string} accessToken - Access token
 * @param {string} refreshToken - Refresh token
 */
const storeTokens = (accessToken, refreshToken) => {
  try {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error storing tokens:', error);
    }
  }
};

/**
 * Clear tokens from localStorage
 */
const clearTokens = () => {
  try {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error clearing tokens:', error);
    }
  }
};

/**
 * Make API request
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Request options
 * @returns {Promise<Object>} - Response data
 */
const apiRequest = async (endpoint, options = {}) => {
  const {
    method = 'GET',
    body = null,
    requiresAuth = false,
    headers = {},
  } = options;

  const url = `${API_CONFIG.baseURL}${endpoint}`;
  const requestHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  };

  // Add authorization header if required
  if (requiresAuth) {
    const token = getAuthToken();
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  const requestOptions = {
    method,
    headers: requestHeaders,
  };

  // Add body for POST, PUT, PATCH requests
  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    requestOptions.body = JSON.stringify(body);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);
    requestOptions.signal = controller.signal;

    const response = await fetch(url, requestOptions);
    clearTimeout(timeoutId);

    const data = await response.json();

    // Handle non-OK responses
    if (!response.ok) {
      // If unauthorized and we have a refresh token, try to refresh
      if (response.status === 401 && requiresAuth && getRefreshToken()) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          // Retry original request with new token
          return apiRequest(endpoint, options);
        }
      }

      const error = new Error(data.message || 'Request failed');
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timeout. Please try again.');
    }
    throw error;
  }
};

/**
 * Refresh access token using refresh token
 * @returns {Promise<boolean>} - Success status
 */
const refreshAccessToken = async () => {
  try {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      return false;
    }

    const response = await apiRequest('/auth/refresh-token', {
      method: 'POST',
      body: { refreshToken },
      requiresAuth: false,
    });

    if (response.success && response.data?.tokens) {
      storeTokens(
        response.data.tokens.accessToken,
        response.data.tokens.refreshToken
      );
      return true;
    }
    return false;
  } catch (error) {
    clearTokens();
    return false;
  }
};

/**
 * API Methods
 */
const api = {
  // Authentication endpoints
  auth: {
    register: async (userData) => {
      return apiRequest('/auth/register', {
        method: 'POST',
        body: userData,
        requiresAuth: false,
      });
    },

    login: async (credentials) => {
      return apiRequest('/auth/login', {
        method: 'POST',
        body: credentials,
        requiresAuth: false,
      });
    },

    verifyEmail: async (token) => {
      return apiRequest('/auth/verify-email', {
        method: 'POST',
        body: { token },
        requiresAuth: false,
      });
    },

    resendVerification: async (email) => {
      return apiRequest('/auth/resend-verification', {
        method: 'POST',
        body: { email },
        requiresAuth: false,
      });
    },

    forgotPassword: async (email) => {
      return apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: { email },
        requiresAuth: false,
      });
    },

    resetPassword: async (token, newPassword) => {
      return apiRequest('/auth/reset-password', {
        method: 'POST',
        body: { token, newPassword },
        requiresAuth: false,
      });
    },

    getCurrentUser: async () => {
      return apiRequest('/auth/me', {
        method: 'GET',
        requiresAuth: true,
      });
    },

    refreshToken: async () => {
      return refreshAccessToken();
    },
  },

  // Property endpoints
  properties: {
    getAll: async (filters = {}) => {
      const queryParams = new URLSearchParams();
      Object.keys(filters).forEach((key) => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
          queryParams.append(key, filters[key]);
        }
      });
      const queryString = queryParams.toString();
      const endpoint = `/properties${queryString ? `?${queryString}` : ''}`;
      return apiRequest(endpoint, {
        method: 'GET',
        requiresAuth: false,
      });
    },

    getById: async (id) => {
      return apiRequest(`/properties/${id}`, {
        method: 'GET',
        requiresAuth: false,
      });
    },

    create: async (formData) => {
      // For FormData, we need special handling
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required. Please login.');
      }
      
      const url = `${API_CONFIG.baseURL}/properties`;
      const headers = {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type for FormData - browser will set it with boundary
      };

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: headers,
          body: formData,
        });

        let data;
        try {
          data = await response.json();
        } catch (parseError) {
          // If response is not JSON, create error
          const text = await response.text();
          throw new Error(`Server error: ${response.status} ${response.statusText}. ${text}`);
        }

        if (!response.ok) {
          const error = new Error(data.message || `Request failed with status ${response.status}`);
          error.status = response.status;
          error.data = data;
          throw error;
        }

        return data;
      } catch (error) {
        // Re-throw with more context if needed
        if (error.message && !error.status) {
          // Network error or other fetch error
          throw new Error(`Network error: ${error.message}`);
        }
        throw error;
      }
    },

    update: async (id, formData) => {
      const token = getAuthToken();
      const url = `${API_CONFIG.baseURL}/properties/${id}`;
      const headers = {};
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      try {
        const response = await fetch(url, {
          method: 'PUT',
          headers: headers,
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          const error = new Error(data.message || 'Request failed');
          error.status = response.status;
          error.data = data;
          throw error;
        }

        return data;
      } catch (error) {
        throw error;
      }
    },

    delete: async (id) => {
      return apiRequest(`/properties/${id}`, {
        method: 'DELETE',
        requiresAuth: true,
      });
    },

    getMyProperties: async () => {
      return apiRequest('/properties/my/properties', {
        method: 'GET',
        requiresAuth: true,
      });
    },
  },

  // Roommate endpoints
  roommates: {
    createOrUpdateProfile: async (profileData) => {
      return apiRequest('/roommates/profile', {
        method: 'POST',
        body: profileData,
        requiresAuth: true,
      });
    },

    getMyProfile: async () => {
      return apiRequest('/roommates/me', {
        method: 'GET',
        requiresAuth: true,
      });
    },

    getAllActiveProfiles: async (filters = {}) => {
      const queryParams = new URLSearchParams();
      Object.keys(filters).forEach((key) => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
          queryParams.append(key, filters[key]);
        }
      });
      const queryString = queryParams.toString();
      const endpoint = `/roommates${queryString ? `?${queryString}` : ''}`;
      return apiRequest(endpoint, {
        method: 'GET',
        requiresAuth: false,
      });
    },

    getMatches: async () => {
      return apiRequest('/roommates/matches', {
        method: 'GET',
        requiresAuth: true,
      });
    },
  },

  // Message endpoints
  messages: {
    getConversations: async () => {
      return apiRequest('/messages/conversations', {
        method: 'GET',
        requiresAuth: true,
      });
    },

    getMessages: async (conversationId, page = 1, limit = 50) => {
      return apiRequest(`/messages/${conversationId}?page=${page}&limit=${limit}`, {
        method: 'GET',
        requiresAuth: true,
      });
    },

    sendMessage: async (receiverId, content) => {
      return apiRequest('/messages', {
        method: 'POST',
        body: { receiverId, content },
        requiresAuth: true,
      });
    },

    markAsRead: async (messageId) => {
      return apiRequest(`/messages/${messageId}/read`, {
        method: 'PUT',
        requiresAuth: true,
      });
    },

    getUnreadCount: async () => {
      return apiRequest('/messages/unread/count', {
        method: 'GET',
        requiresAuth: true,
      });
    },
  },

  // Utility methods
  getAuthToken,
  getRefreshToken,
  storeTokens,
  clearTokens,
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = api;
} else {
  window.api = api;
}
