/**
 * Roommate Integration Script
 * Handles roommate profile listing, registration, and filtering
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Check authentication
  const token = localStorage.getItem('accessToken');
  if (!token) {
    if (typeof toast !== 'undefined') {
      toast.error('Please login to access roommate features');
    }
    setTimeout(() => {
      window.location.href = '../../login.html';
    }, 2000);
    return;
  }

  // Initialize tab functionality
  initializeTabs();

  // Load roommate profiles on search tab
  const searchTab = document.getElementById('search-tab');
  if (searchTab && searchTab.classList.contains('active')) {
    await loadRoommateProfiles({}, 1);
  } else {
    // Also try loading if container exists (might be active by default)
    const container = document.getElementById('roommie-deets');
    if (container) {
      await loadRoommateProfiles({}, 1);
    }
  }

  // Setup search functionality
  setupSearch();

  // Setup registration form
  setupRegistrationForm();

  // Setup filter functionality
  setupFilters();
});

/**
 * Initialize tab switching
 */
function initializeTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach((button) => {
    button.addEventListener('click', async () => {
      const targetTab = button.getAttribute('data-tab');

      // Remove active class from all buttons
      tabButtons.forEach((btn) => btn.classList.remove('active'));
      button.classList.add('active');

      // Hide all tab contents
      tabContents.forEach((content) => content.classList.remove('active'));

      // Show target tab
      const targetContent = document.getElementById(`${targetTab}-tab`);
      if (targetContent) {
        targetContent.classList.add('active');

        // Load data when switching to search tab
        if (targetTab === 'search') {
          // Small delay to ensure tab is visible
          setTimeout(async () => {
            await loadRoommateProfiles({}, 1);
          }, 100);
        }
      }
    });
  });
}

// Track current page for pagination
let currentRoommatePage = 1;
let currentRoommateFilters = {};

/**
 * Load roommate profiles with pagination
 */
