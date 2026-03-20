/**
 * Authentication Guard
 * Protects routes that require authentication
 */

/**
 * Check if user is authenticated
 * @returns {Promise<boolean>} - Is authenticated
 */
const checkAuthentication = async () => {
  const token = api.getAuthToken();

  if (!token) {
    return false;
  }

  try {
    // Verify token by calling /auth/me endpoint
    const response = await api.auth.getCurrentUser();
    return response.success === true;
  } catch (error) {
    // Token is invalid or expired
    api.clearTokens();
    return false;
  }
};

/**
 * Protect a route - redirect to login if not authenticated
 * @param {string} redirectTo - Redirect path if not authenticated (default: '/login.html')
 */
const protectRoute = async (redirectTo = './login.html') => {
  const isAuthenticated = await checkAuthentication();

  if (!isAuthenticated) {
    // Store intended destination
    const currentPath = window.location.pathname;
    if (currentPath !== redirectTo) {
      sessionStorage.setItem('redirectAfterLogin', currentPath);
    }

    // Redirect to login
    window.location.href = redirectTo;
    return false;
  }

  return true;
};

/**
 * Initialize auth guard for protected pages
 * Call this on pages that require authentication
 */
const initAuthGuard = () => {
  // Check if we're on a protected route
  const currentPath = window.location.pathname;
  const protectedPaths = ['/reg-users/', '/admin/'];

  const isProtectedRoute = protectedPaths.some((path) =>
    currentPath.includes(path)
  );

  if (isProtectedRoute) {
    protectRoute();
  }
};

// Auto-initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAuthGuard);
} else {
  initAuthGuard();
}

// Export for manual use
if (typeof window !== 'undefined') {
  window.authGuard = {
    checkAuthentication,
    protectRoute,
    initAuthGuard,
  };
}
