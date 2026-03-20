/**
 * Property Utility Functions
 * Reusable functions for property rendering and formatting
 */

/**
 * Format price to Nigerian Naira
 * @param {number} price - Property price
 * @returns {string} - Formatted price
 */
const formatPrice = (price) => {
  if (!price) return 'Price on request';
  return `₦${parseFloat(price).toLocaleString('en-NG')}`;
};

/**
 * Format property type for display
 * @param {string} type - Apartment type
 * @returns {string} - Formatted type
 */
const formatPropertyType = (type) => {
  return type || 'Not specified';
};

/**
 * Get property status badge
 * @param {Object} property - Property object
 * @returns {string} - Status badge HTML
 */
const getStatusBadge = (property) => {
  if (property.isFlagged) {
    return '<span class="status-badge status-flagged">Flagged</span>';
  }
  if (property.isApproved) {
    return '<span class="status-badge status-approved">Approved</span>';
  }
  return '<span class="status-badge status-pending">Pending</span>';
};

/**
 * Get first image or placeholder
 * @param {Array} images - Property images array
 * @returns {string} - Image URL or placeholder
 */
const getPropertyImage = (images) => {
  if (images && images.length > 0 && images[0]) {
    return images[0];
  }
  // Use a simple data URI placeholder (SVG) to avoid 404 errors
  // Encoded SVG without http:// to avoid parsing issues
  const svgPlaceholder = 'data:image/svg+xml,%3Csvg xmlns=%22http%3A//www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22 viewBox=%220 0 400 300%22%3E%3Crect fill=%22%23e9e0cf%22 width=%22400%22 height=%22300%22/%3E%3Cpath fill=%22%23d4c5a8%22 d=%22M200 120h-60v60h60v-60zm-40 20h20v20h-20v-20z%22/%3E%3Ctext x=%22200%22 y=%22180%22 text-anchor=%22middle%22 fill=%22%23999%22 font-family=%22Arial%22 font-size=%2216%22%3ENo Image%3C/text%3E%3C/svg%3E';
  return svgPlaceholder;
};

/**
 * Render property card HTML
 * @param {Object} property - Property object
 * @returns {string} - Property card HTML
 */
const renderPropertyCard = (property) => {
  const imageUrl = getPropertyImage(property.images);
  const price = formatPrice(property.price);
  const location = property.location || 'Location not specified';
  const bedrooms = property.bedrooms || 0;
  const bathrooms = property.bathrooms || 0;
  const totalArea = property.totalArea ? `${property.totalArea}M²` : '';
  const propertyId = property._id || property.id;

  return `
    <div class="bg-[#e9e0cf] w-full rounded-[20px] property-card" data-property-id="${propertyId}">
      <div class="w-full p-5">
        <img 
          src="${imageUrl}" 
          alt="${property.title || 'Property image'}"
          class="property-image w-full h-48 object-cover rounded-lg"
          onerror="this.onerror=null;this.src=propertyUtils?.getPropertyImage?.([])||'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22400%22%20height%3D%22300%22%20viewBox%3D%220%200%20400%20300%22%3E%3Crect%20fill%3D%22%23e9e0cf%22%20width%3D%22400%22%20height%3D%22300%22/%3E%3Cpath%20fill%3D%22%23d4c5a8%22%20d%3D%22M200%20120h-60v60h60v-60zm-40%2020h20v20h-20v-20z%22/%3E%3Ctext%20x%3D%22200%22%20y%3D%22180%22%20text-anchor%3D%22middle%22%20fill%3D%22%23999%22%20font-family%3D%22Arial%22%20font-size%3D%2216%22%3ENo%20Image%3C/text%3E%3C/svg%3E'"
        />
      </div>
      <div class="explore-prop w-full flex flex-col px-10 pb-4">
        <div class="w-full flex items-center justify-between px-1">
          <h2 class="text-2xl font-medium">${price}</h2>
          ${totalArea ? `<p class="text-[#00000033] text-xs uppercase font-medium">total area: ${totalArea}</p>` : ''}
        </div>
        <p class="text-lg font-medium py-2 px-1">${property.title || 'Untitled Property'}</p>
        <p class="flex items-center gap-2 text-[#00000033] py-2 px-1">
          <img class="w-4 h-3.5" src="assets/images/Vector-(7).png" alt="Location" />
          ${location}
        </p>
        <div class="flex items-center gap-6 px-1">
          ${bedrooms > 0 ? `
            <p class="flex items-center gap-2 text-[#00000033]">
              <img class="w-4 h-2.75" src="assets/images/Vector-(8).png" alt="Bedrooms" />
              ${bedrooms} bedroom${bedrooms !== 1 ? 's' : ''}
            </p>
          ` : ''}
          ${bathrooms > 0 ? `
            <p class="text-[#00000033] flex items-center gap-2">
              <img class="w-4 h-3.25" src="assets/images/Vector-(9).png" alt="Bathrooms" />
              ${bathrooms} bathroom${bathrooms !== 1 ? 's' : ''}
            </p>
          ` : ''}
        </div>
        <div class="flex items-center justify-evenly gap-10 py-4">
          <a
            class="property-link flex items-center justify-center gap-2 text-white bg-[#223448] h-11 w-full rounded-full text-xs hover:bg-[#1a2838] transition"
            href="reg-users/homepage/property-details.html?id=${propertyId}"
          >
            <img class="w-4" src="assets/images/tel.png" alt="" />
            View Details
          </a>
          <a
            class="property-link w-18 h-9 bg-[#00000033] flex items-center justify-center rounded-full hover:bg-[#00000050] transition"
            href="reg-users/homepage/property-details.html?id=${propertyId}"
          >
            <img class="w-4 h-4" src="assets/images/message.png" alt="Message" />
          </a>
        </div>
      </div>
    </div>
  `;
};

