/**
 * Notification Integration Script
 * Handles loading and displaying notifications
 */

let notificationCheckInterval = null;

/**
 * Initialize notifications
 */
function initNotifications() {
  loadNotifications();
  setupNotificationBell();
  
  // Poll for new notifications every 30 seconds
  notificationCheckInterval = setInterval(() => {
    loadNotifications();
  }, 30000);
}

/**
 * Setup notification bell click handler
 */
function setupNotificationBell() {
  const notificationBell = document.querySelector('.notification');
  const notificationContainer = document.querySelector('.notification-container');
  
  if (notificationBell && notificationContainer) {
    notificationBell.addEventListener('click', (e) => {
      e.stopPropagation();
      const isVisible = notificationContainer.style.display !== 'none';
      notificationContainer.style.display = isVisible ? 'none' : 'block';
      
      if (!isVisible) {
        loadNotifications();
      }
    });
    
    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (!notificationContainer.contains(e.target) && !notificationBell.contains(e.target)) {
        notificationContainer.style.display = 'none';
      }
    });
  }
}

/**
 * Load notifications from API
 */
async function loadNotifications() {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      return;
    }

    const baseURL = typeof getAPIBaseURL === 'function' ? getAPIBaseURL() : (window.location.hostname === 'dev-sayo.github.io' || window.location.hostname.includes('github.io') ? 'https://roompal-wrgn.onrender.com/api' : 'http://localhost:5002/api');
    const response = await fetch(`${baseURL}/notifications/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired, try to refresh
        return;
      }
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success && data.data) {
      const notifications = data.data.notifications || [];
      const unreadCount = data.data.unreadCount || 0;
      
      renderNotifications(notifications);
      updateNotificationBadge(unreadCount);
    }
  } catch (error) {
    console.error('Error loading notifications:', error);
  }
}

/**
 * Render notifications in the dropdown
 */
function renderNotifications(notifications) {
  // Try both notification-container and notification-dropdown structures
  const notificationContainer = document.querySelector('.notification-container') || 
                                document.querySelector('.notification-dropdown');
  if (!notificationContainer) return;

  const notificationModal = notificationContainer.querySelector('.notification-modal');
  if (!notificationModal) return;

  // Clear existing notifications (keep header)
  let frameParent = notificationModal.querySelector('.frame-parent');
  
  // If frame-parent doesn't exist, create it
  if (!frameParent) {
    frameParent = document.createElement('div');
    frameParent.className = 'frame-parent';
    
    // Add header
    const header = document.createElement('div');
    header.className = 'frame-wrapper';
    header.innerHTML = `
      <div class="notifications-wrapper">
        <div class="notifications">Notifications</div>
      </div>
    `;
    frameParent.appendChild(header);
    notificationModal.appendChild(frameParent);
  } else {
    // Keep the header, remove old notifications
    const existingGroups = frameParent.querySelectorAll('.frame-group');
    existingGroups.forEach(group => group.remove());
    
    // Also remove frame-child separators
    const existingSeparators = frameParent.querySelectorAll('.frame-child');
    existingSeparators.forEach(sep => sep.remove());
    
    // Remove frame-parent2 if exists
    const frameParent2 = frameParent.querySelector('.frame-parent2');
    if (frameParent2) frameParent2.remove();
  }

  if (notifications.length === 0) {
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'frame-group';
    emptyDiv.innerHTML = `
      <div class="all-dropdown-wrapper">
        <div class="all-dropdown">
          <div class="all-dropdown-inner">
            <div class="property-type-wrapper">
              <div class="property-type">No notifications</div>
            </div>
          </div>
        </div>
      </div>
    `;
    frameParent.appendChild(emptyDiv);
    return;
  }

  // Render each notification
  notifications.forEach((notification) => {
    const notificationDiv = createNotificationElement(notification);
    frameParent.appendChild(notificationDiv);
    
    // Add separator
    const separator = document.createElement('div');
    separator.className = 'frame-child';
    frameParent.appendChild(separator);
  });
}

/**
 * Create notification element
 */
function createNotificationElement(notification) {
  const div = document.createElement('div');
  div.className = 'frame-group';
  
  const isRead = notification.isRead || false;
  const relatedUser = notification.relatedUser || {};
  const userName = relatedUser.fullName || 'Someone';
  
  let actionButtons = '';
  
  // Add action buttons for roommate requests
  if (notification.type === 'roommate_request' && notification.relatedRequest) {
    const requestId = notification.relatedRequest._id || notification.relatedRequest;
    const profileId = relatedUser._id || relatedUser;
    
    actionButtons = `
      <div class="button-parent" style="display: flex; gap: 6px; width: 100%;">
        <div class="button" style="flex: 1;">
          <div class="view-profile-wrapper">
            <a href="../roommate/roommate-info.html?id=${profileId}" class="view-profile">View profile</a>
          </div>
        </div>
        <div class="button2" style="flex: 1; background: #223448;">
          <div class="view-profile-wrapper">
            <a href="#" class="view-profile accept-request" data-request-id="${requestId}" style="color: white;">Accept</a>
          </div>
        </div>
        <div class="button" style="flex: 1; background: #ef4444;">
          <div class="view-profile-wrapper">
            <a href="#" class="view-profile reject-request" data-request-id="${requestId}" style="color: white;">Decline</a>
          </div>
        </div>
      </div>
    `;
  }
  
  div.innerHTML = `
    <div class="all-dropdown-wrapper">
      <div class="all-dropdown" style="${!isRead ? 'background: #f0f7ff;' : ''}">
        <div class="all-dropdown-inner">
          <div class="property-type-wrapper" style="word-wrap: break-word; overflow-wrap: break-word;">
            <div class="property-type" style="font-weight: ${!isRead ? '600' : '400'}; font-size: 13px; line-height: 1.4; word-break: break-word;">
              ${notification.message || notification.title}
            </div>
          </div>
        </div>
      </div>
    </div>
    ${actionButtons}
  `;
  
  // Add click handlers for accept and reject buttons
  if (actionButtons) {
    const acceptBtn = div.querySelector('.accept-request');
    if (acceptBtn) {
      acceptBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await acceptRoommateRequest(acceptBtn.dataset.requestId);
      });
    }
    
    const rejectBtn = div.querySelector('.reject-request');
    if (rejectBtn) {
      rejectBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await rejectRoommateRequest(rejectBtn.dataset.requestId);
      });
    }
  }
  
  // Mark as read when clicked
  div.addEventListener('click', async () => {
    if (!isRead) {
      await markNotificationAsRead(notification._id || notification.id);
    }
  });
  
  return div;
}

/**
 * Update notification badge
 */
function updateNotificationBadge(count) {
  const notificationBell = document.querySelector('.notification');
  if (!notificationBell) return;

  // Remove existing badge
  const existingBadge = notificationBell.querySelector('.notification-badge');
  if (existingBadge) {
    existingBadge.remove();
  }

  // Add badge if there are unread notifications
  if (count > 0) {
    const badge = document.createElement('span');
    badge.className = 'notification-badge';
    badge.textContent = count > 99 ? '99+' : count;
    badge.style.cssText = `
      position: absolute;
      top: -5px;
      right: -5px;
      background: #ef4444;
      color: white;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: bold;
    `;
    notificationBell.style.position = 'relative';
    notificationBell.appendChild(badge);
  }
}

/**
 * Mark notification as read
 */
async function markNotificationAsRead(notificationId) {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const baseURL = typeof getAPIBaseURL === 'function' ? getAPIBaseURL() : (window.location.hostname === 'dev-sayo.github.io' || window.location.hostname.includes('github.io') ? 'https://roompal-wrgn.onrender.com/api' : 'http://localhost:5002/api');
    await fetch(`${baseURL}/notifications/${notificationId}/read`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    // Reload notifications to update UI
    loadNotifications();
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
}

/**
 * Accept roommate request
 */
async function acceptRoommateRequest(requestId) {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      if (typeof toast !== 'undefined') {
        toast.error('Please login to accept requests');
      }
      return;
    }

    const baseURL = typeof getAPIBaseURL === 'function' ? getAPIBaseURL() : (window.location.hostname === 'dev-sayo.github.io' || window.location.hostname.includes('github.io') ? 'https://roompal-wrgn.onrender.com/api' : 'http://localhost:5002/api');
    const response = await fetch(`${baseURL}/roommate-requests/${requestId}/accept`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (response.ok && data.success) {
      if (typeof toast !== 'undefined') {
        toast.success('Roommate request accepted!');
      }
      
      // Reload notifications
      loadNotifications();
    } else {
      // Handle already accepted/rejected gracefully
      if (data.message && (data.message.includes('already') || data.message.includes('accepted') || data.message.includes('rejected'))) {
        if (typeof toast !== 'undefined') {
          toast.info(data.message || 'This request has already been processed');
        }
        // Reload to update UI
        loadNotifications();
      } else {
        throw new Error(data.message || 'Failed to accept request');
      }
    }
  } catch (error) {
    console.error('Error accepting request:', error);
    // Only show error if it's not an "already processed" case
    if (!error.message || (!error.message.includes('already') && !error.message.includes('accepted'))) {
      if (typeof toast !== 'undefined') {
        toast.error(error.message || 'Failed to accept roommate request');
      }
    }
  }
}

/**
 * Reject roommate request
 */
async function rejectRoommateRequest(requestId) {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      if (typeof toast !== 'undefined') {
        toast.error('Please login to reject requests');
      }
      return;
    }

    const baseURL = typeof getAPIBaseURL === 'function' ? getAPIBaseURL() : (window.location.hostname === 'dev-sayo.github.io' || window.location.hostname.includes('github.io') ? 'https://roompal-wrgn.onrender.com/api' : 'http://localhost:5002/api');
    const response = await fetch(`${baseURL}/roommate-requests/${requestId}/reject`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (response.ok && data.success) {
      if (typeof toast !== 'undefined') {
        toast.success('Roommate request declined');
      }
      
      // Reload notifications
      loadNotifications();
    } else {
      // Handle already processed gracefully
      if (data.message && (data.message.includes('already') || data.message.includes('accepted') || data.message.includes('rejected'))) {
        if (typeof toast !== 'undefined') {
          toast.info(data.message || 'This request has already been processed');
        }
        // Reload to update UI
        loadNotifications();
      } else {
        throw new Error(data.message || 'Failed to reject request');
      }
    }
  } catch (error) {
    console.error('Error rejecting request:', error);
    // Only show error if it's not an "already processed" case
    if (!error.message || (!error.message.includes('already') && !error.message.includes('rejected'))) {
      if (typeof toast !== 'undefined') {
        toast.error(error.message || 'Failed to reject roommate request');
      }
    }
  }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNotifications);
} else {
  initNotifications();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (notificationCheckInterval) {
    clearInterval(notificationCheckInterval);
  }
});
