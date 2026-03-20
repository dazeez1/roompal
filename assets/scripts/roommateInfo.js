/**
 * Roommate Info Page Script
 * Fetches and displays roommate profile details
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Show loading state immediately to hide placeholder content
  showLoading();
  
  // Get profile ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const profileId = urlParams.get('id');

  if (!profileId) {
    showError('No profile ID provided');
    return;
  }

  await loadRoommateInfo(profileId);
});

/**
 * Make authenticated API request using api.js functions
 */
async function authenticatedFetch(url, options = {}) {
  // Use api.js if available, otherwise fallback
  if (typeof window !== 'undefined' && window.api && window.api.request) {
    try {
      const baseURL = typeof getAPIBaseURL === 'function' ? getAPIBaseURL() : (window.location.hostname === 'dev-sayo.github.io' || window.location.hostname.includes('github.io') ? 'https://roompal-wrgn.onrender.com/api' : 'http://localhost:5002/api');
      const endpoint = url.replace(baseURL, '').replace('http://localhost:5002/api', '');
      return await window.api.request(endpoint, {
        ...options,
        requiresAuth: true,
      });
    } catch (error) {
      // Fallback to direct fetch
    }
  }
  
  // Fallback: direct fetch with token
  let token = localStorage.getItem('accessToken');
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Try to refresh using api.js
    if (typeof window !== 'undefined' && window.api && window.api.refreshAccessToken) {
      const refreshed = await window.api.refreshAccessToken();
      if (refreshed) {
        token = localStorage.getItem('accessToken');
        headers['Authorization'] = `Bearer ${token}`;
        return fetch(url, {
          ...options,
          headers,
        });
      }
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '../../login.html';
    throw new Error('Token expired');
  }

  return response;
}

/**
 * Load roommate profile information
 */
