/**
 * Configuration helper for environment detection
 * Centralized configuration for API URLs
 */

/**
 * Get API base URL based on environment
 * @returns {string} - API base URL
 */
function getAPIBaseURL() {
  // Check if we're in production (GitHub Pages)
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'dev-sayo.github.io' || window.location.hostname.includes('github.io')) {
      return 'https://roompal-wrgn.onrender.com/api';
    }
  }
  // Development/localhost
  return 'http://localhost:5002/api';
}

/**
 * Get server URL (without /api) for Socket.io
 * @returns {string} - Server URL
 */
function getServerURL() {
  // Check if we're in production (GitHub Pages)
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'dev-sayo.github.io' || window.location.hostname.includes('github.io')) {
      return 'https://roompal-wrgn.onrender.com';
    }
  }
  // Development/localhost
  return 'http://localhost:5002';
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getAPIBaseURL, getServerURL };
} else {
  window.getAPIBaseURL = getAPIBaseURL;
  window.getServerURL = getServerURL;
}
