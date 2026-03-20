/**
 * Property Listing Handler
 * Handles fetching and displaying properties from API
 */

// Wait for DOM and API to be ready
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Properties script loaded');
  
  // Check if API is available
  if (typeof api === 'undefined') {
    console.error('API helper not loaded');
    return;
  }
  
  console.log('API helper found, initializing properties...');

  // Initialize property listings
  await initPropertyListings();
});

/**
 * Initialize property listings on page
 */
const initPropertyListings = async () => {
  console.log('Initializing property listings...');
  
  // Find property container
  let propertyContainer = document.getElementById('property-listings') ||
                         document.querySelector('.property-listings-container') ||
                         document.querySelector('.explore-cards') ||
                         document.querySelector('.grid.grid-cols-1.sm\\:grid-cols-2');

  if (!propertyContainer) {
    // Try to find by class that contains property cards
    const containers = document.querySelectorAll('[class*="grid"]');
    for (const container of containers) {
      if (container.querySelector('.bg-\\[\\#e9e0cf\\]') || container.id === 'property-listings') {
        propertyContainer = container;
        break;
      }
    }
  }

  if (!propertyContainer) {
    console.error('Property container not found! Available containers:', document.querySelectorAll('[class*="grid"]').length);
    return;
  }
  
  console.log('Property container found:', propertyContainer.id || propertyContainer.className);
  
  // Clear any existing static content
  propertyContainer.innerHTML = '';

  // Get filters from URL or form
  const filters = getFiltersFromPage();
  console.log('Filters:', filters);

  // Load properties
  await loadProperties(propertyContainer, filters);
};

/**
 * Get filters from page (search form, URL params, etc.)
 * @returns {Object} - Filter object
 */
const getFiltersFromPage = () => {
  const filters = {};

  // Get from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const location = urlParams.get('location');
  const minPrice = urlParams.get('minPrice');
  const maxPrice = urlParams.get('maxPrice');
  const apartmentType = urlParams.get('apartmentType');

  if (location) filters.location = location;
  if (minPrice) filters.minPrice = minPrice;
  if (maxPrice) filters.maxPrice = maxPrice;
  if (apartmentType) filters.apartmentType = apartmentType;

  // Get from search form if exists
  const searchForm = document.getElementById('property-search-form') || 
                     document.querySelector('form[data-property-search]');
  
  if (searchForm) {
    const formData = new FormData(searchForm);
    const formLocation = formData.get('location');
    const formMinPrice = formData.get('minPrice');
    const formMaxPrice = formData.get('maxPrice');
    const formType = formData.get('apartmentType');

    if (formLocation) filters.location = formLocation;
    if (formMinPrice) filters.minPrice = formMinPrice;
    if (formMaxPrice) filters.maxPrice = formMaxPrice;
    if (formType) filters.apartmentType = formType;
  }

  // Set default limit for landing page
  if (!filters.limit) {
    filters.limit = 8; // Show first 8 on landing page
  }

  return filters;
};

/**
 * Load and display properties
 * @param {HTMLElement} container - Container element
 * @param {Object} filters - Filter object
 * @param {number} page - Page number
 */
const loadProperties = async (container, filters = {}, page = 1) => {
  try {
    // Show loading state
    if (propertyUtils && propertyUtils.renderLoadingState) {
      container.innerHTML = propertyUtils.renderLoadingState(6);
    } else {
      container.innerHTML = '<div class="text-center py-10">Loading properties...</div>';
    }

    // Add page to filters
    const queryFilters = { ...filters, page, limit: filters.limit || 12 };

    // Fetch properties
    console.log('Fetching properties with filters:', queryFilters);
    const response = await api.properties.getAll(queryFilters);
    console.log('API response:', response);

    if (response.success && response.data) {
      const properties = response.data.properties || [];
      const pagination = response.data.pagination || {};

      // Render properties
      if (properties.length > 0) {
        renderProperties(container, properties);
        
        // Render pagination if available
        if (pagination.totalPages > 1) {
          renderPagination(container, pagination, filters);
        }
      } else {
        // Show empty state
        if (propertyUtils && propertyUtils.renderEmptyState) {
          container.innerHTML = propertyUtils.renderEmptyState('No properties found matching your criteria.');
        } else {
          container.innerHTML = '<div class="text-center py-10 text-gray-500">No properties found.</div>';
        }
      }
    } else {
      throw new Error('Failed to load properties');
    }
  } catch (error) {
    // Show error state
    container.innerHTML = `
      <div class="text-center py-10">
        <p class="text-red-500 mb-4">Failed to load properties. Please try again later.</p>
        <button onclick="location.reload()" class="px-4 py-2 bg-[#223448] text-white rounded-full">
          Retry
        </button>
      </div>
    `;

    if (toast) {
      toast.error('Failed to load properties. Please try again.');
    }
  }
};

