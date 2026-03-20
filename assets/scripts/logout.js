/**
 * Logout Handler
 * Handles user logout functionality
 */

console.log('🚪 logout.js loaded');

/**
 * Logout function
 * Clears tokens and redirects to login
 */
function handleLogout() {
  console.log('🚪 Logging out...');
  
  // Clear all auth data
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  
  // Show toast if available
  if (typeof toast !== 'undefined') {
    toast.success('Logged out successfully');
  }
  
  // Redirect to login after short delay
  setTimeout(() => {
    window.location.href = '../../login.html';
  }, 500);
}

// Make it globally available
window.handleLogout = handleLogout;

// Auto-attach to logout buttons
document.addEventListener('DOMContentLoaded', () => {
  const logoutButtons = document.querySelectorAll('.logout-btn, [data-logout]');
  logoutButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      handleLogout();
    });
  });
  
  if (logoutButtons.length > 0) {
    console.log(`✅ Attached logout handler to ${logoutButtons.length} button(s)`);
  }
});