/**
 * Render empty state
 * @param {string} message - Empty state message
 * @returns {string} - Empty state HTML
 */
const renderEmptyState = (message = 'No properties found.') => {
  return `
    <div class="empty-state w-full text-center py-20">
      <div class="empty-state-icon mb-4">
        <svg class="w-24 h-24 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
        </svg>
      </div>
      <h3 class="text-xl font-medium text-gray-600 mb-2">${message}</h3>
      <p class="text-gray-500">Check back later for new listings.</p>
    </div>
  `;
};

/**
 * Render loading state with animated spinner
 * @param {number} count - Number of skeleton cards
 * @param {boolean} showSpinner - Whether to show spinner overlay
 * @returns {string} - Loading skeleton HTML
 */
const renderLoadingState = (count = 6, showSpinner = false) => {
  // If showSpinner is true, show a centered spinner overlay
  if (showSpinner) {
    return `
      <div class="loading-overlay w-full flex flex-col items-center justify-center py-20 min-h-[400px]">
        <div class="spinner-container relative">
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
        </div>
        <p class="text-[#223448] font-medium mt-6 text-lg">Searching properties...</p>
        <p class="text-gray-500 text-sm mt-2">Please wait</p>
      </div>
    `;
  }

  // Otherwise, show skeleton cards with shimmer effect
  const skeletons = Array(count)
    .fill(0)
    .map(
      () => `
    <div class="bg-[#e9e0cf] w-full rounded-[20px] property-skeleton">
      <div class="w-full p-5">
        <div class="w-full h-48 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg shimmer"></div>
      </div>
      <div class="w-full flex flex-col px-10 pb-4">
        <div class="w-full h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded mb-2 shimmer"></div>
        <div class="w-3/4 h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded mb-4 shimmer"></div>
        <div class="w-1/2 h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded shimmer"></div>
      </div>
    </div>
  `
    )
    .join('');

  return skeletons;
};

// Export for use in other files
if (typeof window !== 'undefined') {
  window.propertyUtils = {
    formatPrice,
    formatPropertyType,
    getStatusBadge,
    getPropertyImage,
    renderPropertyCard,
    renderEmptyState,
    renderLoadingState,
  };
}