/**
 * Render properties in container
 * @param {HTMLElement} container - Container element
 * @param {Array} properties - Properties array
 */
const renderProperties = (container, properties) => {
  if (!propertyUtils || !propertyUtils.renderPropertyCard) {
    // Fallback rendering
    container.innerHTML = properties
      .map((property) => {
        return `
          <div class="bg-[#e9e0cf] w-full rounded-[20px]">
            <div class="p-5">
              <img src="${property.images?.[0] || propertyUtils?.getPropertyImage([]) || 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22400%22%20height%3D%22300%22%20viewBox%3D%220%200%20400%20300%22%3E%3Crect%20fill%3D%22%23e9e0cf%22%20width%3D%22400%22%20height%3D%22300%22/%3E%3Cpath%20fill%3D%22%23d4c5a8%22%20d%3D%22M200%20120h-60v60h60v-60zm-40%2020h20v20h-20v-20z%22/%3E%3Ctext%20x%3D%22200%22%20y%3D%22180%22%20text-anchor%3D%22middle%22%20fill%3D%22%23999%22%20font-family%3D%22Arial%22%20font-size%3D%2216%22%3ENo%20Image%3C/text%3E%3C/svg%3E'}" 
                   alt="${property.title}" 
                   class="w-full h-48 object-cover rounded-lg" />
            </div>
            <div class="px-10 pb-4">
              <h3 class="text-xl font-medium mb-2">${property.title}</h3>
              <p class="text-2xl font-bold mb-2">₦${parseFloat(property.price).toLocaleString()}</p>
              <p class="text-gray-600 mb-4">${property.location}</p>
              <a href="reg-users/homepage/property-details.html?id=${property._id || property.id}" 
                 class="block text-center bg-[#223448] text-white py-2 rounded-full">
                View Details
              </a>
            </div>
          </div>
        `;
      })
      .join('');
    return;
  }

  // Use utility function
  container.innerHTML = properties
    .map((property) => propertyUtils.renderPropertyCard(property))
    .join('');
};

/**
 * Render pagination controls
 * @param {HTMLElement} container - Container element
 * @param {Object} pagination - Pagination object
 * @param {Object} filters - Current filters
 */
const renderPagination = (container, pagination, filters) => {
  const paginationContainer = document.createElement('div');
  paginationContainer.className = 'pagination-container w-full flex justify-center items-center gap-4 mt-8';
  paginationContainer.innerHTML = `
    <button 
      class="pagination-btn px-4 py-2 rounded-full ${!pagination.hasPrevPage ? 'opacity-50 cursor-not-allowed' : 'bg-[#223448] text-white hover:bg-[#1a2838]'}"
      ${!pagination.hasPrevPage ? 'disabled' : ''}
      onclick="goToPage(${pagination.currentPage - 1})"
    >
      Previous
    </button>
    <span class="text-gray-600">
      Page ${pagination.currentPage} of ${pagination.totalPages}
    </span>
    <button 
      class="pagination-btn px-4 py-2 rounded-full ${!pagination.hasNextPage ? 'opacity-50 cursor-not-allowed' : 'bg-[#223448] text-white hover:bg-[#1a2838]'}"
      ${!pagination.hasNextPage ? 'disabled' : ''}
      onclick="goToPage(${pagination.currentPage + 1})"
    >
      Next
    </button>
  `;

  // Insert after container
  container.parentNode.insertBefore(paginationContainer, container.nextSibling);
};

/**
 * Go to specific page
 * @param {number} page - Page number
 */
window.goToPage = (page) => {
  const container = document.querySelector('.property-listings-container') ||
                    document.getElementById('property-listings') ||
                    document.querySelector('.explore-cards');
  
  if (container) {
    const filters = getFiltersFromPage();
    loadProperties(container, filters, page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

// Export for use in other files
if (typeof window !== 'undefined') {
  window.propertyLoader = {
    loadProperties,
    initPropertyListings,
    getFiltersFromPage,
  };
}