async function loadRoommateInfo(profileId) {
  try {
    showLoading();

    const response = await authenticatedFetch(
      `${typeof getAPIBaseURL === 'function' ? getAPIBaseURL() : (window.location.hostname === 'dev-sayo.github.io' || window.location.hostname.includes('github.io') ? 'https://roompal-wrgn.onrender.com/api' : 'http://localhost:5002/api')}/roommates/${profileId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        showError('Roommate profile not found');
        return;
      }
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    console.log('📥 API Response:', data);

    if (data.success && data.data) {
      renderRoommateInfo(data.data);
    } else {
      console.error('❌ Invalid response format:', data);
      throw new Error(data.message || 'Invalid response format');
    }
  } catch (error) {
    console.error('Error loading roommate info:', error);
    showError(error.message || 'Failed to load roommate profile');
  }
}

/**
 * Render roommate information
 */
function renderRoommateInfo(data) {
  console.log('📋 Rendering roommate info:', data);
  
  // Handle both { profile: {...} } and direct profile object
  const profile = data.profile || data;
  const user = profile.user || {};
  
  const fullName = user.fullName || 'Unknown';
  const email = user.email || 'Not provided';
  const occupation = profile.occupation || 'Not specified';
  const gender = profile.gender || 'Not specified';
  const preferredLocation = profile.preferredLocation || 'Not specified';
  const budget = profile.budget || 0;
  const lifestyle = profile.lifestyle || 'Not specified';
  const cleanlinessLevel = profile.cleanlinessLevel || 3;
  const smoking = profile.smoking ? 'Yes' : 'No';
  const pets = profile.pets ? 'Yes' : 'No';
  const bio = profile.bio || 'No bio provided';
  const preferredGender = profile.preferredGender || 'No Preference';

  console.log('👤 Profile data:', {
    fullName,
    gender,
    occupation,
    preferredLocation,
    lifestyle,
    smoking,
    bio
  });

  // Get avatar URL
  const avatarUrl = profile.profileImage || 
    `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=223448&color=fff&size=400&bold=true`;

  // Update main image
  const mainImage = document.getElementById('mainImage');
  if (mainImage) {
    mainImage.src = avatarUrl;
    mainImage.alt = fullName;
    mainImage.onerror = function() {
      const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
      this.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=223448&color=fff&size=400&bold=true`;
    };
    console.log('✅ Updated main image:', avatarUrl);
  } else {
    console.warn('⚠️ mainImage element not found');
  }

  // Update left column - Name
  const nameElement = document.querySelector('.property-title-text');
  if (nameElement) {
    nameElement.textContent = fullName;
    console.log('✅ Updated name:', fullName);
  } else {
    console.warn('⚠️ .property-title-text not found');
  }

  // Gender (4th roommate-section in left column)
  const genderElement = document.querySelector('.left-column .roommate-section:nth-of-type(4) p');
  if (genderElement) {
    genderElement.textContent = gender;
    console.log('✅ Updated gender:', gender);
  } else {
    console.warn('⚠️ Gender element not found');
  }
  
  // Contact
  const contactLink = document.getElementById('roommate-contact-link');
  if (contactLink) {
    contactLink.textContent = email;
    contactLink.href = `mailto:${email}`;
    console.log('✅ Updated contact:', email);
  } else {
    console.warn('⚠️ Contact link not found');
  }

  // Preferred location - split state and area
  const locationParts = preferredLocation.split(',').map(s => s.trim());
  const stateElement = document.querySelector('.left-column .roommate-section:nth-of-type(6) p');
  const areaElement = document.querySelector('.left-column .roommate-section:nth-of-type(7) p');
  
  if (stateElement) {
    stateElement.textContent = locationParts[0] || preferredLocation;
    console.log('✅ Updated state:', locationParts[0]);
  }
  if (areaElement) {
    areaElement.textContent = locationParts.slice(1).join(', ') || preferredLocation;
    console.log('✅ Updated area:', locationParts.slice(1).join(', '));
  }

  // Update right column
  // Smoking (2nd details-card)
  const smokingElement = document.querySelector('.right-column .details-card:nth-of-type(2) p');
  if (smokingElement) {
    smokingElement.textContent = smoking;
    console.log('✅ Updated smoking:', smoking);
  }

  // Preferred gender (3rd details-card)
  const preferredGenderElement = document.querySelector('.right-column .details-card:nth-of-type(3) p');
  if (preferredGenderElement) {
    preferredGenderElement.textContent = `Okay with ${preferredGender === 'No Preference' ? 'any gender' : preferredGender.toLowerCase()}`;
    console.log('✅ Updated preferred gender:', preferredGender);
  }

  // Bio (4th and 5th details-card - both show bio)
  const bioElements = document.querySelectorAll('.right-column .details-card:nth-of-type(4) p, .right-column .details-card:nth-of-type(5) p');
  bioElements.forEach(el => {
    if (el) {
      el.textContent = bio;
    }
  });
  console.log('✅ Updated bio:', bio);

  // Occupation (6th details-card)
  const occupationElement = document.querySelector('.right-column .details-card:nth-of-type(6) p');
  if (occupationElement) {
    occupationElement.textContent = occupation;
    console.log('✅ Updated occupation:', occupation);
  }

  // Lifestyle (7th details-card)
  const lifestyleElement = document.querySelector('.right-column .details-card:nth-of-type(7) p');
  if (lifestyleElement) {
    lifestyleElement.textContent = lifestyle;
    console.log('✅ Updated lifestyle:', lifestyle);
  }
  
  // Cleanliness level (8th details-card)
  const cleanlinessElement = document.querySelector('.right-column .details-card:nth-of-type(8) p');
  if (cleanlinessElement) {
    const cleanlinessText = getCleanlinessText(cleanlinessLevel);
    cleanlinessElement.textContent = cleanlinessText;
    console.log('✅ Updated cleanliness:', cleanlinessText);
  }

  // Store profile data globally for request match functionality
  window.currentRoommateProfile = {
    userId: user._id || user.id,
    fullName: fullName,
    profileId: profile._id || profile.id,
  };

  // Update contact button with request match functionality
  const contactBtn = document.getElementById('contactBtn');
  if (contactBtn && user._id) {
    const userId = user._id || user.id;
    contactBtn.onclick = (e) => {
      e.preventDefault();
      showConfirmationModal(userId, fullName);
    };
    console.log('✅ Updated contact button for request match');
  }

  // Update chat link
  const chatLink = document.querySelector('.contact-btn a[href*="message"]');
  if (chatLink && user._id) {
    const userId = user._id || user.id;
    chatLink.href = `../message/in-app-message.html?userId=${userId}`;
    console.log('✅ Updated chat link with userId:', userId);
  }

  console.log('✅ All roommate info rendered successfully!');
  hideLoading();
}

/**
 * Get cleanliness level text
 */
function getCleanlinessText(level) {
  const levels = {
    1: 'Low (Easy-going)',
    2: 'Low-Medium',
    3: 'Medium (Reasonably tidy)',
    4: 'Medium-High',
    5: 'High (Very neat)',
  };
  return levels[level] || 'Not specified';
}

/**
 * Update element text content (kept for backward compatibility)
 */
function updateElement(selector, text) {
  const element = document.querySelector(selector);
  if (element) {
    element.textContent = text;
  } else {
    console.warn(`⚠️ Element not found: ${selector}`);
  }
}

/**
 * Show loading state
 */
function showLoading() {
  const spinner = document.getElementById('loadingSpinner');
  const contentContainer = document.getElementById('contentContainer');
  
  if (spinner) {
    spinner.style.display = 'flex';
  }
  if (contentContainer) {
    contentContainer.style.display = 'none';
  }
}

/**
 * Hide loading state and show content
 */
function hideLoading() {
  const spinner = document.getElementById('loadingSpinner');
  const contentContainer = document.getElementById('contentContainer');
  
  if (spinner) {
    spinner.style.display = 'none';
  }
  if (contentContainer) {
    contentContainer.style.display = 'block';
  }
}

