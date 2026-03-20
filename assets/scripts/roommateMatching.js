/**
 * Roommate Matching Frontend Integration
 * Handles roommate profile creation and matching
 */

document.addEventListener('DOMContentLoaded', async () => {
  if (typeof api === 'undefined') {
    console.error('API helper not loaded');
    return;
  }

  // Check if we're on the roommate listing page
  const roommateContainer = document.getElementById('roommie-deets');
  if (roommateContainer) {
    await loadRoommateProfiles();
  }

  // Check if we're on the matches page
  const matchesContainer = document.getElementById('matches-container');
  if (matchesContainer) {
    await loadMatches();
  }
});

/**
 * Load all active roommate profiles
 */
const loadRoommateProfiles = async () => {
  const container = document.getElementById('roommie-deets');
  if (!container) return;

  try {
    // Show loading state
    container.innerHTML = '<div class="text-center py-10">Loading roommate profiles...</div>';

    const response = await api.roommates.getAllActiveProfiles();

    if (response.success && response.data && response.data.profiles) {
      const profiles = response.data.profiles;

      if (profiles.length > 0) {
        container.innerHTML = profiles.map(profile => createRoommateCard(profile)).join('');
      } else {
        container.innerHTML = '<div class="text-center py-10 text-gray-500">No roommate profiles found.</div>';
      }
    } else {
      throw new Error('Failed to load roommate profiles');
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
};

/**
 * Create roommate card HTML
 * @param {Object} profile - Roommate profile object
 * @returns {string} - HTML string
 */
const createRoommateCard = (profile) => {
  const user = profile.user || {};
  const profileId = profile._id || profile.id;
  const userId = user._id || user.id || '';

  return `
    <div class="roommate-card">
      <div class="roommate-avatar">
        <img src="../images/avatar-1.png" alt="${user.fullName || 'User'}" />
      </div>
      <div class="roommate-info">
        <h4>${user.fullName || 'Unknown'}</h4>
        <p>${profile.occupation || 'Not specified'}</p>
        <p class="text-sm text-gray-500">Budget: ₦${(profile.budget || 0).toLocaleString('en-NG')}</p>
        <p class="text-sm text-gray-500">Location: ${profile.preferredLocation || 'Not specified'}</p>
        <a class="chat" href="../message/in-app-message.html?userId=${userId}">Chat</a>
        <a class="view-more" href="./roommate-info.html?id=${profileId}">View more</a>
      </div>
    </div>
  `;
};

/**
 * Load roommate matches
 */
const loadMatches = async () => {
  const container = document.getElementById('matches-container');
  if (!container) return;

  try {
    container.innerHTML = '<div class="text-center py-10">Loading matches...</div>';

    const response = await api.roommates.getMatches();

    if (response.success && response.data && response.data.matches) {
      const matches = response.data.matches;

      if (matches.length > 0) {
        container.innerHTML = matches.map(match => createMatchCard(match)).join('');
      } else {
        container.innerHTML = '<div class="text-center py-10 text-gray-500">No matches found. Create your profile to find matches!</div>';
      }
    } else {
      throw new Error('Failed to load matches');
    }
  } catch (error) {
    console.error('Error loading matches:', error);
    container.innerHTML = `
      <div class="text-center py-10">
        <p class="text-red-500 mb-4">Failed to load matches. Please try again later.</p>
        ${error.message && error.message.includes('profile') ? 
          '<a href="./create-profile.html" class="px-4 py-2 bg-[#223448] text-white rounded-full inline-block">Create Profile</a>' :
          '<button onclick="location.reload()" class="px-4 py-2 bg-[#223448] text-white rounded-full">Retry</button>'
        }
      </div>
    `;
    if (typeof toast !== 'undefined') {
      toast.error(error.message || 'Failed to load matches.');
    }
  }
};

/**
 * Create match card HTML
 * @param {Object} match - Match object with profile and compatibilityScore
 * @returns {string} - HTML string
 */
const createMatchCard = (match) => {
  const profile = match.profile || {};
  const user = profile.user || {};
  const profileId = profile._id || profile.id;
  const userId = user._id || user.id || '';
  const score = match.compatibilityScore || 0;

  return `
    <div class="roommate-card match-card">
      <div class="match-score">
        <span class="score-badge">${score}% Match</span>
      </div>
      <div class="roommate-avatar">
        <img src="../images/avatar-1.png" alt="${user.fullName || 'User'}" />
      </div>
      <div class="roommate-info">
        <h4>${user.fullName || 'Unknown'}</h4>
        <p>${profile.occupation || 'Not specified'}</p>
        <p class="text-sm text-gray-500">Budget: ₦${(profile.budget || 0).toLocaleString('en-NG')}</p>
        <p class="text-sm text-gray-500">Location: ${profile.preferredLocation || 'Not specified'}</p>
        <p class="text-sm text-gray-500">Lifestyle: ${profile.lifestyle || 'Not specified'}</p>
        <a class="chat" href="../message/in-app-message.html?userId=${userId}">Chat</a>
        <a class="view-more" href="./roommate-info.html?id=${profileId}">View more</a>
      </div>
    </div>
  `;
};

// Export functions for global access
window.roommateMatching = {
  loadRoommateProfiles,
  loadMatches,
};