async function loadRoommateProfiles(filters = {}, page = 1) {
  const container = document.getElementById('roommie-deets');
  if (!container) return;

  try {
    // Store current filters and page
    currentRoommateFilters = filters;
    currentRoommatePage = page;

    // Show loading state
    container.innerHTML = '<div class="text-center py-10">Loading roommate profiles...</div>';

    // Build query string with pagination
    const queryParams = new URLSearchParams();
    if (filters.location) queryParams.append('location', filters.location);
    if (filters.gender) queryParams.append('gender', filters.gender);
    if (filters.budget) queryParams.append('budget', filters.budget);
    queryParams.append('page', page);
    queryParams.append('limit', 12); // 12 profiles per page

        const queryString = queryParams.toString();
        const endpoint = `/roommates${queryString ? `?${queryString}` : ''}`;

        // Get base URL based on environment
        const getBaseURL = () => {
          if (window.location.hostname === 'dev-sayo.github.io' || window.location.hostname.includes('github.io')) {
            return 'https://roompal-wrgn.onrender.com/api';
          }
          return 'http://localhost:5002/api';
        };
        const response = await authenticatedFetch(`${getBaseURL()}${endpoint}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    console.log('📥 Roommate profiles response:', data);

    if (data.success && data.data) {
      // Handle both { profiles: [...] } and direct array response
      const profiles = data.data.profiles || data.data || [];
      const pagination = data.data.pagination || {};
      console.log('📋 Profiles found:', profiles.length);

      if (profiles.length > 0) {
        container.innerHTML = profiles.map(profile => createRoommateCard(profile)).join('');
        console.log('✅ Profiles rendered successfully');
        
        // Render pagination if available
        if (pagination.totalPages > 1) {
          renderRoommatePagination(container, pagination, filters);
        } else {
          // Remove existing pagination
          const existingPagination = container.parentElement.querySelector('.roommate-pagination');
          if (existingPagination) {
            existingPagination.remove();
          }
        }
      } else {
        container.innerHTML = `
          <div class="text-center py-10 text-gray-500">
            <p class="mb-4">No roommate profiles found.</p>
            <p class="text-sm">Try adjusting your filters or check back later.</p>
          </div>
        `;
        
        // Remove pagination if exists
        const existingPagination = container.parentElement.querySelector('.roommate-pagination');
        if (existingPagination) {
          existingPagination.remove();
        }
      }
    } else {
      console.error('❌ Invalid response format:', data);
      throw new Error(data.message || 'Failed to load roommate profiles');
    }
  } catch (error) {
    console.error('Error loading roommate profiles:', error);
    container.innerHTML = `
      <div class="text-center py-10">
        <p class="text-red-500 mb-4">Failed to load roommate profiles. Please try again later.</p>
        <button onclick="location.reload()" class="px-4 py-2 bg-[#223448] text-white rounded-full">
          Retry
        </button>
      </div>
    `;

    if (typeof toast !== 'undefined') {
      toast.error('Failed to load roommate profiles.');
    }
  }
}

/**
 * Get user avatar image URL or generate initials
 */
function getUserAvatar(user, profile) {
  // Priority: profile.profileImage > user.profileImage > profile.image > initials
  if (profile && profile.profileImage) {
    return profile.profileImage;
  }
  
  if (user && user.profileImage) {
    return user.profileImage;
  }
  
  if (profile && profile.image) {
    return profile.image;
  }
  
  // Generate initials-based avatar using UI Avatars service
  const fullName = user.fullName || 'User';
  const initials = fullName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
  
  // Use UI Avatars service for nice avatar with initials
  const bgColor = getAvatarColor(fullName);
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${bgColor}&color=fff&size=200&bold=true&font-size=0.5`;
}

/**
 * Get consistent color for avatar based on name
 */
function getAvatarColor(name) {
  const colors = [
    '223448', // Primary color
    '4A90E2', // Blue
    '50C878', // Green
    'FF6B6B', // Red
    'FFA500', // Orange
    '9B59B6', // Purple
    '1ABC9C', // Teal
    'E74C3C', // Dark Red
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

/**
 * Create roommate card HTML - Simplified: Only image, name, and occupation
 */
function createRoommateCard(profile) {
  const user = profile.user || {};
  const profileId = profile._id || profile.id;
  const userId = user._id || user.id || '';
  const avatarUrl = getUserAvatar(user, profile);
  const fullName = user.fullName || 'Unknown';
  const occupation = profile.occupation || 'Not specified';

  return `
    <div class="roommate-card">
      <div class="roommate-avatar">
        <img 
          src="${avatarUrl}" 
          alt="${fullName}" 
          onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(fullName.substring(0, 2).toUpperCase())}&background=223448&color=fff&size=200&bold=true'"
        />
      </div>
      <div class="roommate-info">
        <h4>${fullName}</h4>
        <p class="occupation">${occupation}</p>
        <div class="roommate-actions">
          <a class="chat-btn" href="../message/in-app-message.html?userId=${userId}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            Chat
          </a>
          <a class="view-more-btn" href="./roommate-info.html?id=${profileId}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            View more
          </a>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render pagination controls for roommate listings
 */
function renderRoommatePagination(container, pagination, filters) {
  // Remove existing pagination
  const existingPagination = container.parentElement.querySelector('.roommate-pagination');
  if (existingPagination) {
    existingPagination.remove();
  }

  const paginationContainer = document.createElement('div');
  paginationContainer.className = 'roommate-pagination';
  paginationContainer.style.cssText = 'width: 100%; display: flex; justify-content: center; align-items: center; gap: 1rem; margin: 2rem 0; padding: 1rem;';
  
  paginationContainer.innerHTML = `
    <button 
      class="pagination-btn" 
      style="padding: 0.5rem 1.5rem; border-radius: 25px; border: none; background: ${!pagination.hasPrevPage ? '#e5e7eb' : '#223448'}; color: ${!pagination.hasPrevPage ? '#9ca3af' : 'white'}; cursor: ${!pagination.hasPrevPage ? 'not-allowed' : 'pointer'}; transition: all 0.2s;"
      ${!pagination.hasPrevPage ? 'disabled' : ''}
      onclick="goToRoommatePage(${pagination.currentPage - 1})"
    >
      ← Previous
    </button>
    <span style="color: #4b5563; font-weight: 500;">
      Page ${pagination.currentPage} of ${pagination.totalPages} (${pagination.totalProperties} profiles)
    </span>
    <button 
      class="pagination-btn"
      style="padding: 0.5rem 1.5rem; border-radius: 25px; border: none; background: ${!pagination.hasNextPage ? '#e5e7eb' : '#223448'}; color: ${!pagination.hasNextPage ? '#9ca3af' : 'white'}; cursor: ${!pagination.hasNextPage ? 'not-allowed' : 'pointer'}; transition: all 0.2s;"
      ${!pagination.hasNextPage ? 'disabled' : ''}
      onclick="goToRoommatePage(${pagination.currentPage + 1})"
    >
      Next →
    </button>
  `;

  // Insert after container
  container.parentNode.insertBefore(paginationContainer, container.nextSibling);
}

/**
 * Go to specific page for roommate listings
 */
window.goToRoommatePage = (page) => {
  const container = document.getElementById('roommie-deets');
  if (container) {
    loadRoommateProfiles(currentRoommateFilters, page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

/**
 * Setup search functionality
 */
function setupSearch() {
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');

  if (searchBtn) {
    searchBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const searchTerm = searchInput?.value?.trim() || '';
      // For now, just reload all profiles
      // TODO: Implement search API endpoint
      await loadRoommateProfiles({}, 1);
    });
  }

  if (searchInput) {
    searchInput.addEventListener('keypress', async (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (searchBtn) searchBtn.click();
      }
    });
  }
}

/**
 * Setup registration form - Single page form (no steps)
 */
function setupRegistrationForm() {
  const form = document.querySelector('.propertyForm') || document.getElementById('roommateForm');
  const submitBtn = document.getElementById('submitBtn');

  if (!form) {
    console.log('⚠️ Form not found');
    return;
  }

  console.log('✅ Initialized single-page roommate form');
  
  // Handle form submission - prevent default form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('📝 Form submit event triggered');
    await submitRegistrationForm();
  });

  // Also handle button click
  if (submitBtn) {
    submitBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('🔘 Submit button clicked');
      await submitRegistrationForm();
    });
  }

  // Handle file upload click
  const fileUploadLabel = document.querySelector('label[for="file-upload"]');
  const fileUploadInput = document.getElementById('file-upload');
  if (fileUploadLabel && fileUploadInput) {
    fileUploadLabel.addEventListener('click', (e) => {
      e.preventDefault();
      fileUploadInput.click();
    });
  }

  // Form is now single page - no step navigation needed
}

/**
 * Validate form fields
 */
function validateForm() {
  const form = document.querySelector('.propertyForm') || document.getElementById('roommateForm');
  if (!form) return false;

  const requiredFields = form.querySelectorAll('input[required], select[required]');
  let isValid = true;

  requiredFields.forEach((field) => {
    if (!field.value || field.value.trim() === '') {
      isValid = false;
      field.style.borderColor = '#ef4444';
      field.style.borderWidth = '2px';
    } else {
      field.style.borderColor = '';
      field.style.borderWidth = '';
    }
  });

  return isValid;
}

/**
 * Make authenticated API request with automatic token refresh
 * Uses api.js functions if available, otherwise falls back to direct fetch
 */
async function authenticatedFetch(url, options = {}) {
  let token = localStorage.getItem('accessToken');
  
  // Simple token expiration check
  function isTokenExpired(token) {
    if (!token) return true;
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        const exp = payload.exp * 1000;
        return Date.now() >= exp;
      }
    } catch (e) {
      return true;
    }
    return true;
  }

  // Simple token refresh
  async function refreshToken() {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) return false;

      // Get base URL based on environment
      const getBaseURL = () => {
        if (window.location.hostname === 'dev-sayo.github.io' || window.location.hostname.includes('github.io')) {
          return 'https://roompal-wrgn.onrender.com/api';
        }
        return 'http://localhost:5002/api';
      };
      const response = await fetch(`${getBaseURL()}/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();
      if (response.ok && data.success && data.data?.tokens) {
        localStorage.setItem('accessToken', data.data.tokens.accessToken);
        localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  }
  
  // Check if token is expired
  if (isTokenExpired(token)) {
    console.log('🔄 Token expired, refreshing...');
    const refreshed = await refreshToken();
    if (!refreshed) {
      if (typeof toast !== 'undefined') {
        toast.error('Your session has expired. Please login again.');
      }
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setTimeout(() => {
        window.location.href = '../../login.html';
      }, 1500);
      throw new Error('Token expired and refresh failed');
    }
    token = localStorage.getItem('accessToken');
  }

  // Make request with token
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // If 401, try refreshing token once more
  if (response.status === 401) {
    console.log('🔄 Got 401, attempting token refresh...');
    const refreshed = await refreshToken();
    if (refreshed) {
      token = localStorage.getItem('accessToken');
      headers['Authorization'] = `Bearer ${token}`;
      return fetch(url, {
        ...options,
        headers,
      });
    } else {
      if (typeof toast !== 'undefined') {
        toast.error('Your session has expired. Please login again.');
      }
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setTimeout(() => {
        window.location.href = '../../login.html';
      }, 1500);
      throw new Error('Token expired and refresh failed');
    }
  }

  return response;
}

/**
 * Submit registration form
 */
async function submitRegistrationForm() {
  const form = document.querySelector('.propertyForm') || document.getElementById('roommateForm');
  if (!form) {
    console.error('❌ Form not found');
    return;
  }

  try {
    console.log('🚀 Starting form submission...');
    
    // Validate form
    if (!validateForm()) {
      console.warn('⚠️ Form validation failed');
      if (typeof toast !== 'undefined') {
        toast.error('Please fill in all required fields');
      }
      return;
    }

    // Collect form data
    const formData = collectFormData();
    console.log('📋 Collected form data:', formData);

    // Validate required fields
    if (!formData.gender || !formData.budget || !formData.preferredLocation) {
      console.error('❌ Missing required fields:', {
        gender: !!formData.gender,
        budget: !!formData.budget,
        preferredLocation: !!formData.preferredLocation,
      });
      if (typeof toast !== 'undefined') {
        toast.error('Please fill in all required fields (Gender, Budget, Location)');
      }
      return;
    }

    // Show loading state
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';
    }

    // Handle image upload if present
    const fileInput = document.getElementById('file-upload');
    if (fileInput && fileInput.files && fileInput.files.length > 0) {
      try {
        console.log('📸 Uploading image...');
        // Upload image to Cloudinary
        const imageFile = fileInput.files[0];
        const imageFormData = new FormData();
        imageFormData.append('image', imageFile);

        // Get base URL based on environment
        const getBaseURL = () => {
          if (window.location.hostname === 'dev-sayo.github.io' || window.location.hostname.includes('github.io')) {
            return 'https://roompal-wrgn.onrender.com/api';
          }
          return 'http://localhost:5002/api';
        };
        const uploadResponse = await authenticatedFetch(`${getBaseURL()}/roommates/upload-image`, {
          method: 'POST',
          // Don't set Content-Type - let browser set it with boundary for FormData
          body: imageFormData,
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          console.log('📸 Image upload response:', uploadData);
          if (uploadData.success && uploadData.data && uploadData.data.imageUrl) {
            formData.profileImage = uploadData.data.imageUrl;
            console.log('✅ Image uploaded and added to formData:', formData.profileImage);
            console.log('✅ Full formData before submission:', formData);
          } else {
            console.warn('⚠️ Image upload response missing imageUrl:', uploadData);
          }
        } else {
          const errorData = await uploadResponse.json();
          console.error('❌ Image upload failed:', errorData);
        }
      } catch (uploadError) {
        console.warn('⚠️ Image upload error, continuing without image:', uploadError);
        // Continue without image if upload fails
      }
    }

    // Submit to API
    console.log('📤 Submitting profile data to API:', formData);
    console.log('📤 profileImage in formData:', formData.profileImage);
    // Get base URL based on environment
    const getBaseURL = () => {
      if (window.location.hostname === 'dev-sayo.github.io' || window.location.hostname.includes('github.io')) {
        return 'https://roompal-wrgn.onrender.com/api';
      }
      return 'http://localhost:5002/api';
    };
    const response = await authenticatedFetch(`${getBaseURL()}/roommates/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    console.log('📥 API Response status:', response.status);
    const data = await response.json();
    console.log('📥 API Response data:', data);
    console.log('📥 Profile image in response:', data.data?.profile?.profileImage);

    if (response.ok && data.success) {
      console.log('✅ Profile created/updated successfully!');
      
      // Show success toast
      if (typeof toast !== 'undefined') {
        toast.success('Roommate profile created successfully!');
      } else {
        alert('Roommate profile created successfully!');
      }

      // Reset form
      if (form) {
        form.reset();
      }
      
      // Switch to search tab and reload profiles
      setTimeout(async () => {
        const searchTabBtn = document.querySelector('.tab-btn[data-tab="search"]');
        if (searchTabBtn) {
          searchTabBtn.click();
          // Wait a bit for tab to switch, then reload profiles
          setTimeout(async () => {
            await loadRoommateProfiles({}, 1);
          }, 300);
        } else {
          // If no tab button, just reload profiles
          await loadRoommateProfiles({}, 1);
        }
      }, 1500);
    } else {
      console.error('❌ API Error:', data);
      const errorMessage = data.message || data.error || 'Failed to create profile';
      if (data.errors && Array.isArray(data.errors)) {
        const validationErrors = data.errors.map(e => e.msg || e.message).join(', ');
        throw new Error(validationErrors || errorMessage);
      }
      throw new Error(errorMessage);
    }
  } catch (error) {
    console.error('❌ Error submitting form:', error);
    console.error('❌ Error stack:', error.stack);
    if (error.message !== 'Token expired and refresh failed') {
      if (typeof toast !== 'undefined') {
        toast.error(error.message || 'Failed to create roommate profile. Check console for details.');
      } else {
        alert(`Error: ${error.message || 'Failed to create roommate profile'}`);
      }
    }

    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Profile';
    }
  }
}

/**
 * Collect form data from single page form
 */
function collectFormData() {
  const form = document.querySelector('.propertyForm') || document.getElementById('roommateForm');
  if (!form) {
    console.error('❌ Form not found in collectFormData');
    return {};
  }

  console.log('📝 Collecting form data from:', form.id || form.className);

  // Map form fields to API fields using IDs and names
  const data = {};

  // Basic info
  const genderEl = form.querySelector('#gender');
  const gender = genderEl?.value;
  console.log('👤 Gender:', gender, genderEl);
  if (gender) {
    data.gender = gender;
  }

  const preferredGenderEl = form.querySelector('#preferredGender');
  const preferredGender = preferredGenderEl?.value;
  if (preferredGender) {
    data.preferredGender = preferredGender;
  }

  const budgetEl = form.querySelector('#budget');
  const budget = budgetEl?.value;
  console.log('💰 Budget:', budget, budgetEl);
  if (budget) {
    data.budget = parseFloat(budget);
  }

  // Location (State and City)
  const stateEl = form.querySelector('#state');
  const cityEl = form.querySelector('#city');
  const state = stateEl?.value;
  const city = cityEl?.value;
  console.log('📍 Location fields:', { 
    state: { value: state, element: stateEl },
    city: { value: city, element: cityEl }
  });
  
  if (state && city) {
    data.preferredLocation = `${state}, ${city}`.trim();
  } else if (state) {
    data.preferredLocation = state.trim();
  } else if (city) {
    data.preferredLocation = city.trim();
  }
  
  if (!data.preferredLocation) {
    console.warn('⚠️ No preferredLocation set - state:', state, 'city:', city);
  } else {
    console.log('✅ preferredLocation:', data.preferredLocation);
  }

  // Lifestyle and Occupation
  const lifestyle = form.querySelector('#lifestyle')?.value;
  if (lifestyle) {
    data.lifestyle = lifestyle;
  }

  const occupation = form.querySelector('#occupation')?.value;
  if (occupation) {
    data.occupation = occupation.trim();
  }

  // Cleanliness, Smoking, Pets, Bio
  const cleanlinessLevel = form.querySelector('#cleanlinessLevel')?.value;
  if (cleanlinessLevel) {
    data.cleanlinessLevel = parseInt(cleanlinessLevel);
  }

  const smoking = form.querySelector('#smoking')?.value;
  if (smoking !== undefined) {
    data.smoking = smoking === 'true';
  }

  const pets = form.querySelector('#pets')?.value;
  if (pets !== undefined) {
    data.pets = pets === 'true';
  }

  const bio = form.querySelector('#bio')?.value;
  if (bio) {
    data.bio = bio.trim();
  }

  return data;
}

/**
 * Setup filter functionality
 */
function setupFilters() {
  const filterBtn = document.querySelector('.filter-btn');
  const cancelBtn = document.querySelector('.cancel');

  if (filterBtn) {
    filterBtn.addEventListener('click', async () => {
      const filters = collectFilters();
      await loadRoommateProfiles(filters, 1);
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      // Clear filters and reload
      loadRoommateProfiles({}, 1);
    });
  }
}

/**
 * Collect filter values
 */
function collectFilters() {
  const filters = {};

  // Get location filter
  const locationDiv = document.querySelector('.location-div span');
  if (locationDiv) {
    filters.location = locationDiv.textContent.trim();
  }

  // Get gender preference filter
  const genderCheckboxes = document.querySelectorAll('input[type="checkbox"]');
  genderCheckboxes.forEach((checkbox) => {
    if (checkbox.checked) {
      const label = checkbox.closest('label')?.textContent?.trim();
      if (label?.toLowerCase().includes('male only')) {
        filters.gender = 'Male';
      } else if (label?.toLowerCase().includes('female only')) {
        filters.gender = 'Female';
      }
    }
  });

  return filters;
}

// Export for global access
window.roommateIntegration = {
  loadRoommateProfiles,
  submitRegistrationForm,
};