/**
 * Show error message
 */
function showError(message) {
  const spinner = document.getElementById('loadingSpinner');
  const contentContainer = document.getElementById('contentContainer');
  
  if (spinner) {
    spinner.innerHTML = `
      <div style="text-align: center; padding: 3rem;">
        <h2 style="color: #ef4444; margin-bottom: 1rem;">Error</h2>
        <p style="color: #666; margin-bottom: 2rem;">${message}</p>
        <a href="roommate.html" style="display: inline-block; padding: 0.75rem 1.5rem; background: #223448; color: white; border-radius: 25px; text-decoration: none;">
          ← Go Back
        </a>
      </div>
    `;
    spinner.innerHTML = `
      <div style="text-align: center; padding: 3rem;">
        <h2 style="color: #ef4444; margin-bottom: 1rem;">Error</h2>
        <p style="color: #666; margin-bottom: 2rem;">${message}</p>
        <a href="roommate.html" style="display: inline-block; padding: 0.75rem 1.5rem; background: #223448; color: white; border-radius: 25px; text-decoration: none;">
          ← Go Back
        </a>
      </div>
    `;
    spinner.style.display = 'flex';
  }
  
  if (contentContainer) {
    contentContainer.style.display = 'none';
  }
}

/**
 * Show confirmation modal for roommate request
 */
function showConfirmationModal(userId, userName) {
  const confirmationFrame = document.querySelector('.confirmation-frame');
  if (confirmationFrame) {
    // Update the name in the modal
    const modalTitle = confirmationFrame.querySelector('h2');
    if (modalTitle) {
      modalTitle.textContent = `Are you sure you want to get matched with ${userName} as a roommate?`;
    }
    
    // Show the modal
    confirmationFrame.style.display = 'flex';
    
    // Remove any existing event listeners by cloning
    const yesButton = confirmationFrame.querySelector('.chat');
    const noButton = confirmationFrame.querySelector('.leave');
    
    if (yesButton) {
      // Clone to remove old listeners
      const newYesButton = yesButton.cloneNode(true);
      yesButton.parentNode.replaceChild(newYesButton, yesButton);
      
      newYesButton.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        confirmationFrame.style.display = 'none';
        sendRoommateRequest(userId, userName);
      };
    }
    
    if (noButton) {
      // Clone to remove old listeners
      const newNoButton = noButton.cloneNode(true);
      noButton.parentNode.replaceChild(newNoButton, noButton);
      
      newNoButton.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        confirmationFrame.style.display = 'none';
      };
    }
  }
}

/**
 * Send roommate request
 */
async function sendRoommateRequest(recipientId, recipientName) {
  try {
    // Show loading state
    const loadingDiv = document.querySelector('.loading_1');
    if (loadingDiv) {
      loadingDiv.style.display = 'flex';
    }

    console.log('📤 Sending roommate request to:', recipientId);

    // Get token
    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw new Error('Please login to send a request');
    }

    // Send request
    const baseURL = typeof getAPIBaseURL === 'function' ? getAPIBaseURL() : (window.location.hostname === 'dev-sayo.github.io' || window.location.hostname.includes('github.io') ? 'https://roompal-wrgn.onrender.com/api' : 'http://localhost:5002/api');
    const response = await fetch(`${baseURL}/roommate-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        recipientId: recipientId,
        message: `I'd like to be your roommate!`,
      }),
    });

    const data = await response.json();
    console.log('📥 Request response:', data);

    // Hide loading
    if (loadingDiv) {
      loadingDiv.style.display = 'none';
    }

    if (response.ok && data.success) {
      // Show success message
      const successDiv = document.querySelector('.request-checked');
      if (successDiv) {
        // Update the name in success message
        const successMessage = successDiv.querySelector('p');
        if (successMessage) {
          successMessage.textContent = `We have successfully sent ${recipientName} your roommate request. They need to accept you now as a roommate. Note that you can chat them up while you wait.`;
        }
        
        // Update chat link
        const chatLink = successDiv.querySelector('.chat');
        if (chatLink) {
          chatLink.href = `../message/in-app-message.html?userId=${recipientId}`;
        }
        
        successDiv.style.display = 'flex';
      }

      // Show toast notification
      if (typeof toast !== 'undefined') {
        toast.success('Roommate request sent successfully!');
      }
    } else {
      throw new Error(data.message || 'Failed to send request');
    }
  } catch (error) {
    console.error('❌ Error sending request:', error);
    
    // Hide loading
    const loadingDiv = document.querySelector('.loading_1');
    if (loadingDiv) {
      loadingDiv.style.display = 'none';
    }

    // Show error
    if (typeof toast !== 'undefined') {
      toast.error(error.message || 'Failed to send roommate request');
    } else {
      alert(`Error: ${error.message || 'Failed to send roommate request'}`);
    }
  }
}
