/**
 * My Properties Page Handler
 * Displays user's own properties
 */

console.log('🚀 myProperties.js loaded');

document.addEventListener('DOMContentLoaded', async () => {
  console.log('📋 DOM ready - My Properties');
  
  // Check authentication
  const token = localStorage.getItem('accessToken');
  if (!token) {
    console.error('❌ No token');
    if (typeof toast !== 'undefined') {
      toast.error('Please login to view your properties');
    } else {
      alert('Please login to view your properties');
    }
    setTimeout(() => {
      window.location.href = '../../login.html';
    }, 1500);
    return;
  }

  console.log('✅ Token found');

  // Load properties
  await loadMyProperties();
});

/**
 * Load user's properties
 */
const loadMyProperties = async () => {
  const container = document.getElementById('my-properties-container') ||
                    document.querySelector('.properties-grid') ||
                    document.querySelector('.grid');

  if (!container) {
    console.error('❌ Properties container not found');
    return;
  }

  try {
    console.log('📤 Fetching my properties...');
    
    // Show loading
    container.innerHTML = '<div class="text-center py-10"><div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#223448]"></div><p class="mt-4 text-gray-600">Loading your properties...</p></div>';

    // Get token
    const token = localStorage.getItem('accessToken');
    
    // Fetch properties
    const baseURL = typeof getAPIBaseURL === 'function' ? getAPIBaseURL() : (window.location.hostname === 'dev-sayo.github.io' || window.location.hostname.includes('github.io') ? 'https://roompal-wrgn.onrender.com/api' : 'http://localhost:5002/api');
    const response = await fetch(`${baseURL}/properties/my/properties`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    console.log('📥 Response:', response.status, data);

    if (response.ok && data.success) {
      const properties = data.data?.properties || data.properties || [];
      console.log(`✅ Found ${properties.length} properties`);

      if (properties.length > 0) {
        renderMyProperties(container, properties);
      } else {
        renderEmptyState(container);
      }
    } else {
      throw new Error(data.message || 'Failed to load properties');
    }
  } catch (error) {
    console.error('❌ Error loading properties:', error);
    container.innerHTML = `
      <div class="text-center py-10">
        <p class="text-red-500 mb-4">Failed to load properties. Please try again.</p>
        <button onclick="location.reload()" class="px-4 py-2 bg-[#223448] text-white rounded-full hover:bg-[#1a2838] transition">
          Retry
        </button>
      </div>
    `;

    if (typeof toast !== 'undefined') {
      toast.error('Failed to load your properties');
    }
  }
};

/**
 * Render user's properties
 * @param {HTMLElement} container - Container element
 * @param {Array} properties - Properties array
 */
const renderMyProperties = (container, properties) => {
  console.log('🎨 Rendering properties:', properties.length);
  container.innerHTML = properties
    .map((property) => renderMyPropertyCard(property))
    .join('');

  // Attach event listeners
  attachPropertyActions();
};

/**
 * Render single property card for my properties
 * @param {Object} property - Property object
 * @returns {string} - Property card HTML
 */
const renderMyPropertyCard = (property) => {
  const imageUrl = property.images && property.images.length > 0 
    ? property.images[0] 
    : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect fill="%23e9e0cf" width="400" height="300"/%3E%3Cpath fill="%23d4c5a8" d="M200 120h-60v60h60v-60zm-40 20h20v20h-20v-20z"/%3E%3Ctext x="200" y="180" text-anchor="middle" fill="%23999" font-family="Arial" font-size="16"%3ENo Image%3C/text%3E%3C/svg%3E';
  
  const price = property.price 
    ? new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(property.price)
    : 'Price on request';
  
  // Status badge
  let statusBadge = '';
  if (property.isFlagged) {
    statusBadge = '<span class="status-badge status-flagged">Flagged</span>';
  } else if (property.isApproved) {
    statusBadge = '<span class="status-badge status-approved">Approved</span>';
  } else {
    statusBadge = '<span class="status-badge status-pending">Pending</span>';
  }

  return `
    <div class="bg-[#e9e0cf] w-full rounded-[20px] property-card" data-property-id="${property._id || property.id}">
      <div class="w-full p-5 relative">
        <img 
          src="${imageUrl}" 
          alt="${property.title || 'Property'}"
          class="property-image w-full h-48 object-cover rounded-lg"
          onerror="this.onerror=null;this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22 viewBox=%220 0 400 300%22%3E%3Crect fill=%22%23e9e0cf%22 width=%22400%22 height=%22300%22/%3E%3Cpath fill=%22%23d4c5a8%22 d=%22M200 120h-60v60h60v-60zm-40 20h20v20h-20v-20z%22/%3E%3Ctext x=%22200%22 y=%22180%22 text-anchor=%22middle%22 fill=%22%23999%22 font-family=%22Arial%22 font-size=%2216%22%3ENo Image%3C/text%3E%3C/svg%3E'"
        />
        <div class="absolute top-6 right-6">
          ${statusBadge}
        </div>
      </div>
      <div class="explore-prop w-full flex flex-col px-10 pb-4">
        <div class="w-full flex items-center justify-between px-1 mb-2">
          <h2 class="text-2xl font-medium">${price}</h2>
        </div>
        <h3 class="text-lg font-medium mb-2">${property.title || 'Untitled Property'}</h3>
        <p class="flex items-center gap-2 text-[#00000033] py-2 px-1">
          <img class="w-4 h-3.5" src="../../assets/images/Vector-(7).png" alt="Location" />
          ${property.location || 'Location not specified'}
        </p>
        <div class="flex items-center gap-6 px-1 mb-4">
          ${property.bedrooms ? `
            <p class="flex items-center gap-2 text-[#00000033]">
              <img class="w-4 h-2.75" src="../../assets/images/Vector-(8).png" alt="Bedrooms" />
              ${property.bedrooms} bed
            </p>
          ` : ''}
          ${property.bathrooms ? `
            <p class="text-[#00000033] flex items-center gap-2">
              <img class="w-4 h-3.25" src="../../assets/images/Vector-(9).png" alt="Bathrooms" />
              ${property.bathrooms} bath
            </p>
          ` : ''}
        </div>
        <div class="flex items-center gap-4 py-4">
          <a
            href="property-details.html?id=${property._id || property.id}"
            class="flex-1 text-center px-4 py-2 bg-[#223448] text-white rounded-full text-sm hover:bg-[#1a2838] transition"
          >
            View
          </a>
          <button
            onclick="editProperty('${property._id || property.id}')"
            class="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-full text-sm hover:bg-gray-300 transition"
          >
            Edit
          </button>
          <button
            onclick="deleteProperty('${property._id || property.id}', '${property.title || 'this property'}')"
            class="px-4 py-2 bg-red-500 text-white rounded-full text-sm hover:bg-red-600 transition"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  `;
};

/**
 * Render empty state
 * @param {HTMLElement} container - Container element
 */
const renderEmptyState = (container) => {
  console.log('📭 No properties found - showing empty state');
  container.innerHTML = `
    <div class="empty-state w-full text-center py-20 col-span-full">
      <div class="empty-state-icon mb-4">
        <svg class="w-24 h-24 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
        </svg>
      </div>
      <h3 class="text-xl font-medium text-gray-600 mb-2">No Properties Listed</h3>
      <p class="text-gray-500 mb-6">You haven't listed any properties yet.</p>
      <a
        href="../list-a-house/list-a-house.html"
        class="inline-block px-6 py-3 bg-[#223448] text-white rounded-full hover:bg-[#1a2838] transition"
      >
        List Your First Property
      </a>
    </div>
  `;
};

/**
 * Attach event listeners for property actions
 */
const attachPropertyActions = () => {
  // Event listeners are attached via onclick handlers in the HTML
  console.log('✅ Property action handlers attached');
};

/**
 * Edit property
 * @param {string} propertyId - Property ID
 */
window.editProperty = (propertyId) => {
  console.log('✏️ Edit property:', propertyId);
  // Redirect to edit page or show edit modal
  window.location.href = `property-details.html?id=${propertyId}&edit=true`;
};

/**
 * Delete property
 * @param {string} propertyId - Property ID
 * @param {string} propertyTitle - Property title
 */
window.deleteProperty = async (propertyId, propertyTitle) => {
  if (!confirm(`Are you sure you want to delete "${propertyTitle}"? This action cannot be undone.`)) {
    return;
  }

  try {
    if (typeof toast !== 'undefined') {
      toast.info('Deleting property...');
    }

    const token = localStorage.getItem('accessToken');
    const baseURL = typeof getAPIBaseURL === 'function' ? getAPIBaseURL() : (window.location.hostname === 'dev-sayo.github.io' || window.location.hostname.includes('github.io') ? 'https://roompal-wrgn.onrender.com/api' : 'http://localhost:5002/api');
    const response = await fetch(`${baseURL}/properties/${propertyId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (response.ok && data.success) {
      if (typeof toast !== 'undefined') {
        toast.success('Property deleted successfully');
      }
      
      // Reload properties
      await loadMyProperties();
    } else {
      throw new Error(data.message || 'Failed to delete property');
    }
  } catch (error) {
    console.error('❌ Error deleting property:', error);
    if (typeof toast !== 'undefined') {
      toast.error(error.message || 'Failed to delete property');
    } else {
      alert('Error: ' + error.message);
    }
  }
};
